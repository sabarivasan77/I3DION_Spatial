import type { BlockSchema } from './types';
import { DEFAULT_BLOCK_SCHEMAS } from './schemas';

export class BlockRegistry {
  private schemas: Map<string, BlockSchema> = new Map();

  constructor() {
    for (const schema of DEFAULT_BLOCK_SCHEMAS) {
      this.register(schema);
    }
  }

  public register(schema: BlockSchema): void {
    this.schemas.set(schema.type, schema);
  }

  public get(type: string): BlockSchema | undefined {
    return this.schemas.get(type);
  }

  public listAll(): BlockSchema[] {
    return Array.from(this.schemas.values());
  }

  public listByCategory(category: BlockSchema['category']): BlockSchema[] {
    return this.listAll().filter((s) => s.category === category);
  }

  public createInstance(type: string, overrides: Record<string, any> = {}) {
    const schema = this.get(type);
    if (!schema) {
      throw new Error(`Unregistered block type: ${type}`);
    }

    return {
      id: `block-${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: schema.type,
      title: schema.title,
      category: schema.category,
      props: {
        ...schema.defaultProps,
        ...overrides,
      },
    };
  }
}

export const blockRegistry = new BlockRegistry();
