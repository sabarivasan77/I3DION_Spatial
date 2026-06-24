import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import type { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function MockModel() {
  const ref = useRef<Group>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.25;
    }
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
      <mesh position={[0, 0, -1.35]}>
        <boxGeometry args={[1.8, 1.8, 0.18]} />
        <meshStandardMaterial color="#0f172a" metalness={0.45} roughness={0.3} />
      </mesh>
    </group>
  );
}

function RealModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  const ref = useRef<Group>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={ref}>
      <primitive object={gltf.scene} scale={1} />
    </group>
  );
}

export default function ThreeProduct({ modelUrl }: { modelUrl?: string }) {
  return (
    <Canvas camera={{ position: [3, 2.6, 4.5], fov: 45 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 5, 4]} intensity={1.5} />
      <Suspense fallback={<MockModel />}>
        {modelUrl ? <RealModel url={modelUrl} /> : <MockModel />}
      </Suspense>
    </Canvas>
  );
}
