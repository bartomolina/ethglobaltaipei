"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import {
  KeyboardControls,
  PointerLockControls,
  Sky,
  Stars,
  Billboard,
  useTexture,
  Float,
} from "@react-three/drei";
import { useRef } from "react";
import { Player } from "./Player";
import { Ground } from "./Ground";
import { Trees } from "./Trees";
import { Butterflies } from "./Butterflies";
import { DoubleSide, Vector3 } from "three";
import { Patricio } from "./Patricio";

function VitalikSun() {
  const texture = useTexture("/faces/vitalik.png");
  const size = 800;
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={groupRef} position={[2000, 1000, -5000]}>
      <pointLight color="#FDB813" intensity={2} distance={10000} />
      <group>
        <mesh>
          <circleGeometry args={[size, 64]} />
          <meshStandardMaterial
            map={texture}
            emissive="#FDB813"
            emissiveIntensity={0.5}
            transparent
            opacity={1}
            side={DoubleSide}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
        <mesh position={[0, 0, 1]}>
          <circleGeometry args={[size * 1.2, 64]} />
          <meshBasicMaterial
            color="#FDB813"
            transparent
            opacity={0.15}
            side={DoubleSide}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
        <mesh position={[0, 0, 2]}>
          <circleGeometry args={[size * 1.4, 64]} />
          <meshBasicMaterial
            color="#FDB813"
            transparent
            opacity={0.05}
            side={DoubleSide}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
      </group>
    </group>
  );
}

function KartikMoon() {
  const texture = useTexture("/faces/kartik.png");
  const size = 400;
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={groupRef} position={[-2000, 1000, -5000]}>
      <pointLight color="#FFFFFF" intensity={1} distance={8000} />
      <group>
        <mesh>
          <circleGeometry args={[size, 64]} />
          <meshStandardMaterial
            map={texture}
            emissive="#FFFFFF"
            emissiveIntensity={0.3}
            transparent
            opacity={1}
            side={DoubleSide}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
        <mesh position={[0, 0, 1]}>
          <circleGeometry args={[size * 1.2, 64]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.15}
            side={DoubleSide}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
        <mesh position={[0, 0, 2]}>
          <circleGeometry args={[size * 1.4, 64]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.05}
            side={DoubleSide}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
      </group>
    </group>
  );
}

interface SceneProps {
  selectedFace?: string;
  playerName: string;
}

export function Scene({ selectedFace, playerName }: SceneProps) {
  return (
    <KeyboardControls
      map={[
        { name: "forward", keys: ["ArrowUp", "w", "W"] },
        { name: "backward", keys: ["ArrowDown", "s", "S"] },
        { name: "left", keys: ["ArrowLeft", "a", "A"] },
        { name: "right", keys: ["ArrowRight", "d", "D"] },
      ]}
    >
      <Canvas shadows camera={{ position: [0, 15, 30], fov: 90, far: 10000 }}>
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        <Sky
          sunPosition={[0, 0.5, -1]}
          turbidity={0.1}
          rayleigh={0.1}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
        <ambientLight intensity={0.7} />
        <Physics>
          <Player selectedFace={selectedFace} playerName={playerName} />
          <Ground />
          <Trees />
          <Butterflies />
          <Patricio />
        </Physics>
        <VitalikSun />
        <KartikMoon />
        <PointerLockControls />
      </Canvas>
    </KeyboardControls>
  );
}
