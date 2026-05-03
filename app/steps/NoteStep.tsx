import { motion } from "framer-motion";
import { MarkdownRenderer } from ".././host/MarkdownRenderer";
import type { ReplayStep } from "../types";

interface NoteStepProps {
  step: ReplayStep;
  storyPath?: string | null;
}

export function NoteStep({ step, storyPath }: NoteStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-3"
    >
      {/* Badge */}
      <div className="inline-flex items-center gap-2 self-start rounded-full bg-gray-500/10 px-3 py-1 text-xs font-semibold text-gray-400">
        <span className="h-2 w-2 rounded-full bg-gray-500" />
        Note
      </div>
      {/* Content */}
      <div className="rounded-xl border border-border bg-surface-secondary p-5 text-sm leading-relaxed text-foreground italic">
        <MarkdownRenderer content={step.content} sourcePath={storyPath ?? undefined} />
      </div>
    </motion.div>
  );
}
