import React, { Component, ReactNode, Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  useGLTF, 
  Environment, 
  ContactShadows, 
  OrbitControls, 
  Bounds, 
  useProgress,
  Grid
} from '@react-three/drei';
import { createXRStore, XR } from '@react-three/xr';
import type { Group } from 'three';
import { motion, AnimatePresence } from 'framer-motion';

export type RenderMode = 'solid' | 'wireframe' | 'xray';

// ─── React Error Boundary for Async GLTF Model Loading ────────────────────────

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class GLTFErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('3D GLTF asset loading failed, seamlessly falling back to procedural CAD model:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ─── Real GLTF Model Loader ──────────────────────────────────────────────────

function RealModel({ url, renderMode = 'solid' }: { url: string; renderMode?: RenderMode }) {
  const { scene } = useGLTF(url);
  
  // Clone scene to avoid mutating cached model across multiple instances
  const clonedScene = useRef<Group>(null);

  useEffect(() => {
    if (!clonedScene.current) return;
    clonedScene.current.traverse((child: any) => {
      if (child.isMesh) {
        if (renderMode === 'wireframe') {
          child.material.wireframe = true;
          child.material.color.set('#00F0FF');
        } else if (renderMode === 'xray') {
          child.material.wireframe = false;
          child.material.transparent = true;
          child.material.opacity = 0.35;
          child.material.color.set('#64748B');
        } else {
          child.material.wireframe = false;
          child.material.transparent = false;
          child.material.opacity = 1.0;
        }
      }
    });
  }, [scene, renderMode]);

  return <primitive ref={clonedScene} object={scene} />;
}

// ─── High-Fidelity Monochromatic Industrial Procedural Assemblies ───────────

function DetailedProceduralModel({ 
  productName, 
  renderMode = 'solid' 
}: { 
  productName?: string; 
  renderMode?: RenderMode; 
}) {
  const mainGroup = useRef<Group>(null);
  const internalRotor = useRef<Group>(null);
  const fanBlades = useRef<Group>(null);

  // Smooth continuous animation
  useFrame((_, delta) => {
    if (mainGroup.current) {
      mainGroup.current.rotation.y += delta * 0.15;
    }
    if (internalRotor.current) {
      internalRotor.current.rotation.z += delta * 1.5;
    }
    if (fanBlades.current) {
      fanBlades.current.rotation.z += delta * 2.2;
    }
  });

  const nameLower = (productName || '').toLowerCase();
  const isCompressor = nameLower.includes('compressor');
  const isDrivetrain = nameLower.includes('drivetrain') || nameLower.includes('motor');
  const isTurbine = nameLower.includes('turbine');

  // Material configurations based on render mode
  const getMaterial = (baseColor: string, isInternal = false) => {
    if (renderMode === 'wireframe') {
      return (
        <meshStandardMaterial 
          color={isInternal ? '#38BDF8' : '#0284C7'} 
          wireframe={true} 
          emissive={isInternal ? '#0284C7' : '#0369A1'} 
          emissiveIntensity={0.5} 
        />
      );
    }
    if (renderMode === 'xray') {
      return (
        <meshStandardMaterial 
          color={isInternal ? '#38BDF8' : '#334155'} 
          transparent={true} 
          opacity={isInternal ? 0.9 : 0.25} 
          metalness={0.9} 
          roughness={0.1} 
        />
      );
    }
    // Solid Monochromatic Industrial Metallic Shader
    return (
      <meshStandardMaterial 
        color={isInternal ? '#2563EB' : baseColor} 
        metalness={0.85} 
        roughness={0.2} 
      />
    );
  };

  return (
    <group ref={mainGroup} rotation={[0.2, 0.4, 0]}>
      {/* MODEL TYPE 1: Rotary Air Compressor 500 */}
      {(isCompressor || (!isDrivetrain && !isTurbine)) && (
        <group>
          {/* Main Heavy Pressure Cylinder Outer Shell */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[1.2, 1.2, 2.6, 64, 1, true]} />
            {getMaterial('#94A3B8')}
          </mesh>

          {/* End Caps with Bolt Receptacles */}
          <mesh position={[0, 1.3, 0]}>
            <cylinderGeometry args={[1.3, 1.2, 0.2, 32]} />
            {getMaterial('#64748B')}
          </mesh>
          <mesh position={[0, -1.3, 0]}>
            <cylinderGeometry args={[1.2, 1.3, 0.2, 32]} />
            {getMaterial('#64748B')}
          </mesh>

          {/* Internal Rotating Dual Helical Rotor Shafts */}
          <group ref={internalRotor} position={[0, 0, 0]}>
            <mesh position={[-0.35, 0, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 2.2, 24]} />
              {getMaterial('#38BDF8', true)}
            </mesh>
            <mesh position={[0.35, 0, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 2.2, 24]} />
              {getMaterial('#60A5FA', true)}
            </mesh>
            {/* Spiral Helical Screw Ribs */}
            {[...Array(8)].map((_, i) => (
              <mesh key={i} position={[0, -0.9 + i * 0.25, 0]} rotation={[0, (i * Math.PI) / 4, 0]}>
                <torusGeometry args={[0.65, 0.08, 16, 32]} />
                {getMaterial('#1D4ED8', true)}
              </mesh>
            ))}
          </group>

          {/* Cooling Heat Sink Fins */}
          {[...Array(6)].map((_, i) => (
            <mesh key={`fin-${i}`} position={[0, -0.8 + i * 0.32, 0]}>
              <torusGeometry args={[1.32, 0.04, 16, 48]} />
              {getMaterial('#CBD5E1')}
            </mesh>
          ))}

          {/* Air Intake Manifold & Flange */}
          <mesh position={[0, 0, 1.35]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.6, 32]} />
            {getMaterial('#475569')}
          </mesh>
          <mesh position={[0, 0, 1.68]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.52, 0.08, 16, 32]} />
            {getMaterial('#2563EB')}
          </mesh>
        </group>
      )}

      {/* MODEL TYPE 2: Electric Drivetrain Assembly */}
      {isDrivetrain && (
        <group>
          {/* Stator Outer Frame / Housing */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[1.35, 1.35, 2.2, 48]} />
            {getMaterial('#64748B')}
          </mesh>

          {/* Liquid Cooling Ribbed Exterior */}
          {[...Array(7)].map((_, i) => (
            <mesh key={`cool-${i}`} position={[-0.9 + i * 0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[1.42, 0.05, 16, 48]} />
              {getMaterial('#38BDF8')}
            </mesh>
          ))}

          {/* Central High-Torque Rotor Shaft */}
          <group ref={internalRotor}>
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.5, 0.5, 3.0, 32]} />
              {getMaterial('#1E40AF', true)}
            </mesh>
            {/* Stator Winding Coils */}
            {[...Array(6)].map((_, i) => (
              <mesh key={`coil-${i}`} position={[0, 0, 0]} rotation={[(i * Math.PI) / 3, 0, 0]}>
                <boxGeometry args={[2.0, 0.2, 1.7]} />
                {getMaterial('#60A5FA', true)}
              </mesh>
            ))}
          </group>

          {/* Terminal Box */}
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[0.8, 0.5, 0.8]} />
            {getMaterial('#334155')}
          </mesh>
        </group>
      )}

      {/* MODEL TYPE 3: Precision Centrifugal Turbine */}
      {isTurbine && (
        <group>
          {/* Outer Centrifugal Scroll Casing */}
          <mesh position={[0, 0, 0]}>
            <torusGeometry args={[1.2, 0.5, 32, 64]} />
            {getMaterial('#475569')}
          </mesh>

          {/* Aerodynamic Air Inlet Cone */}
          <mesh position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.9, 1.2, 32]} />
            {getMaterial('#94A3B8')}
          </mesh>

          {/* Multi-Blade Turbine Impulse Rotor */}
          <group ref={fanBlades} position={[0, 0, 0.4]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.4, 0.4, 0.2, 32]} />
              {getMaterial('#2563EB', true)}
            </mesh>
            {[...Array(12)].map((_, i) => (
              <mesh 
                key={`blade-${i}`} 
                position={[
                  Math.cos((i * Math.PI) / 6) * 0.65, 
                  Math.sin((i * Math.PI) / 6) * 0.65, 
                  0
                ]}
                rotation={[0.3, 0, (i * Math.PI) / 6]}
              >
                <boxGeometry args={[0.45, 0.12, 0.05]} />
                {getMaterial('#38BDF8', true)}
              </mesh>
            ))}
          </group>

          {/* Exhaust Diffuser Pipe */}
          <mesh position={[1.4, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <cylinderGeometry args={[0.4, 0.55, 1.2, 32]} />
            {getMaterial('#64748B')}
          </mesh>
        </group>
      )}
    </group>
  );
}

export const xrStore = createXRStore();

// ─── Floating UI Controls ───────────────────────────────────────────────────

function ViewerControls({ autoRotate }: { autoRotate?: boolean }) {
  return (
    <OrbitControls 
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={1}
      maxDistance={30}
      maxPolarAngle={Math.PI / 2 + 0.1}
      autoRotate={autoRotate}
      autoRotateSpeed={0.8}
    />
  );
}

// ─── Loading Overlay (Outside Canvas) ───────────────────────────────────────

export function LoadingOverlay({ productName }: { productName?: string }) {
  const { progress, active, item } = useProgress();
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!active && progress === 100) {
      const timeout = setTimeout(() => setShow(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [active, progress]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-xl text-white"
        >
          <div className="flex max-w-sm w-full flex-col items-center px-6 text-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <span className="text-[10px] font-mono font-bold tracking-widest text-blue-400 uppercase">I3DION SPATIAL STUDIO</span>
              <h2 className="text-xl font-extrabold tracking-tight text-white mt-1">{productName || 'Industrial Asset'}</h2>
              <p className="mt-1 text-xs text-slate-400">Loading High-Fidelity 3D Shaders...</p>
            </motion.div>
            
            <div className="w-full h-1.5 overflow-hidden rounded-full bg-slate-800 border border-slate-700">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut", duration: 0.2 }}
              />
            </div>
            
            <div className="mt-3 flex w-full justify-between text-[11px] font-mono text-slate-400">
              <span>{item ? item.split('/').pop()?.slice(0, 22) + '...' : 'Streaming Geometry...'}</span>
              <span className="text-blue-400 font-bold">{progress.toFixed(0)}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ThreeProduct({ 
  modelUrl, 
  autoRotate = false,
  productName,
  renderMode = 'solid'
}: { 
  modelUrl?: string;
  autoRotate?: boolean;
  productName?: string;
  renderMode?: RenderMode;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const [loadError, setLoadError] = useState(false);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0A0D14] overflow-hidden rounded-inherit">
      {/* Loading Overlay */}
      <LoadingOverlay productName={productName} />

      <Canvas 
        eventSource={containerRef}
        shadows 
        camera={{ position: [4, 2.5, 5], fov: 42 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <XR store={xrStore}>
          {/* Deep Dark Industrial Monochromatic Atmosphere */}
          <color attach="background" args={['#0A0D14']} />
          
          {/* Dynamic Studio Blueprint Grid Floor */}
          <Grid
            position={[0, -1.35, 0]}
            args={[20, 20]}
            cellSize={0.5}
            cellThickness={0.8}
            cellColor="#1E293B"
            sectionSize={2.5}
            sectionThickness={1.2}
            sectionColor="#334155"
            fadeDistance={18}
            fadeStrength={1}
          />

          {/* Precision Industrial Monochromatic Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[8, 12, 6]} 
            intensity={1.8} 
            castShadow 
            shadow-mapSize={2048}
            color="#FFFFFF"
          />
          {/* Cyan Rim Accent Light for High-Tech CAD Outline */}
          <pointLight position={[-10, 5, -8]} intensity={2.5} color="#00F0FF" />
          <pointLight position={[10, -5, 8]} intensity={1.5} color="#3B82F6" />

          <Environment preset="city" blur={0.8} />

          <Bounds fit clip observe margin={1.2}>
            <Suspense fallback={null}>
              {modelUrl ? (
                <GLTFErrorBoundary fallback={<DetailedProceduralModel productName={productName} renderMode={renderMode} />}>
                  <RealModel url={modelUrl} renderMode={renderMode} />
                </GLTFErrorBoundary>
              ) : (
                <DetailedProceduralModel productName={productName} renderMode={renderMode} />
              )}
            </Suspense>
          </Bounds>

          {/* Soft Ground Contact Shadow */}
          <ContactShadows 
            position={[0, -1.34, 0]} 
            opacity={0.7} 
            scale={12} 
            blur={2.0} 
            far={4.0} 
            color="#000000"
          />

          <ViewerControls autoRotate={autoRotate} />
        </XR>
      </Canvas>
    </div>
  );
}
