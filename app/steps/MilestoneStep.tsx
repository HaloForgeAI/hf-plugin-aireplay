import { motion } from "framer-motion";
import { MarkdownRenderer } from ".././host/MarkdownRenderer";
import type { ReplayStep } from "../types";

interface MilestoneStepProps {
  step: ReplayStep;
  storyPath?: string | null;
}

export function MilestoneStep({ step, storyPath }: MilestoneStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, type: "spring", damping: 20 }}
      className="flex flex-col items-center justify-center gap-4 py-12"
    >
      {/* Large milestone icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-2 ring-primary/30">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" x2="4" y1="22" y2="15" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-foreground text-center">{step.title}</h2>
      {step.content && (
        <div className="max-w-lg text-center text-sm text-foreground-secondary leading-relaxed">
          <MarkdownRenderer content={step.content} sourcePath={storyPath ?? undefined} />
        </div>
      )}
      {step.timestamp && (
        <span className="text-xs text-foreground-secondary/60">{step.timestamp}</span>
      )}
    </motion.div>
  );
}
