import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ExternalLink, Image as ImageIcon, ScanLine, X, Zap } from 'lucide-react';
import jsQR from 'jsqr';

type ScanTarget =
  | { kind: 'internal'; path: string }
  | { kind: 'external'; url: string; host: string }
  | { kind: 'invalid' };

/** Internal app paths a QR code may open directly. Anything else needs the user's confirmation. */
const INTERNAL_PATH = /^\/(hub\/(product|org)\/|c\/|q\/|p\/)[A-Za-z0-9._~\-/]*$/;

export function resolveScanTarget(raw: string): ScanTarget {
  try {
    const url = new URL(raw.trim());
    if (url.origin === window.location.origin && INTERNAL_PATH.test(url.pathname)) {
      return { kind: 'internal', path: `${url.pathname}${url.search}${url.hash}` };
    }
    if (url.protocol === 'https:') return { kind: 'external', url: url.toString(), host: url.host };
    return { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

type DetectorLike = { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>> };
type DetectorCtor = new (opts?: { formats?: string[] }) => DetectorLike;

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
}

export function QrScannerModal({ open, onClose }: QrScannerModalProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('Starting camera…');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ScanTarget | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleResult = useCallback(
    (raw: string) => {
      const target = resolveScanTarget(raw);
      if (target.kind === 'internal') {
        stopCamera();
        onClose();
        navigate(target.path);
      } else {
        stopCamera();
        setPending(target);
      }
    },
    [navigate, onClose, stopCamera]
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let timer: number | undefined;
    setError(null);
    setPending(null);
    setStatus('Starting camera…');

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access needs a secure (https) connection and a supported browser. You can upload a photo of the QR code instead.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
        setTorchAvailable(Boolean(caps.torch));
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStatus('Point the camera at a QR code');

        const Detector = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
        const detector = Detector ? new Detector({ formats: ['qr_code'] }) : null;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { willReadFrequently: true });

        const tick = async () => {
          if (cancelled) return;
          try {
            if (video.readyState >= 2) {
              if (detector) {
                const found = await detector.detect(video);
                if (found[0]?.rawValue) return handleResult(found[0].rawValue);
              } else if (canvas && ctx) {
                const scale = Math.min(1, 640 / video.videoWidth);
                canvas.width = Math.round(video.videoWidth * scale);
                canvas.height = Math.round(video.videoHeight * scale);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
                if (code?.data) return handleResult(code.data);
              }
            }
          } catch {
            /* ignore single-frame decode errors */
          }
          timer = window.setTimeout(tick, 120);
        };
        tick();
      } catch (err) {
        const name = (err as DOMException)?.name;
        if (name === 'NotAllowedError') setError('Camera permission was denied. Allow camera access in your browser settings, or upload a photo of the QR code.');
        else if (name === 'NotFoundError') setError('No camera was found on this device. You can upload a photo of the QR code instead.');
        else setError('Could not start the camera. You can upload a photo of the QR code instead.');
      }
    }
    start();

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      stopCamera();
    };
  }, [open, handleResult, onClose, stopCamera]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn((v) => !v);
    } catch {
      setTorchAvailable(false);
    }
  };

  const decodeFile = async (file: File) => {
    setError(null);
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !ctx) return;
      const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height);
      if (code?.data) handleResult(code.data);
      else setError('No QR code was found in that image. Try a clearer, closer photo.');
    } catch {
      setError('That image could not be read.');
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scan a QR code"
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950 text-white"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ScanLine className="h-5 w-5 text-blue-400" /> Scan QR code
        </div>
        <button onClick={onClose} aria-label="Close scanner" className="rounded-lg p-2 hover:bg-white/10">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        {!error && !pending && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-64 max-w-[70vw] rounded-3xl border-2 border-blue-400/90 shadow-[0_0_0_9999px_rgba(2,6,23,0.55)]" />
          </div>
        )}
      </div>

      <div className="space-y-3 px-4 py-4" aria-live="polite">
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
          </div>
        )}
        {pending?.kind === 'external' && (
          <div className="space-y-2 rounded-xl bg-amber-500/15 p-3 text-sm text-amber-100">
            <p>This QR code opens an outside website: <strong>{pending.host}</strong>. Only continue if you trust it.</p>
            <a
              href={pending.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900"
            >
              Open site <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
        {pending?.kind === 'invalid' && (
          <div className="rounded-xl bg-red-500/15 p-3 text-sm text-red-200">This QR code is not a web link we can open safely.</div>
        )}
        {!error && !pending && <p className="text-center text-sm text-slate-300">{status}</p>}

        <div className="flex items-center justify-center gap-3">
          {torchAvailable && (
            <button onClick={toggleTorch} className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/20" aria-pressed={torchOn}>
              <Zap className="h-4 w-4" /> {torchOn ? 'Light off' : 'Light on'}
            </button>
          )}
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/20">
            <ImageIcon className="h-4 w-4" /> Upload photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && decodeFile(e.target.files[0])} />
        </div>
      </div>
    </div>
  );
}
