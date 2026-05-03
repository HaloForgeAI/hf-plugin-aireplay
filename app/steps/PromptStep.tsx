import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MarkdownRenderer } from "../../../../src/shared/components/MarkdownRenderer";
import type { ReplayStep } from "../types";

interface PromptStepProps {
  step: ReplayStep;
  /** Whether to run the typewriter animation */
  animate: boolean;
  /** Character delay in ms */
  charDelay?: number;
  storyPath?: string | null;
  /** Called when the typewriter animation finishes (or is skipped) */
  onAnimationComplete?: () => void;
}

export function PromptStep({ step, animate, charDelay = 12, storyPath, onAnimationComplete }: PromptStepProps) {
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
    // Type faster: emit chunks instead of single chars
    const chunkSize = 6;
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
    }, charDelay);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step.content, animate, charDelay]);

  // Auto-scroll to keep the cursor visible during typewriter animation
  useEffect(() => {
    if (!done && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [displayed, done]);

  /** Click to skip the typewriter animation and show full content immediately */
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
      {/* Prompt badge */}
      <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <span className="h-2 w-2 rounded-full bg-primary" />
        Prompt
      </div>
      {/* Content — click to skip typewriter */}
      <div
        className="rounded-xl border border-border bg-surface-secondary p-5 text-sm leading-relaxed text-foreground"
        onClick={skipAnimation}
        role={done ? undefined : "button"}
        title={done ? undefined : "Click to skip animation"}
        style={done ? undefined : { cursor: "pointer" }}
      >
        <MarkdownRenderer content={displayed} sourcePath={storyPath ?? undefined} />
        {!done && (
          <span ref={bottomRef} className="inline-block w-[2px] h-[1.1em] bg-primary animate-pulse ml-0.5 align-text-bottom" />
        )}
      </div>
    </motion.div>
  );
}
