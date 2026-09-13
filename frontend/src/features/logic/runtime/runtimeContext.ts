import { create } from 'zustand';
import {
  LogicRuntimeContext,
  RuntimeMode,
  ExecutionState,
  RuntimeLogEntry,
  LogLevel,
} from './runtimeTypes';

interface RuntimeStoreState extends LogicRuntimeContext {
  setMode: (mode: RuntimeMode) => void;
  setExecutionState: (state: ExecutionState) => void;
  startExecution: (experienceId: string, graphId: string) => string;
  stopExecution: () => void;
  resetRuntime: () => void;
  setVariable: (name: string, value: any) => void;
  getVariable: (name: string) => any;
  setActiveNode: (nodeId: string | null) => void;
  setActiveConnection: (connId: string | null) => void;
  addCompletedNode: (nodeId: string) => void;
  setTransientWidgetOverride: (widgetId: string, override: Partial<{ hidden: boolean; text: string; properties: Record<string, any> }>) => void;
  addLog: (level: LogLevel, message: string, nodeId?: string, nodeName?: string, action?: string) => void;
  clearLogs: () => void;
}

const generateExecutionId = (): string => {
  return `exec_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
};

export const useRuntimeStore = create<RuntimeStoreState>((set, get) => ({
  experienceId: 'exp_default',
  graphId: 'graph_default_01',
  variables: {},
  executionId: null,
  mode: 'EDITOR',
  state: 'IDLE',
  activeNodeId: null,
  activeConnectionId: null,
  completedNodeIds: [],
  logs: [],
  transientWidgetOverrides: {},

  setMode: (mode) => set({ mode }),

  setExecutionState: (state) => set({ state }),

  startExecution: (experienceId, graphId) => {
    const execId = generateExecutionId();
    set({
      experienceId,
      graphId,
      executionId: execId,
      state: 'RUNNING',
      activeNodeId: null,
      activeConnectionId: null,
      completedNodeIds: [],
    });
    get().addLog('INFO', `Started logic execution run (${execId})`);
    return execId;
  },

  stopExecution: () => {
    set({
      state: 'STOPPED',
      activeNodeId: null,
      activeConnectionId: null,
    });
    get().addLog('WARNING', 'Execution manually stopped by user');
  },

  resetRuntime: () => {
    set({
      state: 'IDLE',
      executionId: null,
      variables: {},
      activeNodeId: null,
      activeConnectionId: null,
      completedNodeIds: [],
      transientWidgetOverrides: {},
    });
    get().addLog('INFO', 'Runtime state reset to initial preview baseline');
  },

  setVariable: (name, value) => {
    set((state) => ({
      variables: {
        ...state.variables,
        [name]: value,
      },
    }));
    get().addLog('INFO', `Variable "${name}" set to "${JSON.stringify(value)}"`);
  },

  getVariable: (name) => {
    return get().variables[name];
  },

  setActiveNode: (nodeId) => set({ activeNodeId: nodeId }),

  setActiveConnection: (connId) => set({ activeConnectionId: connId }),

  addCompletedNode: (nodeId) =>
    set((state) => ({
      completedNodeIds: state.completedNodeIds.includes(nodeId)
        ? state.completedNodeIds
        : [...state.completedNodeIds, nodeId],
    })),

  setTransientWidgetOverride: (widgetId, override) => {
    set((state) => {
      const existing = state.transientWidgetOverrides[widgetId] || {};
      return {
        transientWidgetOverrides: {
          ...state.transientWidgetOverrides,
          [widgetId]: {
            ...existing,
            ...override,
            properties: {
              ...(existing.properties || {}),
              ...(override.properties || {}),
            },
          },
        },
      };
    });
  },

  addLog: (level, message, nodeId, nodeName, action) => {
    const entry: RuntimeLogEntry = {
      id: `log_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toLocaleTimeString(),
      nodeId,
      nodeName,
      action,
      status: level,
      message,
    };
    set((state) => ({
      logs: [entry, ...state.logs].slice(0, 100), // Keep last 100 logs
    }));
  },

  clearLogs: () => set({ logs: [] }),
}));
