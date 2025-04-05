import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env.mjs";

const createTokenSchema = z.object({
  playerName: z.string(),
  playerAddress: z.string().optional(),
});

async function createHolder(userId: string) {
  console.log("🏗️ Creating holder account for:", userId);

  const response = await fetch(`https://api.metal.build/holder/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.METAL_API_KEY,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Holder creation failed:", {
      status: response.status,
      data,
    });
    throw new Error(`Failed to create holder: ${response.status}`);
  }

  console.log("✅ Holder created:", {
    id: data.id,
    address: data.address,
  });

  return data;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { playerName, playerAddress } = createTokenSchema.parse(body);

    // Create a holder account first
    const holderId = `player_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    const holder = await createHolder(holderId);

    console.log("🪙 Creating token for player:", playerName);

    // Fire and forget token creation
    fetch("https://api.metal.build/merchant/create-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.METAL_API_KEY,
      },
      body: JSON.stringify({
        name: `${playerName} Token`,
        symbol: playerName.slice(0, 4).toUpperCase(),
        merchantAddress: playerAddress,
        canDistribute: true,
        canLP: true,
      }),
    })
      .then(async (tokenResponse) => {
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
          console.error("❌ Token creation failed:", {
            status: tokenResponse.status,
            data: tokenData,
          });
          return;
        }
        console.log("🚀 Token creation initiated:", {
          jobId: tokenData.jobId,
          tokenName: `${playerName} Token`,
          symbol: playerName.slice(0, 4).toUpperCase(),
        });
      })
      .catch((error) => {
        console.error("❌ Error in background token creation:", error);
      });

    // Return immediately with holder info
    return NextResponse.json({
      message: "Token creation initiated",
      holder: {
        id: holder.id,
        address: holder.address,
      },
    });
  } catch (error) {
    console.error("❌ Error creating token and holder:", error);
    return NextResponse.json(
      { error: "Failed to create token and holder" },
      { status: 500 }
    );
  }
}
