"use client";

import { useState, useEffect } from "react";
import { Scene } from "@/components/world/Scene";
import { CharacterSelect } from "@/components/CharacterSelect";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface TokenDetails {
  id: string;
  address: string;
  name: string;
  symbol: string;
  totalSupply: number;
  startingAppSupply: number;
  remainingAppSupply: number;
  merchantSupply: number;
  merchantAddress: string;
  price: number;
}

interface GameState {
  name: string;
  face?: string;
  tokenId?: string;
  tokenDetails?: TokenDetails;
  holder?: {
    id: string;
    address: string;
  };
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [name, setName] = useState("");
  const [isCreatingToken, setIsCreatingToken] = useState(false);

  // Poll for token details
  useEffect(() => {
    if (!gameState?.tokenId) return;

    const checkTokenStatus = async () => {
      try {
        const response = await fetch("/api/token/status");
        if (!response.ok) throw new Error("Failed to get token status");

        const tokens = await response.json();
        const latestTokens = tokens.filter(
          (token: TokenDetails) => token.name === `${gameState.name} Token`
        );

        if (latestTokens.length > 0) {
          const tokenDetails = latestTokens[0];
          console.log("✨ Token found!", {
            name: tokenDetails.name,
            symbol: tokenDetails.symbol,
            address: tokenDetails.address,
            supply: {
              total: tokenDetails.totalSupply,
              remaining: tokenDetails.remainingAppSupply,
            },
          });

          setGameState((prev) => ({
            ...prev!,
            tokenDetails,
          }));
          toast.success("Token created successfully!", {
            description: `Token address: ${tokenDetails.address.slice(
              0,
              6
            )}...${tokenDetails.address.slice(-4)}`,
          });
          return true; // Token found
        }
        return false; // Token not found yet
      } catch (error) {
        console.error("Error checking token status:", error);
        return false;
      }
    };

    // Poll every 5 seconds until token is found
    const interval = setInterval(async () => {
      const found = await checkTokenStatus();
      if (found) clearInterval(interval);
    }, 5000);

    // Initial check
    checkTokenStatus();

    return () => clearInterval(interval);
  }, [gameState?.tokenId, gameState?.name]);

  const handleJoin = async (playerName: string) => {
    setIsCreatingToken(true);
    try {
      const response = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create token");
      }

      const data = await response.json();
      setGameState({
        name: playerName,
        tokenId: data.token.jobId,
        holder: data.holder,
      });

      toast.success(
        "Token creation started! You can start playing while it's being created.",
        {
          description: `Your holder address: ${data.holder.address.slice(
            0,
            6
          )}...${data.holder.address.slice(-4)}`,
        }
      );
    } catch (error) {
      console.error("Error creating token:", error);
      toast.error("Failed to create token and holder, but you can still play!");
      setGameState({ name: playerName });
    } finally {
      setIsCreatingToken(false);
    }
  };

  if (!gameState) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1
            className="mb-8 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400"
            style={{
              textShadow: "0 0 20px rgba(255,255,255,0.5)",
              fontFamily: "var(--font-press-start-2p)",
            }}
          >
            ENTER YOUR NAME
          </h1>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && !isCreatingToken) {
                handleJoin(name.trim());
              }
            }}
            className="w-64 px-4 py-3 text-lg rounded-lg bg-white/20 backdrop-blur-sm border-2 border-white/30 text-sky-900 placeholder-sky-900/50 focus:outline-none focus:border-sky-400"
            placeholder="Your name..."
            maxLength={15}
            autoFocus
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="block mx-auto mt-4 px-8 py-3 rounded-lg bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() =>
              name.trim() && !isCreatingToken && handleJoin(name.trim())
            }
            disabled={!name.trim() || isCreatingToken}
          >
            {isCreatingToken ? "Creating Token..." : "CONTINUE"}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!gameState.face) {
    return (
      <CharacterSelect
        onSelect={(face) => setGameState({ ...gameState, face })}
      />
    );
  }

  return (
    <div className="fixed inset-0">
      <Scene selectedFace={gameState.face} playerName={gameState.name} />
      {/* Token Status Overlay */}
      {gameState.tokenId && !gameState.tokenDetails && (
        <div className="fixed top-4 right-4 bg-black/40 backdrop-blur-sm rounded-lg p-4 text-white">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
            <span>Creating your token...</span>
          </div>
        </div>
      )}
    </div>
  );
}
