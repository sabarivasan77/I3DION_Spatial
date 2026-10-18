import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { Box } from 'lucide-react';
import { getSnapshot, releaseSlot, requestSlot, setHovered, subscribe } from './livePreviewPool';

const ThreeProduct = lazy(() => import('../ThreeProduct'));

interface ModelCardPreviewProps {
  id: string;
  slug: string;
  name: string;
  modelUrl: string;
  /** Optional lightweight (compressed) version used only for card previews. */
  previewUrl?: string;
  thumbnail: string;
}

/**
 * Shows the real 3D model inside the card by default (when the card is mostly visible
 * and a live slot is free). A poster image is always rendered underneath as the
 * fallback, so slow networks, data-saver mode and low-memory phones still get a card.
 * Hovering rotates the model; clicking anywhere opens the product page.
 */
export function ModelCardPreview({ id, slug, name, modelUrl, previewUrl, thumbnail }: ModelCardPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const liveIds = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const isLive = liveIds.includes(id);

  const saveData =
    typeof navigator !== 'undefined' &&
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const reducedMotion =
    typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

  useEffect(() => {
    const el = ref.current;
    if (!el || saveData) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) requestSlot(id);
        else releaseSlot(id);
      },
      { threshold: [0, 0.6] }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      releaseSlot(id);
      setHovered(id, false);
    };
  }, [id, saveData]);

  return (
    <div
      ref={ref}
      className="relative h-full w-full"
      onPointerEnter={() => {
        setHover(true);
        setHovered(id, true);
        if (!saveData) requestSlot(id);
      }}
      onPointerLeave={() => {
        setHover(false);
        setHovered(id, false);
      }}
    >
      <Link to={`/hub/product/${slug}`} className="absolute inset-0 flex items-center justify-center" aria-label={`Open ${name}`}>
        <img
          src={thumbnail}
          alt={name}
          loading="lazy"
          decoding="async"
          className="max-h-full max-w-full object-contain p-6 drop-shadow-md"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/models/thumbnails/thumb_1.svg';
          }}
        />
      </Link>

      {isLive && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-slate-50" aria-hidden="true">
          <Suspense fallback={null}>
            <ThreeProduct
              modelUrl={previewUrl ?? modelUrl}
              productName={name}
              renderMode="solid"
              autoRotate={hover && !reducedMotion}
            />
          </Suspense>
        </div>
      )}

      <span className="pointer-events-none absolute bottom-3 right-3 z-20 inline-flex items-center gap-1 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
        <Box className="h-3 w-3" /> 3D
      </span>
    </div>
  );
}
