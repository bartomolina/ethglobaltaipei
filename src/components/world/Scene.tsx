"use client";

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import {
  KeyboardControls,
  PointerLockControls,
  Sky,
  Stars,
} from "@react-three/drei";
import { Player } from "./Player";
import { Ground } from "./Ground";
import { Trees } from "./Trees";
import { Butterflies } from "./Butterflies";

interface SceneProps {
  selectedFace?: string;
}

export function Scene({ selectedFace }: SceneProps) {
  return (
    <KeyboardControls
      map={[
        { name: "forward", keys: ["ArrowUp", "w", "W"] },
        { name: "backward", keys: ["ArrowDown", "s", "S"] },
        { name: "left", keys: ["ArrowLeft", "a", "A"] },
        { name: "right", keys: ["ArrowRight", "d", "D"] },
      ]}
    >
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <Sky
          sunPosition={[100, 60, 100]}
          turbidity={0.1}
          rayleigh={0.1}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <Physics>
          <Player selectedFace={selectedFace} />
          <Ground />
          <Trees />
          <Butterflies />
        </Physics>
        <PointerLockControls />
      </Canvas>
    </KeyboardControls>
  );
}
