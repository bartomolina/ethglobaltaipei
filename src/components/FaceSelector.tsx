"use client";

import { Dispatch, SetStateAction } from "react";

const FACES = [
  {
    id: 1,
    src: "/faces/anna.png",
    alt: "Anna",
  },
  {
    id: 2,
    src: "/faces/barto.png",
    alt: "Barto",
  },
  {
    id: 3,
    src: "/faces/yuki.png",
    alt: "Yuki",
  },
];

interface FaceSelectorProps {
  selectedFace?: string;
  onSelect: Dispatch<SetStateAction<string | undefined>>;
}

export function FaceSelector({ selectedFace, onSelect }: FaceSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {FACES.map((face) => (
        <button
          key={face.id}
          onClick={() => onSelect(face.src)}
          className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all hover:scale-105 ${
            selectedFace === face.src
              ? "border-blue-500 shadow-lg shadow-blue-500/20"
              : "border-gray-700 hover:border-gray-600"
          }`}
        >
          <img
            src={face.src}
            alt={face.alt}
            className="h-full w-full object-cover"
          />
        </button>
      ))}
    </div>
  );
}
