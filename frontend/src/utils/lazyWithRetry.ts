import { lazy, ComponentType } from 'react';

/**
 * Wraps React.lazy to automatically catch dynamic import chunk errors
 * (e.g. when Vercel deploys a new build replacing hashed JS files).
 * If a chunk fetch fails, it automatically reloads the browser once to fetch the latest index.html and assets.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasBeenReloaded = sessionStorage.getItem('i3dion_chunk_reload_attempt');
    try {
      const component = await componentImport();
      sessionStorage.removeItem('i3dion_chunk_reload_attempt');
      return component;
    } catch (error: any) {
      const isChunkError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.name === 'ChunkLoadError';

      if (isChunkError && !pageHasBeenReloaded) {
        sessionStorage.setItem('i3dion_chunk_reload_attempt', 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });
}
