import { useRuntimeStore } from '../runtime/runtimeContext';
import { StudioWidgetResolver } from './studioWidgetResolver';

type AnimationListener = (targetWidgetId: string, animationName: string, action: 'PLAY' | 'STOP' | 'PAUSE') => void;
type CameraListener = (targetWidgetId: string, preset: string) => void;
type FocusListener = (targetWidgetId: string, objectId: string) => void;

class SpatialObjectResolver {
  private animationListeners: Set<AnimationListener> = new Set();
  private cameraListeners: Set<CameraListener> = new Set();
  private focusListeners: Set<FocusListener> = new Set();

  public onAnimationCommand(cb: AnimationListener): () => void {
    this.animationListeners.add(cb);
    return () => this.animationListeners.delete(cb);
  }

  public onCameraCommand(cb: CameraListener): () => void {
    this.cameraListeners.add(cb);
    return () => this.cameraListeners.delete(cb);
  }

  public onFocusCommand(cb: FocusListener): () => void {
    this.focusListeners.add(cb);
    return () => this.focusListeners.delete(cb);
  }

  public playAnimation(targetWidgetId: string, animationName: string): { success: boolean; message: string } {
    const widget = StudioWidgetResolver.resolveWidget(targetWidgetId);
    if (!widget) {
      return { success: false, message: `3D Model widget "${targetWidgetId}" was not found.` };
    }

    if (widget.type !== '3d_viewer' && widget.type !== 'spatial_3d_viewer') {
      // Friendly runtime error
      return { success: false, message: `Target widget "${widget.name || targetWidgetId}" is not a 3D model viewer.` };
    }

    this.animationListeners.forEach((cb) => cb(targetWidgetId, animationName, 'PLAY'));
    useRuntimeStore.getState().setTransientWidgetOverride(targetWidgetId, {
      properties: { activeAnimation: animationName, animationPlaying: true },
    });

    return { success: true, message: `Playing animation "${animationName}" on "${widget.name || targetWidgetId}".` };
  }

  public stopAnimation(targetWidgetId: string): { success: boolean; message: string } {
    const widget = StudioWidgetResolver.resolveWidget(targetWidgetId);
    if (!widget) {
      return { success: false, message: `3D Model widget "${targetWidgetId}" was not found.` };
    }

    this.animationListeners.forEach((cb) => cb(targetWidgetId, '', 'STOP'));
    useRuntimeStore.getState().setTransientWidgetOverride(targetWidgetId, {
      properties: { animationPlaying: false },
    });

    return { success: true, message: `Stopped animations on "${widget.name || targetWidgetId}".` };
  }

  public pauseAnimation(targetWidgetId: string): { success: boolean; message: string } {
    const widget = StudioWidgetResolver.resolveWidget(targetWidgetId);
    if (!widget) {
      return { success: false, message: `3D Model widget "${targetWidgetId}" was not found.` };
    }

    this.animationListeners.forEach((cb) => cb(targetWidgetId, '', 'PAUSE'));
    useRuntimeStore.getState().setTransientWidgetOverride(targetWidgetId, {
      properties: { animationPlaying: false },
    });

    return { success: true, message: `Paused animations on "${widget.name || targetWidgetId}".` };
  }

  public setCamera(targetWidgetId: string, preset: string): { success: boolean; message: string } {
    const widget = StudioWidgetResolver.resolveWidget(targetWidgetId);
    if (!widget) {
      return { success: false, message: `3D Viewport "${targetWidgetId}" was not found.` };
    }

    this.cameraListeners.forEach((cb) => cb(targetWidgetId, preset));
    useRuntimeStore.getState().setTransientWidgetOverride(targetWidgetId, {
      properties: { cameraPreset: preset },
    });

    return { success: true, message: `Set camera view to "${preset}" on "${widget.name || targetWidgetId}".` };
  }

  public focusObject(targetWidgetId: string, objectId: string): { success: boolean; message: string } {
    const widget = StudioWidgetResolver.resolveWidget(targetWidgetId);
    if (!widget) {
      return { success: false, message: `3D Viewer "${targetWidgetId}" was not found.` };
    }

    if (!objectId) {
      return { success: false, message: `No object ID specified for camera focus.` };
    }

    this.focusListeners.forEach((cb) => cb(targetWidgetId, objectId));
    useRuntimeStore.getState().setTransientWidgetOverride(targetWidgetId, {
      properties: { focusedObjectId: objectId },
    });

    return { success: true, message: `Camera focused on 3D object "${objectId}" in "${widget.name || targetWidgetId}".` };
  }
}

export const spatialObjectResolver = new SpatialObjectResolver();
