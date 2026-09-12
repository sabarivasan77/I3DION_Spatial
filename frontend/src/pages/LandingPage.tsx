import { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  Box,
  Smartphone,
  ShieldCheck,
  Zap,
  BarChart3,
  Cpu,
  Layers,
  Bot,
  QrCode,
  RotateCw,
  CheckCircle2,
  Globe2,
  Factory,
  Car,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThreeProduct from '../components/ThreeProduct';
import { ViewInARButton } from '../components/ViewInARButton';
import { Logo } from '../components/Logo';

// Verified local industrial GLB models with documented open-source CC-BY 4.0 licenses
const DEMO_MODELS = [
  {
    id: 'gearbox',
    name: 'Industrial Gearbox Reference Model',
    title: 'Precision Multi-Gear Transmission Assembly',
    category: 'Mechanical Transmission',
    icon: Factory,
    modelUrl: '/models/gearbox_assembly.glb',
    desc: 'Multi-part mechanical transmission reference assembly featuring helical spur gears, pinion shafts, and cast outer housing designed for rotational power transfer analysis.',
    dataCards: [
      { label: 'Component Structure', value: 'Multi-Part Gear Assembly' },
      { label: 'Visualization Modes', value: 'Solid / Wireframe / X-Ray' },
      { label: 'Internal Geometry', value: 'Helical Gears & Shafts' },
      { label: 'Asset Reference', value: 'glTF 2.0 CAD Standard' }
    ],
    highlights: [
      'Cast Outer Transmission Housing',
      'Helical Spur Gears & Pinion Shafts',
      'Countershaft Bearings & Retaining Rings'
    ]
  },
  {
    id: 'pump',
    name: 'Industrial Twin-Cylinder Assembly',
    title: 'Reciprocating Piston & Manifold Assembly',
    category: 'Fluid Handling Equipment',
    icon: Activity,
    modelUrl: '/models/industrial_pump.glb',
    desc: 'Twin-cylinder reciprocating mechanical reference assembly highlighting internal piston bores, connecting rods, flywheel, and fluid pressure housing.',
    dataCards: [
      { label: 'Component Structure', value: 'Piston & Cylinder Assembly' },
      { label: 'Visualization Modes', value: 'Solid / Wireframe / X-Ray' },
      { label: 'Internal Geometry', value: 'Connecting Rods & Flywheel' },
      { label: 'Asset Reference', value: 'glTF 2.0 CAD Standard' }
    ],
    highlights: [
      'Dual Cylinder Bores & Pressure Manifold',
      'Reciprocating Pistons & Gudgeon Pins',
      'Balanced Flywheel Shaft'
    ]
  },
  {
    id: 'actuator',
    name: 'Reciprocating Power Actuator',
    title: 'Motorized Reciprocating Drive Assembly',
    category: 'Rotating Power Equipment',
    icon: Cpu,
    modelUrl: '/models/electric_motor.glb',
    desc: 'Electric motor-driven reciprocating mechanical assembly demonstrating internal bevel reduction gearing, armature shaft, and outer protective housing.',
    dataCards: [
      { label: 'Component Structure', value: 'Drive Motor & Reduction Gear' },
      { label: 'Visualization Modes', value: 'Solid / Wireframe / X-Ray' },
      { label: 'Internal Geometry', value: 'Stator & Reciprocating Guide' },
      { label: 'Asset Reference', value: 'glTF 2.0 CAD Standard' }
    ],
    highlights: [
      'Electric Motor Stator & Armature',
      'Bevel Gear Reduction Assembly',
      'Reciprocating Guide Shaft'
    ]
  }
];

export function LandingPage() {
  const [activeModelIndex, setActiveModelIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [renderMode, setRenderMode] = useState<'solid' | 'wireframe' | 'xray'>('solid');

  const currentModel = DEMO_MODELS[activeModelIndex];

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 pt-16">
      {/* ─── 1. HERO SECTION WITH MONOCHROMATIC 3D STUDIO EXPERIENCE ───────────────── */}
      <section className="relative overflow-hidden px-4 py-14 md:px-8 md:py-20 text-center flex flex-col items-center">
        {/* Subtle Motion Graphic Radial Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(37,99,235,0.12),rgba(255,255,255,0))]" />
        
        {/* Floating Motion Graphics Particles (Subtle Accent) */}
        <div className="absolute top-20 left-[8%] hidden lg:block animate-bounce" style={{ animationDuration: '6s' }}>
          <div className="flex items-center gap-2 rounded-2xl border border-blue-200/80 bg-white/80 p-3 backdrop-blur-md shadow-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Zap size={18} />
            </div>
            <div className="text-left text-xs">
              <p className="font-bold text-slate-900">+340% Engagement</p>
              <p className="text-[10px] text-slate-500">WebAR Product Demos</p>
            </div>
          </div>
        </div>

        <div className="absolute top-28 right-[8%] hidden lg:block animate-bounce" style={{ animationDuration: '7s', animationDelay: '1s' }}>
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200/80 bg-white/80 p-3 backdrop-blur-md shadow-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Smartphone size={18} />
            </div>
            <div className="text-left text-xs">
              <p className="font-bold text-slate-900">Instant QR Handoff</p>
              <p className="text-[10px] text-slate-500">1:1 Real-Scale AR</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-xs">
            <Sparkles size={14} className="animate-pulse text-blue-600" />
            <span>Next-Gen Enterprise Industrial Product Showcase & WebAR Platform</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Transform Physical Products into{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              Interactive 3D & WebAR
            </span>{' '}
            Experiences
          </h1>

          {/* Hero Subtitle */}
          <p className="text-base sm:text-lg leading-relaxed text-slate-600 mx-auto max-w-2xl font-normal">
            Empower technical buyers and enterprise customers to inspect CAD models in real-time, toggle X-Ray structures, and launch instant 1:1 scale AR directly via mobile QR.
          </p>

          {/* Hero Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            <Link
              to="/signup"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-200 active:scale-[0.98]"
            >
              <span>Start Free Enterprise Trial</span>
              <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            <Link
              to="/hub"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 shadow-xs hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm transition-all duration-200 active:scale-[0.98]"
            >
              <Globe2 size={17} className="text-slate-500 group-hover:text-blue-600 transition-colors duration-200" />
              <span>Explore Spatial Hub</span>
            </Link>
          </div>
        </div>

        {/* ─── 2. HIGH-IMPACT 3D SHOWCASE SECTION (60/40 SPLIT) ────────────────── */}
        <div className="relative mt-12 w-full max-w-6xl z-10 mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl flex flex-col">
            {/* Header / Model Navigation & Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 p-4 bg-slate-50/90 gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                </span>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Box size={15} className="text-blue-600" />
                  i3D Product Showcase
                </span>
              </div>

              {/* Mode Selector: SOLID / WIREFRAME / X-RAY */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
                <button
                  onClick={() => setRenderMode('solid')}
                  className={`px-3.5 py-1.5 rounded-lg transition text-xs font-bold ${
                    renderMode === 'solid' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  SOLID
                </button>
                <button
                  onClick={() => setRenderMode('wireframe')}
                  className={`px-3.5 py-1.5 rounded-lg transition text-xs font-bold ${
                    renderMode === 'wireframe' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  WIREFRAME
                </button>
                <button
                  onClick={() => setRenderMode('xray')}
                  className={`px-3.5 py-1.5 rounded-lg transition text-xs font-bold ${
                    renderMode === 'xray' ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  X-RAY
                </button>
              </div>

              {/* Model Switcher Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 shadow-2xs">
                {DEMO_MODELS.map((model, idx) => {
                  const Icon = model.icon;
                  const isActive = idx === activeModelIndex;
                  return (
                    <button
                      key={model.id}
                      onClick={() => setActiveModelIndex(idx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs font-bold'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon size={14} className={isActive ? 'text-blue-400' : ''} />
                      <span>{model.name.split(' ')[1] || model.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3D Showcase Grid (Viewer + Verified Info Panel) */}
            <div className="grid lg:grid-cols-[1.5fr_1fr] items-stretch">
              {/* 3D Interactive Canvas Container (Left 60%) */}
              <div className="relative h-[400px] sm:h-[480px] lg:h-[540px] w-full bg-[#F8FAFC] border-b lg:border-b-0 lg:border-r border-slate-200 overflow-hidden">
                <ThreeProduct
                  key={`${currentModel.id}-${renderMode}`}
                  modelUrl={currentModel.modelUrl}
                  productName={currentModel.name}
                  autoRotate={autoRotate}
                  renderMode={renderMode}
                  themeMode="light"
                />

                {/* Canvas Control Overlay */}
                <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
                  <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-md hover:bg-white transition"
                  >
                    <RotateCw size={14} className={autoRotate ? 'animate-spin text-blue-600' : ''} />
                    <span>{autoRotate ? 'Auto Rotating' : 'Rotate Paused'}</span>
                  </button>

                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-md backdrop-blur-md">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Verified CAD Geometry</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Model Info & Data Cards Panel (Right 40%) */}
              <div className="p-6 md:p-8 bg-white text-slate-900 space-y-6 flex flex-col justify-between text-left">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase text-blue-700 border border-blue-100">
                      {currentModel.category}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      MODE: {renderMode.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {currentModel.title}
                  </h3>

                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                    {currentModel.desc}
                  </p>

                  {/* Factually Verified Data Cards */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Model Metadata</p>
                    <div className="grid grid-cols-2 gap-2">
                      {currentModel.dataCards.map((card) => (
                        <div key={card.label} className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-xs">
                          <span className="block text-[10px] font-semibold text-slate-500">{card.label}</span>
                          <span className="font-bold text-slate-900 block mt-0.5">{card.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Geometric Structure Highlights */}
                  <div className="space-y-1.5 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Structural Components</p>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {currentModel.highlights.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <ViewInARButton
                    title={currentModel.name}
                    className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
                  />
                  <button
                    onClick={() => setRenderMode(renderMode === 'xray' ? 'solid' : 'xray')}
                    className="flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Layers size={15} className="text-blue-600" />
                    <span>{renderMode === 'xray' ? 'Return to Solid View' : 'Inspect Internal Structure (X-Ray)'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. ENTERPRISE PLATFORM CAPABILITIES ─────────────────────────────────── */}
      <section className="bg-white py-20 px-4 md:px-8 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
              Enterprise Spatial Capabilities
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Industrial Sales & Product Marketing
            </p>
            <p className="text-sm text-slate-600">
              Everything your organization needs to deploy immersive 3D catalogs, manage CAD assets, and capture qualified commercial leads.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: QrCode,
                color: 'bg-blue-50 text-blue-600 border-blue-100',
                title: 'Instant WebAR QR Handoff',
                desc: 'Scan QR codes on desktop to automatically project 1:1 scale products in real-world environments via iOS Quick Look & Android SceneViewer.',
              },
              {
                icon: Layers,
                color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                title: 'CAD & 3D Asset Pipeline',
                desc: 'Seamlessly upload GLB, USDZ, thumbnail imagery, technical PDF datasheets, and maintenance manuals in one unified dashboard.',
              },
              {
                icon: BarChart3,
                color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                title: 'Spatial Telemetry & Funnel',
                desc: 'Track user 3D interactions, rotation metrics, AR session lengths, document downloads, and high-intent quote requests.',
              },
              {
                icon: Bot,
                color: 'bg-purple-50 text-purple-600 border-purple-100',
                title: 'Contextual AI Sales Assistant',
                desc: 'Embedded AI chatbot answers technical product questions 24/7, handles specification inquiries, and escalates leads.',
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-3xl border border-slate-200 bg-[#F8FAFC] p-6 shadow-xs hover:border-blue-200 hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${feat.color}`}>
                      <Icon size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{feat.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 4. INDUSTRY USE CASES & APPLICATION USERS ─────────────────────────────── */}
      <section className="py-20 px-4 md:px-8 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Industry Applications</span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Designed for High-Value Physical Products
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              From heavy industrial machinery to medical devices, I3DION Spatial delivers the spatial performance enterprise buyers demand.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Factory,
                title: 'Heavy Machinery & Equipment',
                items: ['Air Compressors & Turbines', 'Industrial Centrifugal Pumps', 'Power Generators & Transformers', 'Robotic Manufacturing Arms'],
              },
              {
                icon: Car,
                title: 'Automotive & Mobility',
                items: ['Electric Vehicle Powertrains', 'Battery Module Assemblies', 'Custom Chassis & Suspension', 'Fleet Charging Infrastructure'],
              },
              {
                icon: Cpu,
                title: 'Aerospace & Electronics',
                items: ['Avionics & Control Units', 'Precision Gas Turbines', 'Medical Imaging Systems', 'Server & Racking Infrastructure'],
              },
            ].map((sector) => {
              const Icon = sector.icon;
              return (
                <div key={sector.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{sector.title}</h3>
                  </div>
                  <ul className="space-y-2 pt-2 border-t border-slate-100">
                    {sector.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 5. STEP-BY-STEP WORKFLOW ────────────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-8 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">End-to-End Workflow</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">How I3DION Spatial Works</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { num: '01', title: 'Upload 3D Models', desc: 'Drag and drop your GLB, USDZ, thumbnails, and technical datasheets.' },
              { num: '02', title: 'Auto-Generate QR', desc: 'System automatically compiles studio lighting and outputs dynamic spatial QR codes.' },
              { num: '03', title: 'Customer WebAR', desc: 'Buyers scan QR with their phone camera to project products in 1:1 real-world scale.' },
              { num: '04', title: 'Conversion & Leads', desc: 'Capture commercial quote requests, document downloads, and sales interactions.' },
            ].map((step) => (
              <div key={step.num} className="rounded-3xl border border-slate-200 bg-[#F8FAFC] p-6 space-y-3 relative">
                <span className="text-3xl font-black text-blue-600/30">{step.num}</span>
                <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. ENTERPRISE STATS BANNER ────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-8 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-blue-400">99.9%</p>
            <p className="mt-1 text-xs text-slate-400 font-medium uppercase tracking-wider">WebAR Session Uptime</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-blue-400">&lt; 2.5s</p>
            <p className="mt-1 text-xs text-slate-400 font-medium uppercase tracking-wider">Average 3D Load Time</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-blue-400">120+</p>
            <p className="mt-1 text-xs text-slate-400 font-medium uppercase tracking-wider">Enterprise Catalogs</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-blue-400">50,000+</p>
            <p className="mt-1 text-xs text-slate-400 font-medium uppercase tracking-wider">Spatial Events Tracked</p>
          </div>
        </div>
      </section>

      {/* ─── 7. MINIMAL ENTERPRISE LIGHT FOOTER ───────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white px-6 py-12 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <Logo />
            <p className="text-slate-500 leading-relaxed text-xs">
              Next-generation spatial computing, 3D visualization, and AR platform for enterprise industrial products.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Platform</h3>
            <ul className="space-y-2 text-slate-500">
              <li><Link to="/hub" className="hover:text-blue-600 transition">Spatial Hub</Link></li>
              <li><Link to="/login" className="hover:text-blue-600 transition">3D Studio Engine</Link></li>
              <li><Link to="/login" className="hover:text-blue-600 transition">WebAR QR Handoff</Link></li>
              <li><Link to="/login" className="hover:text-blue-600 transition">Lead Capture System</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Solutions</h3>
            <ul className="space-y-2 text-slate-500">
              <li><span className="text-slate-600">Heavy Machinery</span></li>
              <li><span className="text-slate-600">Automotive Engineering</span></li>
              <li><span className="text-slate-600">Energy & Utilities</span></li>
              <li><span className="text-slate-600">Medical Devices</span></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Account</h3>
            <ul className="space-y-2 text-slate-500">
              <li><Link to="/login" className="hover:text-blue-600 transition">Sign In</Link></li>
              <li><Link to="/signup" className="hover:text-blue-600 transition">Register Workspace</Link></li>
              <li><Link to="/support" className="hover:text-blue-600 transition">Support & Documentation</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400">
          <p>© 2026 I3DION Spatial Enterprise. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-600 transition">Privacy Policy</span>
            <span className="hover:text-slate-600 transition">Terms of Service</span>
            <span className="hover:text-slate-600 transition">Security</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
