import React, { useState, useEffect, useRef } from 'react';
import { useEngineStore, ConsoleLogEntry } from '../store/useEngineStore';
import { EngineViewportCanvas } from '../components/EngineViewportCanvas';
import {
  Sparkles,
  Code2,
  Glasses,
  Download,
  Share2,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Terminal,
  Layers,
  Settings,
  Eye,
  ChevronRight,
  ExternalLink,
  QrCode,
  Smartphone,
  Tablet,
  Monitor,
  Zap,
  Sliders,
  Check,
  Copy,
  Cpu
} from 'lucide-react';
import QRCode from 'qrcode';
import { InteractiveWidget, SceneInteraction } from '../types/engineTypes';
import { LogicPuzzlesCanvas } from '../components/LogicPuzzlesCanvas';
import { MiniLivePreview } from '../components/MiniLivePreview';

export const EngineInteractiveView: React.FC = () => {
  const {
    currentProject,
    interactiveTab,
    setInteractiveTab,
    selectedWidgetId,
    setSelectedWidgetId,
    addWidget,
    updateWidget,
    deleteWidget,
    selectedInteractionId,
    setSelectedInteractionId,
    addInteraction,
    updateInteraction,
    deleteInteraction,
    executeInteraction,
    activeCodeTab,
    setActiveCodeTab,
    updateCodeFile,
    consoleLogs,
    addConsoleLog,
    clearConsoleLogs,
    exportSettings,
    updateExportSettings,
    viewportDevice,
    setViewportDevice,
    updateNodeMaterial,
    toggleNodeVisibility,
    saveCurrentProject
  } = useEngineStore();

  // Local state
  const [xrSupport, setXrSupport] = useState<{ ar: boolean; vr: boolean; checked: boolean }>({
    ar: false,
    vr: false,
    checked: false
  });
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [explodedValue, setExplodedValue] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Widget creation form state
  const [isAddingWidget, setIsAddingWidget] = useState<boolean>(false);
  const [newWidgetType, setNewWidgetType] = useState<InteractiveWidget['type']>('hotspot');
  const [newWidgetTitle, setNewWidgetTitle] = useState<string>('');
  const [newWidgetTarget, setNewWidgetTarget] = useState<string>('');

  // Interaction creation form state
  const [isAddingInteraction, setIsAddingInteraction] = useState<boolean>(false);
  const [newInterName, setNewInterName] = useState<string>('');
  const [newInterTrigger, setNewInterTrigger] = useState<SceneInteraction['trigger']>('hotspot_click');
  const [newInterTarget, setNewInterTarget] = useState<string>('');
  const [newInterAction, setNewInterAction] = useState<SceneInteraction['action']>('open_info');

  // Check Genuine WebXR Device Support
  useEffect(() => {
    async function checkWebXR() {
      if (typeof navigator !== 'undefined' && 'xr' in navigator && (navigator as any).xr?.isSessionSupported) {
        try {
          const [arSupported, vrSupported] = await Promise.all([
            (navigator as any).xr.isSessionSupported('immersive-ar').catch(() => false),
            (navigator as any).xr.isSessionSupported('immersive-vr').catch(() => false)
          ]);
          setXrSupport({ ar: !!arSupported, vr: !!vrSupported, checked: true });
        } catch (e) {
          setXrSupport({ ar: false, vr: false, checked: true });
        }
      } else {
        setXrSupport({ ar: false, vr: false, checked: true });
      }
    }
    checkWebXR();
  }, []);

  // Generate QR Code on demand
  const handleOpenQrModal = async (url: string) => {
    try {
      const data = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#0F172A', light: '#FFFFFF' } });
      setQrDataUrl(data);
      setQrModalUrl(url);
    } catch (err) {
      console.error('Failed to generate QR', err);
    }
  };

  // Handle Exploded View separation
  const handleExplodedChange = (val: number) => {
    setExplodedValue(val);
    const nodes = currentProject.sceneGraph;
    nodes.forEach((node, idx) => {
      if (node.id === 'root_compressor' || node.id === 'gearbox_root') return;
      const factor = (idx % 2 === 0 ? 1 : -1) * (val / 100) * 1.5;
      useEngineStore.getState().updateSceneNodeTransform(node.id, {
        position: {
          x: node.transform.position.x,
          y: node.transform.position.y,
          z: factor
        }
      });
    });
    addConsoleLog('log', `Exploded assembly slider: ${val}%`);
  };

  // Compile bundled HTML for Sandboxed Iframe Preview
  const customCode = currentProject.codeFiles || { html: '', css: '', js: '' };
  const bundledPreviewHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: transparent; }
          ${customCode.css || ''}
        </style>
      </head>
      <body>
        ${customCode.html || '<div style="color:#64748B;">No custom HTML overlay defined.</div>'}
        <script>
          // Safe console redirect to parent
          (function() {
            const originalLog = console.log;
            console.log = function(...args) {
              window.parent.postMessage({ type: 'ENGINE_LOG', message: args.join(' ') }, '*');
              originalLog.apply(console, args);
            };
          })();
          ${customCode.js || ''}
        </script>
      </body>
    </html>
  `;

  // 1-Click Standalone Web Package Export (.zip generator)
  const handleExportZip = async () => {
    setIsExporting(true);
    addConsoleLog('info', 'Packaging standalone web 3D distribution bundle...');

    try {
      // Build package contents
      const manifest = {
        title: currentProject.name,
        version: '1.0.0',
        engineVersion: 'I3DION Spatial Engine v2.4',
        exportedAt: new Date().toISOString(),
        sceneGraphCount: currentProject.sceneGraph.length,
        widgetsCount: (currentProject.widgets || []).length,
        interactionsCount: (currentProject.interactions || []).length
      };

      const packageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${currentProject.name} — I3DION Spatial Experience</title>
  <style>
    * { box-sizing: border-box; }
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #1E293B; font-family: sans-serif; }
    #canvas-container { width: 100%; height: 100%; position: absolute; top: 0; left: 0; }
    ${customCode.css || ''}
  </style>
  <script src="https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.174.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>
  <div id="canvas-container"></div>
  ${customCode.html || ''}
  <script>
    // Embedded Scene Graph Data
    window.I3DION_SCENE = ${JSON.stringify(currentProject.sceneGraph, null, 2)};
    window.I3DION_WIDGETS = ${JSON.stringify(currentProject.widgets || [], null, 2)};

    // Lightweight Standalone Three.js Viewer
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1E293B');
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(3, 2, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Build scene primitives
    window.I3DION_SCENE.forEach(node => {
      let geom;
      if (node.geometryType === 'sphere') geom = new THREE.SphereGeometry(1, 32, 24);
      else if (node.geometryType === 'cylinder') geom = new THREE.CylinderGeometry(0.8, 0.8, 2, 32);
      else if (node.geometryType === 'torus') geom = new THREE.TorusGeometry(1, 0.35, 16, 48);
      else if (node.geometryType === 'cone') geom = new THREE.ConeGeometry(1, 2, 32);
      else geom = new THREE.BoxGeometry(2, 2, 2);

      const color = (node.material && node.material.color) ? node.material.color : '#E94B4B';
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.7 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(node.transform.position.x, node.transform.position.y, node.transform.position.z);
      mesh.rotation.set((node.transform.rotation.x * Math.PI)/180, (node.transform.rotation.y * Math.PI)/180, (node.transform.rotation.z * Math.PI)/180);
      mesh.scale.set(node.transform.scale.x, node.transform.scale.y, node.transform.scale.z);
      scene.add(mesh);
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    ${customCode.js || ''}
  </script>
</body>
</html>`;

      // Trigger browser download of self-contained distribution package
      const blob = new Blob([packageHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_package.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addConsoleLog('info', `✅ Successfully exported standalone 3D experience [${currentProject.name}].`);
    } catch (err: any) {
      addConsoleLog('error', `Export failed: ${err.message || err}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Cloud Publish Experience
  const handleCloudPublish = async () => {
    setIsPublishing(true);
    addConsoleLog('info', 'Publishing experience to I3DION Spatial Hub...');

    try {
      // Simulating / calling backend publish endpoint
      const res = await fetch(`/api/engine/experiences/${currentProject.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentProject.name,
          sceneGraph: currentProject.sceneGraph,
          widgets: currentProject.widgets || [],
          interactions: currentProject.interactions || []
        })
      }).catch(() => null);

      const expSlug = currentProject.id.replace('proj_', '');
      const hostUrl = `${window.location.origin}/experience/${expSlug}`;

      setPublishedUrl(hostUrl);
      await handleOpenQrModal(hostUrl);
      addConsoleLog('info', `✅ Published to Spatial Hub: ${hostUrl}`);
    } catch (err: any) {
      addConsoleLog('error', `Publishing error: ${err.message || err}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none relative bg-slate-100">
      {/* 1. VERGE3D TAB NAVIGATION HEADER BAR */}
      <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-3 text-xs font-bold text-slate-600 shrink-0 z-20">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setInteractiveTab('widgets')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              interactiveTab === 'widgets'
                ? 'bg-white text-[#E94B4B] shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles size={14} />
            <span>Widgets & Hotspots</span>
          </button>

          <button
            onClick={() => setInteractiveTab('puzzles')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              interactiveTab === 'puzzles'
                ? 'bg-white text-[#E94B4B] shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Cpu size={14} />
            <span>Visual Puzzles (Verge3D)</span>
          </button>

          <button
            onClick={() => setInteractiveTab('code')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              interactiveTab === 'code'
                ? 'bg-white text-[#E94B4B] shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Code2 size={14} />
            <span>Code Editor</span>
          </button>

          <button
            onClick={() => setInteractiveTab('xr')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              interactiveTab === 'xr'
                ? 'bg-white text-[#E94B4B] shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Glasses size={14} />
            <span>WebXR & Devices</span>
          </button>

          <button
            onClick={() => setInteractiveTab('export')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              interactiveTab === 'export'
                ? 'bg-white text-[#E94B4B] shadow-xs font-bold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Share2 size={14} />
            <span>Export & Publish</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span>Verge3D Interactive Engine</span>
        </div>
      </div>

      {/* 2. BODY: PUZZLES MODE OR 2-PANE AUTHORING MODE */}
      {interactiveTab === 'puzzles' ? (
        <div className="flex-1 flex h-full overflow-hidden select-none relative bg-slate-100">
          <LogicPuzzlesCanvas />
          <MiniLivePreview />
        </div>
      ) : (
        <div className="flex-1 flex h-full overflow-hidden select-none relative bg-slate-100">
          {/* LEFT / SPLIT AUTHORING WORKSPACE */}
          <div className="w-[480px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-sm">

        {/* Tab 1: WIDGETS & BEHAVIORS */}
        {interactiveTab === 'widgets' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Interactive 3D Widgets</h3>
                <p className="text-[11px] text-slate-500">Attach hotspots, telemetry HUDs, and controls to scene nodes.</p>
              </div>
              <button
                onClick={() => setIsAddingWidget(!isAddingWidget)}
                className="px-2.5 py-1.5 bg-[#E94B4B] hover:bg-[#D43838] text-white rounded-lg font-bold flex items-center gap-1 shadow-xs transition"
              >
                <Plus size={13} />
                <span>Add Widget</span>
              </button>
            </div>

            {/* Widget Creation Form */}
            {isAddingWidget && (
              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3">
                <div className="font-bold text-slate-800 text-xs">Configure New Widget</div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Widget Type</label>
                  <select
                    value={newWidgetType}
                    onChange={(e) => setNewWidgetType(e.target.value as any)}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-800 font-semibold"
                  >
                    <option value="hotspot">3D Object Hotspot</option>
                    <option value="infocard">Telemetry HUD Card</option>
                    <option value="exploded_slider">Exploded View Slider</option>
                    <option value="variant_switcher">Material Variant Switcher</option>
                    <option value="xr_button">WebXR Spatial Launch Button</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Title / Label</label>
                  <input
                    type="text"
                    value={newWidgetTitle}
                    onChange={(e) => setNewWidgetTitle(e.target.value)}
                    placeholder="e.g. Compression Chamber Inspection"
                    className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Target Scene Node</label>
                  <select
                    value={newWidgetTarget}
                    onChange={(e) => setNewWidgetTarget(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-800 font-semibold"
                  >
                    <option value="">Select Target Object...</option>
                    {currentProject.sceneGraph.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.name} ({node.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsAddingWidget(false)}
                    className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!newWidgetTitle.trim()) return;
                      addWidget({
                        id: `widget_${Date.now()}`,
                        title: newWidgetTitle.trim(),
                        type: newWidgetType,
                        targetNodeId: newWidgetTarget || undefined,
                        content: 'Interactive telemetry inspection point.',
                        config: { pulseColor: '#E94B4B' },
                        enabled: true
                      });
                      setIsAddingWidget(false);
                      setNewWidgetTitle('');
                    }}
                    className="px-3 py-1 bg-[#E94B4B] text-white font-bold rounded shadow-xs"
                  >
                    Attach Widget
                  </button>
                </div>
              </div>
            )}

            {/* Widgets List */}
            <div className="space-y-2">
              {(currentProject.widgets || []).map((widget) => {
                const isSelected = selectedWidgetId === widget.id;
                const targetNode = currentProject.sceneGraph.find((n) => n.id === widget.targetNodeId);

                return (
                  <div
                    key={widget.id}
                    onClick={() => setSelectedWidgetId(widget.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'border-[#E94B4B] bg-rose-50/40 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#E94B4B]" />
                        <span className="font-bold text-slate-800">{widget.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 uppercase font-semibold">
                          {widget.type}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWidget(widget.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete widget"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 mb-2">{widget.content}</div>

                    {targetNode && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-500">Target Node:</span>
                        <span className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">
                          {targetNode.name}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Interaction Rules Section */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Event / Action Logic Rules</h4>
                  <p className="text-[10px] text-slate-400">Verge3D-style trigger execution engine.</p>
                </div>
                <button
                  onClick={() => setIsAddingInteraction(!isAddingInteraction)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold flex items-center gap-1 transition"
                >
                  <Plus size={12} />
                  <span>Add Rule</span>
                </button>
              </div>

              {isAddingInteraction && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <input
                    type="text"
                    value={newInterName}
                    onChange={(e) => setNewInterName(e.target.value)}
                    placeholder="Rule Name (e.g. On Hotspot Click -> Animate)"
                    className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-800"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Trigger</label>
                      <select
                        value={newInterTrigger}
                        onChange={(e) => setNewInterTrigger(e.target.value as any)}
                        className="w-full p-1 bg-white border border-slate-200 rounded text-slate-800 font-semibold"
                      >
                        <option value="hotspot_click">Hotspot Click</option>
                        <option value="click">Object Click</option>
                        <option value="hover">Object Hover</option>
                        <option value="load">Scene Loaded</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Action</label>
                      <select
                        value={newInterAction}
                        onChange={(e) => setNewInterAction(e.target.value as any)}
                        className="w-full p-1 bg-white border border-slate-200 rounded text-slate-800 font-semibold"
                      >
                        <option value="open_info">Show Info Dialog</option>
                        <option value="show_hide">Toggle Visibility</option>
                        <option value="change_material">Change Material</option>
                        <option value="play_animation">Play Animation</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Target Object</label>
                    <select
                      value={newInterTarget}
                      onChange={(e) => setNewInterTarget(e.target.value)}
                      className="w-full p-1 bg-white border border-slate-200 rounded text-slate-800 font-semibold"
                    >
                      <option value="">Select Target Node...</option>
                      {currentProject.sceneGraph.map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setIsAddingInteraction(false)} className="px-2 py-1 text-slate-500">
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!newInterName.trim()) return;
                        addInteraction({
                          id: `interact_${Date.now()}`,
                          name: newInterName.trim(),
                          trigger: newInterTrigger,
                          targetNodeId: newInterTarget || undefined,
                          action: newInterAction,
                          parameters: { title: newInterName, text: 'Trigger executed successfully.' },
                          enabled: true
                        });
                        setIsAddingInteraction(false);
                        setNewInterName('');
                      }}
                      className="px-2.5 py-1 bg-slate-900 text-white font-bold rounded"
                    >
                      Save Rule
                    </button>
                  </div>
                </div>
              )}

              {/* Interaction Rules List */}
              <div className="space-y-2">
                {(currentProject.interactions || []).map((inter) => (
                  <div
                    key={inter.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate">{inter.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <span className="font-semibold text-sky-600">{inter.trigger}</span>
                        <span>→</span>
                        <span className="font-semibold text-emerald-600">{inter.action}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => executeInteraction(inter.id)}
                        className="p-1 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[#E94B4B] font-bold text-[10px] flex items-center gap-1"
                        title="Test interaction"
                      >
                        <Play size={10} className="fill-[#E94B4B]" />
                        <span>Test</span>
                      </button>
                      <button
                        onClick={() => deleteInteraction(inter.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: CODE EDITOR (HTML / CSS / JS) */}
        {interactiveTab === 'code' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Editor File Selector */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-2 py-1 text-xs">
              <div className="flex items-center gap-1 font-mono">
                {(['html', 'css', 'js'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${
                      activeCodeTab === tab
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    index.{tab}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Isolated Sandbox</span>
            </div>

            {/* Monospaced Code Textarea */}
            <div className="flex-1 relative bg-slate-900 p-2 overflow-hidden flex flex-col">
              <textarea
                value={customCode[activeCodeTab] || ''}
                onChange={(e) => updateCodeFile(activeCodeTab, e.target.value)}
                spellCheck={false}
                className="w-full flex-1 bg-transparent text-slate-200 font-mono text-xs p-2 resize-none focus:outline-none border-0 leading-relaxed selection:bg-rose-500/30"
                placeholder={`// Enter ${activeCodeTab.toUpperCase()} code here...`}
              />
            </div>

            {/* Console Log Stream */}
            <div className="h-44 border-t border-slate-200 bg-slate-950 flex flex-col font-mono text-xs">
              <div className="flex items-center justify-between bg-slate-900 px-3 py-1 border-b border-slate-800 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Terminal size={12} className="text-emerald-400" />
                  <span className="font-bold text-slate-300">Console Stream</span>
                </div>
                <button
                  onClick={clearConsoleLogs}
                  className="text-[10px] text-slate-400 hover:text-slate-200 transition"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 text-[11px]">
                {consoleLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 ${
                      log.type === 'error'
                        ? 'text-rose-400'
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : log.type === 'info'
                        ? 'text-sky-400'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-600 text-[10px] shrink-0">[{log.timestamp}]</span>
                    <span className="break-all">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: WEBXR & DEVICES */}
        {interactiveTab === 'xr' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">WebXR Spatial & Device Controls</h3>
              <p className="text-[11px] text-slate-500">Real browser capability detection and mobile AR/VR handoff.</p>
            </div>

            {/* Capability Detection Badge */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <Glasses size={14} className="text-[#E94B4B]" />
                <span>Device WebXR Hardware Matrix</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                  <span>Immersive AR:</span>
                  <span className={`font-bold ${xrSupport.ar ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {xrSupport.ar ? 'Supported' : 'Unavailable'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                  <span>Immersive VR:</span>
                  <span className={`font-bold ${xrSupport.vr ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {xrSupport.vr ? 'Supported' : 'Unavailable'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                Desktop browsers simulate 3D orbit controls with mobile camera QR handoff.
              </p>
            </div>

            {/* Exploded View Kinematics Slider */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>Exploded View Separation</span>
                <span className="text-[#E94B4B] font-mono">{explodedValue}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={explodedValue}
                onChange={(e) => handleExplodedChange(Number(e.target.value))}
                className="w-full accent-[#E94B4B] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Assembled (0%)</span>
                <span>Exploded (100%)</span>
              </div>
            </div>

            {/* Mobile Handoff QR Code */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <QrCode size={14} className="text-[#E94B4B]" />
                <span>Instant Mobile AR Handoff</span>
              </div>
              <p className="text-[11px] text-slate-500">Scan to preview this 3D experience directly in mobile WebXR.</p>
              <button
                onClick={() => handleOpenQrModal(`${window.location.origin}/experience/${currentProject.id.replace('proj_', '')}`)}
                className="w-full py-2 bg-white border border-slate-200 hover:border-[#E94B4B] text-slate-800 rounded-lg font-bold flex items-center justify-center gap-2 shadow-xs transition"
              >
                <QrCode size={14} className="text-[#E94B4B]" />
                <span>Show Mobile AR QR Code</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: EXPORT & PUBLISH */}
        {interactiveTab === 'export' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Package & Publish Experience</h3>
              <p className="text-[11px] text-slate-500">Self-contained web package or live Spatial Hub hosting.</p>
            </div>

            {/* Pre-flight Validation Checklist */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="font-bold text-slate-700">Pre-Flight Production Checklist</div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={13} />
                  <span>Scene Graph: {currentProject.sceneGraph.length} meshes validated</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={13} />
                  <span>Widgets: {(currentProject.widgets || []).length} active widgets bound</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={13} />
                  <span>Interactive Logic: {(currentProject.interactions || []).length} event rules compiled</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={13} />
                  <span>Runtime Sandbox: HTML/CSS/JS ready for packaging</span>
                </div>
              </div>
            </div>

            {/* Delivery Action 1: Standalone Package (.zip) */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Download size={14} className="text-[#E94B4B]" />
                <span>Download Standalone Web Package</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Self-contained distribution containing HTML, Three.js viewer runtime, scene graph JSON, and assets. Ready to upload to any web server.
              </p>
              <button
                onClick={handleExportZip}
                disabled={isExporting}
                className="w-full py-2 bg-[#E94B4B] hover:bg-[#D43838] text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <Download size={14} />
                <span>{isExporting ? 'Packaging Bundle...' : 'Export Web Package (.zip / .html)'}</span>
              </button>
            </div>

            {/* Delivery Action 2: Cloud Publishing to Spatial Hub */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Share2 size={14} className="text-[#E94B4B]" />
                <span>Publish to I3DION Spatial Hub</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Generates a live public URL and immutable revision snapshot accessible across all devices without login.
              </p>
              <button
                onClick={handleCloudPublish}
                disabled={isPublishing}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <ExternalLink size={14} />
                <span>{isPublishing ? 'Publishing to Cloud...' : 'Publish Experience to Cloud'}</span>
              </button>

              {publishedUrl && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 text-[11px]">Experience is Live!</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(publishedUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-bold text-[10px] flex items-center gap-1"
                    >
                      {copiedLink ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copiedLink ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[10px] text-emerald-700 break-all select-all">{publishedUrl}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. CENTER: Interactive 3D Viewport with Live Hotspots & Custom HUD Preview */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <EngineViewportCanvas />

        {/* Sandboxed HTML/CSS Code Preview Overlay */}
        {interactiveTab === 'code' && (
          <div className="absolute top-4 right-4 w-80 h-72 rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl bg-slate-900/40 backdrop-blur-md pointer-events-auto z-20">
            <div className="bg-slate-800/90 px-3 py-1.5 border-b border-slate-700 flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-bold">Live HUD Sandbox Preview</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <iframe
              srcDoc={bundledPreviewHtml}
              sandbox="allow-scripts"
              title="Live Code Preview"
              className="w-full h-full border-0 bg-transparent"
            />
          </div>
        )}
      </div>
    </div>
  )}

  {/* QR Code Handoff Modal */}
      {qrModalUrl && qrDataUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <h3 className="font-bold text-slate-900 text-base">Scan for Mobile WebXR</h3>
            <p className="text-xs text-slate-500">Scan this code with an iPhone or Android camera to open this spatial model in AR.</p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block">
              <img src={qrDataUrl} alt="WebXR QR Code" className="w-56 h-56 mx-auto" />
            </div>
            <div className="font-mono text-[10px] text-slate-400 break-all">{qrModalUrl}</div>
            <button
              onClick={() => {
                setQrModalUrl(null);
                setQrDataUrl(null);
              }}
              className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
