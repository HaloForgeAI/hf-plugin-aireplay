import { motion } from "framer-motion";
import { MarkdownRenderer } from "../../../../src/shared/components/MarkdownRenderer";
import type { ReplayStep } from "../types";

interface DocumentStepProps {
  step: ReplayStep;
  storyPath?: string | null;
}

export function DocumentStep({ step, storyPath }: DocumentStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-3"
    >
      {/* Document badge */}
      <div className="inline-flex items-center gap-2 self-start rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
        <span className="h-2 w-2 rounded-full bg-blue-500" />
        Document
      </div>
      {/* Content */}
      <div className="rounded-xl border border-border bg-surface p-6 text-sm leading-relaxed overflow-auto max-h-[70vh]">
        <MarkdownRenderer content={step.content} sourcePath={storyPath ?? undefined} />
      </div>
    </motion.div>
  );
}
