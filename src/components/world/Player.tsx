"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import {
  useKeyboardControls,
  useTexture,
  Billboard,
  Html,
} from "@react-three/drei";
import { Vector3, Group, Euler, Matrix4, DoubleSide, Camera } from "three";
import { webSocketService } from "@/lib/websocket-service";
import { Projectile } from "./Projectile";
import Image from "next/image";

const MOVEMENT_SPEED = 8;
const MOVEMENT_IMPULSE = 15; // Force multiplier for movement
const SHOOT_COOLDOWN = 500; // ms
const MAX_HEALTH = 100;
const DAMAGE_AMOUNT = 20;

interface PlayerMeshProps {
  face?: string;
  isLocalPlayer?: boolean;
  health?: number;
}

interface ProjectileState {
  id: string;
  position: Vector3;
  direction: Vector3;
  timestamp: string;
}

interface ShootingState {
  isShooting: boolean;
  direction: {
    x: number;
    y: number;
    z: number;
  };
  timestamp: string;
}

function HealthPanel({ health }: { health: number }) {
  return (
    <Html
      position={[0, 0, 0]}
      wrapperClass="fixed top-4 left-4"
      prepend
      center={false}
      calculatePosition={() => [10, 10]}
    >
      <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 text-white font-bold shadow-lg">
        <div className="flex items-center gap-2">
          <div className="text-red-500">❤</div>
          <div className="w-32 h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${health}%`,
                background:
                  health > 50 ? "#4CAF50" : health > 25 ? "#FFA500" : "#F44336",
              }}
            />
          </div>
          <div className="text-sm">{health}%</div>
        </div>
      </div>
    </Html>
  );
}

function PlayerMesh({ face, isLocalPlayer, health = 100 }: PlayerMeshProps) {
  const faceTexture = face ? useTexture(face) : null;

  return (
    <>
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial color="#5a189a" />
      </mesh>

      {/* Gun */}
      <group position={[0.5, 0.2, 0]} rotation-x={Math.PI * 0.5}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.4, 0.1]} /> {/* Gun handle */}
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.08, 0.3, 0.08]} /> {/* Gun barrel */}
          <meshStandardMaterial color="#666666" />
        </mesh>
      </group>

      {/* Face */}
      {!isLocalPlayer && (
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
  shooting,
  health,
}: {
  position: Vector3;
  rotation: { y: number };
  face?: string;
  shooting?: ShootingState;
  health: number;
}) {
  return (
    <group position={position} rotation-y={rotation.y}>
      <PlayerMesh face={face} isLocalPlayer={false} health={health} />
      {shooting?.isShooting && (
        <Projectile
          position={position.clone().add(new Vector3(0, 1.5, 0))}
          direction={
            new Vector3(
              shooting.direction.x,
              shooting.direction.y,
              shooting.direction.z
            )
          }
        />
      )}
    </group>
  );
}

interface PlayerProps {
  selectedFace?: string;
  playerName: string;
}

interface PlayerState extends PlayerMeshProps {
  health: number;
  name: string;
}

function ConnectedPlayers({
  players,
}: {
  players: {
    [key: string]: {
      face?: string;
      name: string;
      health: number;
    };
  };
}) {
  return (
    <Html
      position={[0, 0, 0]}
      wrapperClass="fixed top-24 left-4"
      prepend
      center={false}
      calculatePosition={() => [10, 10]}
    >
      <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 text-white shadow-lg">
        <h3 className="text-sm font-bold mb-2 text-sky-200">
          Connected Players
        </h3>
        <div className="space-y-2">
          {Object.entries(players).map(([id, player]) => (
            <div key={id} className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/10">
                {player.face && (
                  <Image
                    src={player.face}
                    alt={player.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                )}
              </div>
              <span className="text-sm">{player.name}</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="text-red-500 text-xs">❤</div>
                <span className="text-xs">{player.health}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Html>
  );
}

export function Player({ selectedFace, playerName }: PlayerProps) {
  const [health, setHealth] = useState(MAX_HEALTH);
  const [isDead, setIsDead] = useState(false);
  const ref = useRef<Group>(null);
  const rigidBody = useRef<any>(null);
  const { camera } = useThree();
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    connected: false,
    playerCount: 0,
    health: MAX_HEALTH,
  });
  const [projectiles, setProjectiles] = useState<ProjectileState[]>([]);
  const lastShootTime = useRef(0);
  const [connectedPlayers, setConnectedPlayers] = useState<{
    [key: string]: {
      face?: string;
      name: string;
      health: number;
    };
  }>({});

  // Get all controls at once to prevent desyncs
  const [, getKeys] = useKeyboardControls();

  // Store other players
  const otherPlayers = useRef<{
    [key: string]: {
      position: Vector3;
      rotation: { y: number };
      face?: string;
      shooting?: ShootingState;
      health: number;
    };
  }>({});

  // Handle getting hit
  const handleHit = useCallback(() => {
    setHealth((prev) => {
      const newHealth = Math.max(0, prev - DAMAGE_AMOUNT);
      if (newHealth === 0 && !isDead) {
        setIsDead(true);
        // Handle death
        if (rigidBody.current) {
          rigidBody.current.setTranslation({ x: 0, y: 3, z: 0 }); // Respawn
          setTimeout(() => {
            setHealth(MAX_HEALTH);
            setIsDead(false);
          }, 2000); // Respawn after 2 seconds
        }
      }
      return newHealth;
    });
  }, [isDead]);

  // Update projectile to check for hits
  const handleProjectileCollision = useCallback(
    (position: Vector3) => {
      if (!rigidBody.current || isDead) return;

      const playerPos = rigidBody.current.translation();
      const distance = new Vector3(
        playerPos.x,
        playerPos.y,
        playerPos.z
      ).distanceTo(position);

      if (distance < 1) {
        // Hit radius
        handleHit();
        return true;
      }
      return false;
    },
    [handleHit, isDead]
  );

  // Handle shooting
  useEffect(() => {
    const handleShoot = (event: MouseEvent) => {
      if (!ref.current || !rigidBody.current || isDead) return;

      const now = Date.now();
      if (now - lastShootTime.current < SHOOT_COOLDOWN) return;
      lastShootTime.current = now;

      // Get camera direction
      const cameraDirection = new Vector3();
      camera.getWorldDirection(cameraDirection);
      cameraDirection.normalize();

      // Create new projectile
      const projectileId = `${Date.now()}-${Math.random()}`;
      const projectilePosition = rigidBody.current.translation();
      const newProjectile: ProjectileState = {
        id: projectileId,
        position: new Vector3(
          projectilePosition.x,
          projectilePosition.y + 1.5,
          projectilePosition.z
        ),
        direction: cameraDirection,
        timestamp: new Date().toISOString(),
      };

      setProjectiles((prev) => [...prev, newProjectile]);

      // Send shooting state
      if (isMultiplayer) {
        webSocketService.sendState({
          position: projectilePosition,
          rotation: { y: ref.current.rotation.y },
          face: selectedFace,
          name: playerName,
          health,
          lastUpdate: new Date().toISOString(),
          shooting: {
            isShooting: true,
            direction: {
              x: cameraDirection.x,
              y: cameraDirection.y,
              z: cameraDirection.z,
            },
            timestamp: new Date().toISOString(),
          },
        });
      }
    };

    document.addEventListener("click", handleShoot);
    return () => document.removeEventListener("click", handleShoot);
  }, [isMultiplayer, selectedFace, camera, health, isDead, playerName]);

  // Clean up expired projectiles
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setProjectiles((prev) =>
        prev.filter((p) => now - new Date(p.timestamp).getTime() < 2000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log("Initializing multiplayer...");

    webSocketService.connect();

    webSocketService.onUpdate((gameState) => {
      setIsMultiplayer(true);
      const playerCount = Object.keys(gameState).length;
      console.log(`Received game state with ${playerCount} other players`);

      const updatedPlayers: typeof connectedPlayers = {};

      Object.entries(gameState).forEach(([clientId, playerState]) => {
        otherPlayers.current[clientId] = {
          position: new Vector3(
            playerState.position.x,
            playerState.position.y,
            playerState.position.z
          ),
          rotation: playerState.rotation,
          face: playerState.face,
          shooting: playerState.shooting,
          health: playerState.health,
        };

        updatedPlayers[clientId] = {
          face: playerState.face,
          name: playerState.name || "Unknown Player",
          health: playerState.health,
        };
      });

      setConnectedPlayers(updatedPlayers);
      setDebugInfo((prev) => ({
        ...prev,
        playerCount,
      }));
    });

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
        name: playerName,
        health,
        lastUpdate: new Date().toISOString(),
      });
    }
  });

  // Update debug info with health
  useEffect(() => {
    const debugDiv = document.createElement("div");
    debugDiv.style.position = "fixed";
    debugDiv.style.top = "80px"; // Move below health panel
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

      {/* Health Panel */}
      <HealthPanel health={health} />

      {/* Connected Players */}
      <ConnectedPlayers players={connectedPlayers} />

      {/* Render local projectiles */}
      {projectiles.map((projectile) => (
        <Projectile
          key={projectile.id}
          position={projectile.position}
          direction={projectile.direction}
          onHit={() => {
            // Check for hits on other players
            Object.entries(otherPlayers.current).forEach(
              ([clientId, player]) => {
                const hit = handleProjectileCollision(player.position);
                if (hit) {
                  setProjectiles((prev) =>
                    prev.filter((p) => p.id !== projectile.id)
                  );
                }
              }
            );
          }}
          onExpire={() => {
            setProjectiles((prev) =>
              prev.filter((p) => p.id !== projectile.id)
            );
          }}
        />
      ))}

      {/* Only render other players if multiplayer is active */}
      {isMultiplayer &&
        Object.entries(otherPlayers.current).map(([clientId, player]) => (
          <OtherPlayer
            key={clientId}
            position={player.position}
            rotation={player.rotation}
            face={player.face}
            shooting={player.shooting}
            health={player.health}
          />
        ))}
    </>
  );
}
