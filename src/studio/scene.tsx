import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  backdropHex,
  gelHex,
  lightPosition,
  mixHex,
  type LightSpec,
} from "./data";
import { useStudio } from "./store";

function buildCove(lip = 5, sweep = 1.5, wall = 5) {
  const pts: THREE.Vector2[] = [];
  const arcSteps = 20;
  for (let i = 0; i <= arcSteps; i++) {
    const a = (i / arcSteps) * (Math.PI / 2);
    pts.push(new THREE.Vector2(lip + Math.sin(a) * sweep, (1 - Math.cos(a)) * sweep));
  }
  for (let i = 1; i <= 8; i++) {
    pts.push(new THREE.Vector2(lip + sweep, sweep + (i / 8) * wall));
  }
  const geo = new THREE.LatheGeometry(pts, 72);
  geo.computeVertexNormals();
  return geo;
}

function StudioEnv() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.06);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.38;
    return () => {
      scene.environment = null;
      env.texture.dispose();
      pmrem.dispose();
      room.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
        else material?.dispose();
      });
    };
  }, [gl, scene]);
  return null;
}

function Exposure() {
  const exposure = useStudio((s) => s.exposure);
  const gl = useThree((s) => s.gl);
  useLayoutEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  return null;
}

function FocalLength() {
  const focal = useStudio((s) => s.focal);
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.fov = (2 * Math.atan(12 / focal) * 180) / Math.PI;
    camera.updateProjectionMatrix();
  }, [camera, focal]);
  return null;
}

function CameraReset() {
  const token = useStudio((s) => s.cameraToken);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target: THREE.Vector3; update: () => void } | null;
  useEffect(() => {
    if (token === 0) return;
    camera.position.set(1.7, 1.18, 4.55);
    if (controls?.target) {
      controls.target.set(0, 0.68, 0);
      controls.update();
    }
  }, [token, camera, controls]);
  return null;
}

function CaptureBridge() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const setCapture = useStudio((s) => s.setCapture);
  const setReady = useStudio((s) => s.setReady);
  const armed = useRef(false);

  useEffect(() => {
    setCapture(() => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL("image/jpeg", 0.92);
    });
    return () => setCapture(null);
  }, [gl, scene, camera, setCapture]);

  useFrame(() => {
    if (armed.current) return;
    armed.current = true;
    setReady(true);
    window.__lumenReady = true;
  });

  return null;
}

function StudioSpot({ spec, castShadow }: { spec: LightSpec; castShadow?: boolean }) {
  const light = useRef<THREE.SpotLight>(null);
  const target = useRef<THREE.Object3D>(null);
  const showGuides = useStudio((s) => s.showGuides);
  const guide = useRef<THREE.Mesh>(null);
  const position = lightPosition(spec);
  const color = gelHex(spec.gel);

  useLayoutEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
    guide.current?.lookAt(0, 0.7, 0);
  });

  return (
    <>
      <object3D ref={target} position={[0, 0.7, 0]} />
      <spotLight
        ref={light}
        position={position}
        color={color}
        intensity={spec.intensity}
        angle={0.66}
        penumbra={0.88}
        decay={2}
        distance={30}
        castShadow={castShadow}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00025}
        shadow-normalBias={0.05}
      />
      {showGuides ? (
        <mesh ref={guide} position={position}>
          <planeGeometry args={[0.7, 0.42]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ) : null}
    </>
  );
}

function Lights() {
  const key = useStudio((s) => s.key);
  const fill = useStudio((s) => s.fill);
  const rim = useStudio((s) => s.rim);
  const backdropId = useStudio((s) => s.backdropId);
  const sky = backdropHex(backdropId);
  return (
    <>
      <hemisphereLight args={[sky, mixHex(sky, "#1a1208", 0.45), 0.42]} />
      <StudioSpot spec={key} castShadow />
      <StudioSpot spec={fill} />
      <StudioSpot spec={rim} />
    </>
  );
}

function Cove() {
  const backdropId = useStudio((s) => s.backdropId);
  const color = backdropHex(backdropId);
  const geo = useMemo(() => buildCove(), []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <>
      <color attach="background" args={[color]} />
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial color={color} roughness={0.97} metalness={0} side={THREE.DoubleSide} envMapIntensity={0.04} />
      </mesh>
    </>
  );
}

function Stage() {
  const backdropId = useStudio((s) => s.backdropId);
  const gloss = useStudio((s) => s.floorGloss);
  const color = backdropHex(backdropId);
  const disc = mixHex(color, "#1a1208", color === "#14181e" || color === "#3a3a3a" ? 0.08 : 0.22);
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]} receiveShadow>
        <circleGeometry args={[4.9, 72]} />
        <meshStandardMaterial
          color={color}
          roughness={0.92 - gloss * 0.45}
          metalness={gloss * 0.42}
          envMapIntensity={0.35 + gloss * 0.4}
        />
      </mesh>
      <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.12, 1.16, 0.05, 48]} />
        <meshStandardMaterial color={disc} roughness={0.48} metalness={0.18} />
      </mesh>
    </>
  );
}

const glass = {
  transmission: 1,
  thickness: 0.85,
  roughness: 0.04,
  metalness: 0,
  ior: 1.5,
  transparent: true,
  envMapIntensity: 1.15,
} as const;

function Flacon() {
  return (
    <group scale={0.9}>
      <RoundedBox args={[0.74, 1.05, 0.42]} radius={0.08} smoothness={5} position={[0, 0.56, 0]} castShadow>
        <meshPhysicalMaterial color="#f7f1f2" {...glass} />
      </RoundedBox>
      <RoundedBox args={[0.52, 0.62, 0.22]} radius={0.05} smoothness={4} position={[0, 0.4, 0]}>
        <meshStandardMaterial color="#b83b4e" roughness={0.32} />
      </RoundedBox>
      <mesh position={[0, 0.58, 0.23]}>
        <planeGeometry args={[0.26, 0.32]} />
        <meshStandardMaterial color="#c6a15a" metalness={0.9} roughness={0.32} />
      </mesh>
      <mesh position={[0, 1.18, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 0.2, 32]} />
        <meshPhysicalMaterial color="#f7f1f2" {...glass} thickness={0.3} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.28, 32]} />
        <meshStandardMaterial color="#c6a15a" metalness={1} roughness={0.22} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.04, 32]} />
        <meshStandardMaterial color="#8d6a30" metalness={1} roughness={0.35} />
      </mesh>
    </group>
  );
}

function SecondHand() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z -= Math.min(delta, 0.1) * ((Math.PI * 2) / 10);
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.11, 0.034]}>
        <boxGeometry args={[0.008, 0.2, 0.004]} />
        <meshStandardMaterial color="#e2a04a" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Chrono() {
  return (
    <group>
      <RoundedBox args={[0.34, 0.52, 0.08]} radius={0.04} position={[0, 0.26, -0.02]} castShadow>
        <meshStandardMaterial color="#2a241f" roughness={0.78} />
      </RoundedBox>
      <RoundedBox args={[0.32, 0.62, 0.07]} radius={0.05} position={[0, 1.22, -0.02]} castShadow>
        <meshStandardMaterial color="#2a241f" roughness={0.78} />
      </RoundedBox>
      <group position={[0, 0.78, 0.04]}>
        <mesh rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.1, 48]} />
          <meshStandardMaterial color="#d7dbe2" metalness={1} roughness={0.16} />
        </mesh>
        <mesh position={[0, 0, 0.055]}>
          <torusGeometry args={[0.33, 0.042, 16, 48]} />
          <meshStandardMaterial color="#c5cad2" metalness={1} roughness={0.18} />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <circleGeometry args={[0.28, 48]} />
          <meshStandardMaterial color="#14171c" roughness={0.5} metalness={0.25} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const major = i % 3 === 0;
          return (
            <mesh key={i} position={[Math.sin(a) * 0.22, Math.cos(a) * 0.22, 0.086]} rotation-z={-a}>
              <boxGeometry args={[major ? 0.02 : 0.012, major ? 0.06 : 0.036, 0.005]} />
              <meshStandardMaterial color={major ? "#e2a04a" : "#e6e1d8"} metalness={0.75} roughness={0.28} />
            </mesh>
          );
        })}
        <mesh position={[0, 0.06, 0.092]}>
          <boxGeometry args={[0.018, 0.12, 0.006]} />
          <meshStandardMaterial color="#f3eee6" metalness={0.7} roughness={0.25} />
        </mesh>
        <group rotation-z={-1.15}>
          <mesh position={[0, 0.085, 0.096]}>
            <boxGeometry args={[0.014, 0.17, 0.005]} />
            <meshStandardMaterial color="#f3eee6" metalness={0.65} roughness={0.25} />
          </mesh>
        </group>
        <SecondHand />
        <mesh position={[0, 0, 0.1]}>
          <circleGeometry args={[0.026, 20]} />
          <meshStandardMaterial color="#e2a04a" metalness={0.8} roughness={0.22} />
        </mesh>
        <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.09]}>
          <cylinderGeometry args={[0.29, 0.29, 0.02, 48]} />
          <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={0.2} roughness={0.02} transparent />
        </mesh>
        <mesh position={[0.44, 0, 0]} rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.1, 16]} />
          <meshStandardMaterial color="#d7dbe2" metalness={1} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

function Cans() {
  return (
    <group>
      <mesh position={[0, 0.24, 0]} castShadow>
        <torusGeometry args={[0.64, 0.05, 18, 48, Math.PI]} />
        <meshStandardMaterial color="#1b1b1b" metalness={0.45} roughness={0.38} />
      </mesh>
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 0.64, 0.24, 0]}>
          <mesh rotation-z={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.23, 0.23, 0.16, 32]} />
            <meshStandardMaterial color="#141414" metalness={0.5} roughness={0.42} />
          </mesh>
          <mesh position={[side * -0.09, 0, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.15, 0.15, 0.04, 24]} />
            <meshStandardMaterial color="#4a342c" roughness={0.88} />
          </mesh>
          <mesh rotation-z={Math.PI / 2}>
            <torusGeometry args={[0.23, 0.014, 10, 28]} />
            <meshStandardMaterial color="#b87333" metalness={1} roughness={0.24} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Prism() {
  const geo = useMemo(() => {
    const next = new THREE.OctahedronGeometry(0.62, 0).toNonIndexed();
    next.computeVertexNormals();
    return next;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} position={[0, 0.64, 0]} rotation-y={0.55} castShadow>
      <meshPhysicalMaterial
        color="#e2a04a"
        transmission={1}
        thickness={1.4}
        roughness={0.02}
        ior={2.15}
        metalness={0}
        transparent
        envMapIntensity={1.3}
      />
    </mesh>
  );
}

function Vessel() {
  const geo = useMemo(() => {
    const pts = [
      [0.02, 0],
      [0.28, 0.02],
      [0.34, 0.12],
      [0.22, 0.4],
      [0.18, 0.62],
      [0.32, 0.92],
      [0.36, 1.12],
      [0.16, 1.3],
      [0.18, 1.36],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 48);
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group>
      <mesh geometry={geo} castShadow>
        <meshPhysicalMaterial color="#e7d3c0" roughness={0.42} metalness={0} clearcoat={0.45} clearcoatRoughness={0.35} />
      </mesh>
      <mesh position={[0, 1.35, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.17, 0.012, 10, 32]} />
        <meshStandardMaterial color="#b8893d" metalness={1} roughness={0.28} />
      </mesh>
    </group>
  );
}

function Range() {
  return (
    <group position={[0, 0.4, 0]}>
      <RoundedBox args={[1.2, 0.74, 0.46]} radius={0.045} smoothness={4} castShadow>
        <meshStandardMaterial color="#1c1b19" roughness={0.62} metalness={0.18} />
      </RoundedBox>
      <RoundedBox args={[0.72, 0.12, 0.3]} radius={0.02} position={[0.05, 0.4, -0.02]} castShadow>
        <meshStandardMaterial color="#c8c4bb" metalness={0.86} roughness={0.26} />
      </RoundedBox>
      <mesh position={[0, 0.02, 0.28]} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.22, 32]} />
        <meshStandardMaterial color="#121212" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.02, 0.42]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.2, 0.2, 0.07, 32]} />
        <meshStandardMaterial color="#b8893d" metalness={1} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.02, 0.47]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 32]} />
        <meshPhysicalMaterial color="#10202a" transmission={0.55} roughness={0.05} thickness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0.32, 0.16, 0.24]}>
        <boxGeometry args={[0.18, 0.1, 0.02]} />
        <meshStandardMaterial color="#0c0c0c" metalness={0.4} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Halo() {
  return (
    <group position={[0, 0.58, 0]}>
      <mesh castShadow>
        <torusGeometry args={[0.46, 0.09, 24, 72]} />
        <meshStandardMaterial color="#e4c27a" metalness={1} roughness={0.16} />
      </mesh>
      <mesh rotation-y={Math.PI / 2} castShadow>
        <torusGeometry args={[0.46, 0.042, 20, 64]} />
        <meshStandardMaterial color="#ececf1" metalness={1} roughness={0.08} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.11, 32, 32]} />
        <meshPhysicalMaterial color="#f7f4ef" transmission={1} thickness={0.5} roughness={0} ior={2.1} transparent />
      </mesh>
    </group>
  );
}

function StillLife() {
  return (
    <group>
      <mesh position={[-0.26, 0.26, 0.04]} castShadow>
        <sphereGeometry args={[0.26, 48, 48]} />
        <meshStandardMaterial color="#f4f5f7" metalness={1} roughness={0.06} />
      </mesh>
      <mesh position={[0.22, 0.32, -0.04]} castShadow>
        <sphereGeometry args={[0.32, 48, 48]} />
        <meshStandardMaterial color="#ddd4c8" roughness={0.46} />
      </mesh>
      <mesh position={[0.02, 0.18, 0.26]} castShadow>
        <sphereGeometry args={[0.18, 48, 48]} />
        <meshPhysicalMaterial color="#d5efe8" transmission={1} thickness={0.7} roughness={0.02} ior={1.5} transparent />
      </mesh>
    </group>
  );
}

function Subject() {
  const id = useStudio((s) => s.subjectId);
  switch (id) {
    case "flacon":
      return <Flacon />;
    case "chrono":
      return <Chrono />;
    case "cans":
      return <Cans />;
    case "prism":
      return <Prism />;
    case "vessel":
      return <Vessel />;
    case "range":
      return <Range />;
    case "halo":
      return <Halo />;
    case "still":
      return <StillLife />;
    default:
      return null;
  }
}

function Turntable() {
  const ref = useRef<THREE.Group>(null);
  const yaw = useStudio((s) => s.yaw);
  const autoSpin = useStudio((s) => s.autoSpin);
  const spinSpeed = useStudio((s) => s.spinSpeed);
  useFrame((_, delta) => {
    const group = ref.current;
    if (!group) return;
    if (autoSpin) group.rotation.y += spinSpeed * Math.min(delta, 0.1);
    else group.rotation.y = yaw;
  });
  return (
    <group ref={ref} position={[0, 0.055, 0]}>
      <Subject />
    </group>
  );
}

function World() {
  return (
    <>
      <StudioEnv />
      <Exposure />
      <FocalLength />
      <CameraReset />
      <CaptureBridge />
      <Lights />
      <Cove />
      <Stage />
      <Turntable />
      <OrbitControls
        makeDefault
        target={[0, 0.68, 0]}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={0.22}
        maxPolarAngle={Math.PI / 2 - 0.06}
        minDistance={2.15}
        maxDistance={5.7}
      />
    </>
  );
}

export function StudioScene() {
  return (
    <Canvas
      className="stage"
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [1.7, 1.18, 4.55], fov: 28, near: 0.08, far: 40 }}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = useStudio.getState().exposure;
      }}
    >
      <World />
    </Canvas>
  );
}

declare global {
  interface Window {
    __lumenReady?: boolean;
  }
}
