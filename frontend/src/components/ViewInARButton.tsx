import { useState } from 'react';
import { Smartphone, X, Box } from 'lucide-react';
import { Button } from './ui';
import { useToast } from './Toast';
import { detectPlatform, Platform } from '../utils/deviceDetection';
import { launchQuickLook } from '../services/quickLook';
import { launchSceneViewer } from '../services/sceneViewer';
import { motion, AnimatePresence } from 'framer-motion';

interface ViewInARButtonProps {
  modelUrl?: string | null;
  usdzUrl?: string | null;
  title?: string;
  className?: string;
}

export function ViewInARButton({ modelUrl, usdzUrl, title, className }: ViewInARButtonProps) {
  const { error: showError } = useToast();
  const [platform] = useState<Platform>(() => detectPlatform());
  const [showModal, setShowModal] = useState(false);

  const handleARClick = () => {
    if (platform === 'IOS') {
      if (usdzUrl) {
        launchQuickLook(usdzUrl);
      } else if (modelUrl) {
        showError('USDZ required', 'Apple Quick Look requires a .usdz file for this product.');
      } else {
        showError('Model missing', 'No 3D model available for AR.');
      }
    } else if (platform === 'ANDROID') {
      if (modelUrl) {
        launchSceneViewer(modelUrl, title);
      } else {
        showError('Model missing', 'No 3D model available for AR.');
      }
    } else {
      // Show fallback modal for Desktop / Unsupported devices
      setShowModal(true);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        className={`shadow-md hover:shadow-lg transition-all ${className || ''}`}
        onClick={handleARClick}
      >
        <Smartphone size={18} className="mr-2" />
        View in AR
      </Button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h3 className="font-bold text-slate-900">AR Unavailable</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-blue-500 mb-4">
                  <Box size={32} />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Mobile Device Required</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Augmented Reality is only available on iOS and Android devices. Please scan the QR code for this product on your mobile device to view it in your physical space.
                </p>
                <div className="mt-6">
                  <Button variant="primary" className="w-full" onClick={() => setShowModal(false)}>
                    Continue with 3D Viewer
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
