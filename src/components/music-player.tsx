"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Music2, X, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, ChevronUp } from "lucide-react";

// ── Playlist ─────────────────────────────────────────────────────
// Add your own MP3 files to /public/music/ and list them here.
// Free royalty-free sources: mixkit.co, pixabay.com/music, bensound.com
const PLAYLIST = [
  {
    title: "Summer Vibes",
    artist: "Pixabay Music",
    src: "/music/track1.mp3",
    color: "#0d9488",
  },
  {
    title: "Chill Lofi Beat",
    artist: "Pixabay Music",
    src: "/music/track2.mp3",
    color: "#7c3aed",
  },
  {
    title: "Happy Shopping",
    artist: "Mixkit",
    src: "/music/track3.mp3",
    color: "#ea580c",
  },
];

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, "0");
}
function fmtTime(s: number) {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${pad(sec)}`;
}

export default function MusicPlayer() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const track = PLAYLIST[trackIdx];

  // Init audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("durationchange", () => setDuration(audio.duration));
    audio.addEventListener("ended", () => skipNext());
    audio.addEventListener("play", () => setPlaying(true));
    audio.addEventListener("pause", () => setPlaying(false));

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load new track when index changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const wasPlaying = playing;
    audio.src = PLAYLIST[trackIdx].src;
    audio.load();
    if (wasPlaying) audio.play().catch(() => {});
    setCurrentTime(0);
  }, [trackIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync volume/mute
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const skipNext = useCallback(() => {
    setTrackIdx((i) => (i + 1) % PLAYLIST.length);
  }, []);

  const skipPrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
    } else {
      setTrackIdx((i) => (i - 1 + PLAYLIST.length) % PLAYLIST.length);
    }
  }, []);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrentTime(Number(e.target.value));
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* ── Floating button ────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 left-4 md:bottom-6 md:left-4 z-40 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: playing
            ? `linear-gradient(135deg, ${track.color}, #0f172a)`
            : "linear-gradient(135deg, #1e293b, #0f172a)",
          border: `2px solid ${playing ? track.color : "#334155"}`,
        }}
        aria-label="Music player"
        title="Play music"
      >
        <Music2
          className="w-5 h-5"
          style={{
            color: playing ? track.color : "#94a3b8",
            animation: playing ? "spin 3s linear infinite" : "none",
          }}
        />
        {/* Pulse ring when playing */}
        {playing && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: `${track.color}22` }}
          />
        )}
      </button>

      {/* ── Mini player panel ───────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-36 left-3 md:bottom-20 md:left-4 z-50 w-72 rounded-2xl shadow-2xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4" style={{ color: track.color }} />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Now Playing</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowPlaylist((v) => !v)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Playlist"
              >
                <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform ${showPlaylist ? "" : "rotate-180"}`} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Track info */}
          <div className="px-4 pb-3">
            <div
              className="w-full rounded-xl p-3 mb-3 flex items-center gap-3"
              style={{ background: `${track.color}18`, border: `1px solid ${track.color}33` }}
            >
              {/* Vinyl disc */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle, ${track.color} 20%, #0f172a 21%, #0f172a 45%, ${track.color}44 46%)`,
                  animation: playing ? "spin 4s linear infinite" : "none",
                }}
              >
                <div className="w-2 h-2 rounded-full bg-white/80" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={seek}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${track.color} ${progressPct}%, #334155 ${progressPct}%)`,
                  accentColor: track.color,
                }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-500">{fmtTime(currentTime)}</span>
                <span className="text-[10px] text-slate-500">{fmtTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              {/* Volume */}
              <button
                onClick={() => setMuted((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                {muted ? (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                ) : (
                  <Volume2 className="w-4 h-4" style={{ color: track.color }} />
                )}
              </button>

              {/* Prev / Play / Next */}
              <div className="flex items-center gap-2">
                <button
                  onClick={skipPrev}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <SkipBack className="w-4 h-4 text-slate-300" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
                  style={{ background: track.color }}
                >
                  {playing ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>
                <button
                  onClick={skipNext}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <SkipForward className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              {/* Volume slider */}
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
                className="w-14 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${track.color} ${(muted ? 0 : volume) * 100}%, #334155 ${(muted ? 0 : volume) * 100}%)`,
                  accentColor: track.color,
                }}
              />
            </div>
          </div>

          {/* Playlist */}
          {showPlaylist && (
            <div className="border-t border-white/5 px-4 py-3 space-y-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Playlist</p>
              {PLAYLIST.map((t, i) => (
                <button
                  key={i}
                  onClick={() => { setTrackIdx(i); if (!playing) togglePlay(); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                  style={{ background: i === trackIdx ? `${t.color}22` : "" }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                    style={{ background: i === trackIdx ? t.color : "#334155", color: "white" }}
                  >
                    {i === trackIdx && playing ? "▶" : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200 truncate">{t.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">{t.artist}</p>
                  </div>
                  {i === trackIdx && (
                    <div className="flex gap-0.5 items-end flex-shrink-0">
                      {[1, 2, 3].map((b) => (
                        <div
                          key={b}
                          className="w-0.5 rounded-full"
                          style={{
                            height: `${8 + b * 4}px`,
                            background: t.color,
                            animation: playing ? `bounce ${0.4 + b * 0.15}s ease-in-out infinite alternate` : "none",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Footer note */}
          <div className="px-4 pb-3 pt-0">
            <p className="text-[10px] text-slate-600 text-center">
              Add your MP3s to <code className="text-slate-500">/public/music/</code>
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
