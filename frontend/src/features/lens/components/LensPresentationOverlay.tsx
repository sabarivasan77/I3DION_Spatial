import React, { useEffect, useState } from 'react';
import { useLensStore } from '../store/useLensStore';
import { LensHomeView } from '../views/LensHomeView';
import { LensAnalyticsView } from '../views/LensAnalyticsView';
import { LensVisualizationsView } from '../views/LensVisualizationsView';
import { LensDealsView } from '../views/LensDealsView';
import {
  X,
  Play,
  Pause,
  Compass,
  BarChart3,
  PieChart,
  TrendingUp,
  Radio,
  Clock,
  Sparkles
} from 'lucide-react';

export const LensPresentationOverlay: React.FC = () => {
  const { isPresentationMode, setPresentationMode, activeView, setActiveView } = useLensStore();
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(15);

  const presentationViews: { id: any; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Command Center', icon: Compass },
    { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 },
    { id: 'visualizations', label: 'Interactive Canvas', icon: PieChart },
    { id: 'deals', label: 'Pipeline Deals', icon: TrendingUp }
  ];

  // Auto-play timer
  useEffect(() => {
    if (!isPresentationMode || !isAutoPlay) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Advance to next view
          const currentIndex = presentationViews.findIndex((v) => v.id === activeView);
          const nextIndex = (currentIndex + 1) % presentationViews.length;
          setActiveView(presentationViews[nextIndex].id);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPresentationMode, isAutoPlay, activeView, setActiveView]);

  // Keyboard shortcut listener (ESC to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPresentationMode) {
        setPresentationMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentationMode, setPresentationMode]);

  if (!isPresentationMode) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F19] text-slate-100 flex flex-col font-sans select-none overflow-hidden animate-fadeIn">
      {/* Top Floating Glass Presentation Bar */}
      <header className="h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shrink-0 z-10 shadow-lg">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-amber-500/30 flex items-center justify-center shadow-xs">
            <Sparkles size={16} className="text-[#F4B400]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-sm tracking-tight">I3DION Spatial Lens</span>
              <span className="bg-amber-500/20 text-[#F4B400] text-[9px] font-black uppercase px-2 py-0.5 rounded border border-amber-500/30">
                Boardroom Presentation
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
              <span className="flex items-center gap-1 text-emerald-400">
                <Radio size={10} className="animate-pulse" /> Live Telemetry 60fps
              </span>
              <span>•</span>
              <span>Full Screen Window Mode</span>
            </div>
          </div>
        </div>

        {/* Center: Slide Switcher Tabs */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-2xl border border-slate-800">
          {presentationViews.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setSecondsRemaining(15);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-[#F4B400] text-slate-950 shadow-md scale-102'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Auto-play & Close Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
              isAutoPlay
                ? 'bg-amber-500/20 border-amber-500 text-[#F4B400]'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Auto-rotate through screens every 15 seconds"
          >
            {isAutoPlay ? <Pause size={13} /> : <Play size={13} />}
            <span>Auto-Play {isAutoPlay && `(${secondsRemaining}s)`}</span>
          </button>

          <button
            onClick={() => setPresentationMode(false)}
            className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition"
            title="Exit Presentation Mode (Press ESC)"
          >
            <X size={14} />
            <span>Exit Fullscreen</span>
          </button>
        </div>
      </header>

      {/* Main Viewport Presentation Canvas */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-linear-to-b from-[#0B0F19] to-[#030712]">
        <div className="max-w-[1700px] mx-auto rounded-3xl overflow-hidden bg-slate-950/40 border border-slate-800/80 p-2 md:p-6 shadow-2xl">
          {activeView === 'home' && <LensHomeView />}
          {activeView === 'analytics' && <LensAnalyticsView />}
          {activeView === 'visualizations' && <LensVisualizationsView />}
          {activeView === 'deals' && <LensDealsView />}
          {activeView !== 'home' &&
            activeView !== 'analytics' &&
            activeView !== 'visualizations' &&
            activeView !== 'deals' && <LensHomeView />}
        </div>
      </main>
    </div>
  );
};
