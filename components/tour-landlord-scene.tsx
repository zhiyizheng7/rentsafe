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

function Room() {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.12, 0]}>
        <boxGeometry args={[8, 0.24, 6]} />
        <meshStandardMaterial color="#c79569" roughness={0.92} />
      </mesh>
      <mesh receiveShadow position={[0, 2.35, -3]}>
        <boxGeometry args={[8, 4.7, 0.18]} />
        <meshStandardMaterial color="#f2dfc6" roughness={0.95} />
      </mesh>
      <mesh receiveShadow position={[-4, 2.35, 0]}>
        <boxGeometry args={[0.18, 4.7, 6]} />
        <meshStandardMaterial color="#e9cfad" roughness={0.95} />
      </mesh>

      <group position={[-2.35, 2.65, -2.86]}>
        <RoundedBox args={[2.15, 1.45, 0.12]} radius={0.06} castShadow>
          <meshStandardMaterial color="#754a34" roughness={0.82} />
        </RoundedBox>
        <mesh position={[0, 0, 0.08]}>
          <planeGeometry args={[1.85, 1.15]} />
          <meshStandardMaterial color="#f6bd60" />
        </mesh>
        <mesh position={[-0.43, 0.08, 0.1]}>
          <circleGeometry args={[0.35, 24]} />
          <meshStandardMaterial color="#fff3d5" />
        </mesh>
        <mesh position={[0.42, -0.16, 0.1]}>
          <circleGeometry args={[0.43, 24]} />
          <meshStandardMaterial color="#e67846" />
        </mesh>
      </group>

      <group position={[2.7, 1.05, -2.82]}>
        <RoundedBox args={[1.25, 2.05, 0.2]} radius={0.08} castShadow>
          <meshStandardMaterial color="#6e9f88" roughness={0.86} />
        </RoundedBox>
        <mesh position={[0, 0.2, 0.13]}>
          <boxGeometry args={[0.7, 0.06, 0.03]} />
          <meshStandardMaterial color="#dff2e8" />
        </mesh>
      </group>
    </group>
  );
}

function Person({
  position,
  rotationY,
  shirt,
  trousers,
  hair,
  phase,
  reducedMotion,
}: {
  position: [number, number, number];
  rotationY: number;
  shirt: string;
  trousers: string;
  hair: string;
  phase: number;
  reducedMotion: boolean;
}) {
  const person = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!person.current || reducedMotion) return;
    const time = clock.getElapsedTime() + phase;
    person.current.position.y = position[1] + Math.sin(time * 2) * 0.025;
    person.current.rotation.z = Math.sin(time * 1.15) * 0.018;
  });

  return (
    <group ref={person} position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.82, 0]} castShadow>
        <sphereGeometry args={[0.34, 18, 14]} />
        <meshStandardMaterial color="#efb38d" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.02, -0.03]} scale={[1.04, 0.58, 1.04]} castShadow>
        <sphereGeometry args={[0.35, 14, 10]} />
        <meshStandardMaterial color={hair} roughness={0.96} />
      </mesh>
      <mesh position={[0, 1.08, 0]} castShadow>
        <capsuleGeometry args={[0.33, 0.62, 6, 12]} />
        <meshStandardMaterial color={shirt} roughness={0.88} />
      </mesh>
      {[-0.19, 0.19].map((x) => (
        <group key={x} position={[x, 0.38, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.105, 0.46, 5, 10]} />
            <meshStandardMaterial color={trousers} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.38, 0.09]} castShadow>
            <boxGeometry args={[0.24, 0.13, 0.42]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ConversationCard({
  position,
  accent,
  phase,
  reducedMotion,
}: {
  position: [number, number, number];
  accent: string;
  phase: number;
  reducedMotion: boolean;
}) {
  const card = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!card.current || reducedMotion) return;
    card.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 1.7 + phase) * 0.07;
  });

  return (
    <group ref={card} position={position}>
      <RoundedBox args={[1.65, 0.72, 0.12]} radius={0.13} castShadow>
        <meshStandardMaterial color="#fffaf0" roughness={0.7} />
      </RoundedBox>
      <mesh position={[-0.18, 0.12, 0.075]}>
        <boxGeometry args={[0.92, 0.07, 0.025]} />
        <meshStandardMaterial color="#7b8492" />
      </mesh>
      <mesh position={[-0.32, -0.11, 0.075]}>
        <boxGeometry args={[0.64, 0.07, 0.025]} />
        <meshStandardMaterial color={accent} />
      </mesh>
      <mesh position={[0.42, -0.43, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.25, 0.25, 0.1]} />
        <meshStandardMaterial color="#fffaf0" />
      </mesh>
    </group>
  );
}

function MeetingTable() {
  return (
    <group>
      <RoundedBox args={[3.4, 0.2, 1.45]} radius={0.09} position={[0, 0.94, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#85583c" roughness={0.82} />
      </RoundedBox>
      {[-1.3, 1.3].map((x) =>
        [-0.48, 0.48].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.47, z]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.94, 10]} />
            <meshStandardMaterial color="#5d3b2b" roughness={0.9} />
          </mesh>
        )),
      )}

      <group position={[0, 1.075, 0]} rotation={[-Math.PI / 2, 0, 0.05]}>
        <RoundedBox args={[1.2, 0.82, 0.035]} radius={0.035}>
          <meshStandardMaterial color="#fffdf5" roughness={0.75} />
        </RoundedBox>
        {[0.2, 0, -0.2].map((y, index) => (
          <mesh key={y} position={[-0.08, y, 0.025]}>
            <boxGeometry args={[index === 2 ? 0.65 : 0.82, 0.025, 0.012]} />
            <meshStandardMaterial color={index === 1 ? "#f97316" : "#9aa2ad"} />
          </mesh>
        ))}
      </group>

      <mesh position={[1.05, 1.12, 0.06]} rotation={[0, 0.2, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.035, 0.34, 4, 8]} />
        <meshStandardMaterial color="#ef6b45" />
      </mesh>
      <mesh position={[-1.15, 1.12, 0.12]} castShadow>
        <torusGeometry args={[0.15, 0.035, 8, 18]} />
        <meshStandardMaterial color="#e6b94f" metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

function LandlordRoom() {
  const reducedMotion = useReducedMotion();

  return (
    <>
      <color attach="background" args={["#d9b58f"]} />
      <fog attach="fog" args={["#d9b58f", 11, 20]} />
      <ambientLight intensity={1.4} />
      <directionalLight castShadow intensity={2.1} position={[4, 8, 6]} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <hemisphereLight args={["#fff2dc", "#79543c", 1.05]} />
      <Room />
      <MeetingTable />
      <Person position={[-1.55, 0.02, 1.1]} rotationY={-0.28} shirt="#3b82f6" trousers="#53657b" hair="#493126" phase={0} reducedMotion={reducedMotion} />
      <Person position={[1.55, 0.02, -0.9]} rotationY={2.85} shirt="#f97316" trousers="#334155" hair="#33251f" phase={1.4} reducedMotion={reducedMotion} />
      <ConversationCard position={[-1.45, 3.05, -0.35]} accent="#3b82f6" phase={0} reducedMotion={reducedMotion} />
      <ConversationCard position={[1.45, 3.12, -1.15]} accent="#ef4444" phase={1.8} reducedMotion={reducedMotion} />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.3} scale={10} blur={2.5} far={5} />
    </>
  );
}

export default function TourLandlordScene() {
  return (
    <Canvas
      aria-hidden="true"
      orthographic
      camera={{ position: [8, 7, 9], zoom: 70, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      shadows
    >
      <LandlordRoom />
    </Canvas>
  );
}
