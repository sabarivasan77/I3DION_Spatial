import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Edit3, 
  Undo, 
  Redo, 
  Monitor, 
  Tablet, 
  Smartphone, 
  ChevronDown, 
  Clock, 
  Play, 
  Save, 
  Bell, 
  MessageSquare, 
  Search, 
  Type, 
  MousePointer, 
  Image as ImageIcon, 
  Video, 
  Star, 
  Square, 
  ChevronRight, 
  Box, 
  Maximize2, 
  Lock, 
  Layers, 
  ShieldCheck, 
  Zap, 
  LayoutGrid,
  Database,
  Sliders,
  Settings
} from 'lucide-react';
import { studioApi, StudioProject } from '../../api/studioApi';
import { vaultApi } from '../../api/vaultApi';
import { StudioPreviewModal } from '../../components/studio/StudioPreviewModal';
import { StudioPublishModal } from '../../components/studio/StudioPublishModal';

export const StudioCatalogBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<StudioProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Top bar states
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [projectTitle, setProjectTitle] = useState('Industrial Compressor Showcase');

  // Inspector tabs
  const [leftTab, setLeftTab] = useState<'widgets' | 'hierarchy'>('widgets');
  const [rightTab, setRightTab] = useState<'content' | 'style' | 'layout' | 'events'>('content');
  const [widgetSearch, setWidgetSearch] = useState('');

  // Selected container
  const [selectedContainerId, setSelectedContainerId] = useState('hero_section');

  // Padding state for Right Properties Inspector
  const [paddingTop, setPaddingTop] = useState(40);
  const [paddingRight, setPaddingRight] = useState(40);
  const [paddingBottom, setPaddingBottom] = useState(40);
  const [paddingLeft, setPaddingLeft] = useState(40);
  const [bgColor1, setBgColor1] = useState('#F8FAFC');
  const [bgColor2, setBgColor2] = useState('#E2E8F0');

  // Modals
  const [showPreview, setShowPreview] = useState(false);
  const [showPublish, setShowPublish] = useState(false);

  useEffect(() => {
    if (id) {
      loadData(id);
    } else {
      loadData('default');
    }
  }, [id]);

  const loadData = async (projectId: string) => {
    setLoading(true);
    try {
      let proj = await studioApi.getProject(projectId);
      if (!proj) {
        proj = {
          id: 'proj-default',
          name: 'Industrial Compressor Showcase',
          description: 'High performance industrial compressor catalog presentation',
          owner: 'I3DION Admin',
          status: 'Draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: 1,
          visibility: 'Organization',
          product_ids: [],
          vault_asset_ids: [],
          catalog_data: {
            title: 'Industrial Compressor Showcase',
            subtitle: 'Engineered for a cleaner tomorrow',
            theme: 'violet-industrial',
            sections: [
              {
                id: 'hero_section',
                type: 'cover',
                title: 'Industrial Compressor Series',
                subtitle: 'High performance. Maximum reliability. Built for modern industry.',
                items: []
              }
            ]
          }
        };
      }
      setProject(proj);
      setProjectTitle(proj.name);

      await vaultApi.getAssets();
    } catch (err) {
      console.error('Failed to load catalog builder:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const updated = await studioApi.updateProject(project.id, {
        name: projectTitle,
        catalog_data: project.catalog_data,
      });
      setProject(updated);
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Loading OmniStudio Canvas Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F1F5F9] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Clean Top Bar (Exact matching Screenshot 2) */}
      <header className="h-14 bg-white dark:bg-[#0D111D] border-b border-slate-200 dark:border-slate-800/80 px-4 flex items-center justify-between shrink-0 z-30 shadow-sm">
        {/* Left: Collapsed Nav & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/omni-studio')}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Menu / Exit to Studio"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-900 dark:text-white tracking-wide">I3DION SPATIAL</span>
            <span className="text-slate-400">›</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">OmniStudio</span>
            <span className="text-slate-400">›</span>
            
            {isEditingTitle ? (
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                className="px-2 py-0.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-indigo-500 rounded text-slate-900 dark:text-white outline-none"
                autoFocus
              />
            ) : (
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                {projectTitle}
                <button onClick={() => setIsEditingTitle(true)} className="text-slate-400 hover:text-indigo-600">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Center Controls: Undo/Redo, Responsive View Selector, Zoom, Timeline */}
        <div className="flex items-center gap-4">
          {/* Undo / Redo */}
          <div className="flex items-center gap-1 text-slate-400 border-r border-slate-200 dark:border-slate-800 pr-3">
            <button className="p-1.5 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Undo">
              <Undo className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Redo">
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Responsive View Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                device === 'desktop' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop
            </button>

            <button
              onClick={() => setDevice('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                device === 'tablet' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              Tablet
            </button>

            <button
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                device === 'mobile' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile
            </button>
          </div>

          {/* Canvas Zoom Controls */}
          <div className="flex items-center gap-1 text-xs">
            <select
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
            >
              <option value={50}>50%</option>
              <option value={75}>75%</option>
              <option value={100}>100%</option>
              <option value={125}>125%</option>
              <option value={150}>150%</option>
              <option value={200}>200%</option>
            </select>
          </div>

          {/* Timeline */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            Timeline
          </button>
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition"
          >
            <Play className="w-3.5 h-3.5 fill-indigo-600 dark:fill-indigo-400" />
            Preview
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save'}
          </button>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800" />

          <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition" title="Notifications">
            <Bell className="w-4 h-4" />
          </button>

          <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition" title="AI Chatbot Assistance">
            <MessageSquare className="w-4 h-4" />
          </button>

          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            SV
          </div>
        </div>
      </header>

      {/* Main 3-Column Studio Workbench */}
      <div className="flex-1 flex overflow-hidden">
        {/* 2. Left Panel: Organized Widget Library (Exact matching Screenshot 2) */}
        <aside className="w-72 bg-white dark:bg-[#0D111D] border-r border-slate-200 dark:border-slate-800/80 flex flex-col shrink-0">
          {/* Panel Header Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              onClick={() => setLeftTab('widgets')}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                leftTab === 'widgets'
                  ? 'border-blue-600 text-blue-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/40'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Widgets
            </button>
            <button
              onClick={() => setLeftTab('hierarchy')}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                leftTab === 'hierarchy'
                  ? 'border-blue-600 text-blue-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/40'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Hierarchy
            </button>
          </div>

          {/* Search Widgets */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search widgets..."
                value={widgetSearch}
                onChange={(e) => setWidgetSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Widget Categories Accordion */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {/* Basic Widgets Expanded Group */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Basic</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 bg-slate-50 dark:bg-[#141A29] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl transition cursor-grab flex items-center gap-2.5">
                  <div className="p-1.5 bg-red-100 dark:bg-red-950/60 text-red-500 rounded-lg">
                    <Type className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Text</div>
                    <div className="text-[9px] text-slate-400">Add text content</div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-[#141A29] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl transition cursor-grab flex items-center gap-2.5">
                  <div className="p-1.5 bg-orange-100 dark:bg-orange-950/60 text-orange-500 rounded-lg">
                    <MousePointer className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Button</div>
                    <div className="text-[9px] text-slate-400">Interactive button</div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-[#141A29] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl transition cursor-grab flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 rounded-lg">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Image</div>
                    <div className="text-[9px] text-slate-400">Image with library</div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-[#141A29] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl transition cursor-grab flex items-center gap-2.5">
                  <div className="p-1.5 bg-rose-100 dark:bg-rose-950/60 text-rose-500 rounded-lg">
                    <Video className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Video Player</div>
                    <div className="text-[9px] text-slate-400">HTML5 video player</div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-[#141A29] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl transition cursor-grab flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-950/60 text-blue-500 rounded-lg">
                    <Star className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Icon</div>
                    <div className="text-[9px] text-slate-400">Icon with text</div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-[#141A29] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl transition cursor-grab flex items-center gap-2.5">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-950/60 text-purple-500 rounded-lg">
                    <Square className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Shape</div>
                    <div className="text-[9px] text-slate-400">Basic shapes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion Categories */}
            {[
              { name: 'Layout', icon: LayoutGrid },
              { name: '3D & Models', icon: Box },
              { name: 'Media', icon: ImageIcon },
              { name: 'Forms', icon: Edit3 },
              { name: 'Data & Integrations', icon: Database },
              { name: 'Product Components', icon: Layers },
              { name: 'Interactive', icon: Zap },
              { name: 'Advanced', icon: Sliders },
            ].map((cat, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer transition">
                <div className="flex items-center gap-2.5 font-bold text-slate-700 dark:text-slate-300">
                  <cat.icon className="w-4 h-4 text-blue-500" />
                  <span>{cat.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </aside>

        {/* 3. Center Main Canvas (Exact matching Screenshot 2) */}
        <div className="flex-1 bg-slate-200 dark:bg-[#080B12] overflow-y-auto p-6 flex justify-center items-start relative">
          <div 
            className={`transition-all duration-300 ${
              device === 'desktop' ? 'w-full max-w-5xl' : device === 'tablet' ? 'w-[768px]' : 'w-[375px]'
            }`}
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            {/* Canvas Outer Boundary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-blue-500/80 shadow-2xl overflow-hidden relative">
              {/* Section Header Label Overlay */}
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold rounded shadow-md">
                <Box className="w-3 h-3" />
                <span>Hero Section</span>
              </div>

              <div className="absolute top-2 right-2 z-20 p-1 bg-slate-800 text-slate-300 rounded hover:text-white cursor-pointer">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>

              {/* Rendered Website Preview Container */}
              <div className="p-8 pt-10 space-y-12 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 dark:from-[#0B132B] dark:via-slate-900 dark:to-[#0F172A]">
                {/* Navbar */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-lg">
                    <span className="text-blue-600">I3DION</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>Products</span>
                    <span>Solutions</span>
                    <span>Industries</span>
                    <span>Support</span>
                  </div>
                  <button className="px-4 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-sm">
                    Get a Quote
                  </button>
                </div>

                {/* Hero Showcase Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-4">
                  {/* Left Hero Content */}
                  <div className="space-y-5">
                    <span className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
                      ENGINEERED FOR A CLEANER TOMORROW
                    </span>

                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                      Industrial Compressor Series
                    </h1>

                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      High performance. Maximum reliability. Built for modern industry.
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                      <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition">
                        Explore in 3D
                      </button>
                      <button className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        View Specifications
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-2">
                      <span className="flex items-center gap-1.5">🍃 High Efficiency</span>
                      <span className="flex items-center gap-1.5">🛡️ Low Emissions</span>
                      <span className="flex items-center gap-1.5">🌐 Global Support</span>
                    </div>
                  </div>

                  {/* Right Interactive 3D Model Display */}
                  <div className="h-80 bg-gradient-to-tr from-slate-100 to-blue-50 dark:from-slate-800 dark:to-blue-950/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center relative shadow-inner overflow-hidden">
                    <div className="text-center space-y-2">
                      <div className="w-40 h-40 mx-auto rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Box className="w-24 h-24 animate-pulse" />
                      </div>
                      <span className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1">
                        <MousePointer className="w-3.5 h-3.5" />
                        Drag to rotate 3D Air Compressor
                      </span>
                    </div>

                    {/* Floating Viewport Toolbar */}
                    <div className="absolute right-3 top-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 text-slate-400 shadow-md">
                      <button className="p-1.5 hover:text-blue-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="3D Viewport">
                        <Box className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:text-blue-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Exploded View">
                        <Layers className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:text-blue-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Annotations">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lower Key Features Section */}
                <div className="pt-8 space-y-6">
                  <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white">Key Features</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-2 text-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Settings className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Superior Performance</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Engineered for continuous operation in demanding environments.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-2 text-center">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Smart Monitoring</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Real-time analytics and predictive maintenance.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-2 text-center">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Built to Last</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Rugged design with lower lifecycle costs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Right Panel: Properties Inspector (Exact matching Screenshot 2) */}
        <aside className="w-80 bg-white dark:bg-[#0D111D] border-l border-slate-200 dark:border-slate-800/80 flex flex-col shrink-0 text-xs">
          {/* Properties Inspector Header Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 font-bold">
            {(['content', 'style', 'layout', 'events'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex-1 py-3 text-center border-b-2 capitalize transition ${
                  rightTab === tab
                    ? 'border-blue-600 text-blue-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/40'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Accordion 1: Container Settings */}
            <div className="space-y-3">
              <div className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                Container
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedContainerId}
                      onChange={(e) => setSelectedContainerId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none"
                    />
                    <Lock className="w-3.5 h-3.5 absolute right-2.5 top-2 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Description</label>
                  <input
                    type="text"
                    defaultValue="Main hero section with 3D model"
                    className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Accordion 2: Background Settings */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Background</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Background Type</label>
                  <select className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-medium">
                    <option value="gradient">Gradient</option>
                    <option value="solid">Solid Color</option>
                    <option value="image">Image Background</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 text-[11px]">Color 1</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor1}
                      onChange={(e) => setBgColor1(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                    <span className="font-mono text-slate-600 dark:text-slate-300 uppercase">{bgColor1}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 text-[11px]">Color 2</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor2}
                      onChange={(e) => setBgColor2(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                    <span className="font-mono text-slate-600 dark:text-slate-300 uppercase">{bgColor2}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Direction</span>
                  <select className="px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-slate-100 font-mono">
                    <option value="135">135°</option>
                    <option value="90">90°</option>
                    <option value="180">180°</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Accordion 3: Spacing (4 Padding Boxes) */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Spacing</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-2">Padding</label>
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                    <input
                      type="number"
                      value={paddingTop}
                      onChange={(e) => setPaddingTop(Number(e.target.value))}
                      className="w-full text-center bg-transparent font-bold text-slate-900 dark:text-white outline-none"
                    />
                    <div className="text-[9px] text-slate-400 font-sans">Top</div>
                  </div>

                  <div className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                    <input
                      type="number"
                      value={paddingRight}
                      onChange={(e) => setPaddingRight(Number(e.target.value))}
                      className="w-full text-center bg-transparent font-bold text-slate-900 dark:text-white outline-none"
                    />
                    <div className="text-[9px] text-slate-400 font-sans">Right</div>
                  </div>

                  <div className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                    <input
                      type="number"
                      value={paddingBottom}
                      onChange={(e) => setPaddingBottom(Number(e.target.value))}
                      className="w-full text-center bg-transparent font-bold text-slate-900 dark:text-white outline-none"
                    />
                    <div className="text-[9px] text-slate-400 font-sans">Bottom</div>
                  </div>

                  <div className="p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1">
                    <input
                      type="number"
                      value={paddingLeft}
                      onChange={(e) => setPaddingLeft(Number(e.target.value))}
                      className="w-full text-center bg-transparent font-bold text-slate-900 dark:text-white outline-none"
                    />
                    <div className="text-[9px] text-slate-400 font-sans">Left</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion Categories */}
            {['Border', 'Border Radius', 'Shadow', 'Visibility'].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800 cursor-pointer">
                <span>{item}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <StudioPreviewModal
          project={project}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Publish Modal */}
      {showPublish && (
        <StudioPublishModal
          project={project}
          onClose={() => setShowPublish(false)}
          onSuccess={(updated) => setProject(updated)}
        />
      )}
    </div>
  );
};

export default StudioCatalogBuilder;
