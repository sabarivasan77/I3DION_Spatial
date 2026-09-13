import { create } from 'zustand';
import {
  StudioWidgetNode,
  ExperienceSchema,
  CanvasViewport,
} from '../types/studio';
import { widgetRegistry } from '../registry/widgetRegistry';
import { templateRegistry } from '../templates/templateRegistry';

const generateStableId = (type: string): string => {
  const cleanType = type.toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomHex = Math.random().toString(36).substring(2, 8);
  return `widget_${cleanType}_${randomHex}`;
};

const DEFAULT_EXPERIENCE: ExperienceSchema = {
  version: 2,
  id: 'exp_default_01',
  name: 'OmniStudio Interactive Showcase',
  description: 'Custom spatial 3D experience layout',
  canvas: {
    viewport: 'desktop',
    width: 1200,
    height: 800,
    backgroundColor: '#f8fafc',
  },
  widgets: [
    {
      id: 'widget_container_initial',
      type: 'container',
      name: 'Hero Banner Container',
      properties: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderRadius: 16,
        padding: 24,
        minHeight: 180,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        shadow: 'sm',
      },
      children: [],
    },
    {
      id: 'widget_text_initial',
      type: 'text',
      name: 'Main Title',
      properties: {
        content: '3DION OmniStudio Workspace',
        variant: 'h1',
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
        textAlign: 'left',
        lineHeight: 1.3,
      },
    },
    {
      id: 'widget_button_initial',
      type: 'button',
      name: 'Action CTA',
      properties: {
        label: 'Launch 3D Showcase',
        variant: 'primary',
        backgroundColor: '#2563eb',
        textColor: '#ffffff',
        borderRadius: 10,
        fullWidth: false,
      },
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface StudioState {
  experience: ExperienceSchema;
  selectedWidgetId: string | null;
  selectedWidgetIds: string[];
  canvasViewport: CanvasViewport;
  isPreview: boolean;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isTemplateGalleryOpen: boolean;
  history: {
    past: StudioWidgetNode[][];
    future: StudioWidgetNode[][];
  };
  isAssetPickerOpen: boolean;
  assetPickerTargetNodeId: string | null;

  copiedWidgetNode: StudioWidgetNode | null;

  // Actions
  selectWidget: (id: string | null, isMultiSelect?: boolean) => void;
  deleteSelectedWidgets: () => void;
  addWidget: (type: string, parentId?: string | null) => string | null;
  updateWidgetProperties: (id: string, updatedProps: Record<string, any>) => void;
  deleteWidget: (id: string) => void;
  duplicateWidget: (id: string) => string | null;
  copyWidget: (id?: string) => void;
  pasteWidget: () => string | null;
  moveWidget: (id: string, direction: 'up' | 'down') => void;
  bringToFront: (id?: string) => void;
  sendToBack: (id?: string) => void;
  bringForward: (id?: string) => void;
  sendBackward: (id?: string) => void;
  toggleLockWidget: (id: string) => void;
  toggleHideWidget: (id: string) => void;
  groupSelectedWidgets: () => string | null;
  ungroupSelectedWidgets: () => void;
  setCanvasViewport: (viewport: CanvasViewport) => void;
  setPreview: (isPreview: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoomLevel: (level: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  resetPan: () => void;
  openTemplateGallery: () => void;
  closeTemplateGallery: () => void;
  loadTemplate: (templateId: string) => boolean;
  undo: () => void;
  redo: () => void;
  openAssetPicker: (nodeId: string) => void;
  closeAssetPicker: () => void;
  serializeExperience: () => string;
  deserializeExperience: (jsonString: string) => boolean;
  loadInitialDefaults: () => void;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  experience: DEFAULT_EXPERIENCE,
  selectedWidgetId: 'widget_container_initial',
  selectedWidgetIds: ['widget_container_initial'],
  canvasViewport: 'desktop',
  isPreview: false,
  zoomLevel: 1.0,
  panOffset: { x: 0, y: 0 },
  isTemplateGalleryOpen: false,
  history: {
    past: [],
    future: [],
  },
  isAssetPickerOpen: false,
  assetPickerTargetNodeId: null,
  copiedWidgetNode: null,

  selectWidget: (id, isMultiSelect = false) => {
    if (!id) {
      set({ selectedWidgetId: null, selectedWidgetIds: [] });
      return;
    }

    if (isMultiSelect) {
      const currentIds = get().selectedWidgetIds;
      const exists = currentIds.includes(id);
      const updatedIds = exists
        ? currentIds.filter((item) => item !== id)
        : [...currentIds, id];

      set({
        selectedWidgetId: updatedIds.length > 0 ? updatedIds[updatedIds.length - 1] : null,
        selectedWidgetIds: updatedIds,
      });
    } else {
      set({
        selectedWidgetId: id,
        selectedWidgetIds: [id],
      });
    }
  },

  deleteSelectedWidgets: () => {
    const idsToDelete = get().selectedWidgetIds;
    if (idsToDelete.length === 0) return;

    const currentWidgets = get().experience.widgets;
    const historyPast = get().history.past;

    const deleteRecursive = (nodes: StudioWidgetNode[]): StudioWidgetNode[] => {
      return nodes
        .filter((node) => !idsToDelete.includes(node.id))
        .map((node) => ({
          ...node,
          children: node.children ? deleteRecursive(node.children) : undefined,
        }));
    };

    const updatedWidgets = deleteRecursive(currentWidgets);

    set({
      history: {
        past: [...historyPast, JSON.parse(JSON.stringify(currentWidgets))],
        future: [],
      },
      experience: {
        ...get().experience,
        widgets: updatedWidgets,
        updatedAt: new Date().toISOString(),
      },
      selectedWidgetId: null,
      selectedWidgetIds: [],
    });
  },

  addWidget: (type, parentId = null) => {
    const def = widgetRegistry.get(type);
    if (!def) {
      console.error(`Widget type "${type}" not registered.`);
      return null;
    }

    const newId = generateStableId(type);
    const newNode: StudioWidgetNode = {
      id: newId,
      type: def.type,
      name: `${def.displayName} Node`,
      properties: { ...def.defaultProperties },
      parentId,
    };

    const currentWidgets = get().experience.widgets;
    const historyPast = get().history.past;

    const newWidgets = [...currentWidgets, newNode];

    set({
      history: {
        past: [...historyPast, JSON.parse(JSON.stringify(currentWidgets))],
        future: [],
      },
      experience: {
        ...get().experience,
        widgets: newWidgets,
        updatedAt: new Date().toISOString(),
      },
      selectedWidgetId: newId,
      selectedWidgetIds: [newId],
    });

    return newId;
  },

  updateWidgetProperties: (id, updatedProps) => {
    const currentWidgets = get().experience.widgets;
    const historyPast = get().history.past;

    const updateRecursive = (nodes: StudioWidgetNode[]): StudioWidgetNode[] => {
      return nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            properties: { ...node.properties, ...updatedProps },
          };
        }
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: updateRecursive(node.children),
          };
        }
        return node;
      });
    };

    const updatedWidgets = updateRecursive(currentWidgets);

    set({
      history: {
        past: [...historyPast, JSON.parse(JSON.stringify(currentWidgets))],
        future: [],
      },
      experience: {
        ...get().experience,
        widgets: updatedWidgets,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  deleteWidget: (id) => {
    const currentWidgets = get().experience.widgets;
    const historyPast = get().history.past;

    const deleteRecursive = (nodes: StudioWidgetNode[]): StudioWidgetNode[] => {
      return nodes
        .filter((node) => node.id !== id)
        .map((node) => ({
          ...node,
          children: node.children ? deleteRecursive(node.children) : undefined,
        }));
    };

    const updatedWidgets = deleteRecursive(currentWidgets);

    set({
      history: {
        past: [...historyPast, JSON.parse(JSON.stringify(currentWidgets))],
        future: [],
      },
      experience: {
        ...get().experience,
        widgets: updatedWidgets,
        updatedAt: new Date().toISOString(),
      },
      selectedWidgetId: get().selectedWidgetId === id ? null : get().selectedWidgetId,
      selectedWidgetIds: get().selectedWidgetIds.filter((item) => item !== id),
    });
  },

  duplicateWidget: (id) => {
    const currentWidgets = get().experience.widgets;
    const historyPast = get().history.past;

    const targetNode = currentWidgets.find((n) => n.id === id);
    if (!targetNode) return null;

    const newId = generateStableId(targetNode.type);
    const duplicatedNode: StudioWidgetNode = {
      ...JSON.parse(JSON.stringify(targetNode)),
      id: newId,
      name: `${targetNode.name} (Copy)`,
    };

    const index = currentWidgets.findIndex((n) => n.id === id);
    const newWidgets = [...currentWidgets];
    newWidgets.splice(index + 1, 0, duplicatedNode);

    set({
      history: {
        past: [...historyPast, JSON.parse(JSON.stringify(currentWidgets))],
        future: [],
      },
      experience: {
        ...get().experience,
        widgets: newWidgets,
        updatedAt: new Date().toISOString(),
      },
      selectedWidgetId: newId,
      selectedWidgetIds: [newId],
    });

    return newId;
  },

  copyWidget: (id) => {
    const targetId = id || get().selectedWidgetId;
    if (!targetId) return;

    const findRecursive = (nodes: StudioWidgetNode[]): StudioWidgetNode | null => {
      for (const node of nodes) {
        if (node.id === targetId) return node;
        if (node.children) {
          const found = findRecursive(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const targetNode = findRecursive(get().experience.widgets);
    if (targetNode) {
      set({ copiedWidgetNode: JSON.parse(JSON.stringify(targetNode)) });
    }
  },

  pasteWidget: () => {
    const copied = get().copiedWidgetNode;
    if (!copied) return null;

    const regenerateNodeIds = (node: StudioWidgetNode): StudioWidgetNode => {
      const freshId = generateStableId(node.type);
      return {
        ...JSON.parse(JSON.stringify(node)),
        id: freshId,
        name: `${node.name} (Pasted)`,
        children: node.children ? node.children.map(regenerateNodeIds) : undefined,
      };
    };

    const pastedNode = regenerateNodeIds(copied);
    const currentWidgets = get().experience.widgets;
    const historyPast = get().history.past;

    const newWidgets = [...currentWidgets, pastedNode];

    set({
      history: {
        past: [...historyPast, JSON.parse(JSON.stringify(currentWidgets))],
        future: [],
      },
      experience: {
        ...get().experience,
        widgets: newWidgets,
        updatedAt: new Date().toISOString(),
      },
      selectedWidgetId: pastedNode.id,
      selectedWidgetIds: [pastedNode.id],
    });

    return pastedNode.id;
  },

  moveWidget: (id, direction) => {
    const currentWidgets = [...get().experience.widgets];
    const index = currentWidgets.findIndex((n) => n.id === id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentWidgets.length) return;

    const historyPast = get().history.past;
    const temp = currentWidgets[index];
    currentWidgets[index] = currentWidgets[targetIndex];
    currentWidgets[targetIndex] = temp;

    set({
      history: {
        past: [...historyPast, JSON.parse(JSON.stringify(get().experience.widgets))],
        future: [],
      },
      experience: {
        ...get().experience,
        widgets: currentWidgets,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  bringToFront: (id) => {
    const targetId = id || get().selectedWidgetId;
    if (!targetId) return;
    const currentWidgets = [...get().experience.widgets];
    const index = currentWidgets.findIndex((n) => n.id === targetId);
    if (index === -1 || index === currentWidgets.length - 1) return;

    const historyPast = get().history.past;
    const [targetNode] = currentWidgets.splice(index, 1);
    currentWidgets.push(targetNode);

    set({
      history: { past: [...historyPast, JSON.parse(JSON.stringify(get().experience.widgets))], future: [] },
      experience: { ...get().experience, widgets: currentWidgets, updatedAt: new Date().toISOString() },
    });
  },

  sendToBack: (id) => {
    const targetId = id || get().selectedWidgetId;
    if (!targetId) return;
    const currentWidgets = [...get().experience.widgets];
    const index = currentWidgets.findIndex((n) => n.id === targetId);
    if (index <= 0) return;

    const historyPast = get().history.past;
    const [targetNode] = currentWidgets.splice(index, 1);
    currentWidgets.unshift(targetNode);

    set({
      history: { past: [...historyPast, JSON.parse(JSON.stringify(get().experience.widgets))], future: [] },
      experience: { ...get().experience, widgets: currentWidgets, updatedAt: new Date().toISOString() },
    });
  },

  bringForward: (id) => {
    const targetId = id || get().selectedWidgetId;
    if (targetId) get().moveWidget(targetId, 'down');
  },

  sendBackward: (id) => {
    const targetId = id || get().selectedWidgetId;
    if (targetId) get().moveWidget(targetId, 'up');
  },

  toggleLockWidget: (id) => {
    const currentWidgets = get().experience.widgets;
    const historyPast = get().history.past;

    const toggleRecursive = (nodes: StudioWidgetNode[]): StudioWidgetNode[] => {
      return nodes.map((node) => {
        if (node.id === id) {
          return { ...node, locked: !node.locked };
        }
        if (node.children) {
          return { ...node, children: toggleRecursive(node.children) };
        }
        return node;
      });
    };

    set({
      history: { past: [...historyPast, JSON.parse(JSON.stringify(currentWidgets))], future: [] },
      experience: { ...get().experience, widgets: toggleRecursive(currentWidgets), updatedAt: new Date().toISOString() },
    });
  },

  toggleHideWidget: (id) => {
    const currentWidgets = get().experience.widgets;
    const historyPast = get().history.past;

    const toggleRecursive = (nodes: StudioWidgetNode[]): StudioWidgetNode[] => {
      return nodes.map((node) => {
        if (node.id === id) {
          return { ...node, hidden: !node.hidden };
        }
        if (node.children) {
          return { ...node, children: toggleRecursive(node.children) };
        }
        return node;
      });
    };

    set({
      history: { past: [...historyPast, JSON.parse(JSON.stringify(currentWidgets))], future: [] },
      experience: { ...get().experience, widgets: toggleRecursive(currentWidgets), updatedAt: new Date().toISOString() },
    });
  },

  groupSelectedWidgets: () => {
    const selectedIds = get().selectedWidgetIds;
    if (selectedIds.length < 2) return null;

    const currentWidgets = get().experience.widgets;
    const historyPast = get().history.past;

    const selectedNodes = currentWidgets.filter((w) => selectedIds.includes(w.id));
    const remainingWidgets = currentWidgets.filter((w) => !selectedIds.includes(w.id));

    const groupId = generateStableId('container');
    const groupNode: StudioWidgetNode = {
      id: groupId,
      type: 'container',
      name: 'Group Container',
      isGroup: true,
      properties: {
        backgroundColor: 'transparent',
        borderColor: '#94a3b8',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        flexDirection: 'column',
      },
      children: selectedNodes,
    };

    const newWidgets = [...remainingWidgets, groupNode];

    set({
      history: { past: [...historyPast, JSON.parse(JSON.stringify(currentWidgets))], future: [] },
      experience: { ...get().experience, widgets: newWidgets, updatedAt: new Date().toISOString() },
      selectedWidgetId: groupId,
      selectedWidgetIds: [groupId],
    });

    return groupId;
  },

  ungroupSelectedWidgets: () => {
    const targetId = get().selectedWidgetId;
    if (!targetId) return;

    const currentWidgets = get().experience.widgets;
    const targetNode = currentWidgets.find((w) => w.id === targetId);
    if (!targetNode || !targetNode.children || targetNode.children.length === 0) return;

    const historyPast = get().history.past;
    const index = currentWidgets.findIndex((w) => w.id === targetId);
    const newWidgets = [...currentWidgets];
    newWidgets.splice(index, 1, ...targetNode.children);

    set({
      history: { past: [...historyPast, JSON.parse(JSON.stringify(currentWidgets))], future: [] },
      experience: { ...get().experience, widgets: newWidgets, updatedAt: new Date().toISOString() },
      selectedWidgetId: targetNode.children[0].id,
      selectedWidgetIds: targetNode.children.map((c) => c.id),
    });
  },

  setCanvasViewport: (viewport) =>
    set((state) => ({
      canvasViewport: viewport,
      experience: {
        ...state.experience,
        canvas: { ...state.experience.canvas, viewport },
      },
    })),

  setPreview: (isPreview) => set({ isPreview }),

  zoomIn: () =>
    set((state) => ({
      zoomLevel: Math.min(2.0, parseFloat((state.zoomLevel + 0.1).toFixed(2))),
    })),

  zoomOut: () =>
    set((state) => ({
      zoomLevel: Math.max(0.5, parseFloat((state.zoomLevel - 0.1).toFixed(2))),
    })),

  resetZoom: () => set({ zoomLevel: 1.0 }),

  setZoomLevel: (level) => set({ zoomLevel: Math.max(0.5, Math.min(2.0, level)) }),

  setPanOffset: (offset) => set({ panOffset: offset }),

  resetPan: () => set({ panOffset: { x: 0, y: 0 } }),

  openTemplateGallery: () => set({ isTemplateGalleryOpen: true }),

  closeTemplateGallery: () => set({ isTemplateGalleryOpen: false }),

  loadTemplate: (templateId) => {
    try {
      const clonedExperience = templateRegistry.cloneTemplateAsExperience(templateId);
      const firstWidgetId =
        clonedExperience.widgets.length > 0 ? clonedExperience.widgets[0].id : null;

      set({
        experience: clonedExperience,
        selectedWidgetId: firstWidgetId,
        selectedWidgetIds: firstWidgetId ? [firstWidgetId] : [],
        history: { past: [], future: [] }, // Clean history initialization
        isTemplateGalleryOpen: false,
        zoomLevel: 1.0,
        panOffset: { x: 0, y: 0 },
      });
      return true;
    } catch (e) {
      console.error('Failed to load template:', e);
      return false;
    }
  },

  undo: () => {
    const { past, future } = get().history;
    if (past.length === 0) return;

    const previousWidgets = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const currentWidgets = get().experience.widgets;

    set({
      history: {
        past: newPast,
        future: [JSON.parse(JSON.stringify(currentWidgets)), ...future],
      },
      experience: {
        ...get().experience,
        widgets: previousWidgets,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  redo: () => {
    const { past, future } = get().history;
    if (future.length === 0) return;

    const nextWidgets = future[0];
    const newFuture = future.slice(1);
    const currentWidgets = get().experience.widgets;

    set({
      history: {
        past: [...past, JSON.parse(JSON.stringify(currentWidgets))],
        future: newFuture,
      },
      experience: {
        ...get().experience,
        widgets: nextWidgets,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  openAssetPicker: (nodeId) =>
    set({ isAssetPickerOpen: true, assetPickerTargetNodeId: nodeId }),

  closeAssetPicker: () =>
    set({ isAssetPickerOpen: false, assetPickerTargetNodeId: null }),

  serializeExperience: () => {
    return JSON.stringify(get().experience, null, 2);
  },

  deserializeExperience: (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.widgets)) {
        // Upgrade Version 1 to Version 2 schema migration
        if (!parsed.version || parsed.version < 2) {
          parsed.version = 2;
        }
        set({
          experience: parsed,
          selectedWidgetId: parsed.widgets.length > 0 ? parsed.widgets[0].id : null,
          selectedWidgetIds: parsed.widgets.length > 0 ? [parsed.widgets[0].id] : [],
          history: { past: [], future: [] },
        });
        return true;
      }
    } catch (e) {
      console.error('Failed to deserialize experience JSON:', e);
    }
    return false;
  },

  loadInitialDefaults: () => {
    set({
      experience: DEFAULT_EXPERIENCE,
      selectedWidgetId: 'widget_container_initial',
      selectedWidgetIds: ['widget_container_initial'],
      history: { past: [], future: [] },
      zoomLevel: 1.0,
      panOffset: { x: 0, y: 0 },
    });
  },
}));

