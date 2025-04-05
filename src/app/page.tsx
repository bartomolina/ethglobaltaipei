"use client";

import { useState } from "react";
import { Scene } from "@/components/world/Scene";
import { FaceSelector } from "@/components/FaceSelector";

export default function Home() {
  const [selectedFace, setSelectedFace] = useState<string>();

  return (
    <main className="h-screen w-screen">
      {!selectedFace ? (
        <div className="flex h-full w-full items-center justify-center bg-gray-900">
          <div className="rounded-lg bg-gray-800 p-8">
            <h1 className="mb-6 text-center text-2xl font-bold text-white">
              Choose Your Character
            </h1>
            <FaceSelector onSelect={setSelectedFace} />
          </div>
        </div>
      ) : (
        <Scene selectedFace={selectedFace} />
      )}
    </main>
  );
}
