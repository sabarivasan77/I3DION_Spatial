import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { Button } from './ui';
import { useToast } from './Toast';
import { detectPlatform, Platform } from '../utils/deviceDetection';
import { launchQuickLook } from '../services/quickLook';
import { launchSceneViewer } from '../services/sceneViewer';

interface ViewInARButtonProps {
  modelUrl?: string | null;
  usdzUrl?: string | null;
  title?: string;
  className?: string;
}

export function ViewInARButton({ modelUrl, usdzUrl, title, className }: ViewInARButtonProps) {
  const { error: showError } = useToast();
  const [platform] = useState<Platform>(() => detectPlatform());

  const handleARClick = () => {
    if (platform === 'IOS') {
      if (usdzUrl) {
        launchQuickLook(usdzUrl);
      } else if (modelUrl) {
        // Fallback for missing USDZ - some browsers may handle GLB/GLTF via web viewers
        // but iOS native quick look strictly requires USDZ.
        showError('USDZ required', 'Apple Quick Look requires a .usdz file for this product.');
      } else {
        showError('Model missing', 'No 3D model available for AR.');
      }
    } else if (platform === 'ANDROID') {
      if (modelUrl) {
        // We can manually launch scene viewer intent, or rely on model-viewer.
        // If we want a direct intent:
        launchSceneViewer(modelUrl, title);
      } else {
        showError('Model missing', 'No 3D model available for AR.');
      }
    } else {
      showError('Unsupported Device', 'Augmented Reality is only available on iOS and Android devices.');
    }
  };

  // Do not hide the button if DESKTOP, maybe just show it disabled or let it trigger the toast.
  // The user requested: "When clicked: STEP 1 Detect platform. if Android Launch ARCore. if iOS Launch Quick Look. Otherwise Show unsupported message"

  return (
    <Button
      variant="primary"
      className={`shadow-md hover:shadow-lg transition-all ${className || ''}`}
      onClick={handleARClick}
    >
      <Smartphone size={18} className="mr-2" />
      View in AR
    </Button>
  );
}
