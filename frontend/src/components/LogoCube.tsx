import { useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, Mesh, Group } from 'three';
import { motion } from 'framer-motion';

function RealisticLogoCube() {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const shadowRef = useRef<Mesh>(null);
  
  // Load the I3DION icon texture
  const logoTexture = useLoader(TextureLoader, '/images/logos/03_icon_only.png');

  // Rotate slowly and add gentle levitation float effect
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(time * 1.5) * 0.12;
      groupRef.current.rotation.y += delta * 0.4;
      groupRef.current.rotation.x = Math.sin(time * 0.8) * 0.08;
    }

    if (shadowRef.current) {
      // Pulse shadow size with levitation height
      const scale = 1 - Math.sin(time * 1.5) * 0.08;
      shadowRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      {/* Floating 3D Cube Group */}
      <group ref={groupRef}>
        <mesh ref={meshRef} castShadow receiveShadow>
          <boxGeometry args={[2.4, 2.4, 2.4]} />
          {/* Apply high-grade metallic materials with logo texture on all faces */}
          {[...Array(6)].map((_, index) => (
            <meshStandardMaterial 
              key={index} 
              attach={`material-${index}`} 
              map={logoTexture} 
              color="#ffffff"
              roughness={0.12}
              metalness={0.4}
              envMapIntensity={1.5}
            />
          ))}
        </mesh>
      </group>

      {/* Realistic Soft Drop Shadow Floor */}
      <mesh ref={shadowRef} position={[0, -2.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial 
          color="#0f172a" 
          transparent 
          opacity={0.15} 
        />
      </mesh>
    </group>
  );
}

export default function LogoCube() {
  return (
    <div className="relative w-full h-full min-h-[300px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 overflow-hidden rounded-3xl border border-slate-800/80 shadow-2xl">
      {/* Dynamic ambient studio glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full"
      >
        <Canvas camera={{ position: [0, 0, 6.2], fov: 42 }} gl={{ antialias: true, alpha: true }}>
          {/* Studio Lighting Rig */}
          <ambientLight intensity={0.9} />
          {/* Key Light (Cyan / Blue tint) */}
          <directionalLight position={[6, 8, 5]} intensity={2.2} color="#ffffff" castShadow />
          {/* Fill Light (Soft Purple) */}
          <directionalLight position={[-6, -4, 4]} intensity={1.2} color="#93c5fd" />
          {/* Rim Light (Bright White Specular Highlight) */}
          <directionalLight position={[0, 6, -6]} intensity={1.8} color="#e0f2fe" />
          {/* Accent Point Light inside studio */}
          <pointLight position={[3, 3, 3]} intensity={1.5} color="#38bdf8" />
          <pointLight position={[-3, -2, -2]} intensity={0.8} color="#818cf8" />

          <RealisticLogoCube />
        </Canvas>
      </motion.div>
    </div>
  );
}
