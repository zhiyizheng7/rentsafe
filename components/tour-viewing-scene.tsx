"use client";

import { ContactShadows, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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

function FixedCamera() {
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, 1.2, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

function RoomShell() {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.12, 0]}>
        <boxGeometry args={[8, 0.24, 6]} />
        <meshStandardMaterial color="#d6b58b" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[0, 2.35, -3]}>
        <boxGeometry args={[8, 4.7, 0.18]} />
        <meshStandardMaterial color="#f5e9d7" roughness={0.95} />
      </mesh>
      <mesh receiveShadow position={[-4, 2.35, 0]}>
        <boxGeometry args={[0.18, 4.7, 6]} />
        <meshStandardMaterial color="#ead7bd" roughness={0.95} />
      </mesh>

      {[-3, -2, -1, 0, 1, 2, 3].map((x) => (
        <mesh key={x} position={[x, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.025, 6]} />
          <meshBasicMaterial color="#b48963" />
        </mesh>
      ))}

      <group position={[1.7, 1.55, -2.88]}>
        <mesh>
          <boxGeometry args={[2.2, 1.75, 0.15]} />
          <meshStandardMaterial color="#9bd8ec" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.09]}>
          <boxGeometry args={[0.08, 1.75, 0.08]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0, 0, 0.1]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.08, 2.2, 0.08]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>

      <RoundedBox args={[1.2, 2.25, 0.18]} radius={0.08} position={[3.05, 1.08, -2.82]} castShadow>
        <meshStandardMaterial color="#bd7549" roughness={0.8} />
      </RoundedBox>
      <mesh position={[2.62, 1.1, -2.66]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#f8c84e" metalness={0.35} />
      </mesh>
    </group>
  );
}

function Furniture() {
  return (
    <group>
      <RoundedBox args={[2.65, 0.65, 1.05]} radius={0.18} position={[-1.75, 0.47, -1.55]} castShadow receiveShadow>
        <meshStandardMaterial color="#ef8354" roughness={0.88} />
      </RoundedBox>
      <RoundedBox args={[2.65, 1.05, 0.34]} radius={0.14} position={[-1.75, 0.9, -1.98]} castShadow>
        <meshStandardMaterial color="#dc6944" roughness={0.88} />
      </RoundedBox>
      <RoundedBox args={[0.82, 0.22, 0.62]} radius={0.1} position={[-2.2, 0.9, -1.38]} castShadow>
        <meshStandardMaterial color="#ffd166" roughness={0.92} />
      </RoundedBox>

      <RoundedBox args={[1.8, 0.16, 1.05]} radius={0.08} position={[0.25, 0.72, 0.65]} castShadow>
        <meshStandardMaterial color="#8a5d3b" roughness={0.8} />
      </RoundedBox>
      {[-0.42, 0.92].map((x) =>
        [-0.38, 0.38].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.34, 0.65 + z]} castShadow>
            <cylinderGeometry args={[0.07, 0.08, 0.7, 10]} />
            <meshStandardMaterial color="#68442f" roughness={0.9} />
          </mesh>
        )),
      )}

      <group position={[2.65, 0.82, 0.6]}>
        <RoundedBox args={[1.55, 1.65, 1.55]} radius={0.2} castShadow receiveShadow>
          <meshStandardMaterial color="#77b6a1" roughness={0.85} />
        </RoundedBox>
        <mesh position={[0, 0.2, -0.79]}>
          <boxGeometry args={[0.72, 0.05, 0.04]} />
          <meshStandardMaterial color="#e9f5ef" />
        </mesh>
      </group>
    </group>
  );
}

function FireAlarm() {
  return (
    <group position={[-2.7, 3.72, -2.73]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.28, 0.32, 0.12, 20]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.07, 0]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

function MiiLikeVisitor({ reducedMotion }: { reducedMotion: boolean }) {
  const person = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!person.current || reducedMotion) return;
    const time = clock.getElapsedTime();
    person.current.position.y = Math.sin(time * 2.4) * 0.035;
    person.current.rotation.y = -0.32 + Math.sin(time * 0.75) * 0.08;
  });

  return (
    <group ref={person} position={[-0.8, 0.02, 1.22]} rotation={[0, -0.32, 0]}>
      <mesh position={[0, 2.05, 0]} castShadow>
        <sphereGeometry args={[0.38, 16, 12]} />
        <meshStandardMaterial color="#f1b995" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.27, -0.02]} scale={[1.02, 0.55, 1.02]} castShadow>
        <sphereGeometry args={[0.39, 12, 8]} />
        <meshStandardMaterial color="#513629" roughness={0.95} />
      </mesh>
      <mesh position={[-0.13, 2.08, 0.34]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="#2b211c" />
      </mesh>
      <mesh position={[0.13, 2.08, 0.34]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="#2b211c" />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <capsuleGeometry args={[0.35, 0.65, 6, 12]} />
        <meshStandardMaterial color="#f97316" roughness={0.86} />
      </mesh>
      {[-0.2, 0.2].map((x) => (
        <group key={x} position={[x, 0.55, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.11, 0.55, 5, 10]} />
            <meshStandardMaterial color="#52647a" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.45, 0.08]} castShadow>
            <boxGeometry args={[0.25, 0.15, 0.45]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ViewingRoom() {
  const reducedMotion = useReducedMotion();

  return (
    <>
      <color attach="background" args={["#b8d8e8"]} />
      <fog attach="fog" args={["#b8d8e8", 11, 20]} />
      <ambientLight intensity={1.35} />
      <directionalLight
        castShadow
        intensity={2.2}
        position={[4, 8, 6]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={20}
      />
      <hemisphereLight args={["#dff4ff", "#8b654a", 1.1]} />
      <FixedCamera />
      <RoomShell />
      <Furniture />
      <FireAlarm />
      <MiiLikeVisitor reducedMotion={reducedMotion} />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.28} scale={10} blur={2.5} far={5} />
    </>
  );
}

export default function TourViewingScene() {
  return (
    <Canvas
      aria-hidden="true"
      orthographic
      camera={{ position: [8, 7, 9], zoom: 70, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      shadows
    >
      <ViewingRoom />
    </Canvas>
  );
}
