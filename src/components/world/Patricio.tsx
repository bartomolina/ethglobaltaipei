"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Vector3, Group } from "three";

// Define a smaller movement range
const MOVEMENT_RANGE = 20; // Reduced from 100 to 20 for more central movement

function getRandomPosition() {
  return new Vector3(
    Math.random() * MOVEMENT_RANGE - MOVEMENT_RANGE / 2, // X between -10 and 10
    0,
    Math.random() * MOVEMENT_RANGE - MOVEMENT_RANGE / 2 // Z between -10 and 10
  );
}

export function Patricio() {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF("/patricio/Pbr/base_basic_pbr.glb");
  const { actions } = useAnimations(animations, group);

  // Log available animations
  useEffect(() => {
    console.log("Available animations:", animations);
    console.log("Available actions:", actions);
  }, [animations, actions]);

  // Position and movement
  const position = useRef(new Vector3(0, 0, 0));
  const targetPosition = useRef(getRandomPosition());
  const speed = 2;

  useFrame((state, delta) => {
    if (!group.current) return;

    // Calculate direction to target
    const direction = targetPosition.current.clone().sub(position.current);
    const distance = direction.length();

    // If we're close to target, pick a new random target
    if (distance < 1) {
      targetPosition.current.copy(getRandomPosition());
      return;
    }

    // Normalize direction and apply speed
    direction.normalize().multiplyScalar(speed * delta);
    position.current.add(direction);

    // Update model position
    group.current.position.copy(position.current);

    // Rotate model to face movement direction
    const angle = Math.atan2(direction.x, direction.z);
    group.current.rotation.y = angle;
  });

  return (
    <group ref={group}>
      <primitive object={scene} scale={2} position={[0, 0, 0]} />
    </group>
  );
}

useGLTF.preload("/patricio/Pbr/base_basic_pbr.glb");
