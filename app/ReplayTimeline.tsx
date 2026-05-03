import clsx from "clsx";
import {
  MessageSquareText,
  Bot,
  FileText,
  GitCompareArrows,
  ImageIcon,
  Flag,
  StickyNote,
  Pencil,
  Trash2,
} from "lucide-react";
import type { ReplayStep, StepType } from "./types";

const stepIconMap: Record<StepType, React.ComponentType<{ size?: number }>> = {
  prompt: MessageSquareText,
  "ai-output": Bot,
  document: FileText,
  "code-diff": GitCompareArrows,
  image: ImageIcon,
  milestone: Flag,
  note: StickyNote,
};

const stepColorMap: Record<StepType, string> = {
  prompt: "text-primary border-primary/40 bg-primary/10",
  "ai-output": "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  document: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  "code-diff": "text-amber-400 border-amber-500/40 bg-amber-500/10",
  image: "text-violet-400 border-violet-500/40 bg-violet-500/10",
  milestone: "text-primary border-primary/40 bg-primary/10",
  note: "text-gray-400 border-gray-500/40 bg-gray-500/10",
};

interface ReplayTimelineProps {
  steps: ReplayStep[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onEdit?: (index: number) => void;
  onDelete?: (index: number) => void;
}

export function ReplayTimeline({ steps, currentIndex, onSelect, onEdit, onDelete }: ReplayTimelineProps) {
  return (
    <div className="flex flex-col gap-0 py-2">
      {steps.map((step, idx) => {
        const Icon = stepIconMap[step.type] ?? FileText;
        const colorCls = stepColorMap[step.type] ?? stepColorMap.note;
        const isActive = idx === currentIndex;
        const isPast = idx < currentIndex;

        return (
          <div key={step.id} className="flex items-stretch gap-3">
            {/* Vertical line + node */}
            <div className="flex flex-col items-center w-8 shrink-0">
              {/* Top connector */}
              {idx > 0 && (
                <div
                  className={clsx(
                    "w-px flex-1 min-h-[8px]",
                    isPast || isActive ? "bg-primary/40" : "bg-border",
                  )}
                />
              )}
              {idx === 0 && <div className="flex-1" />}
              {/* Node */}
              <button
                onClick={() => onSelect(idx)}
                className={clsx(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                  isActive
                    ? `${colorCls} ring-2 ring-primary/20 scale-110`
                    : isPast
                      ? "border-primary/30 bg-primary/5 text-primary/60"
                      : "border-border bg-surface text-foreground-secondary hover:border-primary/30",
                )}
              >
                <Icon size={13} />
              </button>
              {/* Bottom connector */}
              {idx < steps.length - 1 && (
                <div
                  className={clsx(
                    "w-px flex-1 min-h-[8px]",
                    isPast ? "bg-primary/40" : "bg-border",
                  )}
                />
              )}
              {idx === steps.length - 1 && <div className="flex-1" />}
            </div>

            {/* Label */}
            <div
              className={clsx(
                "group/item flex-1 flex items-center gap-1 rounded-lg px-3 py-2.5 text-left transition-all duration-150 text-xs cursor-pointer",
                isActive
                  ? "bg-primary/8 text-foreground font-medium"
                  : "text-foreground-secondary hover:text-foreground hover:bg-surface",
              )}
              onClick={() => onSelect(idx)}
            >
              <div className="flex-1 min-w-0">
                <div className="line-clamp-1 font-medium">{step.title}</div>
                {step.timestamp && (
                  <div className="mt-0.5 text-[10px] opacity-60">{step.timestamp}</div>
                )}
              </div>
              {/* Edit / Delete buttons */}
              {(onEdit || onDelete) && (
                <div className="hidden group-hover/item:flex items-center gap-0.5 shrink-0">
                  {onEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(idx); }}
                      className="flex h-5 w-5 items-center justify-center rounded text-foreground-secondary/50 hover:text-primary"
                    >
                      <Pencil size={10} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(idx); }}
                      className="flex h-5 w-5 items-center justify-center rounded text-foreground-secondary/50 hover:text-red-400"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
