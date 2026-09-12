import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui';
import LogoCube from '../components/LogoCube';
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
    <main className="min-h-screen bg-white text-slate-900 pt-16">
      {/* Hero Section */}

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 md:px-6 md:py-28 text-center flex flex-col items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.1),rgba(255,255,255,0))]" />
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 backdrop-blur-md">
            <Sparkles size={14} className="animate-pulse text-blue-600" />
            <span>Next-Gen Enterprise Spatial SaaS Platform</span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
            Immersive <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">3D & AR</span> Product Experiences
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 mx-auto max-w-2xl">
            Transform your physical products into interactive 3D visualizations, instant WebAR experiences, and smart lead-capture engines.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/login" className="flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-500/25 hover:bg-blue-600 transition">
              Launch Workspace <ArrowRight size={18} />
            </Link>
            <Link to="/spatial-hub" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Explore Spatial Hub
            </Link>
          </div>
        </div>

        {/* 3D Visual Centerpiece */}
        <div className="relative mt-16 w-full max-w-4xl z-10 mx-auto">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-100 to-indigo-100 opacity-50 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 bg-white z-10 relative">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">3D Spatial Interactive Engine</p>
              </div>
            </div>
            <div className="h-[400px] flex items-center justify-center">
              <LogoCube />
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations Section */}
      <section className="bg-slate-50 px-4 py-20 md:px-6 border-y border-slate-100">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-blue-600" size={22} /> Recommended Industrial Assets
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map(r => (
              <Card key={r.id} className="p-6 border-slate-200 bg-white hover:border-slate-300 transition shadow-sm">
                <div className="h-36 bg-slate-50 rounded-xl mb-4 flex items-center justify-center border border-slate-100">
                  <Box className="text-blue-500" size={40} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">{r.name}</h3>
                <p className="text-sm text-slate-500">{r.category}</p>
                <div className="mt-4 flex justify-between items-center text-xs font-semibold text-blue-600">
                  <span>Relevance Score</span>
                  <span>{Math.round(r.score * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full" style={{ width: `${r.score * 100}%` }} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Expanded Professional Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-12 text-sm text-slate-600">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <Logo />
            <p className="text-slate-500 mt-4 leading-relaxed">
              Empowering enterprises with next-generation spatial computing, 3D visualization, and AR technologies for superior product experiences.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs">Products</h3>
            <ul className="space-y-3 text-slate-500">
              <li><Link to="/spatial-hub" className="hover:text-blue-600 transition">Spatial Hub</Link></li>
              <li><Link to="#" className="hover:text-blue-600 transition">3D Viewer Engine</Link></li>
              <li><Link to="#" className="hover:text-blue-600 transition">AR Applets</Link></li>
              <li><Link to="#" className="hover:text-blue-600 transition">Lead Capture Integrations</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs">Company</h3>
            <ul className="space-y-3 text-slate-500">
              <li><Link to="#" className="hover:text-blue-600 transition">About Us</Link></li>
              <li><Link to="#" className="hover:text-blue-600 transition">Careers</Link></li>
              <li><Link to="#" className="hover:text-blue-600 transition">Partners</Link></li>
              <li><Link to="#" className="hover:text-blue-600 transition">Contact Sales</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs">Legal</h3>
            <ul className="space-y-3 text-slate-500">
              <li><Link to="#" className="hover:text-blue-600 transition">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-blue-600 transition">Terms of Service</Link></li>
              <li><Link to="#" className="hover:text-blue-600 transition">Cookie Policy</Link></li>
              <li><Link to="#" className="hover:text-blue-600 transition">Security</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-7xl border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 I3DION Spatial Enterprise. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-blue-600">Twitter</span>
            <span className="cursor-pointer hover:text-blue-600">LinkedIn</span>
            <span className="cursor-pointer hover:text-blue-600">GitHub</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
