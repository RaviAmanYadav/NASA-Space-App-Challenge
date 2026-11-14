import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Activity, Eye, RotateCcw, Scan, Upload, Waves } from "lucide-react";

import { Button } from "@/components/ui/button";
import astronautAsset from "@/assets/astronaut.glb";
// import astronautAsset from "../../assets/astronaut.glb?url";
import { subsystems, type SubsystemId, type Vitals } from "@/lib/mission-data";

type Props = {
  vitals: Vitals;
  anomalyActive: boolean;
  activeSubsystem: SubsystemId | null;
  onSelectSubsystem: (id: SubsystemId | null) => void;
};
type Spot = (typeof subsystems)[number] & {
  x: number;
  y: number;
  visible: boolean;
};

function metricFor(id: SubsystemId, vitals: Vitals) {
  if (id === "THORAX_CARDIO") return `${vitals.hr} BPM`;
  if (id === "CRANIUM_SANS") return `${vitals.icp.toFixed(1)} mmHg`;
  if (id === "SUIT_DOSIMETRY") return `${vitals.co2.toFixed(1)} mmHg`;
  return `${vitals.bmd.toFixed(1)}%/mo`;
}

function getDesignColor(tokenName: string, fallback: string) {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return fallback;
  probe.fillStyle = fallback;
  const tokenValue = getComputedStyle(document.documentElement)
    .getPropertyValue(tokenName)
    .trim();
  if (tokenValue) probe.fillStyle = tokenValue;
  return probe.fillStyle;
}

function prepareModel(model: THREE.Group) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  if (size.y <= 0) throw new Error("The model has no visible height.");
  model.scale.setScalar(1.82 / size.y);
  const scaledBounds = new THREE.Box3().setFromObject(model);
  const center = scaledBounds.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -scaledBounds.min.y, -center.z);
  model.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return model;
}

function disposeModel(model: THREE.Group) {
  model.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const materials = Array.isArray(obj.material)
        ? obj.material
        : [obj.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

const hotspotPoints: Record<SubsystemId, THREE.Vector3> = {
  CRANIUM_SANS: new THREE.Vector3(0, 1.59, 0.18),
  THORAX_CARDIO: new THREE.Vector3(0, 1.12, 0.25),
  SUIT_DOSIMETRY: new THREE.Vector3(0.34, 1.12, -0.14),
  LOWER_EXTREMITIES: new THREE.Vector3(-0.13, 0.38, 0.12),
};

export function AstronautViewport({
  vitals,
  anomalyActive,
  activeSubsystem,
  onSelectSubsystem,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const twinRef = useRef<THREE.Group | null>(null);
  const loadedModelRef = useRef<THREE.Group | null>(null);
  const focusCameraRef = useRef<((id: SubsystemId | null) => void) | null>(
    null,
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [modelName, setModelName] = useState("TRAINING DIGITAL TWIN");
  const [modelError, setModelError] = useState("");
  const [wireframe, setWireframe] = useState(false);
  const [autoOrbit, setAutoOrbit] = useState(true);
  const controlsRef = useRef({
    wireframe,
    autoOrbit,
    anomalyActive,
    activeSubsystem,
  });

  useEffect(() => {
    controlsRef.current = {
      wireframe,
      autoOrbit,
      anomalyActive,
      activeSubsystem,
    };
  }, [wireframe, autoOrbit, anomalyActive, activeSubsystem]);

  useEffect(() => {
    focusCameraRef.current?.(activeSubsystem);
  }, [activeSubsystem]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const colors = {
      background: getDesignColor("--twin-background", "#f2f5f4"),
      light: getDesignColor("--twin-light", "#ffffff"),
      groundLight: getDesignColor("--twin-ground-light", "#73828a"),
      fill: getDesignColor("--twin-fill", "#5fb3b5"),
      grid: getDesignColor("--twin-grid", "#95aaa9"),
      gridLight: getDesignColor("--twin-grid-light", "#d4ddda"),
      accent: getDesignColor("--twin-accent", "#168c8d"),
      body: getDesignColor("--twin-body", "#e7ecea"),
      pack: getDesignColor("--twin-pack", "#cbd4d2"),
      joint: getDesignColor("--twin-joint", "#677a7c"),
      visor: getDesignColor("--twin-visor", "#24687a"),
      legs: getDesignColor("--twin-legs", "#dce5e2"),
      heart: getDesignColor("--twin-heart", "#48a989"),
      alert: getDesignColor("--twin-alert", "#d66352"),
    };
    scene.background = new THREE.Color(colors.background);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 40);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;

    scene.add(
      new THREE.HemisphereLight(colors.light, colors.groundLight, 2.15),
    );
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(colors.fill, 1.3);
    fillLight.position.set(-3, 2, -3);
    scene.add(fillLight);

    const ground = new THREE.GridHelper(4.6, 20, colors.grid, colors.gridLight);
    ground.position.y = -0.015;
    scene.add(ground);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: colors.accent,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const base = new THREE.Mesh(
      new THREE.RingGeometry(0.43, 0.48, 64),
      ringMaterial,
    );
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.003;
    scene.add(base);
    const scanMaterial = new THREE.MeshBasicMaterial({
      color: colors.accent,
      transparent: true,
      opacity: 0.62,
    });
    const scan = new THREE.Mesh(
      new THREE.TorusGeometry(0.47, 0.008, 8, 80),
      scanMaterial,
    );
    scan.rotation.x = Math.PI / 2;
    scene.add(scan);

    const standard = (color: string, metalness = 0.15, roughness = 0.48) =>
      new THREE.MeshStandardMaterial({ color, metalness, roughness });
    const bodyMat = standard(colors.body);
    const packMat = standard(colors.pack, 0.35, 0.4);
    const jointMat = standard(colors.joint, 0.35, 0.42);
    const visorMat = new THREE.MeshStandardMaterial({
      color: colors.visor,
      metalness: 0.8,
      roughness: 0.16,
      transparent: true,
      opacity: 0.88,
    });
    const legMat = standard(colors.legs, 0.16, 0.5);
    const heartMat = new THREE.MeshBasicMaterial({ color: colors.heart });
    const materials = [bodyMat, packMat, jointMat, visorMat, legMat];
    const twin = new THREE.Group();
    const limb = (
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      position: [number, number, number],
      rotation: [number, number, number] = [0, 0, 0],
    ) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      twin.add(mesh);
      return mesh;
    };

    limb(new THREE.SphereGeometry(0.18, 32, 24), bodyMat, [0, 1.58, 0]);
    limb(new THREE.SphereGeometry(0.152, 32, 24), visorMat, [0, 1.58, 0.05]);
    limb(
      new THREE.CylinderGeometry(0.13, 0.145, 0.075, 24),
      jointMat,
      [0, 1.38, 0],
    );
    limb(new THREE.CapsuleGeometry(0.19, 0.3, 8, 20), bodyMat, [0, 1.08, 0]);
    limb(new THREE.BoxGeometry(0.22, 0.18, 0.08), packMat, [0, 1.12, 0.19]);
    limb(
      new THREE.SphereGeometry(0.045, 20, 16),
      heartMat,
      [-0.035, 1.12, 0.245],
    );
    limb(new THREE.BoxGeometry(0.4, 0.53, 0.2), packMat, [0, 1.12, -0.17]);
    limb(
      new THREE.CylinderGeometry(0.19, 0.2, 0.13, 24),
      jointMat,
      [0, 0.78, 0],
    );
    for (const side of [-1, 1]) {
      limb(new THREE.SphereGeometry(0.08, 20, 16), jointMat, [
        side * 0.26,
        1.27,
        0,
      ]);
      limb(
        new THREE.CapsuleGeometry(0.055, 0.2, 6, 14),
        packMat,
        [side * 0.31, 1.08, 0],
        [0, 0, side * -0.14],
      );
      limb(
        new THREE.CapsuleGeometry(0.052, 0.2, 6, 14),
        packMat,
        [side * 0.35, 0.84, 0.04],
        [0.22, 0, 0],
      );
      limb(new THREE.SphereGeometry(0.055, 16, 12), jointMat, [
        side * 0.35,
        0.68,
        0.08,
      ]);
      limb(new THREE.CapsuleGeometry(0.065, 0.23, 6, 14), legMat, [
        side * 0.105,
        0.52,
        0,
      ]);
      limb(new THREE.SphereGeometry(0.064, 16, 12), jointMat, [
        side * 0.105,
        0.34,
        0,
      ]);
      limb(new THREE.CapsuleGeometry(0.054, 0.2, 6, 14), legMat, [
        side * 0.105,
        0.15,
        0,
      ]);
      limb(new THREE.BoxGeometry(0.12, 0.075, 0.18), jointMat, [
        side * 0.105,
        0.025,
        0.045,
      ]);
    }
    scene.add(twin);
    twinRef.current = twin;

    let disposed = false;
    new GLTFLoader().load(
      astronautAsset,
      (gltf) => {
        try {
          const model = prepareModel(gltf.scene);
          if (disposed) {
            disposeModel(model);
            return;
          }
          scene.add(model);
          loadedModelRef.current = model;
          twin.visible = false;
          setModelName("UPLOADED ASTRONAUT");
        } catch (error) {
          setModelError(
            error instanceof Error
              ? error.message
              : "This model could not be loaded.",
          );
        }
      },
      undefined,
      () => setModelError("The uploaded astronaut model could not be loaded."),
    );

    let radius = 3.15;
    let theta = 0.28;
    let phi = 1.35;
    let dragging = false;
    let pointer = { x: 0, y: 0 };
    let target = new THREE.Vector3(0, 0.93, 0);
    let current = target.clone();
    const resetCamera = () => {
      radius = 3.15;
      theta = 0.28;
      phi = 1.35;
      target = new THREE.Vector3(0, 0.93, 0);
      current.copy(target);
    };
    focusCameraRef.current = (id) => {
      if (!id) {
        resetCamera();
        return;
      }
      target.copy(hotspotPoints[id]);
      radius = 2.35;
      theta = 0.28;
    };
    let frame = 0;
    let lastProjection = 0;
    const onDown = (event: PointerEvent) => {
      dragging = true;
      pointer = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture?.(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      theta -= (event.clientX - pointer.x) * 0.008;
      phi = THREE.MathUtils.clamp(
        phi - (event.clientY - pointer.y) * 0.007,
        0.42,
        2.35,
      );
      pointer = { x: event.clientX, y: event.clientY };
    };
    const onUp = () => {
      dragging = false;
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      radius = THREE.MathUtils.clamp(radius + event.deltaY * 0.0013, 1.45, 3.6);
    };
    const resizeObserver = new ResizeObserver(() => {
      camera.aspect =
        Math.max(container.clientWidth, 1) /
        Math.max(container.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const clock = new THREE.Clock();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const state = controlsRef.current;
      if (state.autoOrbit && !dragging && !state.activeSubsystem)
        theta += 0.003;
      materials.forEach((material) => {
        material.wireframe = state.wireframe;
      });
      const alertColor = state.anomalyActive ? colors.alert : colors.accent;
      scanMaterial.color.set(alertColor);
      ringMaterial.color.set(alertColor);
      scan.position.y = 0.08 + ((Math.sin(elapsed * 1.15) + 1) / 2) * 1.55;
      heartMat.color.set(state.anomalyActive ? colors.alert : colors.heart);
      const selected = state.activeSubsystem;
      bodyMat.emissive.set(
        state.anomalyActive && selected === "CRANIUM_SANS"
          ? colors.alert
          : selected === "CRANIUM_SANS"
            ? colors.accent
            : "#000000",
      );
      packMat.emissive.set(
        state.anomalyActive &&
          (selected === "SUIT_DOSIMETRY" || selected === "THORAX_CARDIO")
          ? colors.alert
          : selected === "SUIT_DOSIMETRY" || selected === "THORAX_CARDIO"
            ? colors.accent
            : "#000000",
      );
      legMat.emissive.set(
        state.anomalyActive && selected === "LOWER_EXTREMITIES"
          ? colors.alert
          : selected === "LOWER_EXTREMITIES"
            ? colors.accent
            : "#000000",
      );
      const pulse = state.anomalyActive
        ? 1.15 + Math.sin(elapsed * 8) * 0.12
        : 1 + Math.sin(elapsed * 4) * 0.06;
      twin.scale.set(1, pulse, 1);
      current.lerp(target, 0.08);
      camera.position.set(
        current.x + radius * Math.sin(phi) * Math.sin(theta),
        current.y + radius * Math.cos(phi),
        current.z + radius * Math.sin(phi) * Math.cos(theta),
      );
      camera.lookAt(current);
      renderer.render(scene, camera);

      if (elapsed * 1000 - lastProjection > 95) {
        lastProjection = elapsed * 1000;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const projected = subsystems.map((spot) => {
          const vec = hotspotPoints[spot.id].clone().project(camera);
          return {
            ...spot,
            x: (vec.x * 0.5 + 0.5) * width,
            y: (-vec.y * 0.5 + 0.5) * height,
            visible: vec.z < 1 && vec.z > -1,
          };
        });
        setSpots(projected);
      }
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      const loaded = loadedModelRef.current;
      if (loaded) {
        scene.remove(loaded);
        disposeModel(loaded);
        loadedModelRef.current = null;
      }
      disposeModel(twin);
      sceneRef.current = null;
      twinRef.current = null;
      focusCameraRef.current = null;
      scene.remove(ground, base, scan, twin);
      renderer.dispose();
    };
  }, []);

  const resetView = () => {
    focusCameraRef.current?.(null);
    onSelectSubsystem(null);
  };

  const loadModel = async (file: File | undefined) => {
    if (!file) return;
    setModelError("");
    try {
      const buffer = await file.arrayBuffer();
      const loader = new GLTFLoader();
      const gltf = await new Promise<{ scene: THREE.Group }>(
        (resolve, reject) => loader.parse(buffer, "", resolve, reject),
      );
      const model = prepareModel(gltf.scene);
      const scene = sceneRef.current;
      if (!scene) throw new Error("The 3D view is not ready yet.");
      const previous = loadedModelRef.current;
      if (previous) scene.remove(previous);
      if (twinRef.current) twinRef.current.visible = false;
      scene.add(model);
      loadedModelRef.current = model;
      if (previous) disposeModel(previous);
      focusCameraRef.current?.(null);
      onSelectSubsystem(null);
      setModelName(file.name);
    } catch (error) {
      setModelError(
        error instanceof Error
          ? error.message
          : "This model could not be loaded.",
      );
    }
  };

  const selectedSpot = subsystems.find((spot) => spot.id === activeSubsystem);

  return (
    <section
      className="mission-panel twin-panel"
      aria-label="Interactive astronaut digital twin"
    >
      <div className="twin-canvas" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="twin-webgl"
          aria-label="Rotatable 3D astronaut training model"
        />
        <div className="twin-topline">
          <div className="twin-ident">
            <span className="twin-live">
              <Activity size={12} /> SIMULATED
            </span>
            <span className="twin-model-name">{modelName}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="model-upload"
            onClick={() => fileRef.current?.click()}
            title="Load a single-file .glb astronaut model"
          >
            <Upload size={14} /> Model
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".glb,model/gltf-binary"
            className="sr-only"
            aria-label="Choose a single-file GLB model"
            onChange={(event) => {
              void loadModel(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
        {modelError && (
          <div className="model-error" role="status">
            {modelError}
          </div>
        )}
        <div className="twin-target">
          <span>SUBSYSTEM TARGET</span>
          <strong>
            <Scan size={13} />
            {selectedSpot?.label ?? "FULL BODY"}
          </strong>
        </div>
        <div className="twin-hotspots" aria-label="Select a subsystem">
          {spots.map(
            (spot) =>
              spot.visible && (
                <button
                  key={spot.id}
                  className={`hotspot ${activeSubsystem === spot.id ? "hotspot-active" : ""} ${anomalyActive && (spot.id === "THORAX_CARDIO" || spot.id === activeSubsystem) ? "hotspot-alert" : ""}`}
                  style={{ left: `${spot.x}px`, top: `${spot.y}px` }}
                  onClick={() =>
                    onSelectSubsystem(
                      activeSubsystem === spot.id ? null : spot.id,
                    )
                  }
                  aria-pressed={activeSubsystem === spot.id}
                >
                  <span className="hotspot-dot" />
                  {spot.shortName}
                  <span className="hotspot-metric">
                    {metricFor(spot.id, vitals)}
                  </span>
                </button>
              ),
          )}
        </div>
        {selectedSpot && (
          <div className="twin-context">
            <strong>{selectedSpot.shortName}</strong>
            <span>{selectedSpot.description}</span>
            <span className="twin-baseline">
              BASELINE {selectedSpot.baseline}
            </span>
          </div>
        )}
        <div className="twin-controls">
          <div className="twin-control-set">
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw size={13} /> Reset
            </Button>
            <Button
              variant={wireframe ? "default" : "outline"}
              size="sm"
              onClick={() => setWireframe((value) => !value)}
            >
              <Waves size={13} /> Wireframe
            </Button>
            <Button
              variant={autoOrbit ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoOrbit((value) => !value)}
            >
              <Eye size={13} /> Orbit
            </Button>
          </div>
          <div className="twin-shortcuts">
            {subsystems.map((spot) => (
              <Button
                key={spot.id}
                variant={activeSubsystem === spot.id ? "default" : "ghost"}
                size="sm"
                title={spot.label}
                onClick={() =>
                  onSelectSubsystem(
                    activeSubsystem === spot.id ? null : spot.id,
                  )
                }
              >
                {spot.shortName}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
