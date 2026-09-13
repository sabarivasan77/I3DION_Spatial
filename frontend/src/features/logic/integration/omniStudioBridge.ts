import { runtimeEventBus } from '../runtime/runtimeEventBus';
import { useRuntimeStore } from '../runtime/runtimeContext';

export class OmniStudioBridge {
  public static dispatchWidgetClick(widgetId: string, data?: Record<string, any>) {
    // Only dispatch in preview mode
    if (useRuntimeStore.getState().mode !== 'PREVIEW') return;

    runtimeEventBus.emit({
      eventType: 'widget_click',
      widgetId,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  public static dispatchWidgetLoaded(widgetId: string) {
    if (useRuntimeStore.getState().mode !== 'PREVIEW') return;

    runtimeEventBus.emit({
      eventType: 'widget_loaded',
      widgetId,
      timestamp: new Date().toISOString(),
    });
  }

  public static dispatchModelLoaded(widgetId: string) {
    if (useRuntimeStore.getState().mode !== 'PREVIEW') return;

    runtimeEventBus.emit({
      eventType: 'model_loaded',
      widgetId,
      timestamp: new Date().toISOString(),
    });
  }

  public static dispatchObjectSelected(widgetId: string, objectId: string) {
    if (useRuntimeStore.getState().mode !== 'PREVIEW') return;

    runtimeEventBus.emit({
      eventType: 'model_object_selected',
      widgetId,
      objectId,
      timestamp: new Date().toISOString(),
    });
  }

  public static dispatchHotspotClick(widgetId: string, hotspotId?: string) {
    if (useRuntimeStore.getState().mode !== 'PREVIEW') return;

    runtimeEventBus.emit({
      eventType: 'hotspot_click',
      widgetId,
      objectId: hotspotId,
      timestamp: new Date().toISOString(),
    });
  }

  public static dispatchVideoPlay(widgetId: string) {
    if (useRuntimeStore.getState().mode !== 'PREVIEW') return;

    runtimeEventBus.emit({
      eventType: 'video_play',
      widgetId,
      timestamp: new Date().toISOString(),
    });
  }

  public static dispatchVideoEnded(widgetId: string) {
    if (useRuntimeStore.getState().mode !== 'PREVIEW') return;

    runtimeEventBus.emit({
      eventType: 'video_ended',
      widgetId,
      timestamp: new Date().toISOString(),
    });
  }

  public static dispatchFormSubmitted(widgetId: string, formData?: Record<string, any>) {
    if (useRuntimeStore.getState().mode !== 'PREVIEW') return;

    runtimeEventBus.emit({
      eventType: 'form_submitted',
      widgetId,
      timestamp: new Date().toISOString(),
      data: formData,
    });
  }
}
