import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Layers, ShieldCheck, Box, Zap, QrCode, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, Card } from '../components/ui';
import ThreeProduct from '../components/ThreeProduct';
import { Logo } from '../components/Logo';

export function LandingPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/ai/recommendations')
      .then(r => r.json())
      .then(d => {
        if (d.recommendations?.length > 0) {
          setRecommendations(d.recommendations);
        } else {
          setRecommendations([
            { id: '1', name: 'Rotary Air Compressor', category: 'Industrial Energy', score: 0.95 },
            { id: '2', name: 'Centrifugal Pump X-1', category: 'Heavy Manufacturing', score: 0.88 },
            { id: '3', name: 'Industrial Robotic Arm', category: 'Automation', score: 0.82 },
          ]);
        }
      })
      .catch(() => {
        setRecommendations([
          { id: '1', name: 'Rotary Air Compressor', category: 'Industrial Energy', score: 0.95 },
          { id: '2', name: 'Centrifugal Pump X-1', category: 'Heavy Manufacturing', score: 0.88 },
          { id: '3', name: 'Industrial Robotic Arm', category: 'Automation', score: 0.82 },
        ]);
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-6 backdrop-blur-md">
        <Logo />
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition">
            Sign In
          </Link>
          <Link to="/login" className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 md:px-6 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),rgba(255,255,255,0))]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 backdrop-blur-md">
              <Sparkles size={14} className="animate-pulse text-blue-400" />
              <span>Next-Gen Enterprise Spatial SaaS Platform</span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              Immersive <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">3D & AR</span> Product Experiences
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              Transform your physical products into interactive 3D visualizations, instant WebAR experiences, and smart lead-capture engines.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/login" className="flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-500/25 hover:bg-blue-600 transition">
                Launch Workspace <ArrowRight size={18} />
              </Link>
              <Link to="/spatial-hub" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 px-6 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white">
                Explore Spatial Hub
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-slate-800/80 pt-8">
              <div>
                <p className="text-2xl font-bold text-white">99.9%</p>
                <p className="text-xs text-slate-400 mt-1">Uptime SLA</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-slate-400 mt-1">WebAR Mobile</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">RBAC</p>
                <p className="text-xs text-slate-400 mt-1">Multi-Tier Security</p>
              </div>
            </div>
          </div>

          {/* Interactive 3D Card */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-30 blur-2xl" />
            <Card className="relative overflow-hidden rounded-3xl border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-900/90 z-10 relative">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">3D Spatial Interactive Engine</p>
                </div>
                <Badge variant="success">Interactive</Badge>
              </div>
              <div className="h-[420px] bg-slate-950/60 flex items-center justify-center">
                <ThreeProduct />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="bg-slate-900/50 px-4 py-20 md:px-6 border-y border-slate-800/80">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white">Engineered for High-Converting Sales & Publishing</h2>
            <p className="text-slate-400 mt-3 text-sm">Empower sales teams, distributors, and customers with self-service 3D models and augmented reality.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 border-slate-800 bg-slate-900/80 hover:border-slate-700 transition">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                <Box size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Instant 3D & GLB Rendering</h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Upload CAD or GLB/USDZ models with automatic PBR texture generation, lighting presets, and dimension inspection.
              </p>
            </Card>

            <Card className="p-6 border-slate-800 bg-slate-900/80 hover:border-slate-700 transition">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <Smartphone size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">WebAR & QR Instant Launch</h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Generate high-resolution QR codes that allow buyers to project industrial products right into their physical space with zero apps needed.
              </p>
            </Card>

            <Card className="p-6 border-slate-800 bg-slate-900/80 hover:border-slate-700 transition">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Tier Publishing & RBAC</h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Publish products with Public, Organization-only, or Restricted access control protected by OTP and passcode gates.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Recommendations Section */}
      <section className="px-4 py-20 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="text-blue-400" size={22} /> Recommended Industrial Assets
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map(r => (
              <Card key={r.id} className="p-6 border-slate-800 bg-slate-900/80 hover:border-slate-700 transition">
                <div className="h-36 bg-slate-950/80 rounded-xl mb-4 flex items-center justify-center border border-slate-800">
                  <Box className="text-blue-400" size={40} />
                </div>
                <h3 className="font-bold text-lg text-white">{r.name}</h3>
                <p className="text-sm text-slate-400">{r.category}</p>
                <div className="mt-4 flex justify-between items-center text-xs font-semibold text-blue-400">
                  <span>Relevance Score</span>
                  <span>{Math.round(r.score * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full" style={{ width: `${r.score * 100}%` }} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-8 text-sm text-slate-500">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Logo />
          <p>© 2026 I3DION Spatial Enterprise. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
