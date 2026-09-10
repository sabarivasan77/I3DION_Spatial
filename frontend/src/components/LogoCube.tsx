import { useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, Mesh } from 'three';
import { motion } from 'framer-motion';

function RotatingCube() {
  const meshRef = useRef<Mesh>(null);
  
  // Load the I3DION default logo
  const logoTexture = useLoader(TextureLoader, '/images/logos/03_icon_only.png');

  // Rotate slowly
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2.5, 2.5, 2.5]} />
      {/* Apply the logo texture to all 6 faces of the cube */}
      {[...Array(6)].map((_, index) => (
        <meshStandardMaterial 
          key={index} 
          attach={`material-${index}`} 
          map={logoTexture} 
          color="#f8fafc" // slate-50 base color to blend nicely
          roughness={0.2}
          metalness={0.1}
        />
      ))}
    </mesh>
  );
}

export default function LogoCube() {
  return (
    <div className="relative w-full h-full bg-slate-50 overflow-hidden rounded-inherit">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/50 to-transparent pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="w-full h-full"
      >
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ antialias: true }}>
          <color attach="background" args={['#f8fafc']} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />
          <RotatingCube />
        </Canvas>
      </motion.div>
    </div>
  );
}
