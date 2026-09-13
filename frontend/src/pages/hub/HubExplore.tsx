import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Heart,
  ChevronRight,
  Search,
  Box,
  MessageSquare,
  ArrowUpRight,
  Eye,
  Bookmark,
} from 'lucide-react';
import ThreeProduct from '../../components/ThreeProduct';
import { SPATIAL_HUB_MODELS } from '../../data/spatialHubModels';

export function HubExplore() {
  const navigate = useNavigate();
  const [likedIds, setLikedIds] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('i3dion_liked_items') || '[]');
  });

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    let updated: string[];
    if (likedIds.includes(id)) {
      updated = likedIds.filter((item) => item !== id);
    } else {
      updated = [...likedIds, id];
    }
    setLikedIds(updated);
    localStorage.setItem('i3dion_liked_items', JSON.stringify(updated));
  };

  // Reference 1 Featured Cards
  const featuredCards = [
    {
      id: 'vortek_lounge_chair',
      name: 'Vortek Lounge Chair',
      subtitle: 'Modern seating for inspiring spaces',
      categoryBadge: '3D Product',
      badgeColor: 'bg-blue-100 text-blue-700',
      orgAvatar: 'A',
      orgName: 'Armoni Design',
      modelUrl: '/models/gearbox_assembly.glb',
    },
    {
      id: 'centrifugal_pump_x1',
      name: 'Centrifugal Pump X1',
      subtitle: 'Explore the internal structure',
      categoryBadge: 'Interactive 3D',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      orgAvatar: 'I3',
      orgName: 'I3DION Industrial',
      modelUrl: '/models/industrial_pump.glb',
    },
    {
      id: 'modular_office_building',
      name: 'Modular Office Building',
      subtitle: 'Experience in your space',
      categoryBadge: 'AR Experience',
      badgeColor: 'bg-purple-100 text-purple-700',
      orgAvatar: 'V',
      orgName: 'Vertex Buildings',
      modelUrl: '/models/electric_motor.glb',
    },
    {
      id: 'eclipse_ev_concept',
      name: 'Eclipse EV Concept',
      subtitle: 'Next generation mobility',
      categoryBadge: '3D Product',
      badgeColor: 'bg-blue-100 text-blue-700',
      orgAvatar: 'N',
      orgName: 'Nova Motors',
      modelUrl: '/models/gearbox_assembly.glb',
    },
  ];

  // Recently Viewed Items
  const recentlyViewed = [
    { id: 'industrial_valve', name: 'Industrial Valve', time: 'Viewed 2 hours ago', modelUrl: '/models/industrial_pump.glb' },
    { id: 'conference_room', name: 'Conference Room', time: 'Viewed 5 hours ago', modelUrl: '/models/electric_motor.glb' },
    { id: 'solar_panel_system', name: 'Solar Panel System', time: 'Viewed 1 day ago', modelUrl: '/models/gearbox_assembly.glb' },
  ];

  // Trending Items
  const trendingItems = [
    {
      id: 'smart_manufacturing',
      name: 'Smart Manufacturing Line',
      categoryBadge: 'Interactive 3D',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      modelUrl: '/models/industrial_pump.glb',
    },
    {
      id: 'sustainable_arch',
      name: 'Sustainable Architecture',
      categoryBadge: '3D Product',
      badgeColor: 'bg-blue-100 text-blue-700',
      modelUrl: '/models/electric_motor.glb',
    },
    {
      id: 'warehouse_sol',
      name: 'Warehouse Solution',
      categoryBadge: 'AR Experience',
      badgeColor: 'bg-purple-100 text-purple-700',
      modelUrl: '/models/gearbox_assembly.glb',
    },
    {
      id: 'energy_storage',
      name: 'Energy Storage Unit',
      categoryBadge: '3D Product',
      badgeColor: 'bg-blue-100 text-blue-700',
      modelUrl: '/models/industrial_pump.glb',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 pt-6 px-4 md:px-8 space-y-8 select-none">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* ─── HERO BANNER MATCHING SCREEN 1 OF UI REFERENCE ────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] p-8 md:p-12 text-white shadow-xl">
          <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400 via-sky-200 to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-blue-400">
              EXPLORE • EXPERIENCE • ENGAGE
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Welcome to <br />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-white bg-clip-text text-transparent">
                I3DION Spatial Hub
              </span>
            </h1>
            <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed">
              Discover real products. Explore spatial experiences. Connect with a more visual world.
            </p>
          </div>

          <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 text-right border-l border-slate-700/80 pl-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">REAL PRODUCTS.</p>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">REAL SPACES.</p>
            <p className="text-xs font-extrabold uppercase tracking-widest text-blue-400 mt-1">A MORE VISUAL WORLD.</p>
          </div>
        </div>

        {/* ─── FEATURED EXPERIENCES SECTION ───────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-slate-900">Featured Experiences</h2>
            <Link to="/hub/search" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
              View All <ChevronRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredCards.map((card) => {
              const isLiked = likedIds.includes(card.id);
              return (
                <div
                  key={card.id}
                  onClick={() => navigate(`/hub/product/${card.id}`)}
                  className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-md transition duration-200 cursor-pointer overflow-hidden"
                >
                  <div className="relative h-44 w-full bg-[#0F172A] overflow-hidden">
                    <ThreeProduct modelUrl={card.modelUrl} renderMode="solid" autoRotate={true} interactive={false} className="h-full w-full" />
                    
                    <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold ${card.badgeColor}`}>
                      {card.categoryBadge}
                    </span>

                    <button
                      onClick={(e) => toggleLike(e, card.id)}
                      className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition ${
                        isLiked ? 'bg-rose-500 text-white' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">{card.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{card.subtitle}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                        {card.orgAvatar}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600">{card.orgName}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── RECENTLY VIEWED & QUICK ACTIONS (SPLIT GRID) ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recently Viewed (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recently Viewed</h2>
              <Link to="/hub/feed" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                View All <ChevronRight size={15} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentlyViewed.map((item) => (
                <Link
                  key={item.id}
                  to={`/hub/product/${item.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs hover:shadow-sm transition"
                >
                  <div className="h-14 w-14 rounded-xl bg-slate-900 overflow-hidden shrink-0">
                    <ThreeProduct modelUrl={item.modelUrl} renderMode="solid" autoRotate={true} interactive={false} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions (Right 1 col) */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3">
              <Link
                to="/hub/search"
                className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-2xs hover:shadow-md hover:border-blue-200 transition group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition">
                  <Search size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-800 mt-2">Search Products</span>
              </Link>

              <Link
                to="/hub"
                className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-2xs hover:shadow-md hover:border-blue-200 transition group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition">
                  <Box size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-800 mt-2">Explore Experiences</span>
              </Link>

              <Link
                to="/hub/enquiries"
                className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-2xs hover:shadow-md hover:border-blue-200 transition group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition">
                  <MessageSquare size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-800 mt-2">Ask a Question</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── TRENDING IN YOUR INDUSTRY SECTION ─────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-slate-900">Trending in Your Industry</h2>
            <Link to="/hub/search" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
              View All <ChevronRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trendingItems.map((item) => (
              <Link
                key={item.id}
                to={`/hub/product/${item.id}`}
                className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-md transition overflow-hidden"
              >
                <div className="relative h-40 w-full bg-[#0F172A] overflow-hidden">
                  <ThreeProduct modelUrl={item.modelUrl} renderMode="solid" autoRotate={true} interactive={false} className="h-full w-full" />
                  <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold ${item.badgeColor}`}>
                    {item.categoryBadge}
                  </span>
                </div>
                <div className="p-3.5">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">{item.name}</h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
