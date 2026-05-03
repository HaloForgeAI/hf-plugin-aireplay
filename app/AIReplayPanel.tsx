import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import clsx from "clsx";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Save,
  Trash2,
  FileJson,
  FolderArchive,
  Pencil,
  PlusCircle,
  Presentation,
  MessageSquare,
} from "lucide-react";
import { pickFile, pickDirectory, saveFile } from "../../../src/features/devkit/devkitDialogs";
import { useAppStore } from "../../../src/shared/stores/appStore";
import { ReplayTimeline } from "./ReplayTimeline";
import { ReplayStage } from "./ReplayStage";
import { ReplayControls } from "./ReplayControls";
import { ReplayChatView } from "./ReplayChatView";
import { StepEditorDrawer } from "./StepEditorDrawer";
import { useReplayT } from "./i18n";
import type {
  PlaybackSpeed,
  PlaybackState,
  RecentStory,
  ReplayStep,
  ReplayStory,
  ViewMode,
} from "./types";

// ─── Plugin IPC helper (matches gitInvoke pattern) ───────────────────────────

function replayInvoke<T>(cmd: string, args: Record<string, unknown> = {}): Promise<T> {
  return invoke<T>("plugin_invoke", {
    args: {
      wire_name: `plugin_dev_haloforge_aireplay_${cmd}`,
      args,
    },
  });
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const formField = target.closest("input, textarea, select, [contenteditable='true']");
  return formField instanceof HTMLElement;
}

// ─── Default demo story ──────────────────────────────────────────────────────

const DEMO_STORY: ReplayStory = {
  id: "demo-blog",
  title: "用 AI 搭建个人博客",
  description: "一个简单的示例：看看 AI Replay 如何记录人与 AI 的协作过程",
  steps: [
    {
      id: "s1",
      type: "milestone",
      title: "💡 决定开始",
      content:
        "你想搭建一个个人博客来分享技术笔记，决定让 AI 来帮忙。\n\n**AI Replay** 可以把这样的人机协作过程完整记录下来，方便回顾、复盘和分享给别人。",
      timestamp: "2026-04-14",
    },
    {
      id: "s2",
      type: "prompt",
      title: "告诉 AI 你的需求",
      content:
        "我想搭建一个简约风格的个人博客，用来分享编程学习笔记。\n\n要求：\n- 支持 Markdown 写作\n- 有文章列表和标签分类\n- 自适应移动端\n- 尽量简单，不要太复杂",
      timestamp: "2026-04-14",
    },
    {
      id: "s3",
      type: "ai-output",
      title: "AI 给出技术方案",
      content:
        '## 推荐方案\n\n使用 **Astro** 搭建静态博客，理由：\n\n| 特性 | 说明 |\n|------|------|\n| 零 JS 开销 | 默认不发送 JavaScript |\n| Markdown 原生支持 | 直接写 `.md` 文件即可 |\n| 部署简单 | 一键部署到 Vercel / Netlify |\n\n### 建议的项目结构\n```\nmy-blog/\n├── src/\n│   ├── pages/\n│   ├── layouts/\n│   └── content/posts/\n├── public/\n└── astro.config.mjs\n```\n\n大约 10 分钟就能跑起来。',
      timestamp: "2026-04-14",
    },
    {
      id: "s4",
      type: "document",
      title: "生成项目文档",
      content:
        '# 个人博客搭建指南\n\n## 快速上手\n\n```bash\nnpm create astro@latest my-blog\ncd my-blog\nnpm run dev\n```\n\n## 发布文章\n\n在 `src/content/posts/` 下新建 `.md` 文件：\n\n```markdown\n---\ntitle: 我的第一篇文章\ndate: 2026-04-14\ntags: ["入门"]\n---\n\n正文内容…\n```\n\n## 部署\n\n推送到 GitHub，在 Vercel 导入仓库即可自动部署。',
      timestamp: "2026-04-14",
    },
    {
      id: "s5",
      type: "note",
      title: "使用心得",
      content:
        "整个搭建过程不到半小时！\n\n几点体会：\n- AI 帮我跳过了「选技术栈」的纠结阶段\n- 生成的文档可以直接当备忘录用\n- 下次可以试试用 AI Replay 记录更复杂的项目\n\n> 💡 **提示**：你可以点击左上角 **+** 新建自己的故事，或打开 `.replay/` 文件夹来加载已有的记录。",
      timestamp: "2026-04-14",
    },
    {
      id: "s6",
      type: "milestone",
      title: "🎉 博客上线！",
      content:
        "博客成功部署，第一篇文章已发布。\n\n**这就是 AI Replay 的作用** —— 把人与 AI 协作的过程，变成一个可以回放的故事。",
      timestamp: "2026-04-14",
    },
  ],
  created_at: "2026-04-14T10:00:00Z",
  updated_at: "2026-04-14T12:00:00Z",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function AIReplayPanel() {
  const t = useReplayT();
  const activeModule = useAppStore((s) => s.activeModule);
  const isActiveModule = activeModule === "aireplay";

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Story state
  const [story, setStory] = useState<ReplayStory | null>(DEMO_STORY);
  const [recents, setRecents] = useState<RecentStory[]>([]);
  const [storyPath, setStoryPath] = useState<string | null>(null);

  // Playback
  const [playback, setPlayback] = useState<PlaybackState>({
    currentIndex: 0,
    isPlaying: false,
    speed: 1,
  });
  const [animateStep, setAnimateStep] = useState(true);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [stepAnimDone, setStepAnimDone] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("slides");

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ReplayStep | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const steps = story?.steps ?? [];
  const currentStep = steps[playback.currentIndex] ?? null;

  // ── Load recents on mount ──
  useEffect(() => {
    loadRecents();
  }, []);

  const loadRecents = async () => {
    try {
      const result = await replayInvoke<RecentStory[]>("aireplay_list_recents");
      setRecents(result);
    } catch {
      // Plugin may not be loaded yet — that's fine
    }
  };

  // ── Reset animation-done flag when step changes ──
  useEffect(() => {
    setStepAnimDone(false);
  }, [playback.currentIndex]);

  const handleStepAnimComplete = useCallback(() => {
    setStepAnimDone(true);
  }, []);

  // ── Auto-play logic (content-aware) ──
  useEffect(() => {
    if (!playback.isPlaying || steps.length === 0) return;

    const current = steps[playback.currentIndex];
    const hasTypewriter = current?.type === "prompt" || current?.type === "ai-output";

    // For typewriter steps, wait until animation finishes before scheduling advance
    if (hasTypewriter && !stepAnimDone) return;

    // Compute delay: brief buffer after typewriter, or content-length-based for others
    const delay = hasTypewriter
      ? 1000 / playback.speed
      : Math.max(2000, Math.min((current?.content ?? "").length * 4, 8000)) / playback.speed;

    playTimerRef.current = setTimeout(() => {
      setPlayback((prev) => {
        if (prev.currentIndex >= steps.length - 1) {
          return { ...prev, isPlaying: false };
        }
        return { ...prev, currentIndex: prev.currentIndex + 1 };
      });
      setAnimateStep(true);
    }, delay);

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [playback.isPlaying, playback.currentIndex, playback.speed, steps.length, stepAnimDone]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!story || !isActiveModule || isEditableTarget(e.target)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPlayback((prev) => ({
          ...prev,
          currentIndex: Math.max(0, prev.currentIndex - 1),
          isPlaying: false,
        }));
        setAnimateStep(true);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPlayback((prev) => ({
          ...prev,
          currentIndex: Math.min(steps.length - 1, prev.currentIndex + 1),
          isPlaying: false,
        }));
        setAnimateStep(true);
      } else if (e.key === " ") {
        e.preventDefault();
        setPlayback((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [story, isActiveModule, steps.length]);

  // ── Navigation ──
  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= steps.length) return;
      setPlayback((prev) => ({ ...prev, currentIndex: index, isPlaying: false }));
      setAnimateStep(true);
    },
    [steps.length],
  );

  const goPrev = useCallback(() => {
    setPlayback((prev) => ({
      ...prev,
      currentIndex: Math.max(0, prev.currentIndex - 1),
      isPlaying: false,
    }));
    setAnimateStep(true);
  }, []);

  const goNext = useCallback(() => {
    setPlayback((prev) => ({
      ...prev,
      currentIndex: Math.min(steps.length - 1, prev.currentIndex + 1),
      isPlaying: false,
    }));
    setAnimateStep(true);
  }, [steps.length]);

  const togglePlay = useCallback(() => {
    setPlayback((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const setSpeed = useCallback((speed: PlaybackSpeed) => {
    setPlayback((prev) => ({ ...prev, speed }));
  }, []);

  // ── File operations ──
  const loadStoryFromPath = useCallback(async (path: string) => {
    try {
      const result = await replayInvoke<ReplayStory>("aireplay_load_story", { path });
      setStory(result);
      setStoryPath(path);
      setPlayback({ currentIndex: 0, isPlaying: false, speed: 1 });
      setAnimateStep(true);
      loadRecents();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Failed to load story:", msg);
      window.alert(`Failed to load story:\n${msg}`);
    }
  }, []);

  const handleOpenFile = useCallback(async () => {
    const path = await pickFile({
      title: t("replay.pickTitle"),
      filters: ["replay.json", "json"],
    });
    if (!path) return;
    await loadStoryFromPath(path);
  }, [t, loadStoryFromPath]);

  const handleOpenFolder = useCallback(async () => {
    const path = await pickDirectory({
      title: t("replay.pickFolderTitle"),
    });
    if (!path) return;
    // Normalize to file path so relative image resolution works correctly
    const filePath = path.replace(/\/+$/, "") + "/story.json";
    await loadStoryFromPath(filePath);
  }, [t, loadStoryFromPath]);

  const handleSave = useCallback(async () => {
    if (!story) return;
    let path = storyPath;
    if (!path) {
      path = await saveFile({
        title: t("replay.save"),
        defaultName: `${story.title.replace(/\s+/g, "-")}.replay.json`,
        filters: ["replay.json"],
      });
    }
    if (!path) return;
    try {
      await replayInvoke("aireplay_save_story", { path, story });
      setStoryPath(path);
      loadRecents();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Failed to save story:", msg);
      window.alert(`Failed to save story:\n${msg}`);
    }
  }, [story, storyPath, t]);

  const handleNewStory = useCallback(() => {
    const newStory: ReplayStory = {
      id: `story-${Date.now()}`,
      title: "Untitled Story",
      steps: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStory(newStory);
    setStoryPath(null);
    setPlayback({ currentIndex: 0, isPlaying: false, speed: 1 });
    // Immediately open title editing
    setTitleDraft("Untitled Story");
    setIsEditingTitle(true);
  }, []);

  // ── Step editing ──
  const handleAddStep = useCallback(() => {
    setEditingStep(null);
    setEditorOpen(true);
  }, []);

  const handleEditStep = useCallback((index: number) => {
    const s = story?.steps[index];
    if (s) {
      setEditingStep(s);
      setEditorOpen(true);
    }
  }, [story]);

  const handleDeleteStep = useCallback((index: number) => {
    if (!story) return;
    const updated = {
      ...story,
      steps: story.steps.filter((_, i) => i !== index),
      updated_at: new Date().toISOString(),
    };
    setStory(updated);
    // Adjust playback index
    setPlayback((prev) => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex, Math.max(0, updated.steps.length - 1)),
      isPlaying: false,
    }));
  }, [story]);

  const handleEditorSave = useCallback((step: ReplayStep) => {
    if (!story) return;
    let newSteps: ReplayStep[];
    if (editingStep) {
      // Update existing
      newSteps = story.steps.map((s) => (s.id === editingStep.id ? step : s));
    } else {
      // Append new step
      newSteps = [...story.steps, step];
    }
    const updated = { ...story, steps: newSteps, updated_at: new Date().toISOString() };
    setStory(updated);
    setEditorOpen(false);
    setEditingStep(null);
    // Navigate to new/edited step
    const idx = newSteps.findIndex((s) => s.id === step.id);
    if (idx >= 0) {
      setPlayback((prev) => ({ ...prev, currentIndex: idx, isPlaying: false }));
      setAnimateStep(true);
    }
  }, [story, editingStep]);

  const handleEditorCancel = useCallback(() => {
    setEditorOpen(false);
    setEditingStep(null);
  }, []);

  const commitTitleEdit = useCallback(() => {
    if (story && titleDraft.trim()) {
      setStory({ ...story, title: titleDraft.trim(), updated_at: new Date().toISOString() });
    }
    setIsEditingTitle(false);
  }, [story, titleDraft]);

  const handleOpenRecent = useCallback(async (path: string) => {
    await loadStoryFromPath(path);
  }, [loadStoryFromPath]);

  const handleRemoveRecent = useCallback(async (id: string) => {
    try {
      await replayInvoke("aireplay_remove_recent", { id });
      loadRecents();
    } catch {
      // ignore
    }
  }, []);

  // ── Render ──
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-2.5">
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-secondary hover:bg-surface hover:text-foreground transition-colors"
          title={sidebarOpen ? t("replay.collapseSidebar") : t("replay.expandSidebar")}
        >
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
        <h1 className="text-sm font-semibold flex-1 flex items-center gap-1.5">
          {isEditingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitleEdit}
              onKeyDown={(e) => { if (e.key === "Enter") commitTitleEdit(); if (e.key === "Escape") setIsEditingTitle(false); }}
              className="flex-1 rounded border border-primary/40 bg-surface px-2 py-0.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          ) : (
            <>
              <span className="truncate">{story?.title ?? t("replay.title")}</span>
              {story && (
                <button
                  onClick={() => { setTitleDraft(story.title); setIsEditingTitle(true); }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-foreground-secondary/50 hover:text-foreground transition-colors"
                  title={t("replay.editor.editTitle")}
                >
                  <Pencil size={11} />
                </button>
              )}
            </>
          )}
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewStory}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-foreground-secondary hover:bg-surface hover:text-foreground transition-colors"
            title={t("replay.new")}
          >
            <Plus size={14} />
          </button>
          <button
            onClick={handleOpenFile}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-foreground-secondary hover:bg-surface hover:text-foreground transition-colors"
            title={t("replay.open")}
          >
            <FileJson size={14} />
          </button>
          <button
            onClick={handleOpenFolder}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-foreground-secondary hover:bg-surface hover:text-foreground transition-colors"
            title={t("replay.openFolder")}
          >
            <FolderArchive size={14} />
          </button>
          <button
            onClick={handleSave}
            disabled={!story}
            className={clsx(
              "flex h-7 items-center gap-1 rounded-md px-2 text-xs transition-colors",
              story
                ? "text-foreground-secondary hover:bg-surface hover:text-foreground"
                : "text-foreground-secondary/40 cursor-not-allowed",
            )}
            title={t("replay.save")}
          >
            <Save size={14} />
          </button>

          {/* View mode toggle */}
          <div className="ml-1 flex items-center rounded-lg bg-surface p-0.5">
            <button
              onClick={() => setViewMode("slides")}
              className={clsx(
                "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                viewMode === "slides"
                  ? "bg-primary/15 text-primary"
                  : "text-foreground-secondary hover:text-foreground",
              )}
              title={t("replay.view.slides")}
            >
              <Presentation size={13} />
            </button>
            <button
              onClick={() => setViewMode("chat")}
              className={clsx(
                "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                viewMode === "chat"
                  ? "bg-primary/15 text-primary"
                  : "text-foreground-secondary hover:text-foreground",
              )}
              title={t("replay.view.chat")}
            >
              <MessageSquare size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Body: sidebar + stage */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 shrink-0 overflow-y-auto border-r border-border bg-sidebar px-3 py-3">
            {/* Recents section */}
            {recents.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">
                  {t("replay.recentFiles")}
                </h3>
                <div className="flex flex-col gap-0.5">
                  {recents.map((r) => (
                    <div
                      key={r.id}
                      className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface cursor-pointer"
                      onClick={() => handleOpenRecent(r.path)}
                    >
                      <FileJson size={13} className="text-foreground-secondary shrink-0" />
                      <span className="flex-1 truncate text-xs text-foreground-secondary group-hover:text-foreground">
                        {r.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRecent(r.id);
                        }}
                        className="hidden group-hover:flex h-5 w-5 items-center justify-center rounded text-foreground-secondary/60 hover:text-red-400"
                        title={t("replay.removeRecent")}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {steps.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">
                    Timeline
                  </h3>
                  <button
                    onClick={handleAddStep}
                    className="flex h-5 items-center gap-0.5 rounded px-1.5 text-[10px] text-foreground-secondary hover:bg-surface hover:text-foreground transition-colors"
                    title={t("replay.editor.addStep")}
                  >
                    <PlusCircle size={11} />
                  </button>
                </div>
                <ReplayTimeline
                  steps={steps}
                  currentIndex={playback.currentIndex}
                  onSelect={goTo}
                  onEdit={handleEditStep}
                  onDelete={handleDeleteStep}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-xs text-foreground-secondary">
                <FileJson size={28} className="opacity-30" />
                <p>{t("replay.emptyState")}</p>
                {story && (
                  <button
                    onClick={handleAddStep}
                    className="mt-2 flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    <PlusCircle size={13} />
                    {t("replay.editor.addStep")}
                  </button>
                )}
              </div>
            )}
          </aside>
        )}

        {/* Main content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {viewMode === "slides" ? (
            <ReplayStage step={currentStep} animate={animateStep} storyPath={storyPath} onAnimationComplete={handleStepAnimComplete} />
          ) : (
            <ReplayChatView
              steps={steps}
              storyPath={storyPath}
              isPlaying={playback.isPlaying}
              speed={playback.speed}
              onTogglePlay={togglePlay}
              onSpeedChange={setSpeed}
            />
          )}
        </main>
      </div>

      {/* Playback controls (slides mode only) */}
      {viewMode === "slides" && steps.length > 0 && (
        <ReplayControls
          currentIndex={playback.currentIndex}
          totalSteps={steps.length}
          isPlaying={playback.isPlaying}
          speed={playback.speed}
          onPrev={goPrev}
          onNext={goNext}
          onTogglePlay={togglePlay}
          onSpeedChange={setSpeed}
        />
      )}

      {/* Step editor drawer */}
      {editorOpen && (
        <StepEditorDrawer
          step={editingStep}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </div>
  );
}
