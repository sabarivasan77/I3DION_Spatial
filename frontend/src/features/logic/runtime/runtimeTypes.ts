export type RuntimeMode = 'EDITOR' | 'PREVIEW';

export type ExecutionState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ERROR' | 'STOPPED';

export type LogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface RuntimeLogEntry {
  id: string;
  timestamp: string;
  nodeId?: string;
  nodeName?: string;
  action?: string;
  status: LogLevel;
  message: string;
}

export interface RuntimeEventPayload {
  eventType: string;
  widgetId: string;
  objectId?: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface LogicRuntimeContext {
  experienceId: string;
  graphId: string;
  variables: Record<string, any>;
  executionId: string | null;
  mode: RuntimeMode;
  state: ExecutionState;
  activeNodeId: string | null;
  activeConnectionId: string | null;
  completedNodeIds: string[];
  logs: RuntimeLogEntry[];
  transientWidgetOverrides: Record<string, {
    hidden?: boolean;
    text?: string;
    properties?: Record<string, any>;
  }>;
}

export type ActionHandler = (
  properties: Record<string, any>,
  payload: RuntimeEventPayload,
  context: LogicRuntimeContext
) => Promise<{ success: boolean; message: string; output?: any }>;
