import React, { useState, useEffect } from 'react';
import { StudioProject } from '../../api/studioApi';
import { RuntimeRenderer } from './runtimeRenderer';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Maximize2, 
  Minimize2, 
  BookOpen, 
  Grid,
  Sparkles
} from 'lucide-react';

interface EBookReaderModalProps {
  project: StudioProject;
  onClose: () => void;
}

export const EBookReaderModal: React.FC<EBookReaderModalProps> = ({
  project,
  onClose
}) => {
  const doc = project.project_document || { screens: [] };
  const pages = doc.screens.length > 0 ? doc.screens : [
    { id: 'p1', name: 'Page 01', background_color: '#FFFFFF', padding: 24 }
  ];

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  const currentPage = pages[currentPageIndex] || pages[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, pages.length]);

  const handleNext = () => {
    if (currentPageIndex < pages.length - 1) {
      triggerFlipAnimation(() => setCurrentPageIndex(prev => prev + 1));
    }
  };

  const handlePrev = () => {
    if (currentPageIndex > 0) {
      triggerFlipAnimation(() => setCurrentPageIndex(prev => prev - 1));
    }
  };

  const triggerFlipAnimation = (callback: () => void) => {
    setIsFlipping(true);
    setTimeout(() => {
      callback();
      setIsFlipping(false);
    }, 250);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col font-sans select-none overflow-hidden text-slate-100">
      {/* Reader Control Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white leading-none">{project.name}</h3>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-0.5 block">
              Interactive Digital E-Book Publication
            </span>
          </div>
        </div>

        {/* Center Page Counter & Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            disabled={currentPageIndex === 0}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl text-slate-200 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-800 rounded-lg border border-slate-700">
            Page {currentPageIndex + 1} of {pages.length}
          </span>

          <button
            onClick={handleNext}
            disabled={currentPageIndex === pages.length - 1}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl text-slate-200 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              showThumbnails ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" /> Pages
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-red-600/80 text-slate-400 hover:text-white rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Reader Body & Page Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Page Thumbnail Sidebar */}
        {showThumbnails && (
          <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto space-y-3 shrink-0 z-20">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Page Thumbnails</h4>
            <div className="space-y-2">
              {pages.map((p: any, idx: number) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setCurrentPageIndex(idx);
                    setShowThumbnails(false);
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                    idx === currentPageIndex ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold' : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span>Page {idx + 1}: {p.name}</span>
                  {idx === currentPageIndex && <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* E-Book Reader Canvas */}
        <main className="flex-1 bg-[#03060E] flex items-center justify-center p-8 overflow-auto">
          <div
            className={`w-[840px] h-[600px] bg-white rounded-2xl border border-slate-200 shadow-2xl relative overflow-hidden transition-all duration-300 ${
              isFlipping ? 'scale-95 opacity-60 rotate-y-6' : 'scale-100 opacity-100'
            }`}
          >
            <RuntimeRenderer project={project} breakpoint="desktop" />
          </div>
        </main>
      </div>
    </div>
  );
};
