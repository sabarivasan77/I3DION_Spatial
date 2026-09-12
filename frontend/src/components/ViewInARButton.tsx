import { useState } from 'react';
import { Smartphone, X, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from './ui';
import { useToast } from './Toast';
import { detectPlatform, Platform } from '../utils/deviceDetection';
import { launchQuickLook } from '../services/quickLook';
import { launchSceneViewer } from '../services/sceneViewer';
import { QRCodeGenerator } from './QRCodeGenerator';
import { motion, AnimatePresence } from 'framer-motion';

interface ViewInARButtonProps {
  modelUrl?: string | null;
  usdzUrl?: string | null;
  productSlug?: string;
  title?: string;
  logoUrl?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function ViewInARButton({ 
  modelUrl, 
  usdzUrl, 
  productSlug, 
  title = 'Industrial Product',
  logoUrl,
  className,
  variant = 'primary'
}: ViewInARButtonProps) {
  const { success, error: showError } = useToast();
  const [platform] = useState<Platform>(() => detectPlatform());
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const arHandoffUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/product/${productSlug || 'product'}?ar=1`
    : `https://i3-dion-spatial.vercel.app/product/${productSlug || 'product'}?ar=1`;

  const handleARClick = () => {
    if (platform === 'IOS') {
      if (usdzUrl) {
        launchQuickLook(usdzUrl);
      } else if (modelUrl) {
        launchSceneViewer(modelUrl, title);
      } else {
        showError('Model missing', 'No 3D model file available for AR.');
      }
    } else if (platform === 'ANDROID') {
      if (modelUrl) {
        launchSceneViewer(modelUrl, title);
      } else {
        showError('Model missing', 'No 3D model file available for AR.');
      }
    } else {
      // Laptop / Desktop / Unsupported Device: Open Cross-Device AR Handoff QR Modal
      setShowQrModal(true);
    }
  };

  const handleCopyArLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(arHandoffUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = arHandoffUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      success('Copied AR Link', 'Open this link on your mobile phone to launch AR.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showError('Copy failed', 'Could not copy link to clipboard.');
    }
  };

  return (
    <>
      <Button
        variant={variant}
        className={`inline-flex items-center justify-center font-semibold transition-all active:scale-95 ${className || ''}`}
        onClick={handleARClick}
      >
        <Smartphone size={18} className="mr-2" />
        View in AR
      </Button>

      {/* Cross-Device Desktop/Laptop AR Handoff QR Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">View in Your Space</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Scan to open AR on your phone</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 text-center space-y-5">
                {/* Dynamically Generated AR QR Code */}
                <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-inner">
                  <QRCodeGenerator
                    url={arHandoffUrl}
                    logoUrl={logoUrl || '/images/logos/03_icon_only.png'}
                    size={200}
                    className="w-full h-auto"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Point your mobile camera at this QR code to view this product in 1:1 scale AR.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2.5 pt-2">
                  <Button
                    variant="secondary"
                    className="w-full h-11 text-xs font-semibold flex items-center justify-center gap-2"
                    onClick={handleCopyArLink}
                  >
                    {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                    {copied ? 'Copied AR Link!' : 'Copy Mobile AR Link'}
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-full h-11 text-xs font-semibold text-slate-600 border-slate-200"
                    onClick={() => setShowQrModal(false)}
                  >
                    Continue in 3D Viewer
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
