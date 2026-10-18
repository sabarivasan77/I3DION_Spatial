import type { BlockDef, BlockCategory, ValidationError } from './types.ts';

export class BlockRegistry {
  private blocks: Map<string, BlockDef> = new Map();

  register(def: BlockDef): void {
    if (this.blocks.has(def.type)) {
      console.warn(`BlockRegistry: Overwriting existing block definition for type '${def.type}'`);
    }
    this.blocks.set(def.type, def);
  }

  get(type: string): BlockDef | undefined {
    return this.blocks.get(type);
  }

  has(type: string): boolean {
    return this.blocks.has(type);
  }

  list(category?: BlockCategory): BlockDef[] {
    const all = Array.from(this.blocks.values());
    if (!category) return all;
    return all.filter(b => b.category === category);
  }

  getAll(): BlockDef[] {
    return Array.from(this.blocks.values());
  }

  canContain(
    parentType: string,
    childType: string,
    currentChildCount = 0
  ): { allowed: boolean; reason?: string } {
    const parent = this.get(parentType);
    if (!parent) {
      return { allowed: false, reason: `Unknown parent block type: '${parentType}'` };
    }

    if (!parent.isContainer) {
      return { allowed: false, reason: `Block '${parent.title}' is not a container and cannot hold children` };
    }

    if (parent.capacityLimit !== undefined && currentChildCount >= parent.capacityLimit) {
      return {
        allowed: false,
        reason: `Container '${parent.title}' has reached its maximum capacity of ${parent.capacityLimit} children`
      };
    }

    if (typeof parent.accepts === 'function' && !parent.accepts(childType)) {
      return {
        allowed: false,
        reason: `Container '${parent.title}' does not accept '${childType}' widgets`
      };
    }

    return { allowed: true };
  }

  validateProps(type: string, props: unknown): ValidationError[] {
    const def = this.get(type);
    if (!def) {
      return [{ path: '', message: `Unknown block type: ${type}`, severity: 'error' }];
    }

    const parseResult = def.propsSchema.safeParse(props);
    const errors: ValidationError[] = [];

    if (!parseResult.success) {
      for (const issue of parseResult.error.issues) {
        errors.push({
          path: issue.path.join('.'),
          message: issue.message,
          severity: 'error'
        });
      }
    }

    if (typeof def.validate === 'function' && parseResult.success) {
      const customErrors = def.validate(parseResult.data as any);
      if (Array.isArray(customErrors)) {
        errors.push(...customErrors);
      }
    }

    return errors;
  }
}

export const blockRegistry = new BlockRegistry();
