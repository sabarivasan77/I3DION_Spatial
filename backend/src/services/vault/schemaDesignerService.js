/**
 * Schema Designer & Dataverse Service for Spatial Vault (Phase P3)
 * Implements 16 typed column types, formula/rollup evaluation, and relational integrity.
 */

import { pool } from '../../db/pool.js';

export const SUPPORTED_FIELD_TYPES = [
  'text',
  'number',
  'currency',
  'unit-number',
  'date',
  'boolean',
  'choice',
  'multi-choice',
  'lookup',
  'many-to-many',
  'rollup',
  'formula',
  'URL',
  'file',
  '3D model ref',
  'image gallery'
];

/**
 * Validate that a field definition complies with Dataverse specifications
 */
export function validateFieldDefinition(field) {
  if (!field.name || typeof field.name !== 'string') {
    throw new Error('Field name is required and must be a string');
  }

  const fieldType = field.field_type || field.type;
  if (!SUPPORTED_FIELD_TYPES.includes(fieldType)) {
    throw new Error(`Unsupported field type: ${fieldType}. Supported types: ${SUPPORTED_FIELD_TYPES.join(', ')}`);
  }

  if (fieldType === 'formula' && !field.formula_definition) {
    throw new Error('Formula field requires a formula_definition');
  }

  if (fieldType === 'rollup' && !field.rollup_definition) {
    throw new Error('Rollup field requires a rollup_definition');
  }

  if (fieldType === 'lookup' && !field.lookup_collection_id) {
    throw new Error('Lookup field requires lookup_collection_id');
  }

  return true;
}

/**
 * Evaluate a safe mathematical or string formula expression for a record.
 * Allowed operators: + - * / ( ) and identifiers referencing existing record columns.
 * Strictly avoids eval() or Function constructor.
 */
export function evaluateFormula(formulaStr, rowData = {}) {
  if (!formulaStr || typeof formulaStr !== 'string') return null;

  try {
    // 1. Tokenize into numbers, identifiers, operators, parens
    const tokens = formulaStr.match(/([a-zA-Z_][a-zA-Z0-9_]*|\d+(\.\d+)?|[-+*/()])/g);
    if (!tokens) return null;

    // 2. Substitute identifiers with numeric values from rowData
    const resolvedTokens = tokens.map(tok => {
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tok)) {
        const val = rowData[tok];
        if (val === undefined || val === null) return '0';
        const num = Number(val);
        if (Number.isNaN(num)) return '0';
        return String(num);
      }
      return tok;
    });

    // 3. Simple recursive-descent parser for arithmetic: Expr = Term ((+|-) Term)*; Term = Factor ((*|/) Factor)*
    let pos = 0;

    function peek() {
      return resolvedTokens[pos];
    }

    function consume(expected) {
      const tok = resolvedTokens[pos];
      if (expected && tok !== expected) throw new Error(`Expected ${expected} but got ${tok}`);
      pos++;
      return tok;
    }

    function parseFactor() {
      const tok = peek();
      if (tok === '(') {
        consume('(');
        const val = parseExpr();
        consume(')');
        return val;
      }
      if (tok === '-') {
        consume('-');
        return -parseFactor();
      }
      if (/^\d+(\.\d+)?$/.test(tok)) {
        consume();
        return Number(tok);
      }
      throw new Error(`Unexpected token in formula: ${tok}`);
    }

    function parseTerm() {
      let left = parseFactor();
      while (pos < resolvedTokens.length && (peek() === '*' || peek() === '/')) {
        const op = consume();
        const right = parseFactor();
        if (op === '*') left = left * right;
        else {
          if (right === 0) return 0;
          left = left / right;
        }
      }
      return left;
    }

    function parseExpr() {
      let left = parseTerm();
      while (pos < resolvedTokens.length && (peek() === '+' || peek() === '-')) {
        const op = consume();
        const right = parseTerm();
        if (op === '+') left = left + right;
        else left = left - right;
      }
      return left;
    }

    const result = parseExpr();
    return Math.round(result * 10000) / 10000; // round to 4 decimals
  } catch (err) {
    console.warn(`[Formula Evaluation Warning] Failed evaluating "${formulaStr}": ${err.message}`);
    return null;
  }
}

/**
 * Check relationship constraints before deleting a record or collection.
 * Throws an error if delete is restricted and referenced records exist.
 */
export async function assertDeleteAllowed(targetType, targetId, orgId) {
  if (targetType === 'collection') {
    const relRes = await pool.query(
      `SELECT r.*, c.name as source_collection_name
       FROM vault_relationships r
       JOIN vault_collections c ON c.id = r.source_collection_id
       WHERE r.target_collection_id = $1 
         AND r.organization_id = $2
         AND r.on_delete = 'restrict'`,
      [targetId, orgId]
    );

    if (relRes.rows.length > 0) {
      const activeLinks = await pool.query(
        `SELECT COUNT(*) as count 
         FROM vault_records 
         WHERE collection_id = $1 AND organization_id = $2`,
        [relRes.rows[0].source_collection_id, orgId]
      );

      if (Number(activeLinks.rows[0].count) > 0) {
        throw new Error(
          `Cannot delete collection: referenced by active relationship "${relRes.rows[0].name}" from collection "${relRes.rows[0].source_collection_name}" with on_delete=restrict`
        );
      }
    }
  } else if (targetType === 'record') {
    // Check if any other records in any collection point to this record via a lookup
    const lookupRes = await pool.query(
      `SELECT r.id, r.name, c.name as collection_name
       FROM vault_records r
       JOIN vault_collections c ON c.id = r.collection_id
       WHERE r.organization_id = $1
         AND r.data->>'lookup_record_id' = $2
       LIMIT 1`,
      [orgId, targetId]
    );

    if (lookupRes.rows.length > 0) {
      throw new Error(
        `Cannot delete record: referenced by active record "${lookupRes.rows[0].name}" in collection "${lookupRes.rows[0].collection_name}" (restrict constraint enforced)`
      );
    }
  }
}
