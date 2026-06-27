export type Platform = 'ANDROID' | 'IOS' | 'DESKTOP' | 'UNSUPPORTED';

export interface DeviceCapabilities {
  platform: Platform;
  isARSupported: boolean;
  isQuickLookSupported: boolean;
  isWebXRSupported: boolean;
}

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) {
    return 'ANDROID';
  }
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'IOS';
  }
  if (/Mac|Windows|Linux/.test(ua)) {
    return 'DESKTOP';
  }
  return 'UNSUPPORTED';
}

export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  const platform = detectPlatform();
  
  let isWebXRSupported = false;
  if ('xr' in navigator && (navigator as any).xr?.isSessionSupported) {
    try {
      isWebXRSupported = await (navigator as any).xr.isSessionSupported('immersive-ar');
    } catch {
      isWebXRSupported = false;
    }
  }

  // QuickLook is supported by default on iOS 12+ Safari
  const isQuickLookSupported = platform === 'IOS';

  // For Android, we assume ARCore is supported if it's a relatively modern Android device,
  // though actual WebXR immersive-ar checks might fail if ARCore isn't installed. 
  // model-viewer will fallback to Scene Viewer intent.
  const isARSupported = (platform === 'ANDROID') || isQuickLookSupported;

  return {
    platform,
    isARSupported,
    isQuickLookSupported,
    isWebXRSupported,
  };
}
