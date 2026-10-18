/**
 * editor-kernel/types.ts
 * Core types for the unified editor state machine, command stack, and selection.
 */

export type EditorMode = 'layout' | 'circuits' | '3d_edit' | 'preview';

export interface SelectionState {
  selectedBlockId: string | null;
  selectedNodeId: string | null;
  selected3DObjectId: string | null;
  multiSelectIds: string[];
}

export interface Command<T = any> {
  id: string;
  name: string;
  timestamp: number;
  execute: () => void | Promise<void>;
  undo: () => void | Promise<void>;
  payload?: T;
}

export interface HistoryState {
  past: Command[];
  future: Command[];
  maxDepth: number;
}

export interface BlockData {
  id: string;
  type: string;
  title: string;
  category: string;
  props: Record<string, any>;
  children?: BlockData[];
}

export interface CircuitNodeData {
  id: string;
  chipType: 'event' | 'action' | 'transform' | 'condition' | 'variable';
  label: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  config?: Record<string, any>;
  position: { x: number; y: number };
}

export interface CircuitConnection {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}
