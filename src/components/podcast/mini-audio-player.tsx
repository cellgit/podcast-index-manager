"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PauseCircle, PlayCircle, Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";

type MiniAudioPlayerProps = {
  src: string;
  title?: string;
  type?: string | null;
  className?: string;
};

export function MiniAudioPlayer({ src, title, type, className }: MiniAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handleLoaded = () => {
      setDuration(audio.duration || 0);
      setIsReady(true);
    };
    const handleTime = () => {
      setCurrentTime(audio.currentTime || 0);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const formattedCurrent = useMemo(() => formatTime(currentTime), [currentTime]);
  const formattedDuration = useMemo(() => formatTime(duration), [duration]);

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const nextMuted = !muted;
    audio.muted = nextMuted;
    setMuted(nextMuted);
  };

  return (
    <div
      className={cn(
        "flex w-full max-w-sm items-center gap-2 rounded-md border border-border/60 bg-background/80 px-3 py-2 text-xs shadow-sm",
        !isReady && "opacity-70",
        className,
      )}
    >
      <audio ref={audioRef} preload="metadata" src={src} title={title}>
        {type ? <source src={src} type={type} /> : null}
      </audio>
      <button
        type="button"
        onClick={() => setIsPlaying((prev) => !prev)}
        disabled={!isReady}
        className="text-foreground transition hover:text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
        aria-label={isPlaying ? "暂停播放" : "开始播放"}
      >
        {isPlaying ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
      </button>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="truncate" title={title}>
            {title ?? "音频预览"}
          </span>
          <span>
            {formattedCurrent} / {formattedDuration}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={Number.isFinite(duration) && duration > 0 ? duration : 0}
          step={1}
          value={currentTime}
          onChange={(event) => handleSeek(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded bg-muted accent-primary"
          disabled={!isReady || !Number.isFinite(duration) || duration === 0}
          aria-label="播放进度"
        />
      </div>
      <button
        type="button"
        onClick={toggleMute}
        className="text-muted-foreground transition hover:text-primary"
        aria-label={muted ? "取消静音" : "静音"}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "00:00";
  }
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}
