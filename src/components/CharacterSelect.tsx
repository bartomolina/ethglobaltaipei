"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const characters = [
  { id: "ana", name: "Ana", image: "/faces/ana.png" },
  { id: "john", name: "John", image: "/faces/john.png" },
  { id: "juan", name: "Juan", image: "/faces/juan.png" },
  { id: "yuki", name: "Yuki", image: "/faces/yuki.png" },
  { id: "barto", name: "Barto", image: "/faces/barto.png" },
  { id: "anna", name: "Anna", image: "/faces/anna.png" },
];

interface CharacterSelectProps {
  onSelect: (face: string) => void;
}

export function CharacterSelect({ onSelect }: CharacterSelectProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100">
      <div className="relative max-w-5xl mx-auto px-4">
        {/* Floating crystals decoration */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 left-10 w-20 h-20 rotate-45 bg-gradient-to-tr from-purple-200/50 to-pink-200/50 rounded-lg"
        />
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-12 right-20 w-16 h-16 rotate-12 bg-gradient-to-tr from-emerald-200/50 to-sky-200/50 rounded-lg"
        />

        <div className="text-center mb-16">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400"
            style={{
              textShadow: "0 0 20px rgba(255,255,255,0.5)",
              fontFamily: "var(--font-press-start-2p)",
            }}
          >
            CHOOSE YOUR FIGHTER
          </motion.h1>
        </div>

        <div className="grid grid-cols-3 gap-12">
          {characters.map((char, index) => (
            <motion.div
              key={char.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 },
              }}
              className="relative cursor-pointer group"
              onClick={() => onSelect(char.image)}
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-b from-white/80 to-sky-100/80 backdrop-blur-sm shadow-xl">
                <div className="absolute inset-3 rounded-xl overflow-hidden">
                  <Image
                    src={char.image}
                    alt={char.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
