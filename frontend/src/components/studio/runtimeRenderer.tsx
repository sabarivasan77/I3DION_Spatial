import React, { useState, useEffect, useMemo } from 'react';
import { StudioProject, StudioLowCodeComponent } from '../../api/studioApi';
import { formulaEngine } from './formulaEngine';
import { responsiveEngine, Breakpoint } from './responsiveEngine';
import { OmniRuntimeEngine } from './runtimeEngine';
import { 
  Box, 
  Plus, 
  CheckCircle2, 
  Database,
  Play,
  ArrowLeft,
  Send,
  Camera
} from 'lucide-react';

interface RuntimeRendererProps {
  project: StudioProject;
  breakpoint?: Breakpoint;
  onNavigate?: (screenId: string) => void;
}

export const RuntimeRenderer: React.FC<RuntimeRendererProps> = ({
  project,
  breakpoint = 'desktop',
  onNavigate
}) => {
  const engine = useMemo(() => new OmniRuntimeEngine(project), [project]);
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = engine.subscribe(() => setTick(t => t + 1));
    return unsubscribe;
  }, [engine]);

  const doc = project.project_document || { screens: [], components: [], variables: [] };
  const activeScreenId = engine.state.activeScreenId;
  const activeScreen = (doc.screens || []).find((s: any) => s.id === activeScreenId) || doc.screens[0] || {
    id: 'screen-1',
    name: 'Main Screen',
    background_color: '#FFFFFF',
    padding: 24
  };

  // Lead Enquiry Form local state
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });

  const evalProp = (value: any, contextItem?: any) => {
    if (typeof value === 'string' && value.startsWith('=')) {
      return formulaEngine.evaluate(value, {
        variables: engine.state.variables.global,
        project,
        item: contextItem
      });
    }
    return value;
  };

  const handleComponentClick = (comp: StudioLowCodeComponent, contextItem?: any) => {
    if (comp.action) {
      engine.executeAction(comp.action, contextItem);
      if (onNavigate && comp.action.type === 'navigate') {
        const target = comp.action.target_id || comp.action.target_name;
        if (target) onNavigate(target);
      }
    }
  };

  const renderComponent = (comp: StudioLowCodeComponent, contextItem?: any) => {
    if (comp.is_hidden) return null;

    const baseProps = comp.props || {};
    const baseStyle = comp.style || {};
    const resolvedProps = responsiveEngine.resolveProps(baseProps, (comp as any).responsiveOverrides, breakpoint);
    const resolvedStyle = responsiveEngine.resolveProps(baseStyle, (comp as any).responsiveStyleOverrides, breakpoint);

    const containerStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${comp.x}px`,
      top: `${comp.y}px`,
      width: `${comp.width}px`,
      height: `${comp.height}px`,
      zIndex: 10,
      ...resolvedStyle
    };

    switch (comp.type) {
      case 'Button':
        return (
          <button
            key={comp.id}
            onClick={() => handleComponentClick(comp, contextItem)}
            disabled={evalProp(resolvedProps.disabled, contextItem)}
            style={containerStyle}
            className="flex items-center justify-center gap-2 font-bold hover:opacity-90 active:scale-95 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{evalProp(resolvedProps.label || resolvedProps.text, contextItem) || 'Action Button'}</span>
          </button>
        );

      case 'Heading':
        return (
          <h2 key={comp.id} style={containerStyle} className="font-extrabold tracking-tight">
            {evalProp(resolvedProps.content || resolvedProps.text, contextItem) || 'Industrial Title'}
          </h2>
        );

      case 'Text':
        return (
          <div key={comp.id} style={containerStyle} className="text-slate-700 font-medium leading-normal">
            {evalProp(resolvedProps.content || resolvedProps.text, contextItem) || 'Sample text content'}
          </div>
        );

      case 'ProductCard':
        return (
          <div key={comp.id} style={containerStyle} className="shadow-md border border-slate-200 bg-white rounded-2xl p-4 flex flex-col justify-between">
            <div className="h-36 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden text-slate-400 p-2">
              <Box className="w-10 h-10 text-indigo-400 mb-1 animate-pulse" />
              <span className="text-[10px] font-bold text-white">Spatial 3D Model</span>
            </div>
            <div className="space-y-1 mt-2">
              <h4 className="font-bold text-slate-900 text-sm truncate">{evalProp(resolvedProps.text || resolvedProps.title, contextItem) || 'Heavy Industrial Equipment'}</h4>
              <p className="text-xs text-indigo-600 font-bold">{evalProp(resolvedProps.price, contextItem) || '$14,800 USD'}</p>
            </div>
            <button
              onClick={() => handleComponentClick(comp, contextItem)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl mt-2 transition"
            >
              View Specifications
            </button>
          </div>
        );

      case 'Viewer3D': {
        const activeAnim = engine.state.active3dAnimation[comp.id] || 'Idle';
        const cameraPreset = engine.state.cameraPresets[comp.id] || 'Default Orbit';

        return (
          <div key={comp.id} style={containerStyle} className="bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-between p-4 text-center text-slate-300 shadow-2xl relative overflow-hidden">
            <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1 text-emerald-400">
                <Box size={12} /> 3D Viewport ({cameraPreset})
              </span>
              <span className="font-mono text-indigo-400">Anim: {activeAnim}</span>
            </div>

            <div className="my-auto flex flex-col items-center">
              <Box className="w-14 h-14 text-indigo-400 animate-pulse mb-2" />
              <span className="font-extrabold text-xs text-white">Spatial GLB/GLTF Engine</span>
              <span className="text-[10px] text-slate-500 mt-1">{evalProp(resolvedProps.url, contextItem) || '/models/industrial_gear.glb'}</span>
            </div>

            <div className="w-full flex items-center justify-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => engine.play3dAnimation(comp.id, 'Exploded_Assembly')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1"
              >
                <Play size={10} /> Explode
              </button>
              <button
                onClick={() => engine.setCameraPreset(comp.id, 'Top_Overview')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1"
              >
                <Camera size={10} /> Orbit Preset
              </button>
              <button
                onClick={() => engine.launchAR()}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition"
              >
                Launch AR
              </button>
            </div>
          </div>
        );
      }

      case 'EnquiryForm':
        return (
          <form
            key={comp.id}
            onSubmit={(e) => {
              e.preventDefault();
              engine.executeAction({
                type: 'submit_enquiry',
                full_name: enquiryForm.name,
                email: enquiryForm.email,
                phone: enquiryForm.phone,
                company: enquiryForm.company,
                message: enquiryForm.message
              });
              setEnquiryForm({ name: '', email: '', phone: '', company: '', message: '' });
            }}
            style={containerStyle}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-lg flex flex-col justify-between text-xs space-y-2"
          >
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <Send size={14} className="text-indigo-600" /> Technical Product Inquiry
            </h4>
            <input
              type="text"
              placeholder="Full Name *"
              required
              value={enquiryForm.name}
              onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
              className="h-8 w-full rounded-lg bg-slate-50 border border-slate-200 px-3 text-slate-800 font-semibold outline-none focus:border-indigo-500"
            />
            <input
              type="email"
              placeholder="Work Email *"
              required
              value={enquiryForm.email}
              onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
              className="h-8 w-full rounded-lg bg-slate-50 border border-slate-200 px-3 text-slate-800 font-semibold outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Company Name"
              value={enquiryForm.company}
              onChange={(e) => setEnquiryForm({ ...enquiryForm, company: e.target.value })}
              className="h-8 w-full rounded-lg bg-slate-50 border border-slate-200 px-3 text-slate-800 font-semibold outline-none focus:border-indigo-500"
            />
            <textarea
              placeholder="Requirements / Specifications..."
              rows={2}
              value={enquiryForm.message}
              onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
              className="w-full rounded-lg bg-slate-50 border border-slate-200 p-2 text-slate-800 font-semibold outline-none focus:border-indigo-500 resize-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Send size={14} /> Submit Lead Inquiry
            </button>
          </form>
        );

      case 'DataTable':
        return (
          <div key={comp.id} style={containerStyle} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                Spatial Vault Dataset Collection
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Live Sync</span>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Component Name</th>
                  <th className="px-3 py-2">Specification</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 font-medium">
                  <td className="px-3 py-2 font-bold text-slate-900">High-Pressure Turbine</td>
                  <td className="px-3 py-2 text-slate-500">12,500 RPM / 450 kW</td>
                  <td className="px-3 py-2 text-emerald-600 font-bold">In Stock</td>
                </tr>
                <tr className="border-b border-slate-100 font-medium">
                  <td className="px-3 py-2 font-bold text-slate-900">Hydraulic Actuator Assembly</td>
                  <td className="px-3 py-2 text-slate-500">350 Bar ISO-6020</td>
                  <td className="px-3 py-2 text-emerald-600 font-bold">In Stock</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      default:
        return (
          <div key={comp.id} style={containerStyle} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-slate-800 shadow-2xs">
            <Box className="w-4 h-4 text-indigo-600" />
            <span>{comp.name} ({comp.type})</span>
          </div>
        );
    }
  };

  const currentComponents = (doc.components || []).filter((c: any) => !c.parent_id || c.parent_id === activeScreenId);

  return (
    <div 
      className="relative w-full h-full min-h-[600px] transition-all overflow-hidden font-sans select-none"
      style={{ backgroundColor: activeScreen.background_color || '#FFFFFF', padding: `${activeScreen.padding || 24}px` }}
    >
      {/* Top Runtime Screen Header & Navigation Control */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-xl text-white">
        {engine.state.navHistory.length > 1 && (
          <button
            onClick={() => engine.goBack()}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
            title="Go Back"
          >
            <ArrowLeft size={14} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-white">{activeScreen.name}</span>
        </div>
      </div>

      {/* Toast Notification Banners */}
      {engine.state.notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {engine.state.notifications.map(n => (
            <div
              key={n.id}
              className={`p-3 rounded-xl border text-xs font-bold shadow-xl flex items-center gap-2 transition ${
                n.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' :
                n.type === 'error' ? 'bg-red-600 text-white border-red-500' :
                'bg-slate-900 text-slate-100 border-slate-700'
              }`}
            >
              <CheckCircle2 size={16} /> {n.message}
            </div>
          ))}
        </div>
      )}

      {currentComponents.length === 0 ? (
        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl">
          <Box className="w-12 h-12 text-indigo-400 mb-3 animate-pulse" />
          <h3 className="font-bold text-slate-800 text-sm">Empty Low-Code Screen Canvas</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Add components to this screen in the authoring canvas to build interactive digital product experiences.
          </p>
        </div>
      ) : (
        currentComponents.map(comp => renderComponent(comp))
      )}
    </div>
  );
};
