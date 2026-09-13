import React, { useRef, useEffect } from 'react';
import { TransformControls } from '@react-three/drei';
import { useStudioStore } from '../store/useStudioStore';

interface TransformGizmoProps {
  mode?: 'translate' | 'rotate' | 'scale';
  targetObjectRef?: any;
}

export const StudioTransformGizmo: React.FC<TransformGizmoProps> = ({ mode = 'translate', targetObjectRef }) => {
  const { selectedWidgetId, updateWidgetProperties } = useStudioStore();
  const transformRef = useRef<any>(null);

  useEffect(() => {
    if (transformRef.current && targetObjectRef?.current) {
      const controls = transformRef.current;
      const object = targetObjectRef.current;

      const handleObjectChange = () => {
        if (!selectedWidgetId || !object) return;

        const pos = {
          x: parseFloat(object.position.x.toFixed(2)),
          y: parseFloat(object.position.y.toFixed(2)),
          z: parseFloat(object.position.z.toFixed(2)),
        };

        const rot = {
          x: parseFloat(((object.rotation.x * 180) / Math.PI).toFixed(2)),
          y: parseFloat(((object.rotation.y * 180) / Math.PI).toFixed(2)),
          z: parseFloat(((object.rotation.z * 180) / Math.PI).toFixed(2)),
        };

        const scale = {
          x: parseFloat(object.scale.x.toFixed(2)),
          y: parseFloat(object.scale.y.toFixed(2)),
          z: parseFloat(object.scale.z.toFixed(2)),
        };

        updateWidgetProperties(selectedWidgetId, {
          position3D: pos,
          rotation3D: rot,
          scale3D: scale,
        });
      };

      controls.addEventListener('dragging-changed', (event: any) => {
        // Disable orbit controls while dragging transform gizmo
        if (event.value === false) {
          handleObjectChange();
        }
      });
    }
  }, [selectedWidgetId, targetObjectRef, updateWidgetProperties]);

  if (!selectedWidgetId || !targetObjectRef?.current) return null;

  return (
    <TransformControls
      ref={transformRef}
      object={targetObjectRef.current}
      mode={mode}
      size={0.8}
    />
  );
};
