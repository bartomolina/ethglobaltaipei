"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";

const PROJECTILE_SPEED = 30;
const MAX_DISTANCE = 100;

interface ProjectileProps {
  position: Vector3;
  direction: Vector3;
  onHit?: () => void;
  onExpire?: () => void;
}

export function Projectile({
  position,
  direction,
  onHit,
  onExpire,
}: ProjectileProps) {
  const ref = useRef<THREE.Mesh>(null);
  const startPos = useRef(position.clone());
  const velocity = useRef(
    direction.normalize().multiplyScalar(PROJECTILE_SPEED)
  );

  useFrame((_, delta) => {
    if (!ref.current) return;

    // Update position
    ref.current.position.add(velocity.current.clone().multiplyScalar(delta));

    // Check distance traveled
    const distanceTraveled = ref.current.position.distanceTo(startPos.current);
    if (distanceTraveled > MAX_DISTANCE) {
      onExpire?.();
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial
        color="#ff0000"
        emissive="#ff0000"
        emissiveIntensity={2}
      />
      <pointLight color="#ff0000" intensity={2} distance={3} />
    </mesh>
  );
}
