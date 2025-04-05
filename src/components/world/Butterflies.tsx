"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Vector3, Group, DoubleSide } from "three";

function EthereumLogo({ position }: { position: [number, number, number] }) {
  const ref = useRef<Group>(null);
  const texture = useTexture("/ethereum-logo.svg");

  const pathRef = useRef({
    center: new Vector3(position[0], position[1], position[2]),
    radius: Math.random() * 2 + 1,
    speed: Math.random() * 0.2 + 0.1,
    offset: Math.random() * Math.PI * 2,
  });

  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.elapsedTime;

      // Circular path movement
      const angle = time * pathRef.current.speed + pathRef.current.offset;
      ref.current.position.x =
        pathRef.current.center.x + Math.cos(angle) * pathRef.current.radius;
      ref.current.position.z =
        pathRef.current.center.z + Math.sin(angle) * pathRef.current.radius;

      // Gentle floating motion
      ref.current.position.y =
        pathRef.current.center.y +
        Math.sin(time * 0.5 + pathRef.current.offset) * 0.3;

      // Billboard effect - always face camera
      ref.current.quaternion.copy(state.camera.quaternion);
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <planeGeometry args={[1, 1.6]} />{" "}
        {/* Adjusted for Ethereum logo proportions */}
        <meshBasicMaterial
          map={texture}
          transparent={true}
          side={DoubleSide}
          alphaTest={0.001}
        />
      </mesh>
    </group>
  );
}

export function Butterflies() {
  // Create floating Ethereum logos
  const positions = useRef<[number, number, number][]>(
    Array.from({ length: 15 }, (_, i) => {
      const angle = (i / 15) * Math.PI * 2;
      const radius = 15 + Math.random() * 15;
      return [
        Math.cos(angle) * radius,
        Math.random() * 4 + 3, // Height between 3 and 7 units
        Math.sin(angle) * radius,
      ];
    })
  ).current;

  return (
    <>
      {positions.map((position, index) => (
        <EthereumLogo key={index} position={position} />
      ))}
    </>
  );
}
