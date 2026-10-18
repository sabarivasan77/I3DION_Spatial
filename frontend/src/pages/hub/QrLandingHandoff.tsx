import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Smartphone, Monitor, Lock, AlertCircle, ArrowRight, ShieldCheck, Box } from 'lucide-react';
import { QRCodeGenerator } from '../../components/QRCodeGenerator';

interface ResolveData {
  status: 'active' | 'paused' | 'expired' | 'password_required';
  id?: string;
  targetUrl?: string;
  campaign?: string;
  productId?: string;
  title?: string;
  message?: string;
}

export function QrLandingHandoff() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ResolveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    fetch(`/api/qr/resolve/${id}`)
      .then((r) => r.json())
      .then((res: ResolveData) => {
        setData(res);
        // If mobile device and link is active, redirect immediately to destination!
        if (isMobile && res.status === 'active' && res.targetUrl) {
          window.location.href = res.targetUrl;
        }
      })
      .catch(() => {
        setData({ status: 'expired', message: 'Could not connect to link resolver.' });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, isMobile]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    try {
      const res = await fetch(`/api/qr/resolve/${id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await res.json();
      if (res.ok && result.targetUrl) {
        if (isMobile) {
          window.location.href = result.targetUrl;
        } else {
          setData({ status: 'active', targetUrl: result.targetUrl, campaign: result.campaign });
        }
      } else {
        setUnlockError(result.error || 'Incorrect password');
      }
    } catch {
      setUnlockError('Could not verify password');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Resolving QR Destination…</p>
      </div>
    );
  }

  // Paused Link
  if (data?.status === 'paused') {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black">Campaign Temporarily Paused</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {data.message || 'This QR destination has been temporarily paused by the organization.'}
          </p>
          <Link to="/hub" className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition">
            Explore Spatial Hub
          </Link>
        </div>
      </div>
    );
  }

  // Expired Link
  if (data?.status === 'expired') {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black">QR Link Expired</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This QR code campaign has ended. The product may still be available in the open showroom.
          </p>
          <Link to="/hub" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition">
            Explore Spatial Hub
          </Link>
        </div>
      </div>
    );
  }

  // Password Protected
  if (data?.status === 'password_required') {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto text-blue-400">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black">Private 3D Showcase</h2>
            <p className="text-xs text-slate-400 mt-1">This QR experience requires an access password.</p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter access password"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
            {unlockError && <p className="text-xs text-red-400 font-semibold">{unlockError}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition"
            >
              Unlock 3D Experience
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Active Link — On desktop: display Desktop -> Phone Handoff Screen
  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-wider">
          <Smartphone className="w-3.5 h-3.5" /> Mobile 3D & Augmented Reality Handoff
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight">Scan on Phone to Place in AR</h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            For true 1:1 scale augmented reality inspection, open this product directly on your mobile device.
          </p>
        </div>

        {/* Local QR Code Canvas */}
        <div className="bg-white p-6 rounded-2xl inline-block shadow-xl border border-slate-700">
          <QRCodeGenerator
            url={window.location.href}
            size={220}
            className="mx-auto"
          />
          <p className="mt-3 text-[10px] font-mono text-slate-800 font-bold uppercase tracking-wider">
            I3DION SPATIAL SECURE QR
          </p>
        </div>

        {data?.campaign && (
          <div className="text-[11px] text-slate-400 font-mono">
            Attributed Campaign: <span className="text-blue-400 font-semibold">{data.campaign}</span>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {data?.targetUrl && (
            <a
              href={data.targetUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-sm"
            >
              <span>Continue in Web Browser</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
          <Link
            to="/hub"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs px-5 py-3 rounded-xl transition"
          >
            Spatial Hub Home
          </Link>
        </div>
      </div>
    </div>
  );
}
