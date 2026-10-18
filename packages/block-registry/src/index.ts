import { blockRegistry } from './registry.ts';
import { layoutBlocks } from './definitions/layout.ts';
import { contentBlocks } from './definitions/content.ts';
import { productBlocks } from './definitions/product.ts';
import { interactionBlocks } from './definitions/interaction.ts';

// Auto-register standard widget catalog blocks
[...layoutBlocks, ...contentBlocks, ...productBlocks, ...interactionBlocks].forEach(block => {
  blockRegistry.register(block);
});

export * from './types.ts';
export * from './registry.ts';
export * from './definitions/layout.ts';
export * from './definitions/content.ts';
export * from './definitions/product.ts';
export * from './definitions/interaction.ts';
