import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import { CameraPreset } from '../types/threeTypes';
import { actionRegistry } from '../runtime/actionRegistry';
import * as THREE from 'three';

interface CameraControlsManagerProps {
  widgetId: string;
  preset?: CameraPreset;
  controlsEnabled?: boolean;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

const PRESET_POSITIONS: Record<CameraPreset, THREE.Vector3> = {
  Front: new THREE.Vector3(0, 0, 5),
  Back: new THREE.Vector3(0, 0, -5),
  Left: new THREE.Vector3(-5, 0, 0),
  Right: new THREE.Vector3(5, 0, 0),
  Top: new THREE.Vector3(0, 5, 0.001),
  Bottom: new THREE.Vector3(0, -5, 0.001),
  Isometric: new THREE.Vector3(4, 3, 4),
  Custom: new THREE.Vector3(0, 1.5, 4),
};

export const CameraControlsManager: React.FC<CameraControlsManagerProps> = ({
  widgetId,
  preset = 'Custom',
  controlsEnabled = true,
  autoRotate = false,
  rotationSpeed = 0.8,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const applyPreset = (p: CameraPreset) => {
    const targetPos = PRESET_POSITIONS[p] || PRESET_POSITIONS.Custom;
    camera.position.copy(targetPos);
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  useEffect(() => {
    applyPreset(preset);
  }, [preset]);

  useEffect(() => {
    // Listen for runtime camera action dispatches
    const unsubscribe = actionRegistry.registerHandler('SET_CAMERA', (invocation) => {
      if (invocation.targetId === widgetId && invocation.payload?.cameraPreset) {
        applyPreset(invocation.payload.cameraPreset);
      }
    });

    const unsubscribeReset = actionRegistry.registerHandler('RESET_CAMERA', (invocation) => {
      if (invocation.targetId === widgetId) {
        applyPreset('Custom');
      }
    });

    return () => {
      unsubscribe();
      unsubscribeReset();
    };
  }, [widgetId]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={controlsEnabled}
      enableDamping
      dampingFactor={0.05}
      minDistance={1}
      maxDistance={30}
      autoRotate={autoRotate}
      autoRotateSpeed={rotationSpeed}
    />
  );
};
