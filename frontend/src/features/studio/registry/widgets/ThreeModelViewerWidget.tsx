import React, { Component, ReactNode, Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Environment, ContactShadows } from '@react-three/drei';
import { WidgetRendererProps } from '../../types/studio';
import { Box as BoxIcon, RefreshCw } from 'lucide-react';
import type { Group } from 'three';
import { experienceEventBus } from '../../3d/runtime/eventBus';
import { actionRegistry } from '../../3d/runtime/actionRegistry';
import { canonicalExperienceRuntime } from '../../3d/runtime/canonicalRuntime';
import { CameraControlsManager } from '../../3d/camera/CameraControlsManager';
import { HotspotRenderer } from '../../3d/hotspots/HotspotRenderer';
import { Vector3D } from '../../3d/types/threeTypes';

// Procedural Assembly Fallback Mesh Component when GLTF URL is empty or fails
function ProceduralSpatialAssembly({
  autoRotate = true,
  position3D,
  rotation3D,
  scale3D,
  widgetId,
}: {
  autoRotate?: boolean;
  position3D?: Vector3D;
  rotation3D?: Vector3D;
  scale3D?: Vector3D;
  widgetId: string;
}) {
  const meshRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group
      ref={meshRef}
      position={[position3D?.x || 0, position3D?.y || 0, position3D?.z || 0]}
      rotation={[rotation3D?.x || 0, rotation3D?.y || 0, rotation3D?.z || 0]}
      scale={[scale3D?.x || 1, scale3D?.y || 1, scale3D?.z || 1]}
      onClick={(e) => {
        e.stopPropagation();
        experienceEventBus.dispatch({
          type: 'MODEL_CLICKED',
          targetId: widgetId,
          targetName: 'Procedural Assembly',
        });
      }}
    >
      {/* Outer Housing */}
      <mesh>
        <boxGeometry args={[1.8, 1.8, 1.8]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Core Mechanism */}
      <mesh>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial color="#60a5fa" emissive="#2563eb" emissiveIntensity={0.5} roughness={0.1} />
      </mesh>
    </group>
  );
}

// GLTF Loaded Real 3D Model Component with Full Animation Control & Event Dispatching
function GLTFModel({
  url,
  autoRotate = true,
  position3D,
  rotation3D,
  scale3D,
  widgetId,
}: {
  url: string;
  autoRotate?: boolean;
  position3D?: Vector3D;
  rotation3D?: Vector3D;
  scale3D?: Vector3D;
  widgetId: string;
}) {
  const { scene, animations } = useGLTF(url);
  const modelRef = useRef<Group>(null);
  const { actions, names } = useAnimations(animations, modelRef);

  useEffect(() => {
    // Register model state and discover animations
    canonicalExperienceRuntime.registerModelState(widgetId, {
      availableAnimations: names || [],
      position: position3D || { x: 0, y: 0, z: 0 },
      rotation: rotation3D || { x: 0, y: 0, z: 0 },
      scale: scale3D || { x: 1, y: 1, z: 1 },
    });

    experienceEventBus.dispatch({
      type: 'MODEL_LOADED',
      targetId: widgetId,
      data: { animations: names || [] },
    });
  }, [url, names, widgetId]);

  // Action listeners for animation control
  useEffect(() => {
    const unsubscribeAction = actionRegistry.registerHandler('PLAY_ANIMATION', (invocation) => {
      if (invocation.targetId === widgetId && invocation.payload?.animationName) {
        const action = actions[invocation.payload.animationName];
        if (action) {
          Object.values(actions).forEach(a => a?.stop());
          action.reset().play();
          experienceEventBus.dispatch({
            type: 'ANIMATION_STARTED',
            targetId: widgetId,
            data: { animation: invocation.payload.animationName },
          });
        }
      }
    });

    const unsubscribePause = actionRegistry.registerHandler('PAUSE_ANIMATION', (invocation) => {
      if (invocation.targetId === widgetId) {
        Object.values(actions).forEach(a => {
          if (a) a.paused = true;
        });
      }
    });

    const unsubscribeStop = actionRegistry.registerHandler('STOP_ANIMATION', (invocation) => {
      if (invocation.targetId === widgetId) {
        Object.values(actions).forEach(a => a?.stop());
      }
    });

    return () => {
      unsubscribeAction();
      unsubscribePause();
      unsubscribeStop();
    };
  }, [actions, widgetId]);

  useFrame((_, delta) => {
    if (autoRotate && modelRef.current) {
      modelRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={scene}
      position={[position3D?.x || 0, position3D?.y || 0, position3D?.z || 0]}
      rotation={[rotation3D?.x || 0, rotation3D?.y || 0, rotation3D?.z || 0]}
      scale={[scale3D?.x || 1, scale3D?.y || 1, scale3D?.z || 1]}
      onClick={(e: any) => {
        e.stopPropagation();
        experienceEventBus.dispatch({
          type: 'MODEL_CLICKED',
          targetId: widgetId,
          data: { objectName: e.object?.name },
        });
      }}
    />
  );
}

// React Error Boundary for Async GLTF Model Loading
class GLTFErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn('3D GLTF asset load error, switching to procedural fallback:', error);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export const ThreeModelViewerWidget: React.FC<WidgetRendererProps> = ({
  node,
  isSelected,
  isPreview,
  onSelect,
}) => {
  const {
    modelUrl = '',
    height = 380,
    backgroundColor = '#0f172a',
    autoRotate = false,
    controlsEnabled = true,
    lightIntensity = 1.2,
    cameraPreset = 'Custom',
    environmentPreset = 'city',
    shadowsEnabled = true,
    position3D = { x: 0, y: 0, z: 0 },
    rotation3D = { x: 0, y: 0, z: 0 },
    scale3D = { x: 1, y: 1, z: 1 },
    hotspots = [],
    visible = true,
  } = node.properties || {};

  if (!visible) return null;

  return (
    <div
      onClick={onSelect}
      style={{
        height: `${height}px`,
        backgroundColor,
      }}
      className={`relative w-full overflow-hidden border border-slate-800 rounded-2xl shadow-xl cursor-pointer transition-all ${
        isSelected && !isPreview
          ? 'outline-2 outline-dashed outline-blue-500 outline-offset-2'
          : ''
      }`}
    >
      {/* Viewport Header Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur-md shadow-md">
        <BoxIcon size={13} className="text-blue-400" />
        <span>{node.name || '3D Model Viewport'}</span>
        {autoRotate && <RefreshCw size={11} className="animate-spin text-blue-400" />}
      </div>

      {/* R3F Real 3D Viewport Canvas */}
      <Canvas
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        className="h-full w-full"
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <ambientLight intensity={lightIntensity * 0.7} />
        <directionalLight position={[5, 10, 5]} intensity={lightIntensity} castShadow={shadowsEnabled} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} />

        <Suspense fallback={null}>
          <Environment preset={environmentPreset} />
          <GLTFErrorBoundary
            fallback={
              <ProceduralSpatialAssembly
                autoRotate={autoRotate}
                position3D={position3D}
                rotation3D={rotation3D}
                scale3D={scale3D}
                widgetId={node.id}
              />
            }
          >
            {modelUrl ? (
              <GLTFModel
                url={modelUrl}
                autoRotate={autoRotate}
                position3D={position3D}
                rotation3D={rotation3D}
                scale3D={scale3D}
                widgetId={node.id}
              />
            ) : (
              <ProceduralSpatialAssembly
                autoRotate={autoRotate}
                position3D={position3D}
                rotation3D={rotation3D}
                scale3D={scale3D}
                widgetId={node.id}
              />
            )}
          </GLTFErrorBoundary>

          {/* 3D Hotspot Overlays */}
          <HotspotRenderer widgetId={node.id} hotspots={hotspots} />

          {/* Ground Shadow */}
          {shadowsEnabled && <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={10} blur={1.5} far={4} />}
        </Suspense>

        {/* Orbit Camera Controls Manager */}
        <CameraControlsManager
          widgetId={node.id}
          preset={cameraPreset}
          controlsEnabled={controlsEnabled}
          autoRotate={autoRotate}
        />
      </Canvas>
    </div>
  );
};
