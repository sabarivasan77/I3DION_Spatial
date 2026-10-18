import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useEngineStore } from '../store/useEngineStore';
import { Move, RotateCw, Maximize2 } from 'lucide-react';
import { featureFlags } from '../../../packages/editor-kernel/featureFlags';

// -------------------------------------------------------------
// Interactive 3D Industrial Assembly Component
// -------------------------------------------------------------
function IndustrialAssemblyScene({
  selectedNodeId,
  onSelectNode,
  renderMode,
  gizmoMode,
  onTransformChange,
}: {
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  renderMode: 'solid' | 'wireframe' | 'xray';
  gizmoMode: 'translate' | 'rotate' | 'scale';
  onTransformChange: (nodeId: string, position: [number, number, number]) => void;
}) {
  const allowGizmos = featureFlags.isEnabled('ff.engine.transform');
  const motorRef = useRef<THREE.Mesh>(null);
  const pipeRef = useRef<THREE.Mesh>(null);
  const baseRef = useRef<THREE.Mesh>(null);
  const rotorRef = useRef<THREE.Mesh>(null);

  const getMaterialProps = (color: string) => ({
    color,
    wireframe: renderMode === 'wireframe',
    transparent: renderMode === 'xray',
    opacity: renderMode === 'xray' ? 0.45 : 1.0,
    roughness: 0.3,
    metalness: 0.6,
  });

  return (
    <group>
      {/* 1. Base Mounting Frame */}
      <mesh
        ref={baseRef}
        position={[0, -0.2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectNode('node_base');
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[4, 0.4, 2.5]} />
        <meshStandardMaterial {...getMaterialProps('#334155')} />
      </mesh>

      {/* 2. Main Motor Assembly */}
      <mesh
        ref={motorRef}
        position={[0.8, 0.8, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectNode('node_motor');
        }}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.7, 0.7, 1.6, 32]} />
        <meshStandardMaterial {...getMaterialProps('#e94b4b')} />
        {/* Floating Callout Tag */}
        <Html position={[0, 1.1, 0]} center distanceFactor={12}>
          <div className="pointer-events-none select-none rounded bg-[#e94b4b] px-2 py-0.5 text-[11px] font-bold text-white shadow-lg border border-white/20 whitespace-nowrap">
            Electric Motor 5.5kW
          </div>
        </Html>
      </mesh>

      {/* 3. Inlet Manifold & Pipe */}
      <mesh
        ref={pipeRef}
        position={[-1.0, 0.7, 0.2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectNode('node_inlet_pipe');
        }}
        castShadow
        receiveShadow
      >
        <torusGeometry args={[0.6, 0.18, 16, 32, Math.PI]} />
        <meshStandardMaterial {...getMaterialProps('#06b6d4')} />
        <Html position={[0, 0.8, 0]} center distanceFactor={12}>
          <div className="pointer-events-none select-none rounded bg-cyan-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-lg border border-white/20 whitespace-nowrap">
            Inlet Manifold
          </div>
        </Html>
      </mesh>

      {/* 4. Compressor Rotor / Shaft */}
      <mesh
        ref={rotorRef}
        position={[-0.4, 0.4, -0.5]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectNode('node_rotor');
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial {...getMaterialProps('#f59e0b')} />
      </mesh>

      {/* Real TransformControls attached to selected mesh */}
      {allowGizmos && selectedNodeId === 'node_motor' && motorRef.current && (
        <TransformControls
          object={motorRef.current}
          mode={gizmoMode}
          onObjectChange={() => {
            if (motorRef.current) {
              const p = motorRef.current.position;
              onTransformChange('node_motor', [p.x, p.y, p.z]);
            }
          }}
        />
      )}
      {allowGizmos && selectedNodeId === 'node_inlet_pipe' && pipeRef.current && (
        <TransformControls
          object={pipeRef.current}
          mode={gizmoMode}
          onObjectChange={() => {
            if (pipeRef.current) {
              const p = pipeRef.current.position;
              onTransformChange('node_inlet_pipe', [p.x, p.y, p.z]);
            }
          }}
        />
      )}
    </group>
  );
}

// Camera Preset Controller Component
function CameraController({ preset }: { preset: 'Perspective' | 'Top' | 'Front' | 'Right' }) {
  const { camera } = useThree();

  useEffect(() => {
    switch (preset) {
      case 'Top':
        camera.position.set(0, 10, 0.001);
        camera.lookAt(0, 0, 0);
        break;
      case 'Front':
        camera.position.set(0, 1, 8);
        camera.lookAt(0, 0.5, 0);
        break;
      case 'Right':
        camera.position.set(8, 1, 0);
        camera.lookAt(0, 0.5, 0);
        break;
      case 'Perspective':
      default:
        camera.position.set(4, 3, 5);
        camera.lookAt(0, 0.5, 0);
        break;
    }
  }, [preset, camera]);

  return null;
}

export const EngineViewportCanvas: React.FC = () => {
  const {
    selectedNodeId,
    setSelectedNodeId,
    gizmoMode,
    setGizmoMode,
    renderMode,
    setRenderMode,
    updateSceneNodeTransform,
  } = useEngineStore();

  const [cameraPreset, setCameraPreset] = useState<'Perspective' | 'Top' | 'Front' | 'Right'>('Perspective');

  // Keyboard Shortcuts: W (translate), E (rotate), R (scale)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (key === 'w') setGizmoMode('translate');
      else if (key === 'e') setGizmoMode('rotate');
      else if (key === 'r') setGizmoMode('scale');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setGizmoMode]);

  const handleTransformChange = (nodeId: string, position: [number, number, number]) => {
    updateSceneNodeTransform(nodeId, {
      position: { x: position[0], y: position[1], z: position[2] },
    });
  };

  return (
    <div className="flex-1 h-full bg-slate-950 relative overflow-hidden flex flex-col select-none">
      {/* 1. Top Viewport Controls Bar */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-2">
        <select
          value={cameraPreset}
          onChange={(e) => setCameraPreset(e.target.value as 'Perspective' | 'Top' | 'Front' | 'Right')}
          className="bg-slate-900/90 text-white font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-lg backdrop-blur-md focus:outline-none cursor-pointer"
        >
          <option value="Perspective">Perspective ▾</option>
          <option value="Top">Top</option>
          <option value="Front">Front</option>
          <option value="Right">Right</option>
        </select>

        <div className="hidden sm:flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5 shadow-lg backdrop-blur-md text-xs font-bold text-slate-300">
          <button
            onClick={() => setCameraPreset('Top')}
            className={`px-2.5 py-1 rounded transition ${cameraPreset === 'Top' ? 'bg-[#E94B4B] text-white' : 'hover:text-white'}`}
          >
            Top
          </button>
          <button
            onClick={() => setCameraPreset('Front')}
            className={`px-2.5 py-1 rounded transition ${cameraPreset === 'Front' ? 'bg-[#E94B4B] text-white' : 'hover:text-white'}`}
          >
            Front
          </button>
          <button
            onClick={() => setCameraPreset('Right')}
            className={`px-2.5 py-1 rounded transition ${cameraPreset === 'Right' ? 'bg-[#E94B4B] text-white' : 'hover:text-white'}`}
          >
            Right
          </button>
        </div>
      </div>

      {/* Top Right Shading / Render Modes */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-2">
        <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5 shadow-lg backdrop-blur-md text-xs font-bold text-slate-300">
          <button
            onClick={() => setRenderMode('solid')}
            className={`px-3 py-1 rounded transition ${renderMode === 'solid' ? 'bg-[#E94B4B] text-white shadow-sm' : 'hover:text-white'}`}
          >
            Solid
          </button>
          <button
            onClick={() => setRenderMode('wireframe')}
            className={`px-3 py-1 rounded transition ${renderMode === 'wireframe' ? 'bg-[#E94B4B] text-white shadow-sm' : 'hover:text-white'}`}
          >
            Wireframe
          </button>
          <button
            onClick={() => setRenderMode('xray')}
            className={`px-3 py-1 rounded transition ${renderMode === 'xray' ? 'bg-[#E94B4B] text-white shadow-sm' : 'hover:text-white'}`}
          >
            X-Ray
          </button>
        </div>
      </div>

      {/* 2. Left Floating Gizmo / Transformation Toolbar */}
      <div className="absolute top-16 left-4 z-20 flex flex-col bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-2xl backdrop-blur-md space-y-1">
        <button
          onClick={() => setGizmoMode('translate')}
          title="Translate Gizmo (W)"
          className={`p-2 rounded-lg transition ${gizmoMode === 'translate' ? 'bg-[#E94B4B] text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Move size={16} />
        </button>
        <button
          onClick={() => setGizmoMode('rotate')}
          title="Rotate Gizmo (E)"
          className={`p-2 rounded-lg transition ${gizmoMode === 'rotate' ? 'bg-[#E94B4B] text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <RotateCw size={16} />
        </button>
        <button
          onClick={() => setGizmoMode('scale')}
          title="Scale Gizmo (R)"
          className={`p-2 rounded-lg transition ${gizmoMode === 'scale' ? 'bg-[#E94B4B] text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* 3. Central WebGL 3D Canvas (Three.js & React Three Fiber) */}
      <div className="flex-1 w-full h-full relative" onClick={() => setSelectedNodeId(null)}>
        <Canvas
          shadows
          camera={{ position: [4, 3, 5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          className="w-full h-full"
        >
          <Suspense fallback={null}>
            <CameraController preset={cameraPreset} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[8, 12, 6]} intensity={1.3} castShadow shadow-mapSize={1024} />
            <pointLight position={[-6, -4, -4]} intensity={0.5} />

            <Grid
              infiniteGrid
              sectionSize={2}
              cellSize={0.5}
              cellColor="#334155"
              sectionColor="#475569"
              fadeDistance={25}
              fadeStrength={1.5}
            />

            <IndustrialAssemblyScene
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              renderMode={renderMode}
              gizmoMode={gizmoMode}
              onTransformChange={handleTransformChange}
            />

            <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
          </Suspense>
        </Canvas>

        {/* Viewport Info Overlay */}
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex items-center gap-3 text-[10px] text-slate-400 font-mono bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>WebGL 2.0 Realtime R3F Viewport</span>
          <span>•</span>
          <span>W/E/R: Transform Mode</span>
          <span>•</span>
          <span>Selected: {selectedNodeId || 'None'}</span>
        </div>
      </div>
    </div>
  );
};
