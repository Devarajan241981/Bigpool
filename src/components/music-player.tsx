"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

// Drop your MP3 files in /public/music/ and list them here.
// Free vocals/lyrics: uppbeat.io  |  Free instrumentals: pixabay.com/music
const TRACKS = [
  "/music/track1.mp3",
  "/music/track2.mp3",
  "/music/track3.mp3",
];

function randomTrack(current: number) {
  if (TRACKS.length === 1) return 0;
  let next = Math.floor(Math.random() * TRACKS.length);
  while (next === current) next = Math.floor(Math.random() * TRACKS.length);
  return next;
}

export default function MusicPlayer() {
  const [on, setOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idxRef = useRef<number>(-1);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.35;
    audio.preload = "none";
    audioRef.current = audio;

    // When a song ends, play next random one
    audio.addEventListener("ended", () => {
      const next = randomTrack(idxRef.current);
      idxRef.current = next;
      audio.src = TRACKS[next];
      audio.play().catch(() => {});
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (on) {
      audio.pause();
      setOn(false);
    } else {
      // Pick a random track if none loaded yet
      if (idxRef.current === -1) {
        const idx = randomTrack(-1);
        idxRef.current = idx;
        audio.src = TRACKS[idx];
      }
      audio.play().catch(() => {});
      setOn(true);
    }
  };

  return (
    <>
      <button
        onClick={toggle}
        title={on ? "Turn off music" : "Play background music"}
        aria-label={on ? "Mute music" : "Play music"}
        className="fixed bottom-20 left-4 md:bottom-6 md:left-4 z-40 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: on
            ? "linear-gradient(135deg, #0d9488, #0f766e)"
            : "rgba(15,23,42,0.85)",
          border: on ? "2px solid #14b8a6" : "2px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(8px)",
          boxShadow: on
            ? "0 0 16px rgba(13,148,136,0.5), 0 4px 12px rgba(0,0,0,0.3)"
            : "0 4px 12px rgba(0,0,0,0.25)",
        }}
      >
        {on ? (
          <Volume2 className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
        ) : (
          <VolumeX className="w-[18px] h-[18px] text-slate-400" />
        )}

        {/* Subtle pulse ring when music is on */}
        {on && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: "rgba(13,148,136,0.25)", animationDuration: "1.8s" }}
          />
        )}
      </button>
    </>
  );
}
