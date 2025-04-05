"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import { useKeyboardControls, useTexture, Billboard } from "@react-three/drei";
import { Vector3, Group, Euler, Matrix4, DoubleSide } from "three";
import { webSocketService } from "@/lib/websocket-service";

const MOVEMENT_SPEED = 8;
const MOVEMENT_IMPULSE = 15; // Force multiplier for movement

interface PlayerMeshProps {
  face?: string;
  isLocalPlayer?: boolean;
}

function PlayerMesh({ face, isLocalPlayer }: PlayerMeshProps) {
  const faceTexture = face ? useTexture(face) : null;

  return (
    <>
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial color="#5a189a" />
      </mesh>
      {/* Face - only show for other players */}
      {faceTexture && !isLocalPlayer && (
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          <mesh position={[0, 2, 0]}>
            <planeGeometry args={[2, 2]} />
            <meshBasicMaterial
              map={faceTexture}
              transparent
              side={DoubleSide}
              alphaTest={0.1}
              depthWrite={false}
              depthTest={true}
            />
          </mesh>
        </Billboard>
      )}
    </>
  );
}

// Component to render other players
function OtherPlayer({
  position,
  rotation,
  face,
}: {
  position: Vector3;
  rotation: { y: number };
  face?: string;
}) {
  return (
    <group position={position} rotation-y={rotation.y}>
      <PlayerMesh face={face} isLocalPlayer={false} />
    </group>
  );
}

interface PlayerProps {
  selectedFace?: string;
}

export function Player({ selectedFace }: PlayerProps) {
  const ref = useRef<Group>(null);
  const rigidBody = useRef<any>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    connected: false,
    playerCount: 0,
  });

  // Get all controls at once to prevent desyncs
  const [, getKeys] = useKeyboardControls();

  // Store other players
  const otherPlayers = useRef<{
    [key: string]: {
      position: Vector3;
      rotation: { y: number };
      face?: string;
    };
  }>({});

  useEffect(() => {
    console.log("Initializing multiplayer...");

    // Try to connect to WebSocket server
    webSocketService.connect();

    // Handle updates from other players
    webSocketService.onUpdate((gameState) => {
      setIsMultiplayer(true);
      const playerCount = Object.keys(gameState).length;
      console.log(`Received game state with ${playerCount} other players`);

      Object.entries(gameState).forEach(([clientId, playerState]) => {
        otherPlayers.current[clientId] = {
          position: new Vector3(
            playerState.position.x,
            playerState.position.y,
            playerState.position.z
          ),
          rotation: playerState.rotation,
          face: playerState.face,
        };
      });

      setDebugInfo((prev) => ({
        ...prev,
        playerCount,
      }));
    });

    // Check connection status periodically
    const connectionCheck = setInterval(() => {
      const connected = webSocketService.isConnected();
      setIsMultiplayer(connected);
      setDebugInfo((prev) => ({
        ...prev,
        connected,
      }));
    }, 1000);

    return () => {
      console.log("Cleaning up multiplayer...");
      webSocketService.disconnect();
      clearInterval(connectionCheck);
    };
  }, []);

  useFrame((state, delta) => {
    if (!ref.current || !rigidBody.current) return;

    // Get all controls state at once
    const { forward, backward, left, right } = getKeys();

    // Get camera's forward and right vectors
    const cameraMatrix = new Matrix4();
    cameraMatrix.extractRotation(state.camera.matrix);
    const cameraForward = new Vector3(0, 0, -1).applyMatrix4(cameraMatrix);
    const cameraRight = new Vector3(1, 0, 0).applyMatrix4(cameraMatrix);

    // Zero out Y component to keep movement horizontal
    cameraForward.y = 0;
    cameraRight.y = 0;
    cameraForward.normalize();
    cameraRight.normalize();

    // Calculate movement direction based on camera orientation
    const moveDirection = new Vector3(0, 0, 0);

    if (forward) moveDirection.add(cameraForward);
    if (backward) moveDirection.sub(cameraForward);
    if (right) moveDirection.add(cameraRight);
    if (left) moveDirection.sub(cameraRight);

    // Only process movement if there's input
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      moveDirection.multiplyScalar(MOVEMENT_IMPULSE);

      // Apply movement as an impulse while preserving vertical velocity
      const currentVel = rigidBody.current.linvel();
      rigidBody.current.setLinvel({
        x: moveDirection.x,
        y: currentVel.y,
        z: moveDirection.z,
      });

      // Apply additional impulse in movement direction
      rigidBody.current.applyImpulse(
        {
          x: moveDirection.x * delta,
          y: 0,
          z: moveDirection.z * delta,
        },
        true
      );

      // Update player rotation to face movement direction
      if (ref.current) {
        const angle = Math.atan2(moveDirection.x, moveDirection.z);
        ref.current.rotation.y = angle;
      }
    } else {
      // Apply friction when not moving
      const currentVel = rigidBody.current.linvel();
      rigidBody.current.setLinvel({
        x: currentVel.x * 0.8, // Friction factor
        y: currentVel.y,
        z: currentVel.z * 0.8,
      });
    }

    // Get final position after physics update
    const playerPosition = rigidBody.current.translation();

    // Update camera position smoothly
    const cameraPosition = new Vector3();
    cameraPosition.copy(playerPosition);
    cameraPosition.y += 1.5; // Camera height offset
    state.camera.position.lerp(cameraPosition, 0.2); // Smooth interpolation

    // Only send state if multiplayer is active
    if (isMultiplayer) {
      webSocketService.sendState({
        position: playerPosition,
        rotation: { y: ref.current.rotation.y },
        face: selectedFace,
        lastUpdate: new Date().toISOString(),
      });
    }
  });

  // Add debug overlay
  useEffect(() => {
    const debugDiv = document.createElement("div");
    debugDiv.style.position = "fixed";
    debugDiv.style.top = "10px";
    debugDiv.style.left = "10px";
    debugDiv.style.backgroundColor = "rgba(0,0,0,0.7)";
    debugDiv.style.color = "white";
    debugDiv.style.padding = "10px";
    debugDiv.style.fontFamily = "monospace";
    debugDiv.style.zIndex = "1000";
    document.body.appendChild(debugDiv);

    const updateDebug = () => {
      debugDiv.innerHTML = `
        WebSocket: ${debugInfo.connected ? "🟢 Connected" : "🔴 Disconnected"}
        Other Players: ${debugInfo.playerCount}
        Multiplayer: ${isMultiplayer ? "Active" : "Inactive"}
      `.replace(/\n/g, "<br>");
    };

    const interval = setInterval(updateDebug, 1000);

    return () => {
      document.body.removeChild(debugDiv);
      clearInterval(interval);
    };
  }, [debugInfo, isMultiplayer]);

  return (
    <>
      <RigidBody
        ref={rigidBody}
        colliders={false}
        mass={1}
        type="dynamic"
        position={[0, 3, 0]}
        enabledRotations={[false, false, false]}
        friction={0.2}
        linearDamping={0.95}
        angularDamping={0.95}
      >
        <group ref={ref}>
          <CapsuleCollider args={[0.5, 0.5]} />
          <PlayerMesh face={selectedFace} isLocalPlayer={true} />
        </group>
      </RigidBody>

      {/* Only render other players if multiplayer is active */}
      {isMultiplayer &&
        Object.entries(otherPlayers.current).map(([clientId, player]) => (
          <OtherPlayer
            key={clientId}
            position={player.position}
            rotation={player.rotation}
            face={player.face}
          />
        ))}
    </>
  );
}
