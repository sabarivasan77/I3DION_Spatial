import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  useGLTF, 
  Environment, 
  ContactShadows, 
  OrbitControls, 
  Bounds, 
  useProgress
} from '@react-three/drei';
import { createXRStore, XR } from '@react-three/xr';
import type { Group } from 'three';
import { motion, AnimatePresence } from 'framer-motion';

function MockModel() {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.25;
  });
  return (
    <group ref={ref} rotation={[0.3, 0.4, 0]}>
      <mesh>
        <cylinderGeometry args={[1.1, 1.1, 2.4, 48]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, 1.35]}>
        <torusGeometry args={[0.72, 0.18, 24, 64]} />
        <meshStandardMaterial color="#2563eb" metalness={0.55} roughness={0.2} />
      </mesh>
    </group>
  );
}

function RealModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
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
      maxPolarAngle={Math.PI / 2 + 0.1} // Allow looking slightly below the ground
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
    />
  );
}

// ─── Loading Overlay (Outside Canvas) ───────────────────────────────────────

export function LoadingOverlay({ productName }: { productName?: string }) {
  const { progress, active, item } = useProgress();
  const [show, setShow] = useState(true);

  // Smooth fade out when loading reaches 100%
  useEffect(() => {
    if (!active && progress === 100) {
      const timeout = setTimeout(() => setShow(false), 800);
      return () => clearTimeout(timeout);
    }
  }, [active, progress]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 backdrop-blur-xl"
        >
          <div className="flex max-w-sm w-full flex-col items-center px-6 text-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold tracking-tight text-white">{productName || 'Industrial Product'}</h2>
              <p className="mt-2 text-sm text-slate-400">Preparing 3D Experience...</p>
            </motion.div>
            
            <div className="w-full h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div 
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut", duration: 0.2 }}
              />
            </div>
            
            <div className="mt-4 flex w-full justify-between text-xs font-medium text-slate-500">
              <span className="font-mono">{item ? item.split('/').pop()?.slice(0, 20) + '...' : 'Initializing...'}</span>
              <span>{progress.toFixed(0)}%</span>
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
  productName
}: { 
  modelUrl?: string;
  autoRotate?: boolean;
  productName?: string;
}) {
  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden rounded-inherit">
      {/* Premium Loading Overlay */}
      <LoadingOverlay productName={productName} />

      <Canvas 
        shadows 
        camera={{ position: [4, 2, 5], fov: 45 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <XR store={xrStore}>
          <color attach="background" args={['#050a15']} /> {/* Deep premium dark blue/black */}
          
          {/* Soft, realistic industrial lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1.5} 
            castShadow 
            shadow-mapSize={2048}
          />
          <Environment preset="warehouse" blur={0.8} />

          <Bounds fit clip observe margin={1.2}>
            <Suspense fallback={null}>
              {modelUrl ? <RealModel url={modelUrl} /> : <MockModel />}
            </Suspense>
          </Bounds>

          {/* Premium ground shadow */}
          <ContactShadows 
            position={[0, -0.01, 0]} 
            opacity={0.6} 
            scale={15} 
            blur={2.5} 
            far={4.5} 
            color="#000000"
          />

          <ViewerControls autoRotate={autoRotate} />
        </XR>
      </Canvas>
    </div>
  );
}
