import { useStudioStore } from '../../studio/store/useStudioStore';
import { useRuntimeStore } from '../runtime/runtimeContext';

export class StudioWidgetResolver {
  public static resolveWidget(widgetId: string) {
    const experience = useStudioStore.getState().experience;
    return experience.widgets?.find((w) => w.id === widgetId) || null;
  }

  public static showWidget(widgetId: string): { success: boolean; message: string } {
    const widget = this.resolveWidget(widgetId);
    if (!widget) {
      return { success: false, message: `Widget "${widgetId}" not found in current experience.` };
    }

    useRuntimeStore.getState().setTransientWidgetOverride(widgetId, { hidden: false });
    return { success: true, message: `Widget "${widget.name || widgetId}" made visible.` };
  }

  public static hideWidget(widgetId: string): { success: boolean; message: string } {
    const widget = this.resolveWidget(widgetId);
    if (!widget) {
      return { success: false, message: `Widget "${widgetId}" not found in current experience.` };
    }

    useRuntimeStore.getState().setTransientWidgetOverride(widgetId, { hidden: true });
    return { success: true, message: `Widget "${widget.name || widgetId}" hidden.` };
  }

  public static toggleVisibility(widgetId: string): { success: boolean; message: string } {
    const widget = this.resolveWidget(widgetId);
    if (!widget) {
      return { success: false, message: `Widget "${widgetId}" not found in current experience.` };
    }

    const currentOverride = useRuntimeStore.getState().transientWidgetOverrides[widgetId];
    const isCurrentlyHidden = currentOverride?.hidden ?? widget.properties?.hidden ?? false;

    useRuntimeStore.getState().setTransientWidgetOverride(widgetId, { hidden: !isCurrentlyHidden });
    return {
      success: true,
      message: `Widget "${widget.name || widgetId}" visibility toggled to ${isCurrentlyHidden ? 'visible' : 'hidden'}.`,
    };
  }

  public static setText(widgetId: string, text: string): { success: boolean; message: string } {
    const widget = this.resolveWidget(widgetId);
    if (!widget) {
      return { success: false, message: `Widget "${widgetId}" not found in current experience.` };
    }

    useRuntimeStore.getState().setTransientWidgetOverride(widgetId, { text });
    return { success: true, message: `Set text on "${widget.name || widgetId}" to "${text}".` };
  }
}
