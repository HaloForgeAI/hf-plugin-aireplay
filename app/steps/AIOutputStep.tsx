import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MarkdownRenderer } from "../../../../src/shared/components/MarkdownRenderer";
import type { ReplayStep } from "../types";

interface AIOutputStepProps {
  step: ReplayStep;
  animate: boolean;
  /** Chunk size for streaming simulation */
  chunkSize?: number;
  /** Delay between chunks in ms */
  chunkDelay?: number;
  storyPath?: string | null;
  /** Called when the streaming animation finishes (or is skipped) */
  onAnimationComplete?: () => void;
}

export function AIOutputStep({
  step,
  animate,
  chunkSize = 8,
  chunkDelay = 20,
  storyPath,
  onAnimationComplete,
}: AIOutputStepProps) {
  const [displayed, setDisplayed] = useState(animate ? "" : step.content);
  const [done, setDone] = useState(!animate);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!animate) {
      setDisplayed(step.content);
      setDone(true);
      onAnimationComplete?.();
      return;
    }
    setDisplayed("");
    setDone(false);
    let idx = 0;
    timerRef.current = setInterval(() => {
      idx += chunkSize;
      if (idx >= step.content.length) {
        setDisplayed(step.content);
        setDone(true);
        onAnimationComplete?.();
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setDisplayed(step.content.slice(0, idx));
      }
    }, chunkDelay);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step.content, animate, chunkSize, chunkDelay]);

  // Auto-scroll to keep the cursor visible during streaming animation
  useEffect(() => {
    if (!done && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [displayed, done]);

  const skipAnimation = useCallback(() => {
    if (done) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setDisplayed(step.content);
    setDone(true);
    onAnimationComplete?.();
  }, [done, step.content, onAnimationComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-3"
    >
      {/* AI badge */}
      <div className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        AI Output
      </div>
      {/* Content — click to skip streaming */}
      <div
        className="rounded-xl border border-border bg-surface p-5 text-sm leading-relaxed"
        onClick={skipAnimation}
        role={done ? undefined : "button"}
        title={done ? undefined : "Click to skip animation"}
        style={done ? undefined : { cursor: "pointer" }}
      >
        <MarkdownRenderer content={displayed} sourcePath={storyPath ?? undefined} />
        {!done && (
          <span ref={bottomRef} className="inline-block w-[2px] h-[1.1em] bg-emerald-400 animate-pulse ml-0.5 align-text-bottom" />
        )}
      </div>
    </motion.div>
  );
}
