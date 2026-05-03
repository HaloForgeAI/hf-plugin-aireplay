import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  X,
  MessageSquareText,
  Bot,
  FileText,
  GitCompareArrows,
  ImageIcon,
  Flag,
  StickyNote,
  Eye,
  EyeOff,
} from "lucide-react";
import type { ReplayStep, StepType } from "./types";
import { useReplayT } from "./i18n";
import { MarkdownRenderer } from "./host/MarkdownRenderer";

// ─── Type config ─────────────────────────────────────────────────────────────

interface TypeConfig {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  color: string;       // ring + text when selected
  bgActive: string;    // bg when selected
  bgIdle: string;      // bg when not selected
}

function useTypeConfigs(): Record<StepType, TypeConfig> {
  const t = useReplayT();
  return useMemo(
    () => ({
      milestone: {
        icon: Flag,
        label: t("replay.step.milestone"),
        color: "text-primary ring-primary/40",
        bgActive: "bg-primary/12",
        bgIdle: "bg-surface hover:bg-surface-secondary",
      },
      prompt: {
        icon: MessageSquareText,
        label: t("replay.step.prompt"),
        color: "text-primary ring-primary/40",
        bgActive: "bg-primary/12",
        bgIdle: "bg-surface hover:bg-surface-secondary",
      },
      "ai-output": {
        icon: Bot,
        label: t("replay.step.aiOutput"),
        color: "text-emerald-400 ring-emerald-500/40",
        bgActive: "bg-emerald-500/12",
        bgIdle: "bg-surface hover:bg-surface-secondary",
      },
      document: {
        icon: FileText,
        label: t("replay.step.document"),
        color: "text-blue-400 ring-blue-500/40",
        bgActive: "bg-blue-500/12",
        bgIdle: "bg-surface hover:bg-surface-secondary",
      },
      "code-diff": {
        icon: GitCompareArrows,
        label: t("replay.step.codeDiff"),
        color: "text-amber-400 ring-amber-500/40",
        bgActive: "bg-amber-500/12",
        bgIdle: "bg-surface hover:bg-surface-secondary",
      },
      image: {
        icon: ImageIcon,
        label: t("replay.step.image"),
        color: "text-violet-400 ring-violet-500/40",
        bgActive: "bg-violet-500/12",
        bgIdle: "bg-surface hover:bg-surface-secondary",
      },
      note: {
        icon: StickyNote,
        label: t("replay.step.note"),
        color: "text-gray-400 ring-gray-500/40",
        bgActive: "bg-gray-500/12",
        bgIdle: "bg-surface hover:bg-surface-secondary",
      },
    }),
    [t],
  );
}

const STEP_TYPES: StepType[] = [
  "milestone",
  "prompt",
  "ai-output",
  "document",
  "code-diff",
  "image",
  "note",
];

// ─── Main component ──────────────────────────────────────────────────────────

interface StepEditorDrawerProps {
  step?: ReplayStep | null;
  onSave: (step: ReplayStep) => void;
  onCancel: () => void;
}

export function StepEditorDrawer({ step, onSave, onCancel }: StepEditorDrawerProps) {
  const t = useReplayT();
  const typeConfigs = useTypeConfigs();
  const isEdit = !!step;

  const [type, setType] = useState<StepType>(step?.type ?? "prompt");
  const [title, setTitle] = useState(step?.title ?? "");
  const [content, setContent] = useState(step?.content ?? "");
  const [contentBefore, setContentBefore] = useState(step?.contentBefore ?? "");
  const [imageUrl, setImageUrl] = useState(step?.imageUrl ?? "");
  const [language, setLanguage] = useState(step?.language ?? "");
  const [timestamp, setTimestamp] = useState(
    step?.timestamp ?? new Date().toISOString().slice(0, 10),
  );
  const [preview, setPreview] = useState(false);
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onCancel, 200);
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
      ...(type === "code-diff" && contentBefore ? { contentBefore } : {}),
    };
    setVisible(false);
    setTimeout(() => onSave(result), 200);
  }, [step, type, title, content, contentBefore, imageUrl, language, timestamp, onSave]);

  const cfg = typeConfigs[type];
  const Icon = cfg.icon;

  // ── Content area height helper ──
  const needsLargeContent = type === "ai-output" || type === "document";
  const needsSmallContent = type === "milestone";
  const contentRows = needsLargeContent ? 14 : needsSmallContent ? 3 : 8;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className={clsx(
          "flex-1 transition-colors duration-200",
          visible ? "bg-black/30" : "bg-transparent",
        )}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={clsx(
          "flex h-full w-[480px] max-w-[90vw] flex-col border-l border-border bg-background shadow-2xl transition-transform duration-200 ease-out",
          visible ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <div className={clsx("flex h-8 w-8 items-center justify-center rounded-lg", cfg.bgActive)}>
            <Icon size={16} className={cfg.color.split(" ")[0]} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">
              {isEdit ? t("replay.editor.editStep") : t("replay.editor.addStep")}
            </h3>
            <span className={clsx("text-[10px] font-medium", cfg.color.split(" ")[0])}>
              {cfg.label}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-secondary hover:bg-surface hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Type selector */}
          <div className="px-5 pt-4 pb-2">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-foreground-secondary">
              {t("replay.editor.type")}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {STEP_TYPES.map((st) => {
                const c = typeConfigs[st];
                const StIcon = c.icon;
                const selected = type === st;
                return (
                  <button
                    key={st}
                    onClick={() => setType(st)}
                    className={clsx(
                      "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium transition-all",
                      selected
                        ? `${c.bgActive} ${c.color} ring-1`
                        : `${c.bgIdle} text-foreground-secondary`,
                    )}
                  >
                    <StIcon size={15} />
                    <span className="truncate w-full text-center">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Title + Date row ── */}
          <div className="flex gap-3 px-5 pt-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[11px] font-medium text-foreground-secondary">
                {t("replay.editor.stepTitle")}
              </label>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("replay.editor.stepTitlePlaceholder")}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary/40 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="w-[130px] flex flex-col gap-1 shrink-0">
              <label className="text-[11px] font-medium text-foreground-secondary">
                {t("replay.editor.timestamp")}
              </label>
              <input
                type="date"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* ── Type-specific sections ── */}
          <div className="px-5 pt-4 pb-5">
            {/* Image type: URL + preview */}
            {type === "image" && (
              <div className="flex flex-col gap-3 mb-4">
                <label className="text-[11px] font-medium text-foreground-secondary">
                  {t("replay.editor.imageUrl")}
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="images/screenshot.png or https://..."
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary/40 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                {imageUrl && (
                  <div className="rounded-lg border border-border bg-surface p-3">
                    <div className="text-[10px] text-foreground-secondary mb-2">
                      {t("replay.editor.preview")}
                    </div>
                    <div className="flex items-center justify-center rounded-md bg-background/50 p-2 min-h-[80px]">
                      <img
                        src={imageUrl}
                        alt="preview"
                        className="max-w-full max-h-[200px] rounded object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Code diff: language + before/after */}
            {type === "code-diff" && (
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-foreground-secondary">
                    {t("replay.editor.language")}
                  </label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="typescript, rust, python..."
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-foreground placeholder:text-foreground-secondary/40 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-foreground-secondary">
                    {t("replay.editor.codeBefore")}
                  </label>
                  <textarea
                    value={contentBefore}
                    onChange={(e) => setContentBefore(e.target.value)}
                    placeholder={t("replay.editor.codeBeforePlaceholder")}
                    rows={6}
                    className="resize-y rounded-lg border border-amber-500/20 bg-red-500/5 px-3 py-2 font-mono text-xs text-foreground placeholder:text-foreground-secondary/40 focus:border-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-foreground-secondary">
                    {t("replay.editor.codeAfter")}
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("replay.editor.codeAfterPlaceholder")}
                    rows={6}
                    className="resize-y rounded-lg border border-amber-500/20 bg-emerald-500/5 px-3 py-2 font-mono text-xs text-foreground placeholder:text-foreground-secondary/40 focus:border-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            )}

            {/* Prompt type: styled as "user message" */}
            {type === "prompt" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-foreground-secondary">
                    {t("replay.editor.promptContent")}
                  </label>
                  <button
                    onClick={() => setPreview((p) => !p)}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-foreground-secondary hover:bg-surface transition-colors"
                  >
                    {preview ? <EyeOff size={10} /> : <Eye size={10} />}
                    {t("replay.editor.preview")}
                  </button>
                </div>
                {preview ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 min-h-[120px]">
                    <MarkdownRenderer content={content} />
                  </div>
                ) : (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("replay.editor.promptPlaceholder")}
                    rows={contentRows}
                    className="resize-y rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground-secondary/40 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                )}
              </div>
            )}

            {/* AI Output type: styled as "AI message" */}
            {type === "ai-output" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-foreground-secondary">
                    {t("replay.editor.aiContent")}
                  </label>
                  <button
                    onClick={() => setPreview((p) => !p)}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-foreground-secondary hover:bg-surface transition-colors"
                  >
                    {preview ? <EyeOff size={10} /> : <Eye size={10} />}
                    {t("replay.editor.preview")}
                  </button>
                </div>
                {preview ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 min-h-[120px]">
                    <MarkdownRenderer content={content} />
                  </div>
                ) : (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("replay.editor.aiPlaceholder")}
                    rows={contentRows}
                    className="resize-y rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 font-mono text-sm text-foreground placeholder:text-foreground-secondary/40 focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                  />
                )}
              </div>
            )}

            {/* Document type */}
            {type === "document" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-foreground-secondary">
                    {t("replay.editor.docContent")}
                  </label>
                  <button
                    onClick={() => setPreview((p) => !p)}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-foreground-secondary hover:bg-surface transition-colors"
                  >
                    {preview ? <EyeOff size={10} /> : <Eye size={10} />}
                    {t("replay.editor.preview")}
                  </button>
                </div>
                {preview ? (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 min-h-[120px]">
                    <MarkdownRenderer content={content} />
                  </div>
                ) : (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("replay.editor.docPlaceholder")}
                    rows={contentRows}
                    className="resize-y rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground-secondary/40 focus:border-blue-500/40 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                )}
              </div>
            )}

            {/* Milestone type: just a short description */}
            {type === "milestone" && (
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-medium text-foreground-secondary">
                  {t("replay.editor.milestoneDesc")}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t("replay.editor.milestonePlaceholder")}
                  rows={contentRows}
                  className="resize-y rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground-secondary/40 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
            )}

            {/* Note type */}
            {type === "note" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-foreground-secondary">
                    {t("replay.editor.noteContent")}
                  </label>
                  <button
                    onClick={() => setPreview((p) => !p)}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-foreground-secondary hover:bg-surface transition-colors"
                  >
                    {preview ? <EyeOff size={10} /> : <Eye size={10} />}
                    {t("replay.editor.preview")}
                  </button>
                </div>
                {preview ? (
                  <div className="rounded-xl border border-gray-500/20 bg-gray-500/5 px-4 py-3 min-h-[120px]">
                    <MarkdownRenderer content={content} />
                  </div>
                ) : (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("replay.editor.notePlaceholder")}
                    rows={contentRows}
                    className="resize-y rounded-xl border border-gray-500/20 bg-gray-500/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground-secondary/40 focus:border-gray-500/40 focus:outline-none focus:ring-1 focus:ring-gray-500/20"
                  />
                )}
              </div>
            )}

            {/* Image type: extra caption content */}
            {type === "image" && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-foreground-secondary">
                  {t("replay.editor.imageCaption")}
                </label>
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t("replay.editor.imageCaptionPlaceholder")}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary/40 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <button
            onClick={handleClose}
            className="rounded-lg px-4 py-1.5 text-xs font-medium text-foreground-secondary hover:bg-surface transition-colors"
          >
            {t("replay.editor.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className={clsx(
              "rounded-lg px-5 py-2 text-xs font-semibold text-white transition-all",
              title.trim()
                ? "bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20"
                : "bg-primary/40 cursor-not-allowed",
            )}
          >
            {isEdit ? t("replay.editor.save") : t("replay.editor.add")}
          </button>
        </div>
      </div>
    </div>
  );
}
