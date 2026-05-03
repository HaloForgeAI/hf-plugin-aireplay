import { convertFileSrc } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import type { ReplayStep } from "../types";

interface ImageStepProps {
  step: ReplayStep;
  /** Absolute path of the story file, used to resolve relative image paths */
  storyPath?: string | null;
}

/** Resolve ../ segments in a path */
function normalizePath(raw: string): string {
  const parts = raw.split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === ".." && out.length > 0 && out[out.length - 1] !== "..") {
      out.pop();
    } else if (p !== "." && p !== "") {
      out.push(p);
    }
  }
  return (raw.startsWith("/") ? "/" : "") + out.join("/");
}

/** Resolve an image src: absolute path → asset protocol, relative → resolve from storyPath */
function resolveImageSrc(raw: string, storyPath?: string | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();

  // Already a URL or data URI — use as-is
  if (/^(https?|data|blob|asset):/.test(trimmed)) {
    return trimmed;
  }

  // Absolute path
  if (trimmed.startsWith("/") || /^[A-Za-z]:[\\/]/.test(trimmed)) {
    return convertFileSrc(normalizePath(trimmed));
  }

  // Relative path — resolve from story file directory
  if (storyPath) {
    const normalized = storyPath.replace(/\\/g, "/");
    const lastSlash = normalized.lastIndexOf("/");
    const parentDir = lastSlash >= 0 ? normalized.slice(0, lastSlash) : "";
    if (parentDir) {
      const decoded = (() => {
        try { return decodeURIComponent(trimmed); } catch { return trimmed; }
      })();
      const cleaned = decoded.replace(/\\/g, "/").replace(/^\.\//, "");
      const absolute = normalizePath(`${parentDir}/${cleaned}`);
      return convertFileSrc(absolute);
    }
  }

  return trimmed;
}

export function ImageStep({ step, storyPath }: ImageStepProps) {
  const raw = step.imageUrl || step.content;
  const src = resolveImageSrc(raw, storyPath);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-3"
    >
      {/* Badge */}
      <div className="inline-flex items-center gap-2 self-start rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400">
        <span className="h-2 w-2 rounded-full bg-violet-500" />
        Image
      </div>
      {/* Image */}
      <div className="flex items-center justify-center rounded-xl border border-border bg-surface p-4 overflow-hidden">
        {src ? (
          <img
            src={src}
            alt={step.title}
            className="max-w-full max-h-[65vh] rounded-lg object-contain"
          />
        ) : (
          <div className="text-sm text-foreground-secondary italic">No image provided</div>
        )}
      </div>
      {step.title && (
        <p className="text-center text-xs text-foreground-secondary">{step.title}</p>
      )}
    </motion.div>
  );
}
