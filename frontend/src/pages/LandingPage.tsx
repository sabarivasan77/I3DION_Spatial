import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Layers, Users, Box } from 'lucide-react';
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
            { id: '1', name: 'Rotary Air Compressor', category: 'Energy', score: 0.95 },
            { id: '2', name: 'Centrifugal Pump X-1', category: 'Manufacturing', score: 0.88 },
            { id: '3', name: 'Industrial Robotic Arm', category: 'Robotics', score: 0.82 },
          ]);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <main className="pt-16">
      <section className="relative overflow-hidden px-4 py-20 md:px-6 md:py-28">
        <div className="absolute inset-0 hero-gradient" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div className="relative z-10">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white"><Sparkles size={16} />Predictive Intelligence Engine is Live</p>
            <h1 className="text-4xl font-bold leading-tight text-slate-950 md:text-6xl">Self-Learning <span className="text-primary">Industrial</span> Platform</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Every interaction builds customer profiles, trains predictive models, and predicts conversion intent automatically.</p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link to="/login" className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                Start Smart Workspace <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50">
                Sign In
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-200/30 blur-3xl" />
            <Card className="relative overflow-hidden rounded-3xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-white z-10 relative">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  <p className="text-sm font-bold text-slate-900">AI Sales Assistant (Active)</p>
                </div>
                <Badge variant="success">95% Conversion Prob.</Badge>
              </div>
              <div className="h-[420px] bg-slate-100 viewer-grid"><ThreeProduct /></div>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-20 md:px-6 border-y border-slate-200">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4"><Sparkles className="text-primary" /> Recommended For You</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map(r => (
                <Card key={r.id} className="p-6 hover:shadow-lg transition">
                  <div className="h-32 bg-slate-100 rounded-xl mb-4 flex items-center justify-center">
                    <Box className="text-slate-300" size={32} />
                  </div>
                  <h3 className="font-bold text-lg">{r.name}</h3>
                  <p className="text-sm text-slate-500">{r.category}</p>
                  <div className="mt-4 flex justify-between items-center text-xs font-semibold text-primary">
                    <span>Match Score</span>
                    <span>{Math.round(r.score * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${r.score * 100}%` }} />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4"><Layers className="text-emerald-500" /> Trending in Your Industry</h2>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4 flex gap-4 items-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg" />
                    <div>
                      <p className="font-bold text-sm">Industrial Asset {i}</p>
                      <p className="text-xs text-slate-500">Popular among manufacturing users</p>
                    </div>
                    <Badge className="ml-auto" variant="success">Trending</Badge>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-4"><Users className="text-blue-500" /> People Also Viewed</h2>
              <div className="space-y-4">
                {[4, 5, 6].map(i => (
                  <Card key={i} className="p-4 flex gap-4 items-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg" />
                    <div>
                      <p className="font-bold text-sm">Related Accessory {i}</p>
                      <p className="text-xs text-slate-500">Frequently viewed together</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-8 text-sm text-slate-500 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 md:flex-row">
          <Logo />
          <p>Industrial Intelligence Platform</p>
        </div>
      </footer>
    </main>
  );
}
