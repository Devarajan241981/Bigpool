"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const TRACKS: string[] = [
  "https://okmejlnkhxqeevrypzvg.supabase.co/storage/v1/object/public/music/Arctic%20Monkeys%20-%20I%20Wanna%20Be%20Yours.mp3",
  "https://okmejlnkhxqeevrypzvg.supabase.co/storage/v1/object/public/music/cloud-jeff-kaale-main-version-27255-02-57.mp3",
  "https://okmejlnkhxqeevrypzvg.supabase.co/storage/v1/object/public/music/fassounds-escape-your-love-upbeat-fashion-pop-dance-412230.mp3",
];

function randomTrack(current: number) {
  if (TRACKS.length === 1) return 0;
  let next = Math.floor(Math.random() * TRACKS.length);
  while (next === current) next = Math.floor(Math.random() * TRACKS.length);
  return next;
}

// Renders as an inline navbar icon — no fixed positioning.
// Drop it anywhere in a flex row and it fits like any other nav icon.
export default function MusicPlayer() {
  if (TRACKS.length === 0) return null;

  const [on, setOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idxRef = useRef<number>(-1);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.35;
    // "auto" tells the browser to buffer the whole file before playing.
    // This prevents network interruptions (push events, auth refreshes) from
    // causing audio to stutter or slow down mid-song.
    audio.preload = "auto";
    audioRef.current = audio;

    audio.addEventListener("ended", () => {
      const next = randomTrack(idxRef.current);
      idxRef.current = next;
      audio.src = TRACKS[next];
      // Load fully before playing to avoid stutter on track change
      audio.load();
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
      if (idxRef.current === -1) {
        const idx = randomTrack(-1);
        idxRef.current = idx;
        audio.src = TRACKS[idx];
        audio.load(); // Start buffering immediately
      }
      audio.play().catch(() => {});
      setOn(true);
    }
  };

  return (
    <button
      onClick={toggle}
      title={on ? "Turn off music" : "Play background music"}
      aria-label={on ? "Mute music" : "Play music"}
      className="text-white hover:bg-white/10 relative p-2 rounded transition-colors"
    >
      {on ? (
        <Volume2 className="w-5 h-5 text-[#5eead4]" />
      ) : (
        <VolumeX className="w-5 h-5 text-gray-400" />
      )}
      {on && (
        <span
          className="absolute inset-0 rounded-full animate-ping pointer-events-none"
          style={{ background: "rgba(13,148,136,0.22)", animationDuration: "1.8s" }}
        />
      )}
    </button>
  );
}
