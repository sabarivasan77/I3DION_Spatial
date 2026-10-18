import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

import { useEngineStore } from '../store/useEngineStore';
import { SceneNode, BlenderShadingMode, Vector3D } from '../types/engineTypes';
import { vaultApi } from '../../../api/vaultApi';

import { BlenderTopMenu } from './viewport/BlenderTopMenu';
import { BlenderToolShelf } from './viewport/BlenderToolShelf';
import { BlenderNPanel } from './viewport/BlenderNPanel';
import { BlenderOrientationCompass } from './viewport/BlenderOrientationCompass';
import { BlenderStatusBar } from './viewport/BlenderStatusBar';

export const EngineViewportCanvas: React.FC = () => {
  const {
    currentProject,
    selectedNodeId,
    setSelectedNodeId,
    gizmoMode,
    setGizmoMode,
    renderMode,
    showFloorGrid,
    showOverlays,
    updateSceneNodeTransform,
    addSceneNode,
    deleteSceneNode,
    activeBlenderTool,
    setActiveBlenderTool,
    cursor3D,
    setCursor3D,
  } = useEngineStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hidden File Inputs
  const openFileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const appendFileInputRef = useRef<HTMLInputElement>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orthoCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const isOrthoRef = useRef<boolean>(false);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesLinesRef = useRef<THREE.Group | null>(null);
  const cursorMarkerRef = useRef<THREE.Group | null>(null);
  const selectionOutlineRef = useRef<THREE.BoxHelper | null>(null);

  // Mesh Mapping: nodeId -> THREE.Object3D
  const objectMapRef = useRef<Map<string, THREE.Object3D>>(new Map());

  // Viewport State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSavingVault, setIsSavingVault] = useState(false);
  const [vaultSaveSuccess, setVaultSaveSuccess] = useState(false);
  const [cameraAngles, setCameraAngles] = useState({ yaw: 0.785, pitch: 0.55 });
  const [stats, setStats] = useState({
    objectCount: 1,
    vertexCount: 8,
    faceCount: 6,
    triangleCount: 12,
    memoryMB: 18.5,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // ─── 1. THREE.JS INITIALIZATION ───────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    // Scene with Studio Neutral Gray Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#343434');
    sceneRef.current = scene;

    // Perspective Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(4, 3, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Orthographic Camera
    const aspect = width / height;
    const frustumSize = 6;
    const orthoCamera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    orthoCamera.position.set(4, 3, 5);
    orthoCamera.lookAt(0, 0, 0);
    orthoCameraRef.current = orthoCamera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // TransformControls (Gizmo)
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.size = 0.85;
    transformControls.setMode(gizmoMode);

    transformControls.addEventListener('dragging-changed', (event: any) => {
      controls.enabled = !event.value;
      if (!event.value && transformControls.object) {
        // Dragging finished, sync transform to store
        const obj = transformControls.object;
        const nodeId = (obj as any).userData?.nodeId;
        if (nodeId) {
          updateSceneNodeTransform(nodeId, {
            position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
            rotation: {
              x: (obj.rotation.x * 180) / Math.PI,
              y: (obj.rotation.y * 180) / Math.PI,
              z: (obj.rotation.z * 180) / Math.PI,
            },
            scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
          });
        }
      }
    });

    transformControls.addEventListener('change', () => {
      if (selectionOutlineRef.current && transformControls.object) {
        selectionOutlineRef.current.update();
      }
    });

    scene.add(transformControls.getHelper());
    transformControlsRef.current = transformControls;

    // Studio 3-Point Lighting (Neutral, Clean, Clay/Metal Shading - No gloomy black void)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbad2ff, 0.55);
    fillLight.position.set(-8, 6, -6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.4);
    rimLight.position.set(0, -6, -8);
    scene.add(rimLight);

    // Blender Ground Grid
    const grid = new THREE.GridHelper(30, 30, 0x555555, 0x383838);
    grid.position.y = -0.001;
    scene.add(grid);
    gridHelperRef.current = grid;

    // Distinct Blender X & Y Center Axis Lines
    const axesGroup = new THREE.Group();
    // X Axis (Red)
    const xGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-15, 0, 0),
      new THREE.Vector3(15, 0, 0),
    ]);
    const xMat = new THREE.LineBasicMaterial({ color: 0xdd3b3b, linewidth: 2 });
    axesGroup.add(new THREE.Line(xGeo, xMat));

    // Y Axis (Green - on floor Z in Three.js coordinates)
    const yGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -15),
      new THREE.Vector3(0, 0, 15),
    ]);
    const yMat = new THREE.LineBasicMaterial({ color: 0x3bdd3b, linewidth: 2 });
    axesGroup.add(new THREE.Line(yGeo, yMat));
    scene.add(axesGroup);
    axesLinesRef.current = axesGroup;

    // 3D Cursor Marker
    const cursorGroup = new THREE.Group();
    const cursorRingGeo = new THREE.RingGeometry(0.18, 0.22, 24);
    const cursorRingMat = new THREE.MeshBasicMaterial({
      color: 0xe04040,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const cursorRing = new THREE.Mesh(cursorRingGeo, cursorRingMat);
    cursorRing.rotation.x = Math.PI / 2;
    cursorGroup.add(cursorRing);
    scene.add(cursorGroup);
    cursorMarkerRef.current = cursorGroup;

    // Selection Outline Box
    const dummyObj = new THREE.Object3D();
    const boxHelper = new THREE.BoxHelper(dummyObj, 0xea7600); // Blender orange
    boxHelper.visible = false;
    scene.add(boxHelper);
    selectionOutlineRef.current = boxHelper;

    // Animation Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const activeCam = isOrthoRef.current ? orthoCameraRef.current! : cameraRef.current!;
      controls.update();

      // Compute compass rotation angles
      const dir = new THREE.Vector3();
      activeCam.getWorldDirection(dir);
      const yaw = Math.atan2(dir.x, dir.z);
      const pitch = Math.asin(-dir.y);
      setCameraAngles({ yaw, pitch });

      renderer.render(scene, activeCam);
    };
    animate();

    // Window Resize Observer
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      const asp = w / h;
      orthoCamera.left = (-frustumSize * asp) / 2;
      orthoCamera.right = (frustumSize * asp) / 2;
      orthoCamera.top = frustumSize / 2;
      orthoCamera.bottom = -frustumSize / 2;
      orthoCamera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
      transformControls.dispose();
    };
  }, []);

  // ─── 2. GIZMO MODE SYNC ───────────────────────────────────────────────────
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(gizmoMode);
    }
  }, [gizmoMode]);

  // ─── 3. OVERLAYS TOGGLE (GRID, AXES) ──────────────────────────────────────
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showFloorGrid;
    }
    if (axesLinesRef.current) {
      axesLinesRef.current.visible = showFloorGrid;
    }
    if (cursorMarkerRef.current) {
      cursorMarkerRef.current.visible = showOverlays;
    }
  }, [showFloorGrid, showOverlays]);

  // ─── 4. SYNC SCENE GRAPH OBJECTS ──────────────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    let totalVerts = 0;
    let totalFaces = 0;
    let totalTris = 0;

    // Prune removed objects
    const currentIds = new Set(currentProject.sceneGraph.map((n) => n.id));
    objectMapRef.current.forEach((obj, id) => {
      if (!currentIds.has(id)) {
        scene.remove(obj);
        objectMapRef.current.delete(id);
      }
    });

    // Create or update meshes for each node
    currentProject.sceneGraph.forEach((node) => {
      let obj = objectMapRef.current.get(node.id);

      if (!obj) {
        // Create new mesh if not existing
        let geom: THREE.BufferGeometry;
        if (node.geometryType === 'sphere') {
          geom = new THREE.SphereGeometry(1, 32, 24);
        } else if (node.geometryType === 'cylinder') {
          geom = new THREE.CylinderGeometry(0.8, 0.8, 2, 32);
        } else if (node.geometryType === 'torus') {
          geom = new THREE.TorusGeometry(1, 0.35, 16, 48);
        } else if (node.geometryType === 'cone') {
          geom = new THREE.ConeGeometry(1, 2, 32);
        } else if (node.geometryType === 'monkey') {
          // Suzanne stylized high-poly diamond polyhedron
          geom = new THREE.IcosahedronGeometry(1.2, 2);
        } else {
          // Default Cube (2x2x2)
          geom = new THREE.BoxGeometry(2, 2, 2);
        }

        const mat = createBlenderMaterial(renderMode, node.material?.color || '#cfcfcf');
        const mesh = new THREE.Mesh(geom, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        (mesh as any).userData = { nodeId: node.id };

        scene.add(mesh);
        objectMapRef.current.set(node.id, mesh);
        obj = mesh;
      }

      // Update Visibility and Transform
      obj.visible = node.visible;
      obj.position.set(node.transform.position.x, node.transform.position.y, node.transform.position.z);
      obj.rotation.set(
        (node.transform.rotation.x * Math.PI) / 180,
        (node.transform.rotation.y * Math.PI) / 180,
        (node.transform.rotation.z * Math.PI) / 180
      );
      obj.scale.set(node.transform.scale.x, node.transform.scale.y, node.transform.scale.z);

      // Accumulate Stats
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          if (m.geometry) {
            const count = m.geometry.attributes.position ? m.geometry.attributes.position.count : 0;
            totalVerts += count;
            totalTris += m.geometry.index ? m.geometry.index.count / 3 : count / 3;
            totalFaces += Math.floor(count / 3);
          }
        }
      });
    });

    setStats({
      objectCount: currentProject.sceneGraph.length,
      vertexCount: Math.round(totalVerts) || 8,
      faceCount: Math.round(totalFaces) || 6,
      triangleCount: Math.round(totalTris) || 12,
      memoryMB: Math.max(14.2, totalVerts * 0.001 + 18.5),
    });
  }, [currentProject.sceneGraph, renderMode]);

  // ─── 5. UPDATE MATERIALS ACCORDING TO SHADING MODE ─────────────────────────
  useEffect(() => {
    objectMapRef.current.forEach((obj, nodeId) => {
      const node = currentProject.sceneGraph.find((n) => n.id === nodeId);
      const color = node?.material?.color || '#cfcfcf';

      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.material = createBlenderMaterial(renderMode, color);
        }
      });
    });
  }, [renderMode, currentProject.sceneGraph]);

  // ─── 6. SELECTION & TRANSFORM CONTROLS ATTACHMENT ─────────────────────────
  useEffect(() => {
    const transformControls = transformControlsRef.current;
    const boxHelper = selectionOutlineRef.current;
    if (!transformControls || !boxHelper) return;

    if (!selectedNodeId) {
      transformControls.detach();
      boxHelper.visible = false;
      return;
    }

    const selectedObj = objectMapRef.current.get(selectedNodeId);
    if (selectedObj) {
      transformControls.attach(selectedObj);
      boxHelper.setFromObject(selectedObj);
      boxHelper.visible = true;
    } else {
      transformControls.detach();
      boxHelper.visible = false;
    }
  }, [selectedNodeId]);

  // Helper: Create Blender Material by Shading Mode
  function createBlenderMaterial(mode: BlenderShadingMode | 'xray', defaultColor: string): THREE.Material {
    switch (mode) {
      case 'wireframe':
        return new THREE.MeshBasicMaterial({
          wireframe: true,
          color: 0x000000,
        });
      case 'solid':
        // Blender Workbench Solid Clay MatCap Look
        return new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          roughness: 0.55,
          metalness: 0.08,
        });
      case 'material':
        // True Material Preview
        return new THREE.MeshStandardMaterial({
          color: defaultColor || 0xe94b4b,
          roughness: 0.4,
          metalness: 0.3,
        });
      case 'rendered':
        // Glossy Rendered View with Lighting
        return new THREE.MeshStandardMaterial({
          color: defaultColor || 0xe94b4b,
          roughness: 0.2,
          metalness: 0.7,
        });
      case 'xray':
        return new THREE.MeshPhysicalMaterial({
          color: defaultColor || 0x38bdf8,
          roughness: 0.1,
          transmission: 0.75,
          opacity: 0.85,
          transparent: true,
        });
      default:
        return new THREE.MeshStandardMaterial({ color: 0xcccccc });
    }
  }

  // ─── 7. VIEWPORT CLICK RAYCASTING (SELECT OBJECTS) ────────────────────────
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only raycast if transform controls are not active
    if (!transformControlsRef.current?.dragging && canvasRef.current && cameraRef.current && sceneRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      const activeCam = isOrthoRef.current ? orthoCameraRef.current! : cameraRef.current!;
      raycaster.setFromCamera(new THREE.Vector2(x, y), activeCam);

      // Collect all meshes belonging to our nodes
      const candidateMeshes: THREE.Object3D[] = [];
      objectMapRef.current.forEach((obj) => candidateMeshes.push(obj));

      const intersects = raycaster.intersectObjects(candidateMeshes, true);
      if (intersects.length > 0) {
        // Find top parent that has a nodeId
        let hit: THREE.Object3D | null = intersects[0].object;
        let foundNodeId: string | null = null;
        while (hit) {
          if ((hit as any).userData?.nodeId) {
            foundNodeId = (hit as any).userData.nodeId;
            break;
          }
          hit = hit.parent;
        }
        if (foundNodeId) {
          setSelectedNodeId(foundNodeId);
          return;
        }
      }
    }
  };

  // ─── 8. KEYBOARD SHORTCUTS (BLENDER STANDARD) ─────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'g' || e.key === 'G') {
        setGizmoMode('translate');
        setActiveBlenderTool('move');
        showToast('Tool: Move (Translate)');
      } else if (e.key === 'r' || e.key === 'R') {
        setGizmoMode('rotate');
        setActiveBlenderTool('rotate');
        showToast('Tool: Rotate');
      } else if (e.key === 's' || e.key === 'S') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleSaveToVault();
        } else {
          setGizmoMode('scale');
          setActiveBlenderTool('scale');
          showToast('Tool: Scale');
        }
      } else if (e.key === 'o' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        openFileInputRef.current?.click();
      } else if (e.key === 'x' || e.key === 'Delete') {
        if (selectedNodeId) {
          deleteSceneNode(selectedNodeId);
          showToast('Deleted Selected Object');
        }
      } else if (e.key === 'd' && e.shiftKey) {
        e.preventDefault();
        handleDuplicateSelected();
      } else if (e.key === 'a' || e.key === 'A') {
        if (e.altKey) {
          setSelectedNodeId(null);
          showToast('Deselected All');
        } else {
          if (currentProject.sceneGraph.length > 0) {
            setSelectedNodeId(currentProject.sceneGraph[0].id);
            showToast('Selected Object');
          }
        }
      } else if (e.key === '1') {
        handleCameraView('front');
      } else if (e.key === '3') {
        handleCameraView('right');
      } else if (e.key === '7') {
        handleCameraView('top');
      } else if (e.key === '5') {
        handleCameraView('ortho');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, currentProject.sceneGraph]);

  // ─── 9. CAMERA VIEW ALIGNMENT ─────────────────────────────────────────────
  const handleCameraView = (view: 'perspective' | 'top' | 'front' | 'right' | 'ortho') => {
    const cam = cameraRef.current;
    const controls = controlsRef.current;
    if (!cam || !controls) return;

    const dist = cam.position.distanceTo(controls.target) || 7;

    if (view === 'ortho') {
      isOrthoRef.current = !isOrthoRef.current;
      showToast(isOrthoRef.current ? 'View: Orthographic' : 'View: Perspective');
      return;
    }

    if (view === 'top') {
      cam.position.set(controls.target.x, controls.target.y + dist, controls.target.z);
      showToast('View: Top (Num 7)');
    } else if (view === 'front') {
      cam.position.set(controls.target.x, controls.target.y, controls.target.z + dist);
      showToast('View: Front (Num 1)');
    } else if (view === 'right') {
      cam.position.set(controls.target.x + dist, controls.target.y, controls.target.z);
      showToast('View: Right (Num 3)');
    } else if (view === 'perspective') {
      cam.position.set(controls.target.x + dist * 0.6, controls.target.y + dist * 0.5, controls.target.z + dist * 0.7);
      isOrthoRef.current = false;
      showToast('View: User Perspective');
    }

    cam.lookAt(controls.target);
    controls.update();
  };

  // ─── 10. ORIENTATION COMPASS SNAP ─────────────────────────────────────────
  const handleSnapAxis = (axis: 'X' | 'Y' | 'Z' | '-X' | '-Y' | '-Z') => {
    const cam = cameraRef.current;
    const controls = controlsRef.current;
    if (!cam || !controls) return;

    const dist = 7;
    if (axis === 'X') cam.position.set(dist, 0, 0);
    else if (axis === '-X') cam.position.set(-dist, 0, 0);
    else if (axis === 'Y') cam.position.set(0, dist, 0);
    else if (axis === '-Y') cam.position.set(0, -dist, 0);
    else if (axis === 'Z') cam.position.set(0, 0, dist);
    else if (axis === '-Z') cam.position.set(0, 0, -dist);

    cam.lookAt(0, 0, 0);
    controls.update();
    showToast(`Snapped to ${axis} View`);
  };

  // ─── 11. ADD PRIMITIVES ───────────────────────────────────────────────────
  const handleAddPrimitive = (type: 'cube' | 'sphere' | 'cylinder' | 'torus' | 'cone' | 'monkey') => {
    const newId = `node_${type}_${Date.now()}`;
    const name = type.charAt(0).toUpperCase() + type.slice(1);

    const newNode: SceneNode = {
      id: newId,
      name,
      type: 'mesh',
      geometryType: type,
      visible: true,
      transform: {
        position: { x: cursor3D.x, y: cursor3D.y + 1, z: cursor3D.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: { color: type === 'monkey' ? '#f59e0b' : '#cccccc', roughness: 0.5, metalness: 0.1 },
    };

    addSceneNode(newNode);
    setSelectedNodeId(newId);
    showToast(`Added ${name} Primitive`);
  };

  // ─── 12. DUPLICATE & RESET ────────────────────────────────────────────────
  const handleDuplicateSelected = () => {
    if (!selectedNodeId) return;
    const src = currentProject.sceneGraph.find((n) => n.id === selectedNodeId);
    if (!src) return;

    const dupNode: SceneNode = {
      ...JSON.parse(JSON.stringify(src)),
      id: `node_dup_${Date.now()}`,
      name: `${src.name}_Copy`,
      transform: {
        ...src.transform,
        position: {
          x: src.transform.position.x + 1.2,
          y: src.transform.position.y,
          z: src.transform.position.z,
        },
      },
    };

    addSceneNode(dupNode);
    setSelectedNodeId(dupNode.id);
    showToast(`Duplicated: ${dupNode.name}`);
  };

  const handleResetScene = () => {
    // Reset to default Blender Cube
    const defaultCube: SceneNode = {
      id: 'node_default_cube',
      name: 'Cube',
      type: 'mesh',
      geometryType: 'cube',
      visible: true,
      transform: { position: { x: 0, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      material: { color: '#cccccc', roughness: 0.5, metalness: 0.1 },
    };

    useEngineStore.setState((s) => ({
      currentProject: {
        ...s.currentProject,
        sceneGraph: [defaultCube],
      },
      selectedNodeId: 'node_default_cube',
    }));

    showToast('Reset Scene to Default Blender Cube');
  };

  // ─── 13. FILE LOADING (OPEN, IMPORT, APPEND) ──────────────────────────────
  const handleFilePicked = (file: File, mode: 'open' | 'import' | 'append') => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    showToast(`Loading ${file.name}...`);

    const reader = new FileReader();

    if (ext === 'glb' || ext === 'gltf') {
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const loader = new GLTFLoader();
        loader.parse(
          buffer,
          '',
          (gltf) => {
            mountLoadedModel(gltf.scene, file.name, mode);
          },
          (err) => {
            console.error(err);
            showToast(`Failed to parse GLTF: ${err.message}`);
          }
        );
      };
      reader.readAsArrayBuffer(file);
    } else if (ext === 'obj') {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const loader = new OBJLoader();
        const obj = loader.parse(text);
        mountLoadedModel(obj, file.name, mode);
      };
      reader.readAsText(file);
    } else if (ext === 'stl') {
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const loader = new STLLoader();
        const geom = loader.parse(buffer);
        const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 });
        const mesh = new THREE.Mesh(geom, mat);
        const group = new THREE.Group();
        group.add(mesh);
        mountLoadedModel(group, file.name, mode);
      };
      reader.readAsArrayBuffer(file);
    } else {
      showToast(`Unsupported format: .${ext}. Supported: .glb, .gltf, .obj, .stl`);
    }
  };

  const mountLoadedModel = (loadedObj: THREE.Object3D, fileName: string, mode: 'open' | 'import' | 'append') => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Center and Normalize Model Scale
    const bbox = new THREE.Box3().setFromObject(loadedObj);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const targetScale = 3 / maxDim; // scale to fit nicely in studio view

    loadedObj.position.sub(center.multiplyScalar(targetScale));
    loadedObj.position.y += (size.y * targetScale) / 2; // place on floor
    loadedObj.scale.set(targetScale, targetScale, targetScale);

    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const newNodeId = `node_model_${Date.now()}`;

    (loadedObj as any).userData = { nodeId: newNodeId };

    const newNode: SceneNode = {
      id: newNodeId,
      name: baseName,
      type: 'mesh',
      geometryType: 'custom',
      visible: true,
      transform: {
        position: { x: loadedObj.position.x, y: loadedObj.position.y, z: loadedObj.position.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: targetScale, y: targetScale, z: targetScale },
      },
      material: { color: '#cccccc', roughness: 0.5, metalness: 0.1 },
    };

    if (mode === 'open') {
      // Clear old meshes
      objectMapRef.current.forEach((obj) => scene.remove(obj));
      objectMapRef.current.clear();

      scene.add(loadedObj);
      objectMapRef.current.set(newNodeId, loadedObj);

      useEngineStore.setState((s) => ({
        currentProject: {
          ...s.currentProject,
          name: baseName,
          sceneGraph: [newNode],
        },
        selectedNodeId: newNodeId,
      }));

      showToast(`Opened "${fileName}" in Blender Workstation`);
    } else {
      // Append / Import into scene
      scene.add(loadedObj);
      objectMapRef.current.set(newNodeId, loadedObj);

      addSceneNode(newNode);
      setSelectedNodeId(newNodeId);

      showToast(`Appended "${fileName}" into Scene`);
    }
  };

  // ─── 14. EXPORTING (GLB, OBJ, STL) ────────────────────────────────────────
  const handleExport = (format: 'glb' | 'obj' | 'stl') => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Export entire scene (or selected object if exists)
    const exportTarget = selectedNodeId && objectMapRef.current.get(selectedNodeId)
      ? objectMapRef.current.get(selectedNodeId)!
      : scene;

    const baseName = currentProject.name.replace(/\s+/g, '_') || 'I3DION_Scene';

    if (format === 'glb') {
      const exporter = new GLTFExporter();
      exporter.parse(
        exportTarget,
        (result) => {
          const blob = new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' });
          downloadBlob(blob, `${baseName}.glb`);
          showToast(`Exported "${baseName}.glb"`);
        },
        (error) => console.error(error),
        { binary: true }
      );
    } else if (format === 'obj') {
      const exporter = new OBJExporter();
      const result = exporter.parse(exportTarget);
      const blob = new Blob([result], { type: 'text/plain' });
      downloadBlob(blob, `${baseName}.obj`);
      showToast(`Exported "${baseName}.obj"`);
    } else if (format === 'stl') {
      const exporter = new STLExporter();
      const result = exporter.parse(exportTarget, { binary: true });
      const blob = new Blob([result], { type: 'application/octet-stream' });
      downloadBlob(blob, `${baseName}.stl`);
      showToast(`Exported "${baseName}.stl"`);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── 15. SAVE DIRECTLY TO I3DION SPATIAL VAULT ────────────────────────────
  const handleSaveToVault = async () => {
    const scene = sceneRef.current;
    if (!scene) return;

    setIsSavingVault(true);
    showToast('Exporting model & syncing directly to I3DION Spatial Vault...');

    try {
      const exporter = new GLTFExporter();
      exporter.parse(
        scene,
        async (gltfBuffer) => {
          try {
            const glbBlob = new Blob([gltfBuffer as ArrayBuffer], { type: 'model/gltf-binary' });
            const modelFileName = `${(currentProject.name || 'Model').replace(/\s+/g, '_')}.glb`;
            const file = new File([glbBlob], modelFileName, { type: 'model/gltf-binary' });

            // Upload directly to Spatial Vault
            await vaultApi.uploadAsset(file, {
              name: currentProject.name || 'Industrial 3D Model',
              description: currentProject.description || 'Exported from Blender 3D Workstation',
              type: '3D Model',
              category: '3D CAD',
              visibility: 'Organization',
            });

            setIsSavingVault(false);
            setVaultSaveSuccess(true);
            setTimeout(() => setVaultSaveSuccess(false), 4000);

            useEngineStore.setState({ autosaveStatus: 'saved' });
            showToast(`Saved & Synced "${modelFileName}" to I3DION Spatial Vault!`);
          } catch (uploadErr: any) {
            console.error('Vault upload error:', uploadErr);
            setIsSavingVault(false);
            showToast(`Vault upload failed: ${uploadErr.message || 'Offline fallback active'}`);
          }
        },
        (err) => {
          console.error(err);
          setIsSavingVault(false);
          showToast(`Export failed: ${err}`);
        },
        { binary: true }
      );
    } catch (e: any) {
      setIsSavingVault(false);
      showToast(`Save error: ${e.message}`);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full bg-[#343434] relative overflow-hidden flex flex-col select-none focus:outline-none"
    >
      {/* 1. Blender Top Menu Bar */}
      <BlenderTopMenu
        onOpenFilePicker={() => openFileInputRef.current?.click()}
        onImportFilePicker={(format) => importFileInputRef.current?.click()}
        onAppendFilePicker={() => appendFileInputRef.current?.click()}
        onExport={handleExport}
        onSaveToVault={handleSaveToVault}
        onAddPrimitive={handleAddPrimitive}
        onResetScene={handleResetScene}
        onDeleteSelected={() => selectedNodeId && deleteSceneNode(selectedNodeId)}
        onDuplicateSelected={handleDuplicateSelected}
        onSelectAll={() => currentProject.sceneGraph[0] && setSelectedNodeId(currentProject.sceneGraph[0].id)}
        onDeselectAll={() => setSelectedNodeId(null)}
        onCameraView={handleCameraView}
        isSavingVault={isSavingVault}
        vaultSaveSuccess={vaultSaveSuccess}
      />

      {/* 2. Hidden Native File Inputs */}
      <input
        ref={openFileInputRef}
        type="file"
        accept=".glb,.gltf,.obj,.stl"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFilePicked(file, 'open');
          e.target.value = '';
        }}
      />
      <input
        ref={importFileInputRef}
        type="file"
        accept=".glb,.gltf,.obj,.stl"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFilePicked(file, 'import');
          e.target.value = '';
        }}
      />
      <input
        ref={appendFileInputRef}
        type="file"
        accept=".glb,.gltf,.obj,.stl"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFilePicked(file, 'append');
          e.target.value = '';
        }}
      />

      {/* 3. Central WebGL 3D Canvas */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full block focus:outline-none"
        />

        {/* 4. Left Blender Tool Shelf (T-Shelf) */}
        <BlenderToolShelf onOpenAddMenu={() => handleAddPrimitive('cube')} />

        {/* 5. Top-Right Blender 3D Orientation Compass */}
        <BlenderOrientationCompass
          cameraAngles={cameraAngles}
          onSnapAxis={handleSnapAxis}
        />

        {/* 6. Right Blender Properties Sidebar (N-Panel) */}
        <BlenderNPanel onCameraView={handleCameraView} />

        {/* 7. Action Feedback Toast Notification */}
        {toastMessage && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-[#1e1e1e]/95 border border-[#444] text-white px-4 py-2 rounded-lg shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-[#ea7600] animate-ping" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* 8. Bottom Blender Status Bar */}
      <BlenderStatusBar stats={stats} />
    </div>
  );
};

export default EngineViewportCanvas;
