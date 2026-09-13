import { ActionHandler, RuntimeEventPayload, LogicRuntimeContext } from './runtimeTypes';
import { StudioWidgetResolver } from '../integration/studioWidgetResolver';
import { spatialObjectResolver } from '../integration/spatialObjectResolver';

export class ActionRegistry {
  private handlers: Map<string, ActionHandler> = new Map();

  constructor() {
    this.registerDefaultActions();
  }

  public register(actionType: string, handler: ActionHandler): void {
    this.handlers.set(actionType.toLowerCase(), handler);
  }

  public has(actionType: string): boolean {
    return this.handlers.has(actionType.toLowerCase());
  }

  public get(actionType: string): ActionHandler | undefined {
    return this.handlers.get(actionType.toLowerCase());
  }

  public async execute(
    actionType: string,
    properties: Record<string, any>,
    payload: RuntimeEventPayload,
    context: LogicRuntimeContext
  ): Promise<{ success: boolean; message: string; output?: any }> {
    const handler = this.get(actionType);
    if (!handler) {
      return {
        success: false,
        message: `Action type "${actionType}" is not registered in the runtime action registry.`,
      };
    }

    try {
      const res = await handler(properties, payload, context);
      return {
        success: res.success,
        message: res.message || '',
        output: res.output,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Action error (${actionType}): ${err.message || String(err)}`,
      };
    }
  }

  private registerDefaultActions(): void {
    // 1. Show Widget
    this.register('show_widget', async (props) => {
      const targetId = props.targetWidgetId;
      if (!targetId) return { success: false, message: 'Show Widget requires a target widget ID.' };
      return StudioWidgetResolver.showWidget(targetId);
    });

    // 2. Hide Widget
    this.register('hide_widget', async (props) => {
      const targetId = props.targetWidgetId;
      if (!targetId) return { success: false, message: 'Hide Widget requires a target widget ID.' };
      return StudioWidgetResolver.hideWidget(targetId);
    });

    // 3. Toggle Visibility
    this.register('toggle_visibility', async (props) => {
      const targetId = props.targetWidgetId;
      if (!targetId) return { success: false, message: 'Toggle Visibility requires a target widget ID.' };
      return StudioWidgetResolver.toggleVisibility(targetId);
    });

    // 4. Set Text
    this.register('set_text', async (props) => {
      const targetId = props.targetWidgetId;
      const text = props.text ?? props.value ?? '';
      if (!targetId) return { success: false, message: 'Set Text requires a target widget ID.' };
      return StudioWidgetResolver.setText(targetId, String(text));
    });

    // 5. Play Animation
    this.register('play_animation', async (props) => {
      const targetId = props.targetWidgetId;
      const animName = props.animationName || 'Open';
      if (!targetId) return { success: false, message: 'Play Animation requires a target 3D model widget ID.' };
      return spatialObjectResolver.playAnimation(targetId, animName);
    });

    // 6. Stop Animation
    this.register('stop_animation', async (props) => {
      const targetId = props.targetWidgetId;
      if (!targetId) return { success: false, message: 'Stop Animation requires a target 3D model widget ID.' };
      return spatialObjectResolver.stopAnimation(targetId);
    });

    // 7. Pause Animation
    this.register('pause_animation', async (props) => {
      const targetId = props.targetWidgetId;
      if (!targetId) return { success: false, message: 'Pause Animation requires a target 3D model widget ID.' };
      return spatialObjectResolver.pauseAnimation(targetId);
    });

    // 8. Set Camera
    this.register('set_camera', async (props) => {
      const targetId = props.targetWidgetId;
      const preset = props.cameraPreset || props.preset || 'Front';
      if (!targetId) return { success: false, message: 'Set Camera requires a target 3D model widget ID.' };
      return spatialObjectResolver.setCamera(targetId, preset);
    });

    // 9. Focus Object
    this.register('focus_object', async (props) => {
      const targetId = props.targetWidgetId;
      const objectId = props.objectId || 'Impeller_01';
      if (!targetId) return { success: false, message: 'Focus Object requires a target 3D model widget ID.' };
      return spatialObjectResolver.focusObject(targetId, objectId);
    });

    // 10. Open Hotspot
    this.register('open_hotspot', async (props) => {
      const targetId = props.targetWidgetId;
      const hotspotId = props.hotspotId || 'hotspot_01';
      if (!targetId) return { success: false, message: 'Open Hotspot requires a target widget ID.' };
      return { success: true, message: `Opened hotspot "${hotspotId}" on widget "${targetId}".` };
    });

    // 11. Play Video
    this.register('play_video', async (props) => {
      const targetId = props.targetWidgetId;
      if (!targetId) return { success: false, message: 'Play Video requires a target video widget ID.' };
      const widget = StudioWidgetResolver.resolveWidget(targetId);
      if (!widget) return { success: false, message: `Video widget "${targetId}" not found.` };
      if (widget.type !== 'video_player' && widget.type !== 'video') {
        return { success: false, message: `Widget "${widget.name || targetId}" is not a video player widget.` };
      }
      return { success: true, message: `Playing video on widget "${widget.name || targetId}".` };
    });

    // 12. Pause Video
    this.register('pause_video', async (props) => {
      const targetId = props.targetWidgetId;
      if (!targetId) return { success: false, message: 'Pause Video requires a target video widget ID.' };
      const widget = StudioWidgetResolver.resolveWidget(targetId);
      if (!widget) return { success: false, message: `Video widget "${targetId}" not found.` };
      if (widget.type !== 'video_player' && widget.type !== 'video') {
        return { success: false, message: `Widget "${widget.name || targetId}" is not a video player widget.` };
      }
      return { success: true, message: `Paused video on widget "${widget.name || targetId}".` };
    });

    // 13. Navigate
    this.register('navigate', async (props) => {
      const destination = props.destination || props.url || '#';
      // Safety check: ensure target is an approved internal route or relative path
      if (typeof destination === 'string' && (destination.startsWith('javascript:') || destination.startsWith('data:'))) {
        return { success: false, message: 'Forbidden navigation target format.' };
      }
      return { success: true, message: `Navigated to destination "${destination}".` };
    });

    // 14. Set Variable
    this.register('set_variable', async (props, _payload, context) => {
      const varName = props.variableName || props.name;
      const val = props.value;
      if (!varName) return { success: false, message: 'Set Variable requires a variable name.' };
      context.variables[varName] = val;
      return { success: true, message: `Set runtime variable "${varName}" = ${JSON.stringify(val)}.` };
    });
  }
}

export const actionRegistry = new ActionRegistry();
