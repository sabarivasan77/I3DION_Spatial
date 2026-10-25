import { create } from 'zustand';
import {
  EngineProject,
  EngineMode,
  ViewportDevice,
  TransformGizmoMode,
  SceneNode,
  UIElement,
  LogicNode,
  LogicConnection,
  EngineVariable,
  BlenderObjectMode,
  BlenderTool,
  BlenderShadingMode,
  Vector3D,
  InteractiveWidget,
  SceneInteraction,
  CustomCodeFiles,
  EngineExportSettings
} from '../types/engineTypes';
import { DEFAULT_INDUSTRIAL_COMPRESSOR_PROJECT, INITIAL_PROJECT_TEMPLATES } from '../data/defaultEngineProjects';

export interface ConsoleLogEntry {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
}

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
  renderMode: 'solid' | 'wireframe' | 'xray' | 'material' | 'rendered';
  setRenderMode: (mode: 'solid' | 'wireframe' | 'xray' | 'material' | 'rendered') => void;

  // Blender-Style Workstation Controls
  activeObjectMode: BlenderObjectMode;
  setActiveObjectMode: (mode: BlenderObjectMode) => void;
  activeBlenderTool: BlenderTool;
  setActiveBlenderTool: (tool: BlenderTool) => void;
  showFloorGrid: boolean;
  setShowFloorGrid: (show: boolean) => void;
  showOverlays: boolean;
  setShowOverlays: (show: boolean) => void;
  isNPanelOpen: boolean;
  setIsNPanelOpen: (open: boolean) => void;
  toggleNPanel: () => void;
  isTShelfOpen: boolean;
  setIsTShelfOpen: (open: boolean) => void;
  toggleTShelf: () => void;
  cursor3D: Vector3D;
  setCursor3D: (pos: Vector3D) => void;

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
  addPrimitive: (primitiveType: 'cube' | 'sphere' | 'cylinder' | 'torus' | 'cone' | 'monkey') => void;
  updateNodeMaterial: (nodeId: string, material: Partial<NonNullable<SceneNode['material']>>) => void;

  // Interactive Experience & Verge3D Authoring
  interactiveTab: 'widgets' | 'code' | 'xr' | 'export';
  setInteractiveTab: (tab: 'widgets' | 'code' | 'xr' | 'export') => void;
  selectedWidgetId: string | null;
  setSelectedWidgetId: (id: string | null) => void;
  addWidget: (widget: InteractiveWidget) => void;
  updateWidget: (widgetId: string, updates: Partial<InteractiveWidget>) => void;
  deleteWidget: (widgetId: string) => void;

  // Interaction Rules
  selectedInteractionId: string | null;
  setSelectedInteractionId: (id: string | null) => void;
  addInteraction: (interaction: SceneInteraction) => void;
  updateInteraction: (interactionId: string, updates: Partial<SceneInteraction>) => void;
  deleteInteraction: (interactionId: string) => void;
  executeInteraction: (interactionId: string) => void;

  // Custom Code Files
  activeCodeTab: 'html' | 'css' | 'js';
  setActiveCodeTab: (tab: 'html' | 'css' | 'js') => void;
  updateCodeFile: (file: 'html' | 'css' | 'js', content: string) => void;

  // Console Log Stream
  consoleLogs: ConsoleLogEntry[];
  addConsoleLog: (type: 'log' | 'warn' | 'error' | 'info', message: string) => void;
  clearConsoleLogs: () => void;

  // Export Settings
  exportSettings: EngineExportSettings;
  updateExportSettings: (settings: Partial<EngineExportSettings>) => void;

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
  activeMode: 'modeling',
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
      set({
        currentProject: found,
        activeMode: 'modeling',
        selectedNodeId: null,
        selectedUIElementId: null,
        selectedWidgetId: null
      });
      get().addConsoleLog('info', `Opened project: ${found.name}`);
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
        },
        {
          id: 'node_default_cube',
          name: 'Cube',
          type: 'mesh',
          geometryType: 'cube',
          parent: 'root_group',
          visible: true,
          transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#E94B4B', roughness: 0.35, metalness: 0.25 }
        }
      ],
      widgets: base?.widgets ? JSON.parse(JSON.stringify(base.widgets)) : [],
      interactions: base?.interactions ? JSON.parse(JSON.stringify(base.interactions)) : [],
      codeFiles: base?.codeFiles ? JSON.parse(JSON.stringify(base.codeFiles)) : {
        html: '<div class="hud-card"><h3>Spatial Runtime</h3></div>',
        css: '.hud-card { padding: 12px; background: rgba(0,0,0,0.8); color: #fff; }',
        js: 'console.log("Spatial Runtime Active");'
      },
      uiElements: base ? JSON.parse(JSON.stringify(base.uiElements)) : [],
      logicGraph: base ? JSON.parse(JSON.stringify(base.logicGraph)) : { nodes: [], connections: [] },
      variables: base ? JSON.parse(JSON.stringify(base.variables)) : [],
      animations: base ? JSON.parse(JSON.stringify(base.animations)) : []
    };

    set((state) => ({
      projectsList: [newProj, ...state.projectsList],
      currentProject: newProj,
      activeMode: 'modeling',
      selectedNodeId: 'node_default_cube'
    }));
    get().addConsoleLog('info', `Created new project: ${newProj.name}`);
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
    get().addConsoleLog('info', `Duplicated project: ${copy.name}`);
  },

  deleteProject: (id) => {
    set((state) => {
      const remaining = state.projectsList.filter((p) => p.id !== id);
      const nextCurrent = state.currentProject.id === id ? remaining[0] || DEFAULT_INDUSTRIAL_COMPRESSOR_PROJECT : state.currentProject;
      return { projectsList: remaining, currentProject: nextCurrent };
    });
    get().addConsoleLog('warn', `Deleted project ID: ${id}`);
  },

  saveCurrentProject: () => {
    set({ autosaveStatus: 'saving' });
    setTimeout(() => {
      set((state) => ({
        autosaveStatus: 'saved',
        projectsList: state.projectsList.map((p) => (p.id === state.currentProject.id ? { ...state.currentProject, updatedAt: 'Just now' } : p))
      }));
      get().addConsoleLog('info', `Saved project [${get().currentProject.name}] successfully.`);
    }, 500);
  },

  selectedNodeId: 'node_motor',
  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedUIElementId: null }),
  selectedUIElementId: null,
  setSelectedUIElementId: (id) => set({ selectedUIElementId: id, selectedNodeId: null }),

  gizmoMode: 'translate',
  setGizmoMode: (mode) => set({ gizmoMode: mode }),
  renderMode: 'solid',
  setRenderMode: (mode) => set({ renderMode: mode }),

  activeObjectMode: 'object',
  setActiveObjectMode: (mode) => set({ activeObjectMode: mode }),
  activeBlenderTool: 'select',
  setActiveBlenderTool: (tool) => {
    set({ activeBlenderTool: tool });
    if (tool === 'move') set({ gizmoMode: 'translate' });
    else if (tool === 'rotate') set({ gizmoMode: 'rotate' });
    else if (tool === 'scale') set({ gizmoMode: 'scale' });
  },
  showFloorGrid: true,
  setShowFloorGrid: (show) => set({ showFloorGrid: show }),
  showOverlays: true,
  setShowOverlays: (show) => set({ showOverlays: show }),
  isNPanelOpen: true,
  setIsNPanelOpen: (open) => set({ isNPanelOpen: open }),
  toggleNPanel: () => set((state) => ({ isNPanelOpen: !state.isNPanelOpen })),
  isTShelfOpen: true,
  setIsTShelfOpen: (open) => set({ isTShelfOpen: open }),
  toggleTShelf: () => set((state) => ({ isTShelfOpen: !state.isTShelfOpen })),
  cursor3D: { x: 0, y: 0, z: 0 },
  setCursor3D: (pos) => set({ cursor3D: pos }),

  isTimelineOpen: false,
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
    get().addConsoleLog('info', `Deleted scene node: ${nodeId}`);
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

  addPrimitive: (primitiveType) => {
    const count = get().currentProject.sceneGraph.filter((n) => n.geometryType === primitiveType).length + 1;
    const name = `${primitiveType.charAt(0).toUpperCase() + primitiveType.slice(1)}_${count}`;
    const newNode: SceneNode = {
      id: `node_${primitiveType}_${Date.now()}`,
      name,
      type: 'mesh',
      geometryType: primitiveType,
      visible: true,
      transform: {
        position: { ...get().cursor3D },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      material: {
        color: '#E94B4B',
        roughness: 0.35,
        metalness: 0.3
      }
    };
    get().addSceneNode(newNode);
    get().addConsoleLog('info', `Created mesh primitive [${name}] at (${newNode.transform.position.x.toFixed(1)}, ${newNode.transform.position.y.toFixed(1)}, ${newNode.transform.position.z.toFixed(1)})`);
  },

  updateNodeMaterial: (nodeId, material) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      currentProject: {
        ...state.currentProject,
        sceneGraph: state.currentProject.sceneGraph.map((node) =>
          node.id === nodeId
            ? { ...node, material: { ...node.material, ...material } }
            : node
        )
      }
    }));
  },

  // Interactive Experience & Verge3D Authoring
  interactiveTab: 'widgets',
  setInteractiveTab: (tab) => set({ interactiveTab: tab }),
  selectedWidgetId: null,
  setSelectedWidgetId: (id) => set({ selectedWidgetId: id }),

  addWidget: (widget) => {
    set((state) => {
      const widgets = state.currentProject.widgets || [];
      return {
        autosaveStatus: 'unsaved',
        selectedWidgetId: widget.id,
        currentProject: {
          ...state.currentProject,
          widgets: [...widgets, widget]
        }
      };
    });
    get().addConsoleLog('info', `Added widget: ${widget.title} (${widget.type})`);
  },

  updateWidget: (widgetId, updates) => {
    set((state) => {
      const widgets = (state.currentProject.widgets || []).map((w) =>
        w.id === widgetId ? { ...w, ...updates } : w
      );
      return {
        autosaveStatus: 'unsaved',
        currentProject: { ...state.currentProject, widgets }
      };
    });
  },

  deleteWidget: (widgetId) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      selectedWidgetId: state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
      currentProject: {
        ...state.currentProject,
        widgets: (state.currentProject.widgets || []).filter((w) => w.id !== widgetId)
      }
    }));
    get().addConsoleLog('info', `Removed widget: ${widgetId}`);
  },

  // Interaction Rules
  selectedInteractionId: null,
  setSelectedInteractionId: (id) => set({ selectedInteractionId: id }),

  addInteraction: (interaction) => {
    set((state) => {
      const interactions = state.currentProject.interactions || [];
      return {
        autosaveStatus: 'unsaved',
        selectedInteractionId: interaction.id,
        currentProject: {
          ...state.currentProject,
          interactions: [...interactions, interaction]
        }
      };
    });
    get().addConsoleLog('info', `Added interaction rule: ${interaction.name}`);
  },

  updateInteraction: (interactionId, updates) => {
    set((state) => {
      const interactions = (state.currentProject.interactions || []).map((i) =>
        i.id === interactionId ? { ...i, ...updates } : i
      );
      return {
        autosaveStatus: 'unsaved',
        currentProject: { ...state.currentProject, interactions }
      };
    });
  },

  deleteInteraction: (interactionId) => {
    set((state) => ({
      autosaveStatus: 'unsaved',
      selectedInteractionId: state.selectedInteractionId === interactionId ? null : state.selectedInteractionId,
      currentProject: {
        ...state.currentProject,
        interactions: (state.currentProject.interactions || []).filter((i) => i.id !== interactionId)
      }
    }));
    get().addConsoleLog('info', `Removed interaction: ${interactionId}`);
  },

  executeInteraction: (interactionId) => {
    const interaction = (get().currentProject.interactions || []).find((i) => i.id === interactionId);
    if (!interaction) return;

    get().addConsoleLog('log', `Executing interaction [${interaction.name}] - Trigger: ${interaction.trigger}, Action: ${interaction.action}`);

    if (interaction.action === 'show_hide' && interaction.targetNodeId) {
      get().toggleNodeVisibility(interaction.targetNodeId);
    } else if (interaction.action === 'change_material' && interaction.targetNodeId) {
      if (interaction.parameters.color) {
        get().updateNodeMaterial(interaction.targetNodeId, {
          color: interaction.parameters.color,
          roughness: interaction.parameters.roughness ?? 0.3,
          metalness: interaction.parameters.metalness ?? 0.7
        });
      }
    } else if (interaction.action === 'play_animation' && interaction.targetNodeId) {
      get().triggerLogicEvent('animation_play', { target: interaction.targetNodeId, clip: interaction.parameters.clip });
    } else if (interaction.action === 'open_info') {
      get().addConsoleLog('info', `Info dialog: ${interaction.parameters.title} - ${interaction.parameters.text}`);
    }
  },

  // Custom Code Files
  activeCodeTab: 'html',
  setActiveCodeTab: (tab) => set({ activeCodeTab: tab }),

  updateCodeFile: (file, content) => {
    set((state) => {
      const existing = state.currentProject.codeFiles || { html: '', css: '', js: '' };
      return {
        autosaveStatus: 'unsaved',
        currentProject: {
          ...state.currentProject,
          codeFiles: { ...existing, [file]: content }
        }
      };
    });
  },

  // Console Log Stream
  consoleLogs: [
    {
      id: 'log_init',
      type: 'info',
      message: 'I3DION Spatial Engine v2.4 core ready. Workspaces initialized.',
      timestamp: new Date().toLocaleTimeString()
    }
  ],
  addConsoleLog: (type, message) => {
    const entry: ConsoleLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    set((state) => ({
      consoleLogs: [...state.consoleLogs.slice(-99), entry]
    }));
  },
  clearConsoleLogs: () => set({ consoleLogs: [] }),

  // Export Settings
  exportSettings: {
    format: 'standalone_zip',
    title: 'I3DION Spatial Experience Package',
    includeViewer: true,
    enableAr: true
  },
  updateExportSettings: (settings) => {
    set((state) => ({
      exportSettings: { ...state.exportSettings, ...settings }
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
    get().addConsoleLog('log', `[Engine Runtime] Event triggered: ${eventId} ${JSON.stringify(payload || {})}`);
    set((state) => ({
      runtimeVars: { ...state.runtimeVars, machineState: 'running', rpmSpeed: 1450 },
      currentProject: {
        ...state.currentProject,
        sceneGraph: state.currentProject.sceneGraph.map((node) => node.name === 'Electric_Motor_Core' || node.name === 'Motor' ? { ...node, activeAnimation: 'Motor_Start' } : node)
      }
    }));
  }
}));

