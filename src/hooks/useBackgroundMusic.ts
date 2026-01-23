import { useState, useRef, useCallback, useEffect } from "react";

const MUSIC_SRC = "/Kosh - Benefit Of The Doubt.mp3";
const MUTE_STORAGE_KEY = "portfolio_musicMuted";

export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  });
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.volume = 0.3; // Start at 30% volume
    audio.muted = isMuted;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Sync mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
    localStorage.setItem(MUTE_STORAGE_KEY, String(isMuted));
  }, [isMuted]);

  const play = useCallback(() => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        if (import.meta.env.DEV) {
          console.warn("Audio playback failed:", err);
        }
      });
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return { isMuted, isPlaying, play, toggleMute };
}
