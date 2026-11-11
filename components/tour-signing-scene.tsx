"use client";

import { ContactShadows, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);

    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  return reducedMotion;
}

function ContractPage({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, rotation]}>
      <RoundedBox args={[2.25, 3.05, 0.055]} radius={0.045} castShadow receiveShadow>
        <meshStandardMaterial color="#fffdf5" roughness={0.72} />
      </RoundedBox>
      <mesh position={[0, 1.15, 0.04]}>
        <boxGeometry args={[1.15, 0.1, 0.018]} />
        <meshStandardMaterial color="#48576a" />
      </mesh>
      {[0.72, 0.43, 0.14, -0.15, -0.44, -0.73].map((y, index) => (
        <group key={y}>
          <mesh position={[-0.25, y, 0.04]}>
            <boxGeometry args={[index % 2 === 0 ? 1.42 : 1.16, 0.055, 0.018]} />
            <meshStandardMaterial color="#9aa3ae" />
          </mesh>
          {(index === 1 || index === 4) && (
            <mesh position={[0.48, y, 0.052]}>
              <boxGeometry args={[0.48, 0.13, 0.015]} />
              <meshStandardMaterial color="#fb923c" transparent opacity={0.55} />
            </mesh>
          )}
        </group>
      ))}
      <mesh position={[0.5, -1.12, 0.045]}>
        <boxGeometry args={[0.78, 0.06, 0.018]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
    </group>
  );
}

function AnimatedPen({ reducedMotion }: { reducedMotion: boolean }) {
  const pen = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!pen.current || reducedMotion) return;
    const time = clock.getElapsedTime();
    pen.current.position.x = 1.35 + Math.sin(time * 1.5) * 0.12;
    pen.current.position.z = 0.62 + Math.sin(time * 3) * 0.035;
    pen.current.rotation.z = -0.72 + Math.sin(time * 1.5) * 0.04;
  });

  return (
    <group ref={pen} position={[1.35, 1.18, 0.62]} rotation={[0, 0.08, -0.72]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.055, 0.72, 6, 12]} />
        <meshStandardMaterial color="#f97316" metalness={0.25} roughness={0.45} />
      </mesh>
      <mesh position={[0, -0.44, 0]}>
        <coneGeometry args={[0.055, 0.18, 10]} />
        <meshStandardMaterial color="#1f2937" metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

function Stamp({ reducedMotion }: { reducedMotion: boolean }) {
  const stamp = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!stamp.current || reducedMotion) return;
    const cycle = (clock.getElapsedTime() * 0.65) % 2.8;
    stamp.current.position.y = cycle < 0.35 ? 1.35 - Math.sin((cycle / 0.35) * Math.PI) * 0.22 : 1.35;
  });

  return (
    <group ref={stamp} position={[-1.75, 1.35, 0.74]}>
      <RoundedBox args={[0.56, 0.28, 0.56]} radius={0.08} castShadow>
        <meshStandardMaterial color="#b91c1c" roughness={0.62} />
      </RoundedBox>
      <RoundedBox args={[0.34, 0.48, 0.34]} radius={0.08} position={[0, 0.32, 0]} castShadow>
        <meshStandardMaterial color="#f0b64d" roughness={0.58} />
      </RoundedBox>
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.08, 20]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>
    </group>
  );
}

function ClauseFlag({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.72, 0.34, 0.08]} radius={0.07} castShadow>
        <meshStandardMaterial color={color} roughness={0.65} />
      </RoundedBox>
      <mesh position={[-0.13, 0, 0.055]}>
        <boxGeometry args={[0.28, 0.045, 0.012]} />
        <meshStandardMaterial color="#fff7ed" />
      </mesh>
      <mesh position={[0.2, 0, 0.055]}>
        <boxGeometry args={[0.13, 0.045, 0.012]} />
        <meshStandardMaterial color="#fff7ed" />
      </mesh>
    </group>
  );
}

function DeskScene() {
  const reducedMotion = useReducedMotion();

  return (
    <>
      <color attach="background" args={["#d7ad7d"]} />
      <fog attach="fog" args={["#d7ad7d", 12, 21]} />
      <ambientLight intensity={1.35} />
      <directionalLight castShadow intensity={2.15} position={[4, 9, 6]} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <hemisphereLight args={["#fff4df", "#67442f", 1.05]} />

      <RoundedBox args={[7.6, 0.36, 5.4]} radius={0.18} position={[0, 0, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#885a3d" roughness={0.86} />
      </RoundedBox>
      {[-2.7, -1.8, -0.9, 0, 0.9, 1.8, 2.7].map((x) => (
        <mesh key={x} position={[x, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.025, 5]} />
          <meshBasicMaterial color="#68412f" />
        </mesh>
      ))}

      <ContractPage position={[-0.6, 0.25, -0.08]} rotation={-0.04} />
      <ContractPage position={[0.72, 0.22, -0.18]} rotation={0.045} />
      <AnimatedPen reducedMotion={reducedMotion} />
      <Stamp reducedMotion={reducedMotion} />

      <ClauseFlag position={[-2.15, 0.72, -1.1]} color="#f97316" />
      <ClauseFlag position={[2.05, 0.72, -1.05]} color="#3b82f6" />
      <ClauseFlag position={[-2.05, 0.72, 1.22]} color="#22a06b" />
      <ClauseFlag position={[2.12, 0.72, 1.2]} color="#ef4444" />

      <mesh position={[2.6, 0.43, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.27, 0.055, 10, 24]} />
        <meshStandardMaterial color="#e4b94f" metalness={0.62} roughness={0.3} />
      </mesh>
      <ContactShadows position={[0, 0.22, 0]} opacity={0.3} scale={9} blur={2.4} far={4} />
    </>
  );
}

export default function TourSigningScene() {
  return (
    <Canvas
      aria-hidden="true"
      orthographic
      camera={{ position: [6.8, 8.5, 7.2], zoom: 72, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      shadows
    >
      <DeskScene />
    </Canvas>
  );
}
