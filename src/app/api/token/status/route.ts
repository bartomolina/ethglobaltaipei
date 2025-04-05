import { NextResponse } from "next/server";
import { env } from "@/env.mjs";

export async function GET() {
  try {
    console.log("📡 Checking token status...");

    const response = await fetch(
      "https://api.metal.build/merchant/all-tokens",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.METAL_API_KEY,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Token status check failed:", {
        status: response.status,
        data,
      });
      throw new Error("Failed to get tokens");
    }

    console.log("📊 Found tokens:", data.length);

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error getting tokens:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to get tokens" },
      { status: 500 }
    );
  }
}
