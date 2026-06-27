/**
 * Fallback intent generation for Android ARCore Scene Viewer.
 * Usually `<model-viewer>` handles this, but this is a manual fallback if needed.
 */
export function getSceneViewerIntent(
  modelUrl: string,
  title?: string,
  fallbackUrl?: string
): string {
  const intentUrl = new URL('intent://arvr.google.com/scene-viewer/1.0');
  intentUrl.searchParams.set('file', modelUrl);
  intentUrl.searchParams.set('mode', 'ar_only');
  intentUrl.searchParams.set('resizable', 'true');
  
  if (title) {
    intentUrl.searchParams.set('title', title);
  }

  // Fallback to Google Play Store ARCore or a web page
  const fallback = fallbackUrl ?? 'https://play.google.com/store/apps/details?id=com.google.ar.core';

  return `${intentUrl.toString()}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(fallback)};end;`;
}

export function launchSceneViewer(modelUrl: string, title?: string, fallbackUrl?: string) {
  const intent = getSceneViewerIntent(modelUrl, title, fallbackUrl);
  window.location.href = intent;
}
