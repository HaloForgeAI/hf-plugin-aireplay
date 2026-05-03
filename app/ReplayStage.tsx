import { AnimatePresence } from "framer-motion";
import type { ReplayStep } from "./types";
import { PromptStep } from "./steps/PromptStep";
import { AIOutputStep } from "./steps/AIOutputStep";
import { DocumentStep } from "./steps/DocumentStep";
import { CodeDiffStep } from "./steps/CodeDiffStep";
import { ImageStep } from "./steps/ImageStep";
import { MilestoneStep } from "./steps/MilestoneStep";
import { NoteStep } from "./steps/NoteStep";

interface ReplayStageProps {
  step: ReplayStep | null;
  /** Whether to run entry animations for the current step */
  animate: boolean;
  /** Absolute path of the story file, for resolving relative image paths */
  storyPath?: string | null;
  /** Called when the step's typewriter/streaming animation finishes */
  onAnimationComplete?: () => void;
}

export function ReplayStage({ step, animate, storyPath, onAnimationComplete }: ReplayStageProps) {
  if (!step) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-foreground-secondary italic">
        Select a step to begin
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <AnimatePresence mode="wait">
        <div key={step.id}>
          {/* Step title header */}
          <h2 className="mb-4 text-lg font-bold text-foreground">{step.title}</h2>

          {/* Render the appropriate step component */}
          {step.type === "prompt" && (
            <PromptStep step={step} animate={animate} storyPath={storyPath} onAnimationComplete={onAnimationComplete} />
          )}
          {step.type === "ai-output" && (
            <AIOutputStep step={step} animate={animate} storyPath={storyPath} onAnimationComplete={onAnimationComplete} />
          )}
          {step.type === "document" && <DocumentStep step={step} storyPath={storyPath} />}
          {step.type === "code-diff" && <CodeDiffStep step={step} />}
          {step.type === "image" && <ImageStep step={step} storyPath={storyPath} />}
          {step.type === "milestone" && <MilestoneStep step={step} storyPath={storyPath} />}
          {step.type === "note" && <NoteStep step={step} storyPath={storyPath} />}
        </div>
      </AnimatePresence>
    </div>
  );
}
