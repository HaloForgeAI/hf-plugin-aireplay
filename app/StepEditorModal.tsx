import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { ReplayStep, StepType } from "./types";
import { useReplayT } from "./i18n";

const STEP_TYPES: StepType[] = [
  "milestone",
  "prompt",
  "ai-output",
  "document",
  "code-diff",
  "image",
  "note",
];

const STEP_TYPE_LABELS: Record<StepType, { en: string; zh: string }> = {
  milestone: { en: "Milestone", zh: "里程碑" },
  prompt: { en: "Prompt", zh: "提示词" },
  "ai-output": { en: "AI Output", zh: "AI 输出" },
  document: { en: "Document", zh: "文档" },
  "code-diff": { en: "Code Diff", zh: "代码差异" },
  image: { en: "Image", zh: "图片" },
  note: { en: "Note", zh: "笔记" },
};

interface StepEditorModalProps {
  /** If provided, we're editing an existing step; otherwise creating new */
  step?: ReplayStep | null;
  onSave: (step: ReplayStep) => void;
  onCancel: () => void;
}

export function StepEditorModal({ step, onSave, onCancel }: StepEditorModalProps) {
  const t = useReplayT();
  const isEdit = !!step;

  const [type, setType] = useState<StepType>(step?.type ?? "prompt");
  const [title, setTitle] = useState(step?.title ?? "");
  const [content, setContent] = useState(step?.content ?? "");
  const [imageUrl, setImageUrl] = useState(step?.imageUrl ?? "");
  const [language, setLanguage] = useState(step?.language ?? "");
  const [timestamp, setTimestamp] = useState(
    step?.timestamp ?? new Date().toISOString().slice(0, 10),
  );

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  const handleSave = useCallback(() => {
    if (!title.trim()) return;
    const result: ReplayStep = {
      id: step?.id ?? `s-${Date.now()}`,
      type,
      title: title.trim(),
      content,
      timestamp,
      ...(type === "image" && imageUrl ? { imageUrl } : {}),
      ...(type === "code-diff" && language ? { language } : {}),
    };
    onSave(result);
  }, [step, type, title, content, imageUrl, language, timestamp, onSave]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-xl rounded-xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">
            {isEdit ? t("replay.editor.editStep") : t("replay.editor.addStep")}
          </h3>
          <button
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-secondary hover:bg-surface hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-5 py-4">
          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground-secondary">
              {t("replay.editor.type")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STEP_TYPES.map((st) => (
                <button
                  key={st}
                  onClick={() => setType(st)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    type === st
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-surface text-foreground-secondary hover:bg-surface-secondary"
                  }`}
                >
                  {STEP_TYPE_LABELS[st].zh}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground-secondary">
              {t("replay.editor.stepTitle")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("replay.editor.stepTitlePlaceholder")}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Timestamp */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground-secondary">
              {t("replay.editor.timestamp")}
            </label>
            <input
              type="date"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Image URL (only for image type) */}
          {type === "image" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-secondary">
                {t("replay.editor.imageUrl")}
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="images/screenshot.png or https://..."
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          )}

          {/* Language (only for code-diff type) */}
          {type === "code-diff" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-secondary">
                {t("replay.editor.language")}
              </label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="cpp, rust, typescript..."
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground-secondary">
              {t("replay.editor.content")}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("replay.editor.contentPlaceholder")}
              rows={8}
              className="resize-y rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-1.5 text-xs font-medium text-foreground-secondary hover:bg-surface transition-colors"
          >
            {t("replay.editor.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isEdit ? t("replay.editor.save") : t("replay.editor.add")}
          </button>
        </div>
      </div>
    </div>
  );
}
