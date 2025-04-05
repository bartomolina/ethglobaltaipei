"use client";

import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { CylinderGeometry, ConeGeometry } from "three";

// Create geometries once and reuse
const trunkGeometry = new CylinderGeometry(0.3, 0.4, 3, 6);
const foliageGeometry = new ConeGeometry(2, 6, 6);

function TreeShape({ position }: { position: [number, number, number] }) {
  const heightScale = 0.8 + Math.random() * 0.4; // Random height variation

  return (
    <RigidBody type="fixed" position={position} colliders="hull">
      {/* Trunk */}
      <mesh
        geometry={trunkGeometry}
        position={[0, 1.5, 0]}
        scale={[1, heightScale, 1]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#b8c0ff" // Soft lavender
          roughness={0.8}
        />
      </mesh>

      {/* Foliage */}
      <mesh
        geometry={foliageGeometry}
        position={[0, 4.5 * heightScale, 0]}
        scale={[1, heightScale, 1]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#a0e8b7" // Mint green
          roughness={0.7}
        />
      </mesh>
    </RigidBody>
  );
}

export function Trees() {
  const treePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 35; i++) {
      const angle = (i / 35) * Math.PI * 2;
      const radius = 15 + Math.random() * 30;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 15;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 15;

      // Keep a clear area in the center
      if (Math.hypot(x, z) > 12) {
        positions.push([x, 0, z]);
      }
    }
    return positions;
  }, []);

  return (
    <group>
      {treePositions.map((position, index) => (
        <TreeShape key={index} position={position} />
      ))}
    </group>
  );
}
