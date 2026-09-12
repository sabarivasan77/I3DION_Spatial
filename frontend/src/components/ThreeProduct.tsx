import { Component, ReactNode, Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  useGLTF, 
  useAnimations,
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
export type ThemeMode = 'light' | 'dark';

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
    console.warn('3D GLTF asset loading fallback to procedural model:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ─── Real GLTF Model Loader with Enhanced Solid / Wireframe / X-Ray Shader ─────

function RealModel({ 
  url, 
  renderMode = 'solid',
  themeMode = 'light',
  animationSpeed = 0,
  onHasAnimations
}: { 
  url: string; 
  renderMode?: RenderMode;
  themeMode?: ThemeMode;
  animationSpeed?: number;
  onHasAnimations?: (has: boolean) => void;
}) {
  const { scene, animations } = useGLTF(url);
  const clonedScene = useRef<Group>(null);
  const { actions, names } = useAnimations(animations, clonedScene);

  useEffect(() => {
    if (animations && animations.length > 0) {
      onHasAnimations?.(true);
    } else {
      onHasAnimations?.(false);
    }
  }, [animations, onHasAnimations]);

  useEffect(() => {
    if (!names || names.length === 0) return;
    const actionName = names[0];
    const action = actions[actionName];
    if (!action) return;

    if (animationSpeed === 0) {
      action.stop();
    } else {
      action.reset();
      action.timeScale = animationSpeed;
      action.play();
    }
  }, [actions, names, animationSpeed]);

  useEffect(() => {
    if (!clonedScene.current) return;
    
    let meshIndex = 0;
    clonedScene.current.traverse((child: any) => {
      if (child.isMesh) {
        meshIndex++;
        const meshName = (child.name || '').toLowerCase();
        const isHousing = 
          meshName.includes('case') || 
          meshName.includes('housing') || 
          meshName.includes('shell') || 
          meshName.includes('cover') || 
          meshName.includes('frame') || 
          meshName.includes('body') ||
          meshName.includes('outer') ||
          meshIndex === 1;

        if (renderMode === 'wireframe') {
          child.material.wireframe = true;
          child.material.color.set(themeMode === 'light' ? '#2563EB' : '#00F0FF');
          child.material.transparent = false;
          child.material.opacity = 1.0;
        } else if (renderMode === 'xray') {
          child.material.wireframe = false;
          if (isHousing) {
            // Outer casing becomes translucent X-Ray shell
            child.material.transparent = true;
            child.material.opacity = 0.2;
            child.material.color.set('#64748B');
            child.material.metalness = 0.9;
            child.material.roughness = 0.1;
          } else {
            // Internal mechanisms stay solid and vividly highlighted
            child.material.transparent = false;
            child.material.opacity = 1.0;
            child.material.color.set(themeMode === 'light' ? '#2563EB' : '#38BDF8');
            child.material.metalness = 0.85;
            child.material.roughness = 0.2;
          }
        } else {
          // Solid Mode
          child.material.wireframe = false;
          child.material.transparent = false;
          child.material.opacity = 1.0;
        }
      }
    });
  }, [scene, renderMode, themeMode]);

  return <primitive ref={clonedScene} object={scene} />;
}

// ─── High-Fidelity Monochromatic Industrial Procedural Assemblies ───────────

function DetailedProceduralModel({ 
  productName, 
  renderMode = 'solid',
  themeMode: _themeMode = 'light',
  animationSpeed = 0,
  onHasAnimations
}: { 
  productName?: string; 
  renderMode?: RenderMode; 
  themeMode?: ThemeMode;
  animationSpeed?: number;
  onHasAnimations?: (has: boolean) => void;
}) {
  const mainGroup = useRef<Group>(null);
  const internalRotor = useRef<Group>(null);
  const fanBlades = useRef<Group>(null);

  useEffect(() => {
    // Procedural models always support animation
    onHasAnimations?.(true);
  }, [onHasAnimations]);

  useFrame((_, delta) => {
    if (mainGroup.current) {
      mainGroup.current.rotation.y += delta * 0.15;
    }
    if (animationSpeed !== 0) {
      const speedMult = animationSpeed;
      if (internalRotor.current) {
        internalRotor.current.rotation.z += delta * 2.5 * speedMult;
      }
      if (fanBlades.current) {
        fanBlades.current.rotation.z += delta * 4.0 * speedMult;
      }
    } else {
      if (internalRotor.current) {
        internalRotor.current.rotation.z += delta * 0.5;
      }
      if (fanBlades.current) {
        fanBlades.current.rotation.z += delta * 0.8;
      }
    }
  });

  const nameLower = (productName || '').toLowerCase();
  const isCompressor = nameLower.includes('compressor') || nameLower.includes('gearbox') || nameLower.includes('gear');
  const isPump = nameLower.includes('pump') || nameLower.includes('cylinder') || nameLower.includes('drivetrain');
  const isMotor = nameLower.includes('motor') || nameLower.includes('actuator') || nameLower.includes('turbine');

  const getMaterial = (baseColor: string, isInternal = false) => {
    if (renderMode === 'wireframe') {
      return (
        <meshStandardMaterial 
          color={isInternal ? '#2563EB' : '#475569'} 
          wireframe={true} 
        />
      );
    }
    if (renderMode === 'xray') {
      return (
        <meshStandardMaterial 
          color={isInternal ? '#2563EB' : '#64748B'} 
          transparent={true} 
          opacity={isInternal ? 0.95 : 0.22} 
          metalness={0.9} 
          roughness={0.1} 
        />
      );
    }
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
      {/* MODEL TYPE 1: Industrial Gearbox */}
      {(isCompressor || (!isPump && !isMotor)) && (
        <group>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[1.2, 1.2, 2.4, 64, 1, true]} />
            {getMaterial('#94A3B8')}
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[1.3, 1.2, 0.2, 32]} />
            {getMaterial('#64748B')}
          </mesh>
          <mesh position={[0, -1.2, 0]}>
            <cylinderGeometry args={[1.2, 1.3, 0.2, 32]} />
            {getMaterial('#64748B')}
          </mesh>
          <group ref={internalRotor}>
            <mesh position={[-0.35, 0, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 2.0, 24]} />
              {getMaterial('#2563EB', true)}
            </mesh>
            <mesh position={[0.35, 0, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 2.0, 24]} />
              {getMaterial('#3B82F6', true)}
            </mesh>
            {[...Array(6)].map((_, i) => (
              <mesh key={i} position={[0, -0.8 + i * 0.3, 0]} rotation={[0, (i * Math.PI) / 3, 0]}>
                <torusGeometry args={[0.65, 0.08, 16, 32]} />
                {getMaterial('#1D4ED8', true)}
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* MODEL TYPE 2: Twin Cylinder Industrial Pump */}
      {isPump && (
        <group>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[1.3, 1.3, 2.2, 48]} />
            {getMaterial('#64748B')}
          </mesh>
          <group ref={internalRotor}>
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.48, 0.48, 2.8, 32]} />
              {getMaterial('#1E40AF', true)}
            </mesh>
            {[...Array(6)].map((_, i) => (
              <mesh key={`coil-${i}`} position={[0, 0, 0]} rotation={[(i * Math.PI) / 3, 0, 0]}>
                <boxGeometry args={[1.8, 0.2, 1.5]} />
                {getMaterial('#3B82F6', true)}
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* MODEL TYPE 3: Reciprocating Power Actuator / Motor */}
      {isMotor && (
        <group>
          <mesh position={[0, 0, 0]}>
            <torusGeometry args={[1.2, 0.5, 32, 64]} />
            {getMaterial('#475569')}
          </mesh>
          <group ref={fanBlades} position={[0, 0, 0.4]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.4, 0.4, 0.2, 32]} />
              {getMaterial('#2563EB', true)}
            </mesh>
            {[...Array(10)].map((_, i) => (
              <mesh 
                key={`blade-${i}`} 
                position={[
                  Math.cos((i * Math.PI) / 5) * 0.65, 
                  Math.sin((i * Math.PI) / 5) * 0.65, 
                  0
                ]}
                rotation={[0.3, 0, (i * Math.PI) / 5]}
              >
                <boxGeometry args={[0.45, 0.12, 0.05]} />
                {getMaterial('#3B82F6', true)}
              </mesh>
            ))}
          </group>
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
      const timeout = setTimeout(() => setShow(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [active, progress]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md text-slate-900"
        >
          <div className="flex max-w-sm w-full flex-col items-center px-6 text-center">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-4"
            >
              <h2 className="text-lg font-bold tracking-tight text-slate-900">{productName || 'Industrial 3D Asset'}</h2>
              <p className="mt-1 text-xs text-slate-500">Preparing CAD Geometry...</p>
            </motion.div>
            
            <div className="w-full h-1.5 overflow-hidden rounded-full bg-slate-200 border border-slate-300">
              <motion.div 
                className="h-full bg-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut", duration: 0.2 }}
              />
            </div>
            
            <div className="mt-3 flex w-full justify-between text-[11px] font-mono text-slate-500">
              <span>{item ? item.split('/').pop()?.slice(0, 22) + '...' : 'Streaming Geometry...'}</span>
              <span className="text-blue-600 font-bold">{progress.toFixed(0)}%</span>
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
  renderMode = 'solid',
  themeMode = 'light',
  className = '',
  animationSpeed = 0,
  onHasAnimations
}: { 
  modelUrl?: string;
  autoRotate?: boolean;
  productName?: string;
  renderMode?: RenderMode;
  themeMode?: ThemeMode;
  className?: string;
  animationSpeed?: number;
  onHasAnimations?: (hasAnimations: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const isDark = themeMode === 'dark';
  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const gridCellColor = isDark ? '#1E293B' : '#E2E8F0';
  const gridSectionColor = isDark ? '#334155' : '#CBD5E1';

  return (
    <div ref={containerRef} className={`relative w-full h-full ${isDark ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'} overflow-hidden rounded-inherit ${className}`}>
      {/* Loading Overlay */}
      <LoadingOverlay productName={productName} />

      <Canvas 
        eventSource={containerRef as unknown as HTMLElement}
        shadows 
        camera={{ position: [4, 2.5, 5], fov: 42 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <XR store={xrStore}>
          <color attach="background" args={[bgColor]} />
          
          {/* Dynamic Studio Blueprint Grid Floor */}
          <Grid
            position={[0, -1.35, 0]}
            args={[20, 20]}
            cellSize={0.5}
            cellThickness={0.8}
            cellColor={gridCellColor}
            sectionSize={2.5}
            sectionThickness={1.2}
            sectionColor={gridSectionColor}
            fadeDistance={18}
            fadeStrength={1}
          />

          {/* Clean Studio Lighting */}
          <ambientLight intensity={0.9} />
          <directionalLight 
            position={[8, 12, 6]} 
            intensity={1.6} 
            castShadow 
            shadow-mapSize={2048}
            color="#FFFFFF"
          />
          <pointLight position={[-10, 5, -8]} intensity={1.5} color="#3B82F6" />

          <Environment preset="studio" blur={0.8} />

          <Bounds fit clip observe margin={1.2}>
            <Suspense fallback={null}>
              {modelUrl ? (
                <GLTFErrorBoundary fallback={<DetailedProceduralModel productName={productName} renderMode={renderMode} themeMode={themeMode} animationSpeed={animationSpeed} onHasAnimations={onHasAnimations} />}>
                  <RealModel url={modelUrl} renderMode={renderMode} themeMode={themeMode} animationSpeed={animationSpeed} onHasAnimations={onHasAnimations} />
                </GLTFErrorBoundary>
              ) : (
                <DetailedProceduralModel productName={productName} renderMode={renderMode} themeMode={themeMode} animationSpeed={animationSpeed} onHasAnimations={onHasAnimations} />
              )}
            </Suspense>
          </Bounds>

          {/* Ground Contact Shadow */}
          <ContactShadows 
            position={[0, -1.34, 0]} 
            opacity={0.5} 
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
