import React, { useEffect, useRef, useState } from 'react';
import { Lock, Unlock, RotateCcw, Move, Maximize } from 'lucide-react';
import { Button } from './ui';

// Add type for model-viewer custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        poster?: string;
        alt?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'camera-controls'?: string;
        'shadow-intensity'?: string;
        autoplay?: boolean;
        class?: string;
      };
    }
  }
}

interface ARViewerProps {
  modelUrl: string;
  posterUrl?: string;
  altText?: string;
  title?: string;
  onExitAR?: () => void;
}

export function ARViewer({ modelUrl, posterUrl, altText, title, onExitAR }: ARViewerProps) {
  const modelViewerRef = useRef<any>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isAR, setIsAR] = useState(false);

  useEffect(() => {
    if (!customElements.get('model-viewer')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const mv = modelViewerRef.current;
    if (!mv) return;

    const handleARStatus = (event: any) => {
      if (event.detail.status === 'session-started') {
        setIsAR(true);
      } else if (event.detail.status === 'not-presenting') {
        setIsAR(false);
        onExitAR?.();
      }
    };

    mv.addEventListener('ar-status', handleARStatus);
    return () => mv.removeEventListener('ar-status', handleARStatus);
  }, [onExitAR]);

  const toggleLock = () => {
    setIsLocked((prev) => !prev);
    const mv = modelViewerRef.current;
    if (mv) {
      if (!isLocked) {
        mv.removeAttribute('camera-controls');
      } else {
        mv.setAttribute('camera-controls', 'true');
      }
    }
  };

  const resetPosition = () => {
    const mv = modelViewerRef.current;
    if (mv) {
      mv.cameraOrbit = '0deg 75deg 105%';
      mv.cameraTarget = 'auto auto auto';
      mv.fieldOfView = 'auto';
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-slate-100 rounded-3xl overflow-hidden shadow-inner flex flex-col">
      {/* @ts-ignore */}
      <model-viewer
        ref={modelViewerRef}
        src={modelUrl}
        poster={posterUrl}
        alt={altText ?? title ?? '3D model'}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls={!isLocked ? 'true' : undefined}
        shadow-intensity="1"
        {...{ autoplay: true } as any}
        class="w-full h-full flex-1 outline-none"
        style={{ '--poster-color': 'transparent', width: '100%', height: '100%' } as React.CSSProperties}
      >
        {/* Custom DOM Overlay for WebXR (Android AR) */}
        <div slot="ar-button" className="absolute bottom-4 right-4 z-10">
          <Button variant="primary" className="shadow-lg font-bold">
            <Maximize size={18} className="mr-2" />
            Launch AR
          </Button>
        </div>

        {/* Custom UI overlay inside WebXR */}
        {isAR && (
          <>
            {/* Top Instructions Overlay */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-black/60 text-white backdrop-blur-md px-6 py-3 rounded-2xl text-sm font-medium whitespace-nowrap z-20 pointer-events-none">
              Place the product on a flat surface
            </div>

            {/* Right Vertical Controls (Lock/Unlock/Reset) */}
            <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col items-center gap-4 bg-black/60 text-white backdrop-blur-md p-3 rounded-[32px] shadow-xl z-20 pointer-events-auto">
              <button
                onClick={toggleLock}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition ${isLocked ? 'text-white' : 'text-white/70 hover:text-white'}`}
              >
                {isLocked ? <Lock size={20} className="mb-1" /> : <Unlock size={20} className="mb-1" />}
                <span className="text-[9px] font-medium tracking-wider">{isLocked ? 'Lock' : 'Unlock'}</span>
              </button>
              <button
                onClick={resetPosition}
                className="flex flex-col items-center justify-center w-12 h-12 rounded-full text-white/70 hover:text-white transition"
              >
                <RotateCcw size={20} className="mb-1" />
                <span className="text-[9px] font-medium tracking-wider">Reset</span>
              </button>
            </div>

            {/* Bottom Horizontal Controls */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-between w-[90%] max-w-sm bg-black/60 text-white backdrop-blur-md px-6 py-4 rounded-3xl shadow-xl z-20 pointer-events-auto">
              <div className="flex flex-col items-center justify-center text-white/90 cursor-default">
                <Move size={22} className="mb-1" />
                <span className="text-[10px] font-medium tracking-wider">Move</span>
              </div>
              <div className="flex flex-col items-center justify-center text-white/90 cursor-default">
                <RotateCcw size={22} className="mb-1" />
                <span className="text-[10px] font-medium tracking-wider">Rotate</span>
              </div>
              <div className="flex flex-col items-center justify-center text-white/90 cursor-default">
                <Maximize size={22} className="mb-1" />
                <span className="text-[10px] font-medium tracking-wider">Scale</span>
              </div>
              <button
                onClick={toggleLock}
                className="flex flex-col items-center justify-center text-white hover:text-white/80 transition"
              >
                {isLocked ? <Lock size={22} className="mb-1" /> : <Unlock size={22} className="mb-1" />}
                <span className="text-[10px] font-medium tracking-wider">{isLocked ? 'Unlock' : 'Lock'}</span>
              </button>
            </div>
          </>
        )}
      </model-viewer>
    </div>
  );
}
