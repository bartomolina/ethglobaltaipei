"use client";

import { RigidBody } from "@react-three/rapier";

export function Ground() {
  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#7ac555" roughness={0.6} metalness={0.1} />
      </mesh>
    </RigidBody>
  );
}
