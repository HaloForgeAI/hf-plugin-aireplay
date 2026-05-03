import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Gauge,
} from "lucide-react";
import type { PlaybackSpeed } from "./types";
import { useReplayT } from "./i18n";

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.5, 2];

interface ReplayControlsProps {
  currentIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}

export function ReplayControls({
  currentIndex,
  totalSteps,
  isPlaying,
  speed,
  onPrev,
  onNext,
  onTogglePlay,
  onSpeedChange,
}: ReplayControlsProps) {
  const t = useReplayT();
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= totalSteps - 1;

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    onSpeedChange(next);
  };

  return (
    <div className="flex items-center justify-between border-t border-border bg-sidebar px-4 py-2.5">
      {/* Left: step counter */}
      <span className="text-xs text-foreground-secondary min-w-[100px]">
        {t("replay.controls.stepOf", {
          current: totalSteps > 0 ? currentIndex + 1 : 0,
          total: totalSteps,
        })}
      </span>

      {/* Center: navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            isFirst
              ? "text-foreground-secondary/40 cursor-not-allowed"
              : "text-foreground-secondary hover:bg-surface hover:text-foreground",
          )}
          title={t("replay.controls.prev")}
        >
          <ChevronLeft size={18} />
        </button>

        <button
          onClick={onTogglePlay}
          disabled={totalSteps === 0}
          className={clsx(
            "flex h-9 w-9 items-center justify-center rounded-full transition-all",
            totalSteps === 0
              ? "text-foreground-secondary/40 cursor-not-allowed"
              : isPlaying
                ? "bg-primary/15 text-primary hover:bg-primary/25"
                : "bg-primary/10 text-primary hover:bg-primary/20",
          )}
          title={isPlaying ? t("replay.controls.pause") : t("replay.controls.play")}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          onClick={onNext}
          disabled={isLast}
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            isLast
              ? "text-foreground-secondary/40 cursor-not-allowed"
              : "text-foreground-secondary hover:bg-surface hover:text-foreground",
          )}
          title={t("replay.controls.next")}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Right: speed */}
      <button
        onClick={cycleSpeed}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-foreground-secondary hover:bg-surface hover:text-foreground transition-colors min-w-[80px] justify-end"
        title={t("replay.controls.speed")}
      >
        <Gauge size={13} />
        {speed}×
      </button>
    </div>
  );
}
