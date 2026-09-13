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
  GitBranch, 
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
  Settings,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  Eye,
  EyeOff,
  Globe,
  FileText,
  Check,
  X,
  HelpCircle,
  Link as LinkIcon,
  HelpCircle as HelpIcon,
  Tag,
  Share2,
  QrCode
} from 'lucide-react';
import { studioApi, StudioProject, StudioSection, StudioVersion } from '../../api/studioApi';
import { vaultApi, VaultAsset } from '../../api/vaultApi';
import { StudioPreviewModal } from '../../components/studio/StudioPreviewModal';
import { StudioPublishModal } from '../../components/studio/StudioPublishModal';

export const StudioCatalogBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<StudioProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Unsaved changes'>('Saved');

  // Top Bar Controls
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [projectTitle, setProjectTitle] = useState('Industrial Compressor Showcase');

  // Left & Right Panels
  const [leftTab, setLeftTab] = useState<'widgets' | 'hierarchy'>('widgets');
  const [rightTab, setRightTab] = useState<'content' | 'style' | 'layout' | 'events'>('content');
  const [widgetSearch, setWidgetSearch] = useState('');
  const [openCategory, setOpenCategory] = useState<string>('basic');

  // Sections & Active Component Selection
  const [sections, setSections] = useState<StudioSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('sec-hero');

  // Inspector Form State for Selected Section
  const [inspectTitle, setInspectTitle] = useState('');
  const [inspectSubtitle, setInspectSubtitle] = useState('');
  const [inspectBgColor1, setInspectBgColor1] = useState('#F8FAFC');
  const [inspectBgColor2, setInspectBgColor2] = useState('#E2E8F0');
  const [paddingTop, setPaddingTop] = useState(40);
  const [paddingRight, setPaddingRight] = useState(40);
  const [paddingBottom, setPaddingBottom] = useState(40);
  const [paddingLeft, setPaddingLeft] = useState(40);
  const [dataBinding, setDataBinding] = useState('Product.Name');
  const [clickEvent, setClickEvent] = useState('Open Modal');
  const [boundVaultAssetId, setBoundVaultAssetId] = useState<string>('');

  // Undo / Redo Stack
  const [history, setHistory] = useState<StudioSection[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Modals & Drawers
  const [showPreview, setShowPreview] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showVaultPicker, setShowVaultPicker] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [showExportImportModal, setShowExportImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [vaultAssets, setVaultAssets] = useState<VaultAsset[]>([]);
  const [vaultSearch, setVaultSearch] = useState('');
  const [versionsList, setVersionsList] = useState<StudioVersion[]>([]);

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
          id: projectId,
          name: 'Industrial Compressor Showcase',
          description: 'High performance industrial compressor visual catalog presentation',
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
                id: 'sec-hero',
                type: 'cover',
                title: 'Industrial Compressor Series',
                subtitle: 'High performance. Maximum reliability. Built for modern industry.',
                items: []
              },
              {
                id: 'sec-features',
                type: 'intro',
                title: 'Key Features & Technological Excellence',
                subtitle: 'Continuous high-efficiency compressed air output with real-time telemetry.',
                items: []
              },
              {
                id: 'sec-3d',
                type: 'interactive_3d',
                title: 'Interactive 3D Equipment Inspection',
                subtitle: 'Rotate, zoom, and explode assembly components in real-time spatial 3D.',
                items: []
              }
            ]
          }
        };
      }
      setProject(proj);
      setProjectTitle(proj.name);
      const initialSections = proj.catalog_data?.sections || [];
      setSections(initialSections);
      setHistory([initialSections]);
      setHistoryIndex(0);

      if (initialSections.length > 0) {
        selectSection(initialSections[0]);
      }

      // Pre-load Vault Assets & Versions
      const assets = await studioApi.fetchVaultAssets();
      setVaultAssets(assets);
      const vers = studioApi.getVersions(proj.id);
      setVersionsList(vers);
    } catch (err) {
      console.error('Failed to load catalog builder data:', err);
    } finally {
      setLoading(false);
    }
  };

  const pushHistory = (newSections: StudioSection[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    setHistory([...nextHistory, newSections]);
    setHistoryIndex(nextHistory.length);
    setSaveStatus('Unsaved changes');
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setSections(history[newIdx]);
      setSaveStatus('Unsaved changes');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setSections(history[newIdx]);
      setSaveStatus('Unsaved changes');
    }
  };

  const selectSection = (sec: StudioSection) => {
    setSelectedSectionId(sec.id);
    setInspectTitle(sec.title || '');
    setInspectSubtitle(sec.subtitle || '');
    setInspectBgColor1(sec.background_color || '#F8FAFC');
  };

  const handleUpdateSectionTitle = (title: string) => {
    setInspectTitle(title);
    const updated = sections.map(s => s.id === selectedSectionId ? { ...s, title } : s);
    setSections(updated);
    pushHistory(updated);
  };

  const handleUpdateSectionSubtitle = (subtitle: string) => {
    setInspectSubtitle(subtitle);
    const updated = sections.map(s => s.id === selectedSectionId ? { ...s, subtitle } : s);
    setSections(updated);
    pushHistory(updated);
  };

  const handleAddWidget = (type: StudioSection['type'], title: string, subtitle: string) => {
    const newSec: StudioSection = {
      id: `sec-${Date.now()}`,
      type,
      title,
      subtitle,
      items: []
    };
    const updated = [...sections, newSec];
    setSections(updated);
    pushHistory(updated);
    selectSection(newSec);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const copy = [...sections];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setSections(copy);
    pushHistory(copy);
  };

  const handleDuplicateSection = (sec: StudioSection) => {
    const dup: StudioSection = {
      ...JSON.parse(JSON.stringify(sec)),
      id: `sec-${Date.now()}`,
      title: `${sec.title} (Copy)`
    };
    const updated = [...sections, dup];
    setSections(updated);
    pushHistory(updated);
    selectSection(dup);
  };

  const handleDeleteSection = (idToDelete: string) => {
    const updated = sections.filter(s => s.id !== idToDelete);
    setSections(updated);
    pushHistory(updated);
    if (selectedSectionId === idToDelete && updated.length > 0) {
      selectSection(updated[0]);
    }
  };

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    setSaveStatus('Saving...');
    try {
      const updatedData = {
        ...project.catalog_data,
        title: projectTitle,
        sections
      };
      const updated = await studioApi.updateProject(project.id, {
        name: projectTitle,
        catalog_data: updatedData,
      });
      setProject(updated);
      setSaveStatus('Saved');
    } catch (err) {
      console.error('Failed to save project:', err);
      setSaveStatus('Unsaved changes');
    } finally {
      setSaving(false);
    }
  };

  const handleExportJson = () => {
    if (!project) return;
    const jsonStr = studioApi.exportProjectJson({
      ...project,
      name: projectTitle,
      catalog_data: { ...project.catalog_data, sections }
    });
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.toLowerCase().replace(/\s+/g, '_')}.omni.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async () => {
    if (!importJsonText.trim()) return;
    try {
      const importedProj = await studioApi.importProjectJson(importJsonText);
      setProject(importedProj);
      setProjectTitle(importedProj.name);
      setSections(importedProj.catalog_data?.sections || []);
      setShowExportImportModal(false);
      setImportJsonText('');
      setSaveStatus('Saved');
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    }
  };

  const handleBindVaultAsset = (asset: VaultAsset) => {
    setBoundVaultAssetId(asset.id);
    const updated = sections.map(s => {
      if (s.id === selectedSectionId) {
        return {
          ...s,
          items: [
            ...(s.items || []),
            {
              id: asset.id,
              name: asset.name,
              category: asset.category,
              type: asset.type,
              public_url: asset.public_url,
              specs: asset.specs
            }
          ]
        };
      }
      return s;
    });
    setSections(updated);
    pushHistory(updated);
    setShowVaultPicker(false);
  };

  if (loading || !project) {
    return (
      <div className="h-screen w-screen bg-[#F8FAFC] text-slate-900 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Initializing OmniStudio Builder Workbench...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F1F5F9] text-slate-900 overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. TOP TOOLBAR (Minimal, Professional, Clean Light Theme) */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-30 shadow-2xs">
        {/* Left: Logo, Title & Autosave Status */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/omni-studio')}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition flex items-center gap-2"
            title="Return to OmniStudio Projects"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-extrabold text-slate-900 tracking-wide">OMNI STUDIO</span>
            <span className="text-slate-300">/</span>
            
            {isEditingTitle ? (
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                className="px-2 py-0.5 text-xs font-bold bg-slate-100 border border-indigo-500 rounded text-slate-900 outline-none"
                autoFocus
              />
            ) : (
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                {projectTitle}
                <button onClick={() => setIsEditingTitle(true)} className="text-slate-400 hover:text-indigo-600">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full text-[10px] font-semibold text-slate-500">
            <span className={`w-2 h-2 rounded-full ${saveStatus === 'Saved' ? 'bg-emerald-500' : saveStatus === 'Saving...' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>{saveStatus}</span>
          </div>
        </div>

        {/* Center Controls: Undo/Redo, Responsive View Selector, Zoom, Schema Import/Export */}
        <div className="flex items-center gap-3">
          {/* Undo / Redo */}
          <div className="flex items-center gap-1 text-slate-400 border-r border-slate-200 pr-3">
            <button 
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 hover:text-slate-700 rounded-md hover:bg-slate-100 disabled:opacity-30 transition" 
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button 
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 hover:text-slate-700 rounded-md hover:bg-slate-100 disabled:opacity-30 transition" 
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Responsive Viewport Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                device === 'desktop' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop
            </button>

            <button
              onClick={() => setDevice('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                device === 'tablet' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              Tablet
            </button>

            <button
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition ${
                device === 'mobile' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile
            </button>
          </div>

          {/* Canvas Zoom Selector */}
          <select
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold text-xs focus:outline-none"
          >
            <option value={50}>50%</option>
            <option value={75}>75%</option>
            <option value={100}>100%</option>
            <option value={125}>125%</option>
            <option value={150}>150%</option>
          </select>

          {/* Import / Export JSON Schema */}
          <button
            onClick={() => setShowExportImportModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            title="Import or Export .omni.json schema"
          >
            <Download className="w-3.5 h-3.5" />
            Schema
          </button>
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowVaultPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
          >
            <Database className="w-3.5 h-3.5" />
            + Vault Asset
          </button>

          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 rounded-xl transition"
          >
            <Play className="w-3.5 h-3.5 fill-indigo-600" />
            Preview
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={() => setShowPublish(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            Publish
          </button>

          <button
            onClick={() => setShowVersionsModal(true)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="Version History"
          >
            <GitBranch className="w-4 h-4" />
          </button>

          <div className="h-5 w-[1px] bg-slate-200" />

          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
            SV
          </div>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN WORKBENCH */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Organized Widget Library & Component Hierarchy */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
          {/* Panel Header Tabs */}
          <div className="flex border-b border-slate-200 text-xs font-bold">
            <button
              onClick={() => setLeftTab('widgets')}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                leftTab === 'widgets'
                  ? 'border-indigo-600 text-indigo-600 bg-slate-50'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Widgets
            </button>
            <button
              onClick={() => setLeftTab('hierarchy')}
              className={`flex-1 py-3 text-center border-b-2 transition ${
                leftTab === 'hierarchy'
                  ? 'border-indigo-600 text-indigo-600 bg-slate-50'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Hierarchy
            </button>
          </div>

          {leftTab === 'widgets' ? (
            <>
              {/* Widget Search */}
              <div className="p-3 border-b border-slate-200">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search widgets..."
                    value={widgetSearch}
                    onChange={(e) => setWidgetSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Categorized Widget Accordion List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                {/* 1. Basic Widgets Group */}
                <div className="space-y-2">
                  <div 
                    onClick={() => setOpenCategory(openCategory === 'basic' ? '' : 'basic')}
                    className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <span>BASIC</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openCategory === 'basic' ? 'rotate-180' : ''}`} />
                  </div>

                  {openCategory === 'basic' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div 
                        onClick={() => handleAddWidget('cover', 'Heading Banner', 'Custom headline content')}
                        className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 rounded-xl transition cursor-pointer flex items-center gap-2"
                      >
                        <div className="p-1.5 bg-red-100 text-red-500 rounded-lg">
                          <Type className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-[11px]">Text</div>
                          <div className="text-[9px] text-slate-400">Heading & text</div>
                        </div>
                      </div>

                      <div 
                        onClick={() => handleAddWidget('contact_cta', 'Call to Action Button', 'Interactive user click trigger')}
                        className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 rounded-xl transition cursor-pointer flex items-center gap-2"
                      >
                        <div className="p-1.5 bg-orange-100 text-orange-500 rounded-lg">
                          <MousePointer className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-[11px]">Button</div>
                          <div className="text-[9px] text-slate-400">Interactive button</div>
                        </div>
                      </div>

                      <div 
                        onClick={() => handleAddWidget('intro', 'Product Image Section', 'Product imagery visual block')}
                        className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 rounded-xl transition cursor-pointer flex items-center gap-2"
                      >
                        <div className="p-1.5 bg-emerald-100 text-emerald-500 rounded-lg">
                          <ImageIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-[11px]">Image</div>
                          <div className="text-[9px] text-slate-400">Media photo</div>
                        </div>
                      </div>

                      <div 
                        onClick={() => handleAddWidget('intro', 'Video Player Block', 'HTML5 & YouTube video streaming')}
                        className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 rounded-xl transition cursor-pointer flex items-center gap-2"
                      >
                        <div className="p-1.5 bg-rose-100 text-rose-500 rounded-lg">
                          <Video className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-[11px]">Video Player</div>
                          <div className="text-[9px] text-slate-400">HTML5 video</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Other Categories Accordion */}
                {[
                  { id: 'layout', name: 'LAYOUT', icon: LayoutGrid, type: 'intro' as const },
                  { id: '3d', name: '3D & PRODUCT', icon: Box, type: 'interactive_3d' as const },
                  { id: 'media', name: 'MEDIA', icon: ImageIcon, type: 'intro' as const },
                  { id: 'content', name: 'CONTENT', icon: FileText, type: 'tech_specs' as const },
                  { id: 'interaction', name: 'INTERACTION', icon: Zap, type: 'intro' as const },
                  { id: 'forms', name: 'FORMS', icon: Edit3, type: 'contact_cta' as const },
                  { id: 'data', name: 'DATA & INTEGRATIONS', icon: Database, type: 'product_grid' as const },
                  { id: 'advanced', name: 'ADVANCED', icon: Sliders, type: 'cover' as const },
                ].map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <div 
                      onClick={() => handleAddWidget(cat.type, `${cat.name} Block`, 'Configured visual catalog component')}
                      className="p-2.5 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-400 rounded-xl flex items-center justify-between cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2.5 font-bold text-slate-700 text-xs">
                        <cat.icon className="w-4 h-4 text-indigo-600" />
                        <span>{cat.name}</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Hierarchy Component Tree Tab */
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              <div className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2">
                Page Sections Hierarchy ({sections.length})
              </div>

              {sections.map((sec, index) => (
                <div 
                  key={sec.id}
                  onClick={() => selectSection(sec)}
                  className={`p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                    selectedSectionId === sec.id
                      ? 'bg-indigo-50 border-indigo-500 font-bold text-indigo-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">{sec.title || 'Untitled Section'}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMoveSection(index, 'up'); }}
                      disabled={index === 0}
                      className="p-1 hover:text-indigo-600 disabled:opacity-20"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMoveSection(index, 'down'); }}
                      disabled={index === sections.length - 1}
                      className="p-1 hover:text-indigo-600 disabled:opacity-20"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDuplicateSection(sec); }}
                      className="p-1 hover:text-indigo-600"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSection(sec.id); }}
                      className="p-1 hover:text-rose-600 text-slate-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* CENTER MAIN CANVAS ENGINE */}
        <div className="flex-1 bg-[#F1F5F9] overflow-y-auto p-6 flex justify-center items-start relative">
          <div 
            className={`transition-all duration-300 ${
              device === 'desktop' ? 'w-full max-w-5xl' : device === 'tablet' ? 'w-[768px]' : 'w-[375px]'
            }`}
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            {/* Canvas Outer Viewport Card */}
            <div className="bg-white rounded-2xl border-2 border-indigo-500/80 shadow-xl overflow-hidden relative">
              {/* Empty Project State */}
              {sections.length === 0 ? (
                <div className="p-12 text-center space-y-6">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Start building your experience</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Add components from the left widget library or click a quick action below.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <button 
                      onClick={() => handleAddWidget('cover', 'Hero Section', 'Engineered product presentation')}
                      className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-700"
                    >
                      + Add Hero Section
                    </button>
                    <button 
                      onClick={() => handleAddWidget('interactive_3d', '3D Equipment Viewer', 'Interactive spatial assembly inspection')}
                      className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 font-bold text-xs rounded-xl hover:bg-indigo-50"
                    >
                      + Add 3D Model
                    </button>
                    <button 
                      onClick={() => handleAddWidget('tech_specs', 'Specification Table', 'Detailed technical performance metadata')}
                      className="px-4 py-2 bg-white text-slate-700 border border-slate-200 font-bold text-xs rounded-xl hover:bg-slate-50"
                    >
                      + Add Specifications
                    </button>
                  </div>
                </div>
              ) : (
                /* Rendered Dynamic Sections from Project JSON Schema */
                <div className="divide-y divide-slate-100">
                  {sections.map((sec, idx) => {
                    const isSelected = selectedSectionId === sec.id;
                    return (
                      <div 
                        key={sec.id}
                        onClick={() => selectSection(sec)}
                        className={`relative transition p-8 cursor-pointer ${
                          isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50/10' : 'hover:bg-slate-50/50'
                        }`}
                        style={{
                          backgroundColor: sec.background_color || 'transparent',
                          paddingTop: `${paddingTop}px`,
                          paddingRight: `${paddingRight}px`,
                          paddingBottom: `${paddingBottom}px`,
                          paddingLeft: `${paddingLeft}px`
                        }}
                      >
                        {/* Selected Handle Pill Badge Overlay */}
                        {isSelected && (
                          <div className="absolute top-2 left-2 z-20 flex items-center gap-2 px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-md shadow-md">
                            <Layers className="w-3 h-3" />
                            <span>{sec.title || 'Section'}</span>
                            <span className="text-indigo-200">({sec.type})</span>
                          </div>
                        )}

                        {/* Section Content Rendering */}
                        {sec.type === 'cover' && (
                          <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                              <span className="font-extrabold text-indigo-600 text-lg">I3DION</span>
                              <div className="flex gap-4 text-xs font-semibold text-slate-600">
                                <span>Products</span>
                                <span>Solutions</span>
                                <span>Support</span>
                              </div>
                              <button className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs">
                                Get a Quote
                              </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-4">
                              <div className="space-y-4">
                                <span className="text-[10px] font-extrabold tracking-widest text-indigo-600 uppercase">
                                  ENGINEERED FOR A CLEANER TOMORROW
                                </span>
                                <h1 className="text-3xl font-black text-slate-900 leading-tight">
                                  {sec.title}
                                </h1>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {sec.subtitle}
                                </p>

                                <div className="flex items-center gap-3 pt-2">
                                  <button className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md">
                                    Explore in 3D
                                  </button>
                                  <button className="px-5 py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl">
                                    View Specifications
                                  </button>
                                </div>
                              </div>

                              <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center relative overflow-hidden group">
                                <img 
                                  src="/images/industrial_compressor_3d.jpg" 
                                  alt="3D Compressor Render" 
                                  className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-white/90 rounded-full border text-[10px] font-bold text-slate-600 shadow-xs flex items-center gap-1">
                                  <MousePointer className="w-3 h-3 text-indigo-600" />
                                  <span>Drag to rotate</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {sec.type === 'interactive_3d' && (
                          <div className="space-y-4 text-center">
                            <h3 className="text-xl font-bold text-slate-900">{sec.title}</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">{sec.subtitle}</p>

                            <div className="h-72 bg-gradient-to-tr from-slate-50 to-indigo-50/50 rounded-2xl border border-slate-200 flex items-center justify-center relative overflow-hidden shadow-inner">
                              <img 
                                src="/images/industrial_compressor_3d.jpg" 
                                alt="3D Spatial Model Viewport" 
                                className="h-full w-full object-contain p-3"
                              />

                              <div className="absolute right-3 top-3 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 flex flex-col gap-1 text-slate-500 shadow-md">
                                <button className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg" title="3D Orbit">
                                  <Box className="w-4 h-4" />
                                </button>
                                <button className="p-1.5 hover:text-indigo-600 rounded-lg" title="Exploded View">
                                  <Layers className="w-4 h-4" />
                                </button>
                                <button className="p-1.5 hover:text-indigo-600 rounded-lg" title="AR View">
                                  <QrCode className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {(sec.type === 'intro' || sec.type === 'product_grid' || sec.type === 'tech_specs' || sec.type === 'contact_cta') && (
                          <div className="space-y-3">
                            <h3 className="text-lg font-bold text-slate-900">{sec.title}</h3>
                            <p className="text-xs text-slate-500">{sec.subtitle}</p>

                            {sec.type === 'tech_specs' && (
                              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-xs">
                                <table className="w-full text-left">
                                  <thead className="bg-slate-50 text-slate-500 font-bold border-b">
                                    <tr>
                                      <th className="p-3">Specification Parameter</th>
                                      <th className="p-3">Performance Value</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 font-mono">
                                    <tr><td className="p-3 font-sans font-medium text-slate-700">Operating Pressure</td><td className="p-3 text-slate-900">12.5 Bar</td></tr>
                                    <tr><td className="p-3 font-sans font-medium text-slate-700">Motor Power Output</td><td className="p-3 text-slate-900">75 kW (100 HP)</td></tr>
                                    <tr><td className="p-3 font-sans font-medium text-slate-700">Volumetric Air Flow</td><td className="p-3 text-slate-900">14.2 m³/min</td></tr>
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {sec.type === 'contact_cta' && (
                              <div className="p-6 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-center space-y-3">
                                <button className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md">
                                  Submit Technical Enquiry
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Properties Inspector */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 text-xs">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 font-bold">
            {(['content', 'style', 'layout', 'events'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex-1 py-3 text-center border-b-2 capitalize transition ${
                  rightTab === tab
                    ? 'border-indigo-600 text-indigo-600 bg-slate-50'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {rightTab === 'content' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Component Title
                  </label>
                  <input
                    type="text"
                    value={inspectTitle}
                    onChange={(e) => handleUpdateSectionTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Subtitle / Description
                  </label>
                  <textarea
                    rows={3}
                    value={inspectSubtitle}
                    onChange={(e) => handleUpdateSectionSubtitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Spatial Vault Asset Reference
                  </label>
                  <button
                    onClick={() => setShowVaultPicker(true)}
                    className="w-full p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 rounded-xl text-left transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Database className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-700 truncate">
                        {boundVaultAssetId ? `Asset: ${boundVaultAssetId}` : 'Select Vault 3D Asset...'}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}

            {rightTab === 'style' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Background Type
                  </label>
                  <select className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900">
                    <option value="gradient">Gradient</option>
                    <option value="solid">Solid Color</option>
                    <option value="image">Image Background</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 font-medium text-xs">Color 1</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={inspectBgColor1}
                      onChange={(e) => setInspectBgColor1(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-300"
                    />
                    <span className="font-mono text-slate-600 uppercase">{inspectBgColor1}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 font-medium text-xs">Color 2</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={inspectBgColor2}
                      onChange={(e) => setInspectBgColor2(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-300"
                    />
                    <span className="font-mono text-slate-600 uppercase">{inspectBgColor2}</span>
                  </div>
                </div>
              </div>
            )}

            {rightTab === 'layout' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Padding (px)
                  </label>
                  <div className="grid grid-cols-4 gap-2 text-center font-mono">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <input
                        type="number"
                        value={paddingTop}
                        onChange={(e) => setPaddingTop(Number(e.target.value))}
                        className="w-full text-center bg-transparent font-bold text-slate-900 outline-none"
                      />
                      <div className="text-[9px] text-slate-400 font-sans">Top</div>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <input
                        type="number"
                        value={paddingRight}
                        onChange={(e) => setPaddingRight(Number(e.target.value))}
                        className="w-full text-center bg-transparent font-bold text-slate-900 outline-none"
                      />
                      <div className="text-[9px] text-slate-400 font-sans">Right</div>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <input
                        type="number"
                        value={paddingBottom}
                        onChange={(e) => setPaddingBottom(Number(e.target.value))}
                        className="w-full text-center bg-transparent font-bold text-slate-900 outline-none"
                      />
                      <div className="text-[9px] text-slate-400 font-sans">Bottom</div>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <input
                        type="number"
                        value={paddingLeft}
                        onChange={(e) => setPaddingLeft(Number(e.target.value))}
                        className="w-full text-center bg-transparent font-bold text-slate-900 outline-none"
                      />
                      <div className="text-[9px] text-slate-400 font-sans">Left</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {rightTab === 'events' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Data Binding Schema
                  </label>
                  <select 
                    value={dataBinding}
                    onChange={(e) => setDataBinding(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                  >
                    <option value="Product.Name">Product.Name</option>
                    <option value="Product.Description">Product.Description</option>
                    <option value="Product.PrimaryImage">Product.PrimaryImage</option>
                    <option value="Vault.Asset.ModelFile">Vault.Asset.ModelFile</option>
                    <option value="Organization.Logo">Organization.Logo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    On-Click Action Trigger
                  </label>
                  <select 
                    value={clickEvent}
                    onChange={(e) => setClickEvent(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                  >
                    <option value="Open Modal">Open Modal</option>
                    <option value="Open URL">Open URL</option>
                    <option value="Launch AR">Launch AR</option>
                    <option value="Submit Enquiry">Submit Enquiry</option>
                    <option value="Generate QR">Generate QR Code</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* MODAL 1: Spatial Vault Asset Picker */}
      {showVaultPicker && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                Select Spatial Vault Asset
              </h3>
              <button onClick={() => setShowVaultPicker(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search Vault 3D assets..."
              value={vaultSearch}
              onChange={(e) => setVaultSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50"
            />

            <div className="max-h-64 overflow-y-auto space-y-2">
              {vaultAssets
                .filter(a => a.name.toLowerCase().includes(vaultSearch.toLowerCase()))
                .map(asset => (
                  <div 
                    key={asset.id}
                    onClick={() => handleBindVaultAsset(asset)}
                    className="p-3 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 cursor-pointer flex items-center justify-between transition text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <Box className="w-5 h-5 text-indigo-600" />
                      <div>
                        <div className="font-bold text-slate-900">{asset.name}</div>
                        <div className="text-[10px] text-slate-400">{asset.category} • {asset.type}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-md">
                      Select
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Export / Import JSON Schema */}
      {showExportImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-600" />
                Project Schema (.omni.json)
              </h3>
              <button onClick={() => setShowExportImportModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleExportJson}
                className="flex-1 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export .omni.json
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <label className="block text-xs font-bold text-slate-700">Import .omni.json Definition</label>
              <textarea
                rows={5}
                placeholder="Paste project schema JSON here..."
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full p-3 font-mono text-[11px] bg-slate-50 border rounded-xl"
              />
              <button
                onClick={handleImportJson}
                disabled={!importJsonText.trim()}
                className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-xl disabled:opacity-40"
              >
                Import & Apply Schema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Versions History */}
      {showVersionsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-600" />
                Version History
              </h3>
              <button onClick={() => setShowVersionsModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {versionsList.map(v => (
                <div key={v.id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">Version {v.version_number}</div>
                    <div className="text-[10px] text-slate-500">{v.change_summary}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{new Date(v.published_at).toLocaleString()}</div>
                  </div>
                  <button 
                    onClick={() => { setSections(v.catalog_data?.sections || []); setShowVersionsModal(false); }}
                    className="px-3 py-1 bg-indigo-600 text-white font-bold text-[10px] rounded-lg"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Live Responsive Preview */}
      {showPreview && (
        <StudioPreviewModal
          project={{
            ...project,
            name: projectTitle,
            catalog_data: { ...project.catalog_data, sections }
          }}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* MODAL 5: Publishing & QR Generation */}
      {showPublish && (
        <StudioPublishModal
          project={{
            ...project,
            name: projectTitle,
            catalog_data: { ...project.catalog_data, sections }
          }}
          onClose={() => setShowPublish(false)}
          onPublished={(updated) => {
            setProject(updated);
            setShowPublish(false);
          }}
        />
      )}
    </div>
  );
};

export default StudioCatalogBuilder;
