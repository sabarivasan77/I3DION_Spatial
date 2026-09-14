import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Play,
  Share2,
  Save,
  RotateCcw,
  RotateCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Grid,
  Layers,
  Sparkles,
  Box,
  FileText,
  Package,
  Cpu,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  CheckCircle2,
  Database,
  Link2,
  Sliders,
  Settings,
  HelpCircle,
  X,
  BookOpen,
  AlertTriangle,
  Download,
  Upload,
  Printer,
  Code
} from 'lucide-react';
import {
  studioApi,
  StudioProject,
  StudioLowCodeComponent,
  StudioLowCodeScreen
} from '../../api/studioApi';
import { vaultApi, VaultAsset, VaultProduct } from '../../api/vaultApi';
import { StudioScreenPanel } from '../../components/studio/StudioScreenPanel';
import { EBookReaderModal } from '../../components/studio/ebookEngine';
import { validatorEngine, ValidationError } from '../../components/studio/validatorEngine';
import { printCatalogEngine } from '../../components/studio/printCatalogEngine';

// Comprehensive Component Palette Definitions (9 Categories)
const COMPONENT_PALETTE = [
  // BASIC
  { category: 'BASIC', type: 'Container', name: 'Container', icon: Box, defaultW: 400, defaultH: 220 },
  { category: 'BASIC', type: 'Section', name: 'Section Container', icon: Layers, defaultW: 600, defaultH: 180 },
  { category: 'BASIC', type: 'Text', name: 'Text Block', icon: FileText, defaultW: 220, defaultH: 40 },
  { category: 'BASIC', type: 'Heading', name: 'Heading', icon: FileText, defaultW: 280, defaultH: 48 },
  { category: 'BASIC', type: 'RichText', name: 'Rich Text Paragraph', icon: FileText, defaultW: 320, defaultH: 90 },
  { category: 'BASIC', type: 'Image', name: 'Image Component', icon: Box, defaultW: 300, defaultH: 200 },
  { category: 'BASIC', type: 'Icon', name: 'Vector Icon', icon: Sparkles, defaultW: 40, defaultH: 40 },
  { category: 'BASIC', type: 'Divider', name: 'Horizontal Divider', icon: Grid, defaultW: 350, defaultH: 20 },
  { category: 'BASIC', type: 'Spacer', name: 'Layout Spacer', icon: Layers, defaultW: 100, defaultH: 30 },

  // INPUT
  { category: 'INPUT', type: 'Button', name: 'Action Button', icon: Plus, defaultW: 150, defaultH: 44 },
  { category: 'INPUT', type: 'TextInput', name: 'Text Field Input', icon: FileText, defaultW: 260, defaultH: 42 },
  { category: 'INPUT', type: 'NumberInput', name: 'Number Input', icon: FileText, defaultW: 180, defaultH: 42 },
  { category: 'INPUT', type: 'EmailInput', name: 'Email Address Input', icon: FileText, defaultW: 260, defaultH: 42 },
  { category: 'INPUT', type: 'Search', name: 'Search Input', icon: Sliders, defaultW: 280, defaultH: 42 },
  { category: 'INPUT', type: 'Dropdown', name: 'Dropdown Select', icon: Sliders, defaultW: 240, defaultH: 42 },
  { category: 'INPUT', type: 'MultiSelect', name: 'Multi-Select Field', icon: Sliders, defaultW: 260, defaultH: 48 },
  { category: 'INPUT', type: 'Checkbox', name: 'Checkbox Option', icon: CheckCircle2, defaultW: 160, defaultH: 32 },
  { category: 'INPUT', type: 'Radio', name: 'Radio Choice', icon: CheckCircle2, defaultW: 160, defaultH: 32 },
  { category: 'INPUT', type: 'Toggle', name: 'Switch Toggle', icon: Sliders, defaultW: 120, defaultH: 36 },
  { category: 'INPUT', type: 'Slider', name: 'Range Slider', icon: Sliders, defaultW: 240, defaultH: 40 },
  { category: 'INPUT', type: 'DatePicker', name: 'Date Picker', icon: FileText, defaultW: 220, defaultH: 42 },
  { category: 'INPUT', type: 'FileUpload', name: 'File Upload Dragzone', icon: Box, defaultW: 300, defaultH: 100 },

  // DISPLAY
  { category: 'DISPLAY', type: 'Card', name: 'Content Card', icon: Package, defaultW: 320, defaultH: 220 },
  { category: 'DISPLAY', type: 'List', name: 'Item List', icon: Layers, defaultW: 350, defaultH: 180 },
  { category: 'DISPLAY', type: 'Table', name: 'Data Table', icon: Grid, defaultW: 480, defaultH: 240 },
  { category: 'DISPLAY', type: 'Badge', name: 'Status Badge', icon: CheckCircle2, defaultW: 100, defaultH: 30 },
  { category: 'DISPLAY', type: 'Status', name: 'Indicator Dot', icon: CheckCircle2, defaultW: 90, defaultH: 26 },
  { category: 'DISPLAY', type: 'Tabs', name: 'Tabbed Panel', icon: Layers, defaultW: 400, defaultH: 200 },
  { category: 'DISPLAY', type: 'Accordion', name: 'Accordion Collapse', icon: Layers, defaultW: 360, defaultH: 180 },
  { category: 'DISPLAY', type: 'Modal', name: 'Dialog Modal Window', icon: Box, defaultW: 450, defaultH: 280 },
  { category: 'DISPLAY', type: 'Drawer', name: 'Side Drawer Panel', icon: Box, defaultW: 320, defaultH: 400 },
  { category: 'DISPLAY', type: 'Tooltip', name: 'Hover Tooltip', icon: HelpCircle, defaultW: 120, defaultH: 32 },

  // NAVIGATION
  { category: 'NAVIGATION', type: 'Navbar', name: 'Top Navigation Bar', icon: Monitor, defaultW: 650, defaultH: 56 },
  { category: 'NAVIGATION', type: 'Sidebar', name: 'Side Nav Menu', icon: Layers, defaultW: 220, defaultH: 400 },
  { category: 'NAVIGATION', type: 'Breadcrumb', name: 'Breadcrumb Links', icon: Link2, defaultW: 280, defaultH: 32 },
  { category: 'NAVIGATION', type: 'Pagination', name: 'Page Numbers Bar', icon: Sliders, defaultW: 300, defaultH: 40 },
  { category: 'NAVIGATION', type: 'Link', name: 'Text Hyperlink', icon: Link2, defaultW: 120, defaultH: 30 },
  { category: 'NAVIGATION', type: 'NavButton', name: 'Nav Action Button', icon: Plus, defaultW: 140, defaultH: 40 },

  // MEDIA
  { category: 'MEDIA', type: 'ImageGallery', name: 'Image Gallery Grid', icon: Box, defaultW: 420, defaultH: 260 },
  { category: 'MEDIA', type: 'Video', name: 'Video Player', icon: Play, defaultW: 400, defaultH: 240 },
  { category: 'MEDIA', type: 'Audio', name: 'Audio Player Bar', icon: Sliders, defaultW: 300, defaultH: 48 },
  { category: 'MEDIA', type: 'PDFViewer', name: 'PDF Spec Document', icon: FileText, defaultW: 450, defaultH: 350 },

  // PRODUCT
  { category: 'PRODUCT', type: 'ProductCard', name: 'Product Master Card', icon: Package, defaultW: 340, defaultH: 380 },
  { category: 'PRODUCT', type: 'ProductDetails', name: 'Product Spec Overview', icon: FileText, defaultW: 500, defaultH: 320 },
  { category: 'PRODUCT', type: 'SpecTable', name: 'Technical Specs Grid', icon: Grid, defaultW: 450, defaultH: 250 },
  { category: 'PRODUCT', type: 'ProductGallery', name: 'Product Image Carousel', icon: Box, defaultW: 420, defaultH: 300 },
  { category: 'PRODUCT', type: 'ProductComparison', name: 'Product Comparison Matrix', icon: Grid, defaultW: 550, defaultH: 320 },
  { category: 'PRODUCT', type: 'ProductCTA', name: 'Product Inquiry CTA', icon: Plus, defaultW: 360, defaultH: 120 },
  { category: 'PRODUCT', type: 'PriceOffer', name: 'Price & Offer Badge', icon: CheckCircle2, defaultW: 180, defaultH: 60 },
  { category: 'PRODUCT', type: 'EnquiryForm', name: 'Lead Enquiry Form', icon: FileText, defaultW: 380, defaultH: 360 },

  // 3D / AR
  { category: '3D_AR', type: 'Viewer3D', name: '3D Model Viewport (GLB/GLTF)', icon: Box, defaultW: 480, defaultH: 340 },
  { category: '3D_AR', type: 'ModelViewer', name: 'Interactive Model Inspector', icon: Box, defaultW: 460, defaultH: 320 },
  { category: '3D_AR', type: 'Hotspot', name: 'Spatial Hotspot Pin', icon: Sparkles, defaultW: 140, defaultH: 40 },
  { category: '3D_AR', type: 'Annotation', name: '3D Annotation Callout', icon: FileText, defaultW: 180, defaultH: 50 },
  { category: '3D_AR', type: 'ExplodedView', name: 'Assembly Explode Slider', icon: Sliders, defaultW: 240, defaultH: 50 },
  { category: '3D_AR', type: 'AnimController', name: 'Animation Playback Controller', icon: Play, defaultW: 260, defaultH: 50 },
  { category: '3D_AR', type: 'Measurement', name: 'Spatial Dimension Ruler', icon: Grid, defaultW: 180, defaultH: 40 },
  { category: '3D_AR', type: 'CameraController', name: 'Camera Preset Orbit Controller', icon: Monitor, defaultW: 220, defaultH: 48 },
  { category: '3D_AR', type: 'ARButton', name: 'WebXR / AR Launch Button', icon: Cpu, defaultW: 180, defaultH: 48 },
  { category: '3D_AR', type: 'ModelInfoPanel', name: 'Model Metadata Panel', icon: Database, defaultW: 300, defaultH: 180 },

  // DATA
  { category: 'DATA', type: 'DataTable', name: 'Spatial Vault Data Table', icon: Database, defaultW: 560, defaultH: 300 },
  { category: 'DATA', type: 'DataList', name: 'Vault Record Feed', icon: Database, defaultW: 400, defaultH: 260 },
  { category: 'DATA', type: 'DataCard', name: 'Dynamic Record Card', icon: Package, defaultW: 320, defaultH: 200 },
  { category: 'DATA', type: 'DataDetail', name: 'Record Detail Panel', icon: FileText, defaultW: 420, defaultH: 300 },
  { category: 'DATA', type: 'DataFilter', name: 'Dataset Filter Control', icon: Sliders, defaultW: 280, defaultH: 50 },
  { category: 'DATA', type: 'DataSearch', name: 'Live Dataset Search Bar', icon: Sliders, defaultW: 300, defaultH: 42 },

  // ADVANCED
  { category: 'ADVANCED', type: 'CustomHTML', name: 'Custom HTML Embed', icon: FileText, defaultW: 360, defaultH: 180 },
  { category: 'ADVANCED', type: 'Embed', name: 'IFrame Web Embed', icon: Monitor, defaultW: 450, defaultH: 260 },
  { category: 'ADVANCED', type: 'DynamicContainer', name: 'Dynamic State Container', icon: Box, defaultW: 400, defaultH: 220 },
  { category: 'ADVANCED', type: 'Repeater', name: 'Data Collection Repeater', icon: Layers, defaultW: 420, defaultH: 280 },
  { category: 'ADVANCED', type: 'ConditionalContainer', name: 'Conditional Visibility Block', icon: Eye, defaultW: 380, defaultH: 180 }
];

export function StudioEditor() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<StudioProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTabLeft, setActiveTabLeft] = useState<'insert' | 'tree' | 'screens'>('insert');
  const [activeTabInspector, setActiveTabInspector] = useState<'layout' | 'content' | 'data' | 'action'>('layout');
  const [projectType, setProjectType] = useState<string>('Standard Application');

  // Low-Code State
  const [screens, setScreens] = useState<StudioLowCodeScreen[]>([
    { id: 'screen-1', name: 'Main Screen', background_color: '#FFFFFF', padding: 24, is_initial: true }
  ]);
  const [activeScreenId, setActiveScreenId] = useState('screen-1');
  const [components, setComponents] = useState<StudioLowCodeComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [history, setHistory] = useState<StudioLowCodeComponent[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Modals & Panels State
  const [showEBookReader, setShowEBookReader] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[] | null>(null);

  // Vault Sources
  const [vaultProducts, setVaultProducts] = useState<VaultProduct[]>([]);
  const [vaultAssets, setVaultAssets] = useState<VaultAsset[]>([]);

  // Canvas Drag / Resize state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId) loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setIsLoading(true);
    try {
      const [projData, prods, assets] = await Promise.all([
        studioApi.getProject(projectId!),
        vaultApi.getProducts().catch(() => []),
        vaultApi.getAssets().catch(() => [])
      ]);

      if (projData) {
        setProject(projData);
        setVaultProducts(prods);
        setVaultAssets(assets);

        if (projData.project_type) {
          setProjectType(projData.project_type);
        }

        if (projData.project_document?.components) {
          setComponents(projData.project_document.components);
          if (projData.project_document.screens?.length > 0) {
            setScreens(projData.project_document.screens);
            setActiveScreenId(projData.project_document.screens[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load studio project', err);
    } finally {
      setIsLoading(false);
    }
  };

  const pushHistory = (newComps: StudioLowCodeComponent[]) => {
    const updated = history.slice(0, historyIndex + 1);
    setHistory([...updated, newComps]);
    setHistoryIndex(updated.length);
  };

  const handleAddComponent = (type: string) => {
    const def = COMPONENT_PALETTE.find(p => p.type === type);
    if (!def) return;

    const newComp: StudioLowCodeComponent = {
      id: `comp-${Date.now()}`,
      type: def.type,
      name: `${def.name} ${components.length + 1}`,
      category: def.category as any,
      x: 40 + (components.length * 20) % 200,
      y: 40 + (components.length * 20) % 200,
      width: def.defaultW,
      height: def.defaultH,
      parent_id: activeScreenId,
      style: {
        background_color: type === 'Button' ? '#4F46E5' : '#FFFFFF',
        color: type === 'Button' ? '#FFFFFF' : '#1E293B',
        border_radius: 12,
        font_size: 14,
        font_weight: 'bold'
      },
      props: {
        text: type === 'Button' ? 'Click Action' : type === 'Heading' ? 'Industrial Title' : 'Sample content block',
        url: type === 'Viewer3D' ? '/models/model_1.gltf' : ''
      }
    };

    const updated = [...components, newComp];
    setComponents(updated);
    setSelectedComponentId(newComp.id);
    pushHistory(updated);
    saveProjectDocument(updated, screens, projectType);
  };

  const saveProjectDocument = async (
    currentComps = components,
    currentScreens = screens,
    type = projectType
  ) => {
    if (!project) return;
    setIsAutoSaving(true);
    try {
      const doc = {
        screens: currentScreens,
        components: currentComps,
        component_tree: [],
        variables: [],
        logic: [],
        theme: { primary_color: '#4F46E5' },
        settings: {}
      };
      await studioApi.updateProject(project.id, {
        project_type: type,
        project_document: doc
      });
    } catch (err) {
      console.error('Auto-save error', err);
    } finally {
      setTimeout(() => setIsAutoSaving(false), 500);
    }
  };

  // Screen Management Handlers
  const handleAddScreen = (name?: string) => {
    const newScreenName = name || (projectType === 'E-Book' ? `Page ${screens.length + 1}` : `Screen ${screens.length + 1}`);
    const newScreen: StudioLowCodeScreen = {
      id: `screen-${Date.now()}`,
      name: newScreenName,
      background_color: '#FFFFFF',
      padding: 24,
      is_initial: screens.length === 0
    };
    const updatedScreens = [...screens, newScreen];
    setScreens(updatedScreens);
    setActiveScreenId(newScreen.id);
    saveProjectDocument(components, updatedScreens);
  };

  const handleDuplicateScreen = (screenId: string) => {
    const target = screens.find(s => s.id === screenId);
    if (!target) return;
    const dup: StudioLowCodeScreen = {
      ...target,
      id: `screen-${Date.now()}`,
      name: `${target.name} (Copy)`,
      is_initial: false
    };
    const updatedScreens = [...screens, dup];
    setScreens(updatedScreens);
    setActiveScreenId(dup.id);
    saveProjectDocument(components, updatedScreens);
  };

  const handleDeleteScreen = (screenId: string) => {
    if (screens.length <= 1) return;
    const updatedScreens = screens.filter(s => s.id !== screenId);
    setScreens(updatedScreens);
    if (activeScreenId === screenId) {
      setActiveScreenId(updatedScreens[0].id);
    }
    saveProjectDocument(components, updatedScreens);
  };

  const handleRenameScreen = (screenId: string, newName: string) => {
    const updatedScreens = screens.map(s => s.id === screenId ? { ...s, name: newName } : s);
    setScreens(updatedScreens);
    saveProjectDocument(components, updatedScreens);
  };

  const handleSetInitialScreen = (screenId: string) => {
    const updatedScreens = screens.map(s => ({ ...s, is_initial: s.id === screenId }));
    setScreens(updatedScreens);
    saveProjectDocument(components, updatedScreens);
  };

  const handleReorderScreen = (screenId: string, direction: 'up' | 'down') => {
    const idx = screens.findIndex(s => s.id === screenId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= screens.length) return;

    const copy = [...screens];
    const [removed] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, removed);
    setScreens(copy);
    saveProjectDocument(components, copy);
  };

  const handleRunValidation = () => {
    if (!project) return;
    const fullProj: StudioProject = {
      ...project,
      project_type: projectType,
      project_document: {
        screens,
        components,
        theme: { primary_color: '#4F46E5' }
      }
    };
    const errs = validatorEngine.validateProject(fullProj);
    setValidationErrors(errs);
  };

  const selectedComp = components.find(c => c.id === selectedComponentId);

  const handleUpdateSelectedProp = (key: string, val: any) => {
    if (!selectedComp) return;
    const updated = components.map(c => {
      if (c.id === selectedComp.id) {
        return {
          ...c,
          props: { ...(c.props || {}), [key]: val }
        };
      }
      return c;
    });
    setComponents(updated);
    saveProjectDocument(updated);
  };

  const handleUpdateSelectedStyle = (key: string, val: any) => {
    if (!selectedComp) return;
    const updated = components.map(c => {
      if (c.id === selectedComp.id) {
        return {
          ...c,
          style: { ...(c.style || {}), [key]: val }
        };
      }
      return c;
    });
    setComponents(updated);
    saveProjectDocument(updated);
  };

  const handleDeleteSelected = () => {
    if (!selectedComponentId) return;
    const updated = components.filter(c => c.id !== selectedComponentId);
    setComponents(updated);
    setSelectedComponentId(null);
    pushHistory(updated);
    saveProjectDocument(updated);
  };

  const handleDuplicateSelected = () => {
    if (!selectedComp) return;
    const dup: StudioLowCodeComponent = {
      ...selectedComp,
      id: `comp-${Date.now()}`,
      name: `${selectedComp.name} (Copy)`,
      x: selectedComp.x + 20,
      y: selectedComp.y + 20
    };
    const updated = [...components, dup];
    setComponents(updated);
    setSelectedComponentId(dup.id);
    pushHistory(updated);
    saveProjectDocument(updated);
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-bold">Loading OmniStudio Visual Editor...</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 font-sans text-slate-200 select-none overflow-hidden">
      {/* ─── 1. TOP COMMAND TOOLBAR ───────── */}
      <header className="h-14 bg-[#1E293B] border-b border-slate-700/60 px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/omni-studio/projects')}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-extrabold text-xs shadow-sm">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="font-bold text-sm text-white block leading-none">{project?.name || 'Studio Experience'}</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">OmniStudio Phase 2 Authoring Engine</span>
            </div>
          </div>
        </div>

        {/* Center Controls: Project Type & Active Screen */}
        <div className="flex items-center gap-2.5">
          <select
            value={projectType}
            onChange={(e) => {
              const newType = e.target.value;
              setProjectType(newType);
              saveProjectDocument(components, screens, newType);
            }}
            className="h-8 rounded-lg bg-slate-800 border border-indigo-500/50 text-xs font-bold text-indigo-300 px-3 outline-none focus:border-indigo-400"
          >
            <option value="Standard Application">Standard Application</option>
            <option value="Product Catalog">Product Catalog</option>
            <option value="E-Book">Interactive E-Book</option>
            <option value="Print Catalog">Print Catalog</option>
            <option value="Digital Product Experience">Digital Product Experience</option>
            <option value="Custom Experience">Custom Experience</option>
          </select>

          <div className="h-4 w-[1px] bg-slate-700" />

          <select
            value={activeScreenId}
            onChange={(e) => setActiveScreenId(e.target.value)}
            className="h-8 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 px-3 outline-none focus:border-indigo-500"
          >
            {screens.map((s, idx) => (
              <option key={s.id} value={s.id}>
                {projectType === 'E-Book' ? `Page ${idx + 1}: ${s.name}` : s.name}
              </option>
            ))}
          </select>

          <div className="h-4 w-[1px] bg-slate-700" />

          <button
            onClick={() => navigate(`/omni-studio/logic/${projectId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-400 transition"
          >
            <Cpu size={14} /> Visual Logic & iScript
          </button>

          {projectType === 'E-Book' && (
            <button
              onClick={() => setShowEBookReader(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition"
            >
              <BookOpen size={14} /> Read E-Book
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunValidation}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 transition border border-amber-500/20"
            title="Pre-flight Publisher Validation"
          >
            <AlertTriangle size={14} /> Validate
          </button>

          <button
            onClick={() => {
              if (!project) return;
              const jsonStr = JSON.stringify(project, null, 2);
              const blob = new Blob([jsonStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}.omni.json`;
              a.click();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Export Package (.omni.json)"
          >
            <Download size={15} />
          </button>

          <span className="text-[10px] font-bold text-slate-400 px-1">
            {isAutoSaving ? 'Saving...' : 'Saved'}
          </span>

          <button
            onClick={() => navigate(`/omni-studio/preview/${projectId}`)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-sm"
          >
            <Play size={14} /> Preview App
          </button>
        </div>
      </header>

      {/* ─── 2. MAIN 3-ZONE WORKSPACE ───────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── LEFT ZONE: INSERT PALETTE, TREE & SCREENS ───────── */}
        <aside className="w-64 bg-[#182232] border-r border-slate-700/60 flex flex-col shrink-0">
          <div className="flex border-b border-slate-700/60">
            <button
              onClick={() => setActiveTabLeft('insert')}
              className={`flex-1 py-2.5 text-[11px] font-bold transition border-b-2 ${
                activeTabLeft === 'insert' ? 'border-indigo-500 text-indigo-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Components
            </button>
            <button
              onClick={() => setActiveTabLeft('tree')}
              className={`flex-1 py-2.5 text-[11px] font-bold transition border-b-2 ${
                activeTabLeft === 'tree' ? 'border-indigo-500 text-indigo-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Tree
            </button>
            <button
              onClick={() => setActiveTabLeft('screens')}
              className={`flex-1 py-2.5 text-[11px] font-bold transition border-b-2 ${
                activeTabLeft === 'screens' ? 'border-indigo-500 text-indigo-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {projectType === 'E-Book' ? 'Pages' : 'Screens'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar flex flex-col">
            {activeTabLeft === 'screens' ? (
              <div className="flex-1 -m-3">
                <StudioScreenPanel
                  screens={screens}
                  activeScreenId={activeScreenId}
                  projectType={projectType}
                  onSelectScreen={setActiveScreenId}
                  onAddScreen={handleAddScreen}
                  onDuplicateScreen={handleDuplicateScreen}
                  onDeleteScreen={handleDeleteScreen}
                  onRenameScreen={handleRenameScreen}
                  onSetInitialScreen={handleSetInitialScreen}
                  onReorderScreen={handleReorderScreen}
                />
              </div>
            ) : activeTabLeft === 'insert' ? (
              <div className="space-y-4">
                {['BASIC', 'INPUT', 'DISPLAY', 'PRODUCT', '3D_AR', 'DATA'].map(cat => (
                  <div key={cat} className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">{cat.replace('_', ' / ')}</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {COMPONENT_PALETTE.filter(p => p.category === cat).map(comp => (
                        <button
                          key={comp.type}
                          onClick={() => handleAddComponent(comp.type)}
                          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-indigo-600/20 hover:border-indigo-500 transition text-slate-300 hover:text-indigo-400"
                        >
                          <comp.icon size={18} className="mb-1" />
                          <span className="text-[11px] font-bold text-center leading-tight">{comp.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">Screen Component Tree</div>
                {components.length === 0 ? (
                  <p className="text-slate-500 italic text-[11px]">No components added yet.</p>
                ) : (
                  components.map(comp => (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedComponentId(comp.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                        selectedComponentId === comp.id ? 'bg-indigo-600/30 text-indigo-400 font-bold border border-indigo-500/50' : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{comp.name}</span>
                      <div className="flex items-center gap-1 text-slate-500">
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSelected(); }} className="hover:text-red-400"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ─── CENTER ZONE: INTERACTIVE CANVAS ───────── */}
        <main className="flex-1 bg-[#0F172A] relative overflow-auto flex items-center justify-center p-8">
          <div
            ref={canvasRef}
            className="w-[960px] h-[600px] bg-white rounded-2xl border border-slate-300 shadow-2xl relative overflow-hidden select-none"
            style={{ backgroundColor: screens[0]?.background_color || '#FFFFFF' }}
          >
            {components.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <Box size={48} className="mb-3 text-indigo-400 animate-pulse" />
                <h4 className="text-base font-bold text-slate-800">Empty Low-Code Canvas</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">Select components from the left Insert Library to start building your 3D digital experience.</p>
              </div>
            ) : (
              components.map(comp => {
                const isSel = selectedComponentId === comp.id;
                return (
                  <div
                    key={comp.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedComponentId(comp.id); }}
                    className={`absolute cursor-move transition-shadow ${
                      isSel ? 'ring-2 ring-indigo-600 shadow-lg' : 'hover:ring-1 hover:ring-slate-400'
                    }`}
                    style={{
                      left: comp.x,
                      top: comp.y,
                      width: comp.width,
                      height: comp.height,
                      backgroundColor: comp.style?.background_color || 'transparent',
                      color: comp.style?.color || '#1E293B',
                      borderRadius: comp.style?.border_radius || 0
                    }}
                  >
                    {/* Render Component Content by Type */}
                    {comp.type === 'Button' && (
                      <button className="w-full h-full font-bold text-xs flex items-center justify-center gap-1.5 px-3">
                        {comp.props?.text || 'Button'}
                      </button>
                    )}

                    {comp.type === 'Text' && (
                      <div className="w-full h-full p-2 text-xs font-semibold text-slate-800 leading-normal">
                        {comp.props?.text || 'Text Content'}
                      </div>
                    )}

                    {comp.type === 'Heading' && (
                      <div className="w-full h-full p-2 text-lg font-extrabold text-slate-900 tracking-tight">
                        {comp.props?.text || 'Industrial Heading'}
                      </div>
                    )}

                    {comp.type === 'Viewer3D' && (
                      <div className="w-full h-full bg-slate-950 rounded-xl flex flex-col items-center justify-center p-4 text-center text-slate-400 border border-slate-800">
                        <Box size={36} className="text-emerald-400 mb-2" />
                        <span className="font-bold text-xs text-white">3D Viewport ({comp.props?.url ? 'Model Attached' : 'Select GLB Model'})</span>
                        <span className="text-[10px] text-slate-500 mt-1">Orbit • Zoom • Hotspots</span>
                      </div>
                    )}

                    {comp.type === 'ProductCard' && (
                      <div className="w-full h-full bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between text-xs">
                        <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold">
                          Product Image / 3D Render
                        </div>
                        <div className="space-y-1 mt-2">
                          <span className="font-bold text-slate-900 block">{comp.props?.text || 'Heavy Machinery Component'}</span>
                          <span className="text-[10px] text-slate-500 block">Category • Specification</span>
                        </div>
                        <button className="w-full py-1.5 rounded-lg bg-indigo-600 font-bold text-white text-[11px] mt-2">Inspect Experience</button>
                      </div>
                    )}

                    {/* Resize Handles if Selected */}
                    {isSel && (
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-indigo-600 rounded-full border border-white" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* ─── RIGHT ZONE: 8-TAB GROUPED PROPERTY INSPECTOR ───────── */}
        <aside className="w-80 bg-[#182232] border-l border-slate-700/60 flex flex-col shrink-0">
          {selectedComp ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-slate-700/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedComp.name}</h4>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase">{selectedComp.type} ({selectedComp.category})</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={handleDuplicateSelected} className="p-1 text-slate-400 hover:text-white" title="Duplicate"><Copy size={14} /></button>
                  <button onClick={handleDeleteSelected} className="p-1 text-slate-400 hover:text-red-400" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>

              {/* 8-Tab Inspector Toolbar */}
              <div className="grid grid-cols-4 border-b border-slate-700/60 text-[10px] font-bold text-center">
                {['content', 'layout', 'style', 'behavior', 'data', 'events', 'a11y', 'advanced'].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTabInspector(t as any)}
                    className={`py-2 uppercase transition ${
                      activeTabInspector === t ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/40' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs no-scrollbar">
                {activeTabInspector === 'content' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Text Content / Value</label>
                      <input
                        type="text"
                        value={selectedComp.props?.text || selectedComp.props?.content || ''}
                        onChange={(e) => handleUpdateSelectedProp('text', e.target.value)}
                        className="h-8 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 font-semibold text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Low-Code Formula Expression</label>
                      <input
                        type="text"
                        placeholder="e.g. =IF(selectedProduct.status = 'Published', 'Active', 'Draft')"
                        value={selectedComp.props?.formula || ''}
                        onChange={(e) => handleUpdateSelectedProp('formula', e.target.value)}
                        className="h-8 w-full rounded-lg bg-slate-900 border border-indigo-500/50 px-3 font-mono text-[11px] text-indigo-300 outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeTabInspector === 'layout' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">X Position</label>
                        <input
                          type="number"
                          value={selectedComp.x}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setComponents(components.map(c => c.id === selectedComp.id ? { ...c, x: val } : c));
                          }}
                          className="h-8 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 font-semibold text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Y Position</label>
                        <input
                          type="number"
                          value={selectedComp.y}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setComponents(components.map(c => c.id === selectedComp.id ? { ...c, y: val } : c));
                          }}
                          className="h-8 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 font-semibold text-white outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Width (px)</label>
                        <input
                          type="number"
                          value={selectedComp.width}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setComponents(components.map(c => c.id === selectedComp.id ? { ...c, width: val } : c));
                          }}
                          className="h-8 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 font-semibold text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Height (px)</label>
                        <input
                          type="number"
                          value={selectedComp.height}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setComponents(components.map(c => c.id === selectedComp.id ? { ...c, height: val } : c));
                          }}
                          className="h-8 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 font-semibold text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTabInspector === 'style' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Background Color</label>
                      <input
                        type="color"
                        value={selectedComp.style?.background_color || '#FFFFFF'}
                        onChange={(e) => handleUpdateSelectedStyle('background_color', e.target.value)}
                        className="h-8 w-full rounded-lg bg-slate-800 border border-slate-700 p-1 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Text Color</label>
                      <input
                        type="color"
                        value={selectedComp.style?.color || '#1E293B'}
                        onChange={(e) => handleUpdateSelectedStyle('color', e.target.value)}
                        className="h-8 w-full rounded-lg bg-slate-800 border border-slate-700 p-1 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Border Radius (px)</label>
                      <input
                        type="number"
                        value={selectedComp.style?.border_radius || 0}
                        onChange={(e) => handleUpdateSelectedStyle('border_radius', Number(e.target.value))}
                        className="h-8 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 font-semibold text-white outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeTabInspector === 'data' && (
                  <div className="space-y-3">
                    <label className="block text-slate-400 font-bold mb-1">Bind to Spatial Vault Source</label>
                    <select
                      value={selectedComp.data_binding?.field_key || ''}
                      onChange={(e) => {
                        const updated = components.map(c => c.id === selectedComp.id ? {
                          ...c,
                          data_binding: { source: 'vault_products' as const, field_key: e.target.value }
                        } : c);
                        setComponents(updated);
                      }}
                      className="h-8 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 font-semibold text-white outline-none"
                    >
                      <option value="">-- No Data Binding --</option>
                      <option value="Vault.Product.name">Vault.Product.name</option>
                      <option value="Vault.Product.category">Vault.Product.category</option>
                      <option value="Vault.Product.description">Vault.Product.description</option>
                      <option value="Vault.Product.glb_file">Vault.Product.glb_file</option>
                      <option value="Vault.Product.specifications">Vault.Product.specifications</option>
                    </select>
                  </div>
                )}

                {activeTabInspector === 'events' && (
                  <div className="space-y-3">
                    <label className="block text-slate-400 font-bold mb-1">OnClick Trigger Action</label>
                    <select
                      value={selectedComp.action?.type || ''}
                      onChange={(e) => {
                        const updated = components.map(c => c.id === selectedComp.id ? {
                          ...c,
                          action: { type: e.target.value as any }
                        } : c);
                        setComponents(updated);
                      }}
                      className="h-8 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 font-semibold text-white outline-none"
                    >
                      <option value="">-- No Action Trigger --</option>
                      <option value="navigate">Navigate to Screen</option>
                      <option value="play_3d_anim">Play 3D Model Animation</option>
                      <option value="change_camera">Change Camera Angle</option>
                      <option value="explode_model">Explode Assembly Model</option>
                      <option value="launch_ar">Launch Augmented Reality</option>
                      <option value="submit_enquiry">Submit Lead Enquiry</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-slate-500">
              Select a component on the canvas to configure layout, styles, data bindings, and action triggers.
            </div>
          )}
        </aside>
      </div>

      {/* ─── 3. MODALS & DRAWERS ───────── */}

      {/* E-Book Reader Modal */}
      {showEBookReader && project && (
        <EBookReaderModal
          project={{
            ...project,
            project_type: projectType,
            project_document: {
              screens,
              components,
              theme: { primary_color: '#4F46E5' }
            }
          }}
          onClose={() => setShowEBookReader(false)}
        />
      )}

      {/* Validation Results Drawer */}
      {validationErrors && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-slate-900 border-t border-slate-700 p-4 font-sans text-xs shadow-2xl">
          <div className="max-w-5xl mx-auto flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-400 w-4 h-4" />
                <h4 className="font-bold text-white text-sm">
                  Pre-flight Publisher Validation ({validationErrors.length} issues found)
                </h4>
              </div>
              <button
                onClick={() => setValidationErrors(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {validationErrors.length === 0 ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> All pre-flight validation checks passed cleanly! Project is ready for publishing.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 no-scrollbar">
                {validationErrors.map((err) => (
                  <div
                    key={err.id}
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      err.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <div>
                      <span className="font-bold uppercase tracking-wider text-[10px] mr-2">[{err.location}]</span>
                      <span className="font-semibold">{err.target_name}: </span>
                      <span>{err.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
