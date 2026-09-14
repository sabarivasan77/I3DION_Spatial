import React, { useState, useEffect } from 'react';
import { StudioProject, StudioLowCodeComponent, StudioLowCodeScreen } from '../../api/studioApi';
import { formulaEngine } from './formulaEngine';
import { actionEngine } from './actionEngine';
import { responsiveEngine, Breakpoint } from './responsiveEngine';
import { COMPONENT_REGISTRY } from './componentRegistry';
import { 
  Box, 
  FileText, 
  Plus, 
  Package, 
  CheckCircle2, 
  Grid, 
  Cpu, 
  Database,
  Play,
  Layers,
  Sparkles,
  HelpCircle,
  Link2
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
  const [doc, setDoc] = useState(project.project_document || { screens: [], components: [], variables: [] });
  const [activeScreenId, setActiveScreenId] = useState<string>(
    doc.screens.find((s: any) => s.is_initial)?.id || doc.screens[0]?.id || 'screen-1'
  );
  const [variables, setVariables] = useState<Record<string, any>>(() => {
    const map: Record<string, any> = {};
    (doc.variables || []).forEach((v: any) => { map[v.name] = v.value; });
    return map;
  });

  useEffect(() => {
    if (project.project_document) {
      setDoc(project.project_document);
      if (project.project_document.screens?.length > 0) {
        setActiveScreenId(project.project_document.screens[0].id);
      }
    }
  }, [project]);

  const activeScreen = doc.screens.find((s: any) => s.id === activeScreenId) || doc.screens[0] || {
    id: 'screen-1',
    name: 'Main Screen',
    background_color: '#FFFFFF',
    padding: 24
  };

  const handleSetVariable = (name: string, value: any) => {
    setVariables(prev => ({ ...prev, [name]: value }));
  };

  const handleNavigate = (targetScreenId: string) => {
    const screenExists = doc.screens.some((s: any) => s.id === targetScreenId);
    if (screenExists) setActiveScreenId(targetScreenId);
    if (onNavigate) onNavigate(targetScreenId);
  };

  const evalProp = (value: any) => {
    if (typeof value === 'string' && value.startsWith('=')) {
      return formulaEngine.evaluate(value, { variables, project });
    }
    return value;
  };

  const renderComponent = (comp: StudioLowCodeComponent) => {
    if (comp.is_hidden) return null;

    const baseProps = comp.props || {};
    const baseStyle = comp.style || {};
    const resolvedProps = responsiveEngine.resolveProps(baseProps, (comp as any).responsiveOverrides, breakpoint);
    const resolvedStyle = responsiveEngine.resolveProps(baseStyle, (comp as any).responsiveStyleOverrides, breakpoint);

    const compDef = COMPONENT_REGISTRY[comp.type];

    const handleClick = () => {
      if (comp.action) {
        actionEngine.executeSingle(comp.action, {
          variables,
          setVariable: handleSetVariable,
          navigate: handleNavigate,
          showNotification: (msg) => alert(msg)
        });
      }
    };

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
            onClick={handleClick}
            disabled={evalProp(resolvedProps.disabled)}
            style={containerStyle}
            className="flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{evalProp(resolvedProps.label) || 'Action Button'}</span>
          </button>
        );

      case 'Heading':
        return (
          <h2 key={comp.id} style={containerStyle} className="font-extrabold tracking-tight">
            {evalProp(resolvedProps.content) || 'Heading Title'}
          </h2>
        );

      case 'Text':
        return (
          <div key={comp.id} style={containerStyle} className="text-slate-700">
            {evalProp(resolvedProps.content) || 'Text block content'}
          </div>
        );

      case 'Card':
        return (
          <div key={comp.id} style={containerStyle} className="shadow-xs flex flex-col justify-between">
            <h4 className="font-bold text-slate-900 text-base">{evalProp(resolvedProps.title) || 'Card Title'}</h4>
            <p className="text-xs text-slate-500 mt-1">{evalProp(resolvedProps.description) || 'Card description text.'}</p>
          </div>
        );

      case 'ProductCard':
        return (
          <div key={comp.id} style={containerStyle} className="shadow-md border border-slate-200 flex flex-col justify-between">
            <div className="h-44 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center relative overflow-hidden">
              <Box className="w-12 h-12 text-indigo-400 opacity-80" />
            </div>
            <div className="space-y-1 mt-2">
              <h3 className="font-bold text-slate-900 text-sm">{evalProp(resolvedProps.title) || 'Heavy Duty Rotary Compressor'}</h3>
              <p className="text-xs text-indigo-600 font-bold">{evalProp(resolvedProps.price) || '$12,500'}</p>
            </div>
            <button onClick={handleClick} className="w-full py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg mt-2">
              View Product Specs
            </button>
          </div>
        );

      case 'Viewer3D':
        return (
          <div key={comp.id} style={containerStyle} className="bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
            <Box className="w-16 h-16 text-indigo-400 animate-pulse mb-2" />
            <div className="text-xs font-bold text-white">Spatial 3D Model Viewport</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{evalProp(resolvedProps.modelUrl) || '/models/model_1.gltf'}</div>
          </div>
        );

      case 'DataTable':
        return (
          <div key={comp.id} style={containerStyle} className="overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              Spatial Vault Bound Data Table
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="px-3 py-2 font-mono text-[10px]">rec-01</td>
                  <td className="px-3 py-2 font-medium">Planetary Reducer</td>
                  <td className="px-3 py-2 text-emerald-600 font-bold">Active</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      default:
        return (
          <div key={comp.id} style={containerStyle} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2 text-xs">
            <Box className="w-4 h-4 text-indigo-600" />
            <span>{comp.name} ({comp.type})</span>
          </div>
        );
    }
  };

  const currentComponents = doc.components.filter((c: any) => !c.screen_id || c.screen_id === activeScreenId);

  return (
    <div 
      className="relative w-full h-full min-h-[600px] transition-all overflow-hidden"
      style={{ backgroundColor: activeScreen.background_color || '#FFFFFF', padding: `${activeScreen.padding || 24}px` }}
    >
      {/* Screen Header Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-xs font-bold text-slate-800">{activeScreen.name}</span>
      </div>

      {currentComponents.length === 0 ? (
        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl">
          <Box className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">Empty Screen Canvas</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Drag components from the library onto the canvas to start authoring your application experience.
          </p>
        </div>
      ) : (
        currentComponents.map(renderComponent)
      )}
    </div>
  );
};
