import { create } from 'zustand';
import { EngineProject, EngineMode, ViewportDevice, TransformGizmoMode, SceneNode, UIElement, LogicNode, LogicConnection, EngineVariable } from '../types/engineTypes';
import { DEFAULT_INDUSTRIAL_COMPRESSOR_PROJECT, INITIAL_PROJECT_TEMPLATES } from '../data/defaultEngineProjects';

interface EngineStoreState {
  // Mode & Navigation
  activeMode: EngineMode;
  setActiveMode: (mode: EngineMode) => void;
  viewportDevice: ViewportDevice;
  setViewportDevice: (device: ViewportDevice) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;

  // Project Management
  currentProject: EngineProject;
  projectsList: EngineProject[];
  selectProject: (id: string) => void;
  createNewProject: (name: string, templateId?: string) => void;
  duplicateProject: (id: string) => void;
  deleteProject: (id: string) => void;
  saveCurrentProject: () => void;
  autosaveStatus: 'saved' | 'saving' | 'unsaved';

  // Selection & Tools
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedUIElementId: string | null;
  setSelectedUIElementId: (id: string | null) => void;
  gizmoMode: TransformGizmoMode;
  setGizmoMode: (mode: TransformGizmoMode) => void;
  renderMode: 'solid' | 'wireframe' | 'xray';
  setRenderMode: (mode: 'solid' | 'wireframe' | 'xray') => void;

  // Layout Docks
  isTimelineOpen: boolean;
  toggleTimeline: () => void;
  isLeftDockOpen: boolean;
  toggleLeftDock: () => void;
  isRightDockOpen: boolean;
  toggleRightDock: () => void;

  // CRUD Operations on Current Project
  updateSceneNodeTransform: (nodeId: string, transform: Partial<SceneNode['transform']>) => void;
  toggleNodeVisibility: (nodeId: string) => void;
  addSceneNode: (node: SceneNode) => void;
  deleteSceneNode: (nodeId: string) => void;
  renameSceneNode: (nodeId: string, newName: string) => void;

  // UI Elements
  addUIElement: (element: UIElement) => void;
  deleteUIElement: (elementId: string) => void;

  // Logic Graph
  addLogicNode: (node: LogicNode) => void;
  updateLogicNodePosition: (nodeId: string, pos: { x: number; y: number }) => void;
  deleteLogicNode: (nodeId: string) => void;
  connectLogicNodes: (connection: LogicConnection) => void;
  deleteLogicConnection: (connectionId: string) => void;

  // Variables
  addVariable: (variable: EngineVariable) => void;
  deleteVariable: (varId: string) => void;
  updateVariableValue: (varId: string, val: any) => void;

  // History Undo/Redo
  undoStack: EngineProject[];
  redoStack: EngineProject[];
  undo: () => void;
  redo: () => void;

  // Runtime State
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  runtimeVars: Record<string, any>;
  triggerLogicEvent: (eventId: string, payload?: any) => void;
}

export const useEngineStore = create<EngineStoreState>((set, get) => ({
  activeMode: 'ui',
  setActiveMode: (mode) => set({ activeMode: mode }),
  viewportDevice: 'desktop',
  setViewportDevice: (device) => set({ viewportDevice: device }),
  zoomLevel: 100,
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),

  currentProject: DEFAULT_INDUSTRIAL_COMPRESSOR_PROJECT,
  projectsList: INITIAL_PROJECT_TEMPLATES,
  autosaveStatus: 'saved',

  selectProject: (id) => {
    const found = get().projectsList.find((p) => p.id === id);
    if (found) {
      set({ currentProject: found, activeMode: 'ui', selectedNodeId: null, selectedUIElementId: null });
    }
  },

  createNewProject: (name, templateId) => {
    const base = templateId ? get().projectsList.find((p) => p.id === templateId) : null;
    const newProj: EngineProject = {
      id: `proj_${Date.now()}`,
      name: name || 'New Spatial Experience',
      description: 'Custom created 3D interaction experience.',
      status: 'Draft',
      updatedAt: 'Just now',
      thumbnailUrl: base?.thumbnailUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      sceneGraph: base ? JSON.parse(JSON.stringify(base.sceneGraph)) : [
        {
          id: 'root_group',
          name: 'Main_Assembly',
          type: 'group',
          visible: true,
          transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        }
      ],
      uiElements: base ? JSON.parse(JSON.stringify(base.uiElements)) : [],
      logicGraph: base ? JSON.parse(JSON.stringify(base.logicGraph)) : { nodes: [], connections: [] },
      variables: base ? JSON.parse(JSON.stringify(base.variables)) : [],
      animations: base ? JSON.parse(JSON.stringify(base.animations)) : []
    };

    set((state) => ({
      projectsList: [newProj, ...state.projectsList],
      currentProject: newProj,
      activeMode: 'ui'
    }));
  },

  duplicateProject: (id) => {
    const target = get().projectsList.find((p) => p.id === id);
    if (!target) return;
    const copy: EngineProject = {
      ...JSON.parse(JSON.stringify(target)),
      id: `proj_${Date.now()}`,
      name: `${target.name} (Copy)`,
      updatedAt: 'Just now'
    };
    set((state) => ({ projectsList: [copy, ...state.projectsList] }));
  },

  deleteProject: (id) => {
    set((state) => {
      const remaining = state.projectsList.filter((p) => p.id !== id);
      const nextCurrent = state.currentProject.id === id ? remaining[0] || DEFAULT_INDUSTRIAL_COMPRESSOR_PROJECT : state.currentProject;
      return { projectsList: remaining, currentProject: nextCurrent };
    });
  },

  saveCurrentProject: () => {
    set({ autosaveStatus: 'saving' });
    setTimeout(() => {
      set((state) => ({
        autosaveStatus: 'saved',
        projectsList: state.projectsList.map((p) => (p.id === state.currentProject.id ? { ...state.currentProject, updatedAt: 'Just now' } : p))
      }));
    }, 600);
  },

  selectedNodeId: 'node_motor',
  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedUIElementId: null }),
  selectedUIElementId: null,
  setSelectedUIElementId: (id) => set({ selectedUIElementId: id, selectedNodeId: null }),

  gizmoMode: 'translate',
  setGizmoMode: (mode) => set({ gizmoMode: mode }),
  renderMode: 'solid',
  setRenderMode: (mode) => set({ renderMode: mode }),

  isTimelineOpen: true,
  toggleTimeline: () => set((state) => ({ isTimelineOpen: !state.isTimelineOpen })),
  isLeftDockOpen: true,
  toggleLeftDock: () => set((state) => ({ isLeftDockOpen: !state.isLeftDockOpen })),
  isRightDockOpen: true,
  toggleRightDock: () => set((state) => ({ isRightDockOpen: !state.isRightDockOpen })),

  updateSceneNodeTransform: (nodeId, partialTransform) => {
    set((state) => {
      const newGraph = state.currentProject.sceneGraph.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            transform: {
              position: { ...node.transform.position, ...partialTransform.position },
              rotation: { ...node.transform.rotation, ...partialTransform.rotation },
              scale: { ...node.transform.scale, ...partialTransform.scale }
            }
          };
        }
        return node;
      });

      return {
        autosaveStatus: 'unsaved',
        currentProject: { ...state.currentProject, sceneGraph: newGraph }
      };
    });
  },

  toggleNodeVisibility: (nodeId) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      currentProject: {
        ...state.currentProject,
        sceneGraph: state.currentProject.sceneGraph.map((node) => node.id === nodeId ? { ...node, visible: !node.visible } : node)
      }
    }));
  },

  addSceneNode: (newNode) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      currentProject: { ...state.currentProject, sceneGraph: [...state.currentProject.sceneGraph, newNode] },
      selectedNodeId: newNode.id
    }));
  },

  deleteSceneNode: (nodeId) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      currentProject: { ...state.currentProject, sceneGraph: state.currentProject.sceneGraph.filter((n) => n.id !== nodeId) }
    }));
  },

  renameSceneNode: (nodeId, newName) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      currentProject: {
        ...state.currentProject,
        sceneGraph: state.currentProject.sceneGraph.map((n) => n.id === nodeId ? { ...n, name: newName } : n)
      }
    }));
  },

  addUIElement: (element) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      currentProject: { ...state.currentProject, uiElements: [...state.currentProject.uiElements, element] },
      selectedUIElementId: element.id
    }));
  },

  deleteUIElement: (elementId) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      selectedUIElementId: state.selectedUIElementId === elementId ? null : state.selectedUIElementId,
      currentProject: { ...state.currentProject, uiElements: state.currentProject.uiElements.filter((e) => e.id !== elementId) }
    }));
  },

  addLogicNode: (node) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      currentProject: {
        ...state.currentProject,
        logicGraph: {
          ...state.currentProject.logicGraph,
          nodes: [...state.currentProject.logicGraph.nodes, node]
        }
      }
    }));
  },

  updateLogicNodePosition: (nodeId, pos) => {
    set((state) => ({
      currentProject: {
        ...state.currentProject,
        logicGraph: {
          ...state.currentProject.logicGraph,
          nodes: state.currentProject.logicGraph.nodes.map((n) => n.id === nodeId ? { ...n, position: pos } : n)
        }
      }
    }));
  },

  deleteLogicNode: (nodeId) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      currentProject: {
        ...state.currentProject,
        logicGraph: {
          nodes: state.currentProject.logicGraph.nodes.filter((n) => n.id !== nodeId),
          connections: state.currentProject.logicGraph.connections.filter((c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId)
        }
      }
    }));
  },

  connectLogicNodes: (connection) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      currentProject: {
        ...state.currentProject,
        logicGraph: {
          ...state.currentProject.logicGraph,
          connections: [...state.currentProject.logicGraph.connections, connection]
        }
      }
    }));
  },

  deleteLogicConnection: (connectionId) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      currentProject: {
        ...state.currentProject,
        logicGraph: {
          ...state.currentProject.logicGraph,
          connections: state.currentProject.logicGraph.connections.filter((c) => c.id !== connectionId)
        }
      }
    }));
  },

  addVariable: (variable) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      currentProject: { ...state.currentProject, variables: [...state.currentProject.variables, variable] }
    }));
  },

  deleteVariable: (varId) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      currentProject: { ...state.currentProject, variables: state.currentProject.variables.filter((v) => v.id !== varId) }
    }));
  },

  updateVariableValue: (varId, val) => {
    set((state) => ({
      currentProject: {
        ...state.currentProject,
        variables: state.currentProject.variables.map((v) => v.id === varId ? { ...v, value: val } : v)
      }
    }));
  },

  undoStack: [],
  redoStack: [],
  undo: () => {},
  redo: () => {},

  isRunning: false,
  setIsRunning: (running) => set({ isRunning: running }),
  runtimeVars: { machineState: 'idle', rpmSpeed: 0 },
  triggerLogicEvent: (eventId, payload) => {
    console.log(`[Engine Runtime] Event triggered: ${eventId}`, payload);
    set((state) => ({
      runtimeVars: { ...state.runtimeVars, machineState: 'running', rpmSpeed: 1450 },
      currentProject: {
        ...state.currentProject,
        sceneGraph: state.currentProject.sceneGraph.map((node) => node.name === 'Motor' ? { ...node, activeAnimation: 'Motor_Start' } : node)
      }
    }));
  }
}));
