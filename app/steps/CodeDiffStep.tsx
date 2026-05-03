import { motion } from "framer-motion";
import type { ReplayStep } from "../types";

interface CodeDiffStepProps {
  step: ReplayStep;
}

/**
 * Renders a code diff with basic +/- line coloring.
 * `step.content` is the unified diff text.
 */
export function CodeDiffStep({ step }: CodeDiffStepProps) {
  const lines = step.content.split("\n");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-3"
    >
      {/* Badge */}
      <div className="inline-flex items-center gap-2 self-start rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        Code Diff
        {step.language && (
          <span className="ml-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px]">
            {step.language}
          </span>
        )}
      </div>
      {/* Diff content */}
      <div className="rounded-xl border border-border bg-[#0d1117] p-4 font-mono text-xs leading-5 overflow-auto max-h-[70vh]">
        {lines.map((line, i) => {
          let cls = "text-gray-300";
          let bg = "";
          if (line.startsWith("+++") || line.startsWith("---")) {
            cls = "text-gray-500";
          } else if (line.startsWith("@@")) {
            cls = "text-blue-400";
            bg = "bg-blue-500/5";
          } else if (line.startsWith("+")) {
            cls = "text-emerald-400";
            bg = "bg-emerald-500/10";
          } else if (line.startsWith("-")) {
            cls = "text-red-400";
            bg = "bg-red-500/10";
          }
          return (
            <div key={i} className={`px-2 ${bg} ${cls} whitespace-pre`}>
              {line}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
