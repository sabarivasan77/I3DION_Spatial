import { parseDocument, Document, isCollection, isMap, isSeq, isPair, isScalar } from 'yaml';
import { AppDefinitionSchema } from '../../contracts/src/catalogAppDefinition.ts';
import type { AppDefinitionContract } from '../../contracts/src/catalogAppDefinition.ts';
import { DocumentStore } from './documentStore.ts';
import type { Command } from './commands/index.ts';

export interface YamlError {
  message: string;
  line: number;
  column: number;
  fixHint?: string;
  severity: 'error' | 'warning';
}

export interface ParseYamlResult {
  success: boolean;
  doc?: AppDefinitionContract;
  errors: YamlError[];
  importedAssets?: { originalUrl: string; assetId: string }[];
}

const ALLOWED_ROOT_KEYS = new Set([
  'schema',
  'meta',
  'theme',
  'data',
  'variables',
  'pages',
  'revision'
]);

const ALLOWED_PAGE_KEYS = new Set([
  'id',
  'title',
  'route',
  'layout',
  'children'
]);

const ALLOWED_NODE_KEYS = new Set([
  'id',
  'type',
  'title',
  'bind',
  'layout',
  'props',
  'on',
  'visibility',
  'children'
]);

/**
 * Calculates string similarity distance for fix hint suggestions (Levenshtein)
 */
function getClosestMatch(target: string, candidates: Set<string>): string | undefined {
  let closest: string | undefined;
  let minDistance = 3; // Max threshold

  for (const candidate of candidates) {
    const dist = levenshteinDistance(target.toLowerCase(), candidate.toLowerCase());
    if (dist < minDistance) {
      minDistance = dist;
      closest = candidate;
    }
  }
  return closest;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Restricted expression parser: only allows {{ meta.* }}, {{ item.* }}, {{ product.* }}, {{ variables.* }}
 * Strictly blocks code execution, function calling, prototypes, and arbitrary globals.
 */
export function validateAndSanitizeExpression(expr: string): { valid: boolean; reason?: string } {
  const match = expr.match(/^\s*\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}\s*$/);
  if (!match) {
    return {
      valid: false,
      reason: `Invalid expression syntax '${expr}'. Only simple single-identifier expressions are permitted, e.g. {{ item.name }}.`
    };
  }

  const tokenPath = match[1];
  const parts = tokenPath.split('.');
  const rootScope = parts[0];

  const allowedScopes = new Set(['meta', 'item', 'product', 'variables', 'sources', 'data']);
  if (!allowedScopes.has(rootScope)) {
    return {
      valid: false,
      reason: `Forbidden expression scope '${rootScope}' in '${expr}'. Allowed scopes: meta, item, product, variables.`
    };
  }

  // Block any dangerous prototype properties
  for (const p of parts) {
    if (p === '__proto__' || p === 'constructor' || p === 'prototype') {
      return {
        valid: false,
        reason: `Prototype traversal is forbidden in expressions: '${p}'`
      };
    }
  }

  return { valid: true };
}

/**
 * Recursively scans YAML CST/AST to enforce maximum depth, check unknown keys,
 * validate restricted expressions, and collect remote URLs for Vault auto-import.
 */
function inspectYamlNode(
  node: any,
  depth: number,
  errors: YamlError[],
  parentKey = '',
  importedAssets: { originalUrl: string; assetId: string }[]
): void {
  if (depth > 32) {
    const pos = node?.range ? { line: 1, column: 1 } : { line: 1, column: 1 };
    errors.push({
      message: `YAML exceeds maximum allowed nesting depth of 32 levels (current depth: ${depth})`,
      line: pos.line,
      column: pos.column,
      fixHint: 'Flatten deeply nested container structures or split into separate sub-pages',
      severity: 'error'
    });
    return;
  }

  if (isMap(node)) {
    for (const pair of node.items) {
      if (isPair(pair) && isScalar(pair.key)) {
        const keyName = String(pair.key.value);

        // Check root keys
        if (depth === 1 && !ALLOWED_ROOT_KEYS.has(keyName)) {
          const closest = getClosestMatch(keyName, ALLOWED_ROOT_KEYS);
          errors.push({
            message: `Unknown top-level property '${keyName}'`,
            line: pair.key.range ? 1 : 1, // Will be line-mapped
            column: 1,
            fixHint: closest ? `Did you mean '${closest}'?` : `Allowed top-level keys: ${Array.from(ALLOWED_ROOT_KEYS).join(', ')}`,
            severity: 'error'
          });
        }

        // Check node keys
        if (parentKey === 'children' && !ALLOWED_NODE_KEYS.has(keyName)) {
          const closest = getClosestMatch(keyName, ALLOWED_NODE_KEYS);
          errors.push({
            message: `Unknown widget property '${keyName}'`,
            line: 1,
            column: 1,
            fixHint: closest ? `Did you mean '${closest}'?` : `Standard widget keys: ${Array.from(ALLOWED_NODE_KEYS).join(', ')}`,
            severity: 'error'
          });
        }

        inspectYamlNode(pair.value, depth + 1, errors, keyName, importedAssets);
      }
    }
  } else if (isSeq(node)) {
    for (const item of node.items) {
      inspectYamlNode(item, depth + 1, errors, parentKey, importedAssets);
    }
  } else if (isScalar(node)) {
    const val = node.value;
    if (typeof val === 'string') {
      // Check for template expressions
      if (val.includes('{{') && val.includes('}}')) {
        const validation = validateAndSanitizeExpression(val);
        if (!validation.valid) {
          errors.push({
            message: validation.reason || 'Invalid expression',
            line: 1,
            column: 1,
            fixHint: 'Use allowed syntax: {{ item.fieldName }} or {{ meta.name }}',
            severity: 'error'
          });
        }
      }

      // Check for remote URLs to auto-import into Vault
      if (val.startsWith('https://') || val.startsWith('http://')) {
        const assetId = `vault-${Math.random().toString(36).slice(2, 10)}`;
        importedAssets.push({ originalUrl: val, assetId });
        node.value = `asset:${assetId}`;
      }
    }
  }
}

/**
 * Parses catalog YAML with CST-preservation, alias limits, depth checks,
 * unknown key errors, and expression validation (§4.5).
 */
export function parseCatalogYaml(yamlString: string): ParseYamlResult {
  const errors: YamlError[] = [];
  const importedAssets: { originalUrl: string; assetId: string }[] = [];

  // Rule 1: Size <= 1 MB
  const byteLength = Buffer.byteLength(yamlString, 'utf8');
  if (byteLength > 1024 * 1024) {
    return {
      success: false,
      errors: [
        {
          message: `YAML size of ${(byteLength / (1024 * 1024)).toFixed(2)} MB exceeds maximum limit of 1 MB`,
          line: 1,
          column: 1,
          fixHint: 'Reduce inline catalog size or move large static assets into Vault',
          severity: 'error'
        }
      ]
    };
  }

  // Rule 2: Reject custom YAML tags
  if (/!\w+/g.test(yamlString)) {
    // Custom tag detected
    const match = yamlString.match(/(!\w+)/);
    return {
      success: false,
      errors: [
        {
          message: `Custom YAML tag '${match ? match[0] : '!'}' is strictly forbidden for security`,
          line: 1,
          column: 1,
          fixHint: 'Remove custom tags and use standard YAML types (strings, maps, lists)',
          severity: 'error'
        }
      ]
    };
  }

  // Parse Document with alias and anchor limits (max 10 aliases to block billion-laughs / alias bombs)
  let parsedDoc: Document.Parsed;
  try {
    parsedDoc = parseDocument(yamlString, {
      maxAliasCount: 10,
      customTags: []
    } as any);
  } catch (err: any) {
    return {
      success: false,
      errors: [
        {
          message: `YAML parse error: ${err.message}`,
          line: err.linePos?.[0]?.line || 1,
          column: err.linePos?.[0]?.col || 1,
          fixHint: 'Verify YAML syntax indentation and formatting',
          severity: 'error'
        }
      ]
    };
  }

  // Collect parser syntax errors
  if (parsedDoc.errors && parsedDoc.errors.length > 0) {
    for (const e of parsedDoc.errors) {
      errors.push({
        message: e.message,
        line: e.linePos?.[0]?.line || 1,
        column: e.linePos?.[0]?.col || 1,
        severity: 'error'
      });
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Deep inspect CST nodes
  if (parsedDoc.contents) {
    inspectYamlNode(parsedDoc.contents, 1, errors, '', importedAssets);
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Convert to JSON and validate against AppDefinitionSchema
  const rawJson = parsedDoc.toJS();
  if (!rawJson || typeof rawJson !== 'object') {
    return {
      success: false,
      errors: [
        {
          message: 'YAML root must be a mapping/object defining an App Definition',
          line: 1,
          column: 1,
          fixHint: 'Define schema, meta, theme, and pages at root',
          severity: 'error'
        }
      ]
    };
  }

  // Enforce schema identifier
  if (rawJson.schema !== 'i3dion.catalog/1') {
    return {
      success: false,
      errors: [
        {
          message: `Unsupported schema '${rawJson.schema}'. Omni Studio requires 'schema: i3dion.catalog/1'`,
          line: 1,
          column: 1,
          fixHint: "Set 'schema: i3dion.catalog/1' at the top of your YAML",
          severity: 'error'
        }
      ]
    };
  }

  // Auto-assign IDs for nodes and pages if omitted in authored YAML
  function ensureNodeIds(node: any): void {
    if (node && typeof node === 'object') {
      if (!node.id && node.type) {
        node.id = `${node.type}-${Math.random().toString(36).slice(2, 8)}`;
      }
      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          ensureNodeIds(child);
        }
      }
    }
  }

  if (Array.isArray(rawJson.pages)) {
    for (let i = 0; i < rawJson.pages.length; i++) {
      const page = rawJson.pages[i];
      if (!page.id) {
        page.id = `page-${i + 1}`;
      }
      if (Array.isArray(page.children)) {
        for (const child of page.children) {
          ensureNodeIds(child);
        }
      }
    }
  }

  // Validate against Zod AppDefinitionSchema
  const zodResult = AppDefinitionSchema.safeParse(rawJson);
  if (!zodResult.success) {
    for (const issue of zodResult.error.issues) {
      errors.push({
        message: `${issue.path.join('.')}: ${issue.message}`,
        line: 1,
        column: 1,
        fixHint: `Check required format for ${issue.path.join('.')}`,
        severity: 'error'
      });
    }
    return { success: false, errors };
  }

  return {
    success: true,
    doc: zodResult.data,
    errors: [],
    importedAssets
  };
}

/**
 * Serializes an App Definition into canonical, human-readable YAML conforming to §4.5
 */
export function serializeCatalogYaml(doc: AppDefinitionContract): string {
  const cleanDoc = {
    schema: doc.schema,
    meta: doc.meta,
    theme: doc.theme,
    data: doc.data,
    variables: doc.variables,
    pages: doc.pages.map(page => ({
      id: page.id,
      title: page.title,
      route: page.route,
      layout: page.layout,
      children: cleanNodesForYaml(page.children)
    }))
  };

  const yamlDoc = new Document(cleanDoc);
  return yamlDoc.toString({
    indent: 2,
    lineWidth: 120,
    singleQuote: false
  });
}

function cleanNodesForYaml(nodes?: any[]): any[] {
  if (!nodes || nodes.length === 0) return [];
  return nodes.map(node => {
    const cleaned: any = {
      type: node.type,
      props: node.props || {}
    };
    if (node.id) cleaned.id = node.id;
    if (node.title) cleaned.title = node.title;
    if (node.bind) cleaned.bind = node.bind;
    if (node.layout) cleaned.layout = node.layout;
    if (node.on) cleaned.on = node.on;
    if (node.visibility) cleaned.visibility = node.visibility;
    if (node.children && node.children.length > 0) {
      cleaned.children = cleanNodesForYaml(node.children);
    }
    return cleaned;
  });
}

/**
 * Single undoable command applying a full YAML string to the DocumentStore
 */
export class ApplyYamlCommand implements Command {
  id = `yaml-apply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  name = 'Apply YAML Changes';
  private previousDoc: AppDefinitionContract;
  private newDoc: AppDefinitionContract;
  private store: DocumentStore;

  constructor(store: DocumentStore, newDoc: AppDefinitionContract) {
    this.store = store;
    this.previousDoc = JSON.parse(JSON.stringify(store.getDocument()));
    this.newDoc = JSON.parse(JSON.stringify(newDoc));
  }

  execute(): void {
    this.store.setDocument(this.newDoc);
  }

  undo(): void {
    this.store.setDocument(this.previousDoc);
  }
}
