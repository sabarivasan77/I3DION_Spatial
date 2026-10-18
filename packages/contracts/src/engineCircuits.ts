import { z } from 'zod';

export const Vector3TupleSchema = z.tuple([z.number(), z.number(), z.number()]);
export type Vector3Tuple = z.infer<typeof Vector3TupleSchema>;

export const MaterialOverrideSchema = z.object({
  color: z.string().optional(),
  roughness: z.number().min(0).max(1).optional(),
  metalness: z.number().min(0).max(1).optional(),
  opacity: z.number().min(0).max(1).optional(),
  emissive: z.string().optional()
});
export type MaterialOverride = z.infer<typeof MaterialOverrideSchema>;

export const SceneObjectTransformSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: Vector3TupleSchema.default([0, 0, 0]),
  rotation: Vector3TupleSchema.default([0, 0, 0]),
  scale: Vector3TupleSchema.default([1, 1, 1]),
  visible: z.boolean().default(true),
  materialOverride: MaterialOverrideSchema.optional().nullable()
});
export type SceneObjectTransform = z.infer<typeof SceneObjectTransformSchema>;

export const KeyframePointSchema = z.object({
  time: z.number().min(0),
  value: z.union([z.number(), Vector3TupleSchema, z.string()]),
  easing: z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut', 'step']).default('linear')
});
export type KeyframePoint = z.infer<typeof KeyframePointSchema>;

export const KeyframeTrackSchema = z.object({
  targetId: z.string(),
  property: z.enum(['position', 'rotation', 'scale', 'opacity', 'explodedFactor']),
  keyframes: z.array(KeyframePointSchema).default([])
});
export type KeyframeTrack = z.infer<typeof KeyframeTrackSchema>;

export const SceneDocumentSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  sourceAssetId: z.string().uuid().optional().nullable(),
  sourceAssetSha256: z.string().optional().nullable(),
  objects: z.record(SceneObjectTransformSchema).default({}),
  timeline: z.object({
    duration: z.number().positive().default(5.0),
    currentTime: z.number().min(0).default(0),
    tracks: z.array(KeyframeTrackSchema).default([])
  }).default({ duration: 5.0, currentTime: 0, tracks: [] }),
  revision: z.number().int().positive().default(1)
});
export type SceneDocument = z.infer<typeof SceneDocumentSchema>;

// Circuit Types & Intermediate Representation (IR)
export const CircuitPortTypeSchema = z.enum([
  'exec',
  'boolean',
  'number',
  'string',
  'vector3',
  'objectRef',
  'any'
]);
export type CircuitPortType = z.infer<typeof CircuitPortTypeSchema>;

export const CircuitPortSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: CircuitPortTypeSchema,
  defaultValue: z.any().optional()
});
export type CircuitPort = z.infer<typeof CircuitPortSchema>;

export const CircuitNodeSchema = z.object({
  id: z.string(),
  chipId: z.string(),
  category: z.enum(['events', 'actions', 'ecosystem', 'logic', 'variables']),
  params: z.record(z.any()).default({}),
  position: z.object({ x: z.number(), y: z.number() }).default({ x: 0, y: 0 })
});
export type CircuitNode = z.infer<typeof CircuitNodeSchema>;

export const CircuitEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceHandle: z.string().optional(),
  target: z.string(),
  targetHandle: z.string().optional()
});
export type CircuitEdge = z.infer<typeof CircuitEdgeSchema>;

export const CircuitGraphSchema = z.object({
  nodes: z.array(CircuitNodeSchema).default([]),
  edges: z.array(CircuitEdgeSchema).default([])
});
export type CircuitGraph = z.infer<typeof CircuitGraphSchema>;

export const CircuitIRInstructionSchema = z.object({
  chipId: z.string(),
  category: z.string(),
  params: z.record(z.any()).default({}),
  nextSteps: z.array(z.string()).default([])
});
export type CircuitIRInstruction = z.infer<typeof CircuitIRInstructionSchema>;

export const CircuitIRSchema = z.object({
  version: z.literal('1.0').default('1.0'),
  entrypoints: z.record(z.array(z.string())).default({}),
  instructions: z.record(CircuitIRInstructionSchema).default({})
});
export type CircuitIR = z.infer<typeof CircuitIRSchema>;
