import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquareText,
  Bot,
  FileText,
  GitCompareArrows,
  ImageIcon,
  Flag,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Gauge,
} from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { MarkdownRenderer } from "../../../src/shared/components/MarkdownRenderer";
import { useReplayT } from "./i18n";
import type { ReplayStep, StepType, PlaybackSpeed } from "./types";

// ─── Config ──────────────────────────────────────────────────────────────────

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.5, 2];

/** Max content height (px) before collapsing */
const COLLAPSE_THRESHOLD = 280;

const typeIcon: Record<StepType, React.ComponentType<{ size?: number; className?: string }>> = {
  prompt: MessageSquareText,
  "ai-output": Bot,
  document: FileText,
  "code-diff": GitCompareArrows,
  image: ImageIcon,
  milestone: Flag,
  note: StickyNote,
};

/** Which side does each type appear on? */
function getBubbleSide(type: StepType): "right" | "left" | "center" {
  switch (type) {
    case "prompt":
      return "right";
    case "ai-output":
      return "left";
    case "milestone":
      return "center";
    default:
      // document, code-diff, image, note → left (AI / system side)
      return "left";
  }
}

// ─── Image resolver (shared with ImageStep) ──────────────────────────────────

function normalizePath(raw: string): string {
  const parts = raw.split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === ".." && out.length > 0 && out[out.length - 1] !== "..") out.pop();
    else if (p !== "." && p !== "") out.push(p);
  }
  return (raw.startsWith("/") ? "/" : "") + out.join("/");
}

function resolveImageSrc(raw: string, storyPath?: string | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (/^(https?|data|blob|asset):/.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/") || /^[A-Za-z]:[\\/]/.test(trimmed)) return convertFileSrc(normalizePath(trimmed));
  if (storyPath) {
    const normalized = storyPath.replace(/\\/g, "/");
    const lastSlash = normalized.lastIndexOf("/");
    const parentDir = lastSlash >= 0 ? normalized.slice(0, lastSlash) : "";
    if (parentDir) {
      const decoded = (() => { try { return decodeURIComponent(trimmed); } catch { return trimmed; } })();
      const cleaned = decoded.replace(/\\/g, "/").replace(/^\.\//, "");
      return convertFileSrc(normalizePath(`${parentDir}/${cleaned}`));
    }
  }
  return trimmed;
}

// ─── Date divider ────────────────────────────────────────────────────────────

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 border-t border-border" />
      <span className="text-[10px] font-medium text-foreground-secondary/60 shrink-0">
        {date}
      </span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

// ─── Milestone (centered) ────────────────────────────────────────────────────

function MilestoneBubble({ step }: { step: ReplayStep }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-2 py-4"
    >
      <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 ring-1 ring-primary/20">
        <Flag size={13} className="text-primary" />
        <span className="text-xs font-semibold text-primary">{step.title}</span>
      </div>
      {step.content && (
        <p className="max-w-md text-center text-xs text-foreground-secondary leading-relaxed">
          <MarkdownRenderer content={step.content} />
        </p>
      )}
    </motion.div>
  );
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────

interface ChatBubbleProps {
  step: ReplayStep;
  storyPath?: string | null;
}

function ChatBubble({ step, storyPath }: ChatBubbleProps) {
  const t = useReplayT();
  const side = getBubbleSide(step.type);
  const isRight = side === "right";
  const Icon = typeIcon[step.type] ?? FileText;

  const [collapsed, setCollapsed] = useState(true);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setNeedsCollapse(contentRef.current.scrollHeight > COLLAPSE_THRESHOLD);
    }
  }, [step.content]);

  // Colors per type
  const bubbleColors = isRight
    ? "bg-primary/10 border-primary/20"
    : step.type === "ai-output"
      ? "bg-emerald-500/8 border-emerald-500/15"
      : step.type === "document"
        ? "bg-blue-500/8 border-blue-500/15"
        : step.type === "code-diff"
          ? "bg-amber-500/8 border-amber-500/15"
          : step.type === "image"
            ? "bg-violet-500/8 border-violet-500/15"
            : "bg-surface border-border";

  const iconColor = isRight
    ? "text-primary bg-primary/15"
    : step.type === "ai-output"
      ? "text-emerald-400 bg-emerald-500/15"
      : step.type === "document"
        ? "text-blue-400 bg-blue-500/15"
        : step.type === "code-diff"
          ? "text-amber-400 bg-amber-500/15"
          : step.type === "image"
            ? "text-violet-400 bg-violet-500/15"
            : "text-gray-400 bg-gray-500/15";

  const typeLabel = (() => {
    const key = `replay.step.${
      step.type === "ai-output" ? "aiOutput" : step.type === "code-diff" ? "codeDiff" : step.type
    }` as Parameters<typeof t>[0];
    return t(key);
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={clsx(
        "flex gap-2.5 max-w-[85%] min-w-0",
        isRight ? "ml-auto flex-row-reverse" : "mr-auto",
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          iconColor,
        )}
      >
        <Icon size={14} />
      </div>

      {/* Bubble */}
      <div className={clsx("flex flex-col gap-1 min-w-0", isRight ? "items-end" : "items-start")}>
        {/* Header: type label + time */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-semibold text-foreground-secondary/70">{typeLabel}</span>
          {step.timestamp && (
            <span className="text-[10px] text-foreground-secondary/40">{step.timestamp}</span>
          )}
        </div>

        {/* Title */}
        <div
          className={clsx(
            "rounded-2xl border px-4 py-3 min-w-0 w-full overflow-hidden",
            bubbleColors,
            isRight ? "rounded-tr-md" : "rounded-tl-md",
          )}
        >
          <div className="text-xs font-semibold text-foreground mb-1.5">{step.title}</div>

          {/* Content */}
          <div className="relative min-w-0">
            <div
              ref={contentRef}
              className={clsx(
                "text-sm text-foreground leading-relaxed transition-[max-height] duration-300",
                needsCollapse && collapsed ? "max-h-[280px] overflow-hidden" : "max-h-none",
              )}
            >
              {/* Image */}
              {step.type === "image" && (step.imageUrl || step.content) && (
                <div className="mb-2">
                  <img
                    src={resolveImageSrc(step.imageUrl || step.content, storyPath)}
                    alt={step.title}
                    className="max-w-full max-h-[400px] rounded-lg object-contain"
                  />
                </div>
              )}

              {/* Code diff */}
              {step.type === "code-diff" ? (
                <div className="flex flex-col gap-2">
                  {step.contentBefore && (
                    <div>
                      <div className="text-[10px] font-medium text-red-400/60 mb-1">{t("replay.editor.codeBefore")}</div>
                      <pre className="rounded-lg bg-red-500/5 p-3 text-xs font-mono overflow-x-auto border border-red-500/10">
                        <code>{step.contentBefore}</code>
                      </pre>
                    </div>
                  )}
                  {step.content && (
                    <div>
                      <div className="text-[10px] font-medium text-emerald-400/60 mb-1">{t("replay.editor.codeAfter")}</div>
                      <pre className="rounded-lg bg-emerald-500/5 p-3 text-xs font-mono overflow-x-auto border border-emerald-500/10">
                        <code>{step.content}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ) : step.type !== "image" && step.content ? (
                <MarkdownRenderer content={step.content} sourcePath={storyPath ?? undefined} />
              ) : null}
            </div>

            {/* Collapse gradient overlay */}
            {needsCollapse && collapsed && (
              <div
                className={clsx(
                  "absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t pointer-events-none",
                  isRight
                    ? "from-primary/10 to-transparent"
                    : step.type === "ai-output"
                      ? "from-emerald-500/8 to-transparent"
                      : "from-surface to-transparent",
                )}
              />
            )}
          </div>

          {/* Expand / collapse button */}
          {needsCollapse && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="mt-2 flex items-center gap-1 text-[10px] font-medium text-foreground-secondary/60 hover:text-foreground-secondary transition-colors"
            >
              {collapsed ? (
                <>
                  <ChevronDown size={11} />
                  {t("replay.chat.expand")}
                </>
              ) : (
                <>
                  <ChevronUp size={11} />
                  {t("replay.chat.collapse")}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main chat view ──────────────────────────────────────────────────────────

interface ReplayChatViewProps {
  steps: ReplayStep[];
  storyPath?: string | null;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  onTogglePlay: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}

export function ReplayChatView({
  steps,
  storyPath,
  isPlaying,
  speed,
  onTogglePlay,
  onSpeedChange,
}: ReplayChatViewProps) {
  const t = useReplayT();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll playback state
  const [visibleCount, setVisibleCount] = useState(steps.length);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Track previous isPlaying so we can detect play-button presses */
  const prevPlayingRef = useRef(false);

  // When steps change (new story loaded), show all
  useEffect(() => {
    setVisibleCount(steps.length);
  }, [steps]);

  // Auto-scroll: reveal one message at a time
  useEffect(() => {
    const wasPlaying = prevPlayingRef.current;
    prevPlayingRef.current = isPlaying;

    if (!isPlaying) return;

    if (visibleCount >= steps.length) {
      if (!wasPlaying) {
        // Play button was just pressed while all messages visible → restart
        setVisibleCount(1);
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Playback naturally reached the end → stop
        onTogglePlay();
      }
      return;
    }

    // Content-aware delay: longer messages get more reading time
    const currentStep = steps[visibleCount - 1];
    const contentLen = (currentStep?.content ?? "").length;
    const baseDelay = Math.max(1500, Math.min(1500 + contentLen * 3, 6000));
    const delay = baseDelay / speed;

    playTimerRef.current = setTimeout(() => {
      setVisibleCount((c) => Math.min(c + 1, steps.length));
    }, delay);

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, visibleCount, steps.length, speed, onTogglePlay]);

  // Scroll to bottom when new message appears during playback
  useEffect(() => {
    if (isPlaying && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [visibleCount, isPlaying]);

  const visibleSteps = steps.slice(0, visibleCount);

  // Group by date for date dividers
  let lastDate = "";

  const cycleSpeed = useCallback(() => {
    const idx = SPEEDS.indexOf(speed);
    onSpeedChange(SPEEDS[(idx + 1) % SPEEDS.length]);
  }, [speed, onSpeedChange]);

  const handleRestart = useCallback(() => {
    setVisibleCount(1);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    // Will start playing after state updates
    if (!isPlaying) onTogglePlay();
  }, [isPlaying, onTogglePlay]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-3 min-w-0 w-full">
          <AnimatePresence>
            {visibleSteps.map((step) => {
              const showDate = step.timestamp && step.timestamp !== lastDate;
              if (step.timestamp) lastDate = step.timestamp;

              return (
                <div key={step.id}>
                  {showDate && <DateDivider date={step.timestamp!} />}
                  {step.type === "milestone" ? (
                    <MilestoneBubble step={step} />
                  ) : (
                    <ChatBubble step={step} storyPath={storyPath} />
                  )}
                </div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Bottom controls bar */}
      <div className="flex items-center justify-between border-t border-border bg-sidebar px-4 py-2">
        <span className="text-[11px] text-foreground-secondary">
          {t("replay.chat.messagesShown", { shown: visibleCount, total: steps.length })}
        </span>

        <div className="flex items-center gap-2">
          {visibleCount >= steps.length && (
            <button
              onClick={handleRestart}
              className="rounded-md px-2.5 py-1 text-[11px] font-medium text-foreground-secondary hover:bg-surface hover:text-foreground transition-colors"
            >
              {t("replay.chat.restart")}
            </button>
          )}

          <button
            onClick={onTogglePlay}
            className={clsx(
              "flex h-7 w-7 items-center justify-center rounded-full transition-all",
              isPlaying
                ? "bg-primary/15 text-primary hover:bg-primary/25"
                : "bg-primary/10 text-primary hover:bg-primary/20",
            )}
            title={isPlaying ? t("replay.controls.pause") : t("replay.controls.play")}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>

          <button
            onClick={cycleSpeed}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-foreground-secondary hover:bg-surface hover:text-foreground transition-colors"
            title={t("replay.controls.speed")}
          >
            <Gauge size={11} />
            {speed}×
          </button>
        </div>
      </div>
    </div>
  );
}
