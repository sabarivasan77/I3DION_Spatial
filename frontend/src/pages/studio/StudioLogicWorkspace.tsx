import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Play,
  Cpu,
  Trash2,
  GitBranch,
  Sparkles,
  Database,
  Box,
  CheckCircle2,
  X,
  Code,
  Save,
  AlertTriangle
} from 'lucide-react';
import { studioApi, StudioProject, StudioLowCodeLogicNode } from '../../api/studioApi';
import { iScriptEngine } from '../../components/studio/iScriptEngine';

export function StudioLogicWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<StudioProject | null>(null);
  const [activeMode, setActiveMode] = useState<'visual' | 'iscript'>('visual');
  const [nodes, setNodes] = useState<StudioLowCodeLogicNode[]>([
    {
      id: 'node-1',
      type: 'trigger',
      name: 'On Screen Load',
      trigger_event: 'OnLoad'
    },
    {
      id: 'node-2',
      type: 'action',
      name: 'Fetch Vault Product Data',
      action_type: 'get_vault_record',
      next_nodes: []
    }
  ]);
  const [iScriptCode, setIScriptCode] = useState<string>(
    '// iScript Logic Definition\nOnLoad {\n    Set(selectedProduct, Vault.Product)\n    Navigate("ProductDetail")\n}'
  );
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (projectId) {
      studioApi.getProject(projectId).then(p => {
        if (p) {
          setProject(p);
          if (p.project_document?.logic?.length > 0) {
            setNodes(p.project_document.logic);
          }
          if (p.project_document?.scripts?.[0]?.code) {
            setIScriptCode(p.project_document.scripts[0].code);
          }
        }
      });
    }
  }, [projectId]);

  const handleAddNode = (type: 'trigger' | 'action' | 'condition') => {
    const newNode: StudioLowCodeLogicNode = {
      id: `node-${Date.now()}`,
      type,
      name: type === 'trigger' ? 'On Button Click' : type === 'condition' ? 'If Available' : 'Launch AR Experience',
      action_type: type === 'action' ? 'launch_ar' : undefined
    };
    const updated = [...nodes, newNode];
    setNodes(updated);
    // Sync to iScript
    const code = iScriptEngine.convertVisualLogicToIScript(updated);
    setIScriptCode(code);
  };

  const handleDeleteNode = (id: string) => {
    const updated = nodes.filter(n => n.id !== id);
    setNodes(updated);
    const code = iScriptEngine.convertVisualLogicToIScript(updated);
    setIScriptCode(code);
  };

  const handleModeSwitch = (mode: 'visual' | 'iscript') => {
    if (mode === 'iscript' && activeMode === 'visual') {
      const code = iScriptEngine.convertVisualLogicToIScript(nodes);
      setIScriptCode(code);
    }
    setActiveMode(mode);
  };

  const handleIScriptChange = (code: string) => {
    setIScriptCode(code);
    try {
      iScriptEngine.parse(code);
      setScriptError(null);
    } catch (err: any) {
      setScriptError(err.message || 'Syntax Error');
    }
  };

  const handleSaveLogic = async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      const doc = project.project_document || { screens: [], components: [] };
      const updatedDoc = {
        ...doc,
        logic: nodes,
        scripts: [{ id: 'main-script', name: 'App Logic', code: iScriptCode }]
      };
      await studioApi.updateProject(project.id, { project_document: updatedDoc });
    } catch (err) {
      console.error('Save logic error', err);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 font-sans text-slate-200 select-none overflow-hidden">
      {/* ─── HEADER BAR ───────── */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/omni-studio/editor/${projectId}`)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-extrabold text-xs shadow-sm">
              <Cpu size={16} />
            </div>
            <div>
              <span className="font-bold text-sm text-white block leading-none">{project?.name || 'Studio Experience'}</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Visual Logic & iScript Workspace</span>
            </div>
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700">
          <button
            onClick={() => handleModeSwitch('visual')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeMode === 'visual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch size={14} /> Visual Logic Blocks
          </button>
          <button
            onClick={() => handleModeSwitch('iscript')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeMode === 'iscript' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code size={14} /> iScript Scripting Code
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveLogic}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 border border-emerald-500/30 transition"
          >
            <Save size={14} /> {isSaving ? 'Saving...' : 'Save Logic'}
          </button>
          <button
            onClick={() => navigate(`/omni-studio/preview/${projectId}`)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-sm"
          >
            <Play size={14} /> Preview Execution
          </button>
        </div>
      </header>

      {/* ─── WORKSPACE CONTENT ───────── */}
      <div className="flex-1 flex overflow-hidden">
        {activeMode === 'visual' ? (
          <>
            {/* Left Node Palette */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-4 shrink-0">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Add Logic Blocks</h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleAddNode('trigger')}
                  className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs hover:bg-amber-500/20 transition"
                >
                  <Sparkles size={16} /> Add Trigger Node
                </button>
                <button
                  onClick={() => handleAddNode('action')}
                  className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-xs hover:bg-indigo-500/20 transition"
                >
                  <Cpu size={16} /> Add Action Node
                </button>
                <button
                  onClick={() => handleAddNode('condition')}
                  className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs hover:bg-emerald-500/20 transition"
                >
                  <GitBranch size={16} /> Add Condition Node
                </button>
              </div>
            </aside>

            {/* Center Node Canvas */}
            <main className="flex-1 bg-[#090D16] p-8 overflow-auto flex items-start gap-8">
              <div className="flex flex-col gap-6 w-full max-w-2xl">
                {nodes.map((node, index) => (
                  <div
                    key={node.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between relative group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xs ${
                        node.type === 'trigger' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        node.type === 'condition' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}>
                        {node.type === 'trigger' ? 'TRIG' : node.type === 'condition' ? 'IF' : 'ACT'}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-white">{node.name}</h5>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">{node.type} Node • Step #{index + 1}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* Flow Arrow Connection */}
                    {index < nodes.length - 1 && (
                      <div className="absolute -bottom-6 left-9 h-6 w-[2px] bg-indigo-500/40" />
                    )}
                  </div>
                ))}
              </div>
            </main>
          </>
        ) : (
          /* iScript Code Editor Workspace */
          <main className="flex-1 bg-[#0D1117] flex flex-col font-mono text-xs">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400">
              <span className="font-bold text-indigo-400 flex items-center gap-2">
                <Code size={14} /> iScript Language Editor (Human-Readable Automation Logic)
              </span>
              {scriptError ? (
                <span className="text-red-400 font-semibold flex items-center gap-1">
                  <AlertTriangle size={14} /> {scriptError}
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={14} /> Syntax Validated Cleanly
                </span>
              )}
            </div>

            <textarea
              value={iScriptCode}
              onChange={(e) => handleIScriptChange(e.target.value)}
              placeholder="Write iScript instructions..."
              className="flex-1 bg-[#0D1117] text-slate-100 p-6 font-mono text-sm leading-relaxed outline-none resize-none selection:bg-indigo-600/50"
              spellCheck={false}
            />
          </main>
        )}
      </div>
    </div>
  );
}
