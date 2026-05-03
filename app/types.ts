// ─── AI Replay Story types ────────────────────────────────────────────────────

export type StepType =
  | "prompt"
  | "ai-output"
  | "document"
  | "code-diff"
  | "image"
  | "milestone"
  | "note";

export interface ReplayStep {
  id: string;
  type: StepType;
  title: string;
  /** Main content: markdown text, prompt text, diff string, image path, note text.
   *  In folder-based stories this is populated at load time from the `file` reference. */
  content: string;
  /** Relative path to the content file inside a .replay/ folder.
   *  Present only in folder-based stories; omitted in single-file .replay.json. */
  file?: string;
  /** Optional secondary content (e.g. "before" code for code-diff) */
  contentBefore?: string;
  /** Relative path to contentBefore file (folder-based stories) */
  fileBefore?: string;
  /** Programming language hint for code-diff steps */
  language?: string;
  /** Image URL or base64 data URI for image steps */
  imageUrl?: string;
  /** ISO-8601 timestamp */
  timestamp?: string;
  /** Arbitrary metadata */
  meta?: Record<string, unknown>;
}

export interface ReplayStory {
  id: string;
  title: string;
  description?: string;
  steps: ReplayStep[];
  created_at: string;
  updated_at: string;
}

export interface RecentStory {
  id: string;
  path: string;
  title: string;
  opened_at: string;
}

// ─── Playback state ──────────────────────────────────────────────────────────

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

export type ViewMode = "slides" | "chat";

export interface PlaybackState {
  currentIndex: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
}
