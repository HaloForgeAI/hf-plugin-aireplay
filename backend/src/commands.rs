use hf_plugin_api::{PluginContext, PluginError};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

const RECENTS_TABLE: &str = "plugin_dev_haloforge_aireplay_recents";

fn get_path(args: &Value) -> Result<String, PluginError> {
    args["path"]
        .as_str()
        .map(str::trim)
        .filter(|p| !p.is_empty())
        .map(String::from)
        .ok_or_else(|| PluginError::Custom("missing required field: path".into()))
}

fn sql_escape(value: &str) -> String {
    value.replace('\'', "''")
}

fn row_to_json(row: HashMap<String, Value>) -> Value {
    Value::Object(row.into_iter().collect())
}

fn now_iso() -> String {
    let dur = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = dur.as_secs();
    format!("{secs}")
}

fn read_text(path: &Path) -> Result<String, PluginError> {
    std::fs::read_to_string(path)
        .map_err(|e| PluginError::Custom(format!("failed to read {}: {e}", path.display())))
}

/// Determine if `path` is a `.replay` folder or a `story.json` inside one.
/// Returns `(base_dir, story_json_path)`.
fn resolve_story_root(path: &Path) -> (PathBuf, PathBuf) {
    let name = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("");
    if name == "story.json" {
        // User pointed at story.json inside the folder
        let base = path.parent().unwrap_or(path).to_path_buf();
        (base, path.to_path_buf())
    } else {
        // User pointed at the .replay folder itself
        (path.to_path_buf(), path.join("story.json"))
    }
}

/// Load a folder-based `.replay/` story.
/// Reads `story.json`, then fills each step's `content` from its referenced file.
fn load_folder_story(
    base_dir: &Path,
    story_json_path: &Path,
) -> Result<Value, PluginError> {
    let raw = read_text(story_json_path)?;
    let mut story: Value = serde_json::from_str(&raw)
        .map_err(|e| PluginError::Custom(format!("invalid story.json: {e}")))?;

    if let Some(steps) = story.get_mut("steps").and_then(|s| s.as_array_mut()) {
        for step in steps.iter_mut() {
            // Read main content file
            if let Some(file_rel) = step.get("file").and_then(|f| f.as_str()).map(String::from) {
                let file_path = base_dir.join(&file_rel);
                let text = read_text(&file_path)?;
                step["content"] = Value::String(text);
            }
            // Read optional contentBefore file (code-diff)
            if let Some(file_rel) =
                step.get("fileBefore").and_then(|f| f.as_str()).map(String::from)
            {
                let file_path = base_dir.join(&file_rel);
                let text = read_text(&file_path)?;
                step["contentBefore"] = Value::String(text);
            }
        }
    }

    Ok(story)
}

/// Detect whether a path points to a folder-based story.
fn is_folder_story(path: &Path) -> bool {
    let name = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("");
    // It's a folder story if:
    // 1. path ends with story.json (user picked the manifest inside a .replay folder)
    // 2. path has .replay extension (user picked the folder itself)
    // 3. path is a directory containing story.json (user picked a folder via dialog)
    name == "story.json"
        || path
            .extension()
            .and_then(|e| e.to_str())
            .map_or(false, |e| e == "replay")
        || (path.is_dir() && path.join("story.json").exists())
}

// ─── Commands ────────────────────────────────────────────────────────────────

/// List recently opened replay stories.
pub fn aireplay_list_recents(
    _args: Value,
    ctx: &dyn PluginContext,
) -> Result<Value, PluginError> {
    let rows = ctx.db().query(
        &format!("SELECT id, path, title, opened_at FROM {RECENTS_TABLE} ORDER BY opened_at DESC LIMIT 50"),
        &[],
    )?;
    let items: Vec<Value> = rows.into_iter().map(row_to_json).collect();
    Ok(json!(items))
}

/// Load a story from either a `.replay.json` file (legacy) or a `.replay/` folder.
pub fn aireplay_load_story(
    args: Value,
    ctx: &dyn PluginContext,
) -> Result<Value, PluginError> {
    let path_str = get_path(&args)?;
    let path = Path::new(&path_str);

    if !path.exists() {
        return Err(PluginError::NotFound(format!("path not found: {path_str}")));
    }

    let story = if is_folder_story(path) {
        // ── Folder-based .replay/ story ──
        let (base_dir, story_json) = resolve_story_root(path);
        if !story_json.exists() {
            return Err(PluginError::NotFound(format!(
                "story.json not found in {}",
                base_dir.display()
            )));
        }
        load_folder_story(&base_dir, &story_json)?
    } else {
        // ── Legacy single-file .replay.json ──
        let raw = read_text(path)?;
        serde_json::from_str(&raw)
            .map_err(|e| PluginError::Custom(format!("invalid JSON: {e}")))?
    };

    // Extract metadata for recents
    let title = story["title"]
        .as_str()
        .unwrap_or_else(|| {
            path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Untitled")
        })
        .to_string();
    let id = story["id"]
        .as_str()
        .map(String::from)
        .unwrap_or_else(|| format!("story-{}", now_iso()));

    // Upsert into recents (store the original path the user opened)
    let escaped_id = sql_escape(&id);
    let escaped_path = sql_escape(&path_str);
    let escaped_title = sql_escape(&title);
    let ts = now_iso();
    ctx.db().execute(
        &format!(
            "INSERT OR REPLACE INTO {RECENTS_TABLE} (id, path, title, opened_at) VALUES ('{escaped_id}', '{escaped_path}', '{escaped_title}', '{ts}')"
        ),
        &[],
    )?;

    Ok(story)
}

/// Save a story.
/// If path ends with `.replay` or is a directory, saves as folder-based format.
/// Otherwise saves as a single `.replay.json` file (legacy).
pub fn aireplay_save_story(
    args: Value,
    ctx: &dyn PluginContext,
) -> Result<Value, PluginError> {
    let path_str = get_path(&args)?;
    let story = args
        .get("story")
        .ok_or_else(|| PluginError::Custom("missing required field: story".into()))?;

    let path = Path::new(&path_str);

    if is_folder_story(path) {
        // ── Folder-based save ──
        let (base_dir, story_json) = resolve_story_root(path);
        let steps_dir = base_dir.join("steps");
        std::fs::create_dir_all(&base_dir)
            .map_err(|e| PluginError::Custom(format!("create dir {}: {e}", base_dir.display())))?;
        std::fs::create_dir_all(&steps_dir)
            .map_err(|e| PluginError::Custom(format!("create dir {}: {e}", steps_dir.display())))?;

        // Build a manifest with file references, write step files
        let mut manifest = story.clone();
        if let Some(steps) = manifest.get_mut("steps").and_then(|s| s.as_array_mut()) {
            for (i, step) in steps.iter_mut().enumerate() {
                let step_id = step["id"]
                    .as_str()
                    .map(String::from)
                    .unwrap_or_else(|| format!("s{:02}", i + 1));
                let step_type = step["type"]
                    .as_str()
                    .map(String::from)
                    .unwrap_or_else(|| "note".into());
                let filename = format!("{:02}-{}-{}.md", i + 1, step_id, step_type);
                let rel_path = format!("steps/{filename}");

                // Write content to file
                if let Some(content) = step.get("content").and_then(|c| c.as_str()).map(String::from) {
                    let p = base_dir.join(&rel_path);
                    std::fs::write(&p, content.as_bytes())
                        .map_err(|e| PluginError::Custom(format!("write {}: {e}", p.display())))?;
                }
                step["file"] = Value::String(rel_path);
                step.as_object_mut().map(|m| m.remove("content"));

                // Handle contentBefore for code-diff
                if let Some(before) = step.get("contentBefore").and_then(|c| c.as_str()).map(String::from) {
                    let before_filename =
                        format!("{:02}-{}-{}-before.md", i + 1, step_id, step_type);
                    let before_rel = format!("steps/{before_filename}");
                    let p = base_dir.join(&before_rel);
                    std::fs::write(&p, before.as_bytes())
                        .map_err(|e| PluginError::Custom(format!("write {}: {e}", p.display())))?;
                    step["fileBefore"] = Value::String(before_rel);
                    step.as_object_mut().map(|m| m.remove("contentBefore"));
                }
            }
        }

        let manifest_json = serde_json::to_string_pretty(&manifest)
            .map_err(|e| PluginError::Custom(format!("failed to serialize manifest: {e}")))?;
        std::fs::write(&story_json, manifest_json.as_bytes())
            .map_err(|e| PluginError::Custom(format!("write {}: {e}", story_json.display())))?;
    } else {
        // ── Legacy single-file save ──
        let content = serde_json::to_string_pretty(story)
            .map_err(|e| PluginError::Custom(format!("failed to serialize story: {e}")))?;
        std::fs::write(path, content.as_bytes())
            .map_err(|e| PluginError::Custom(format!("write {}: {e}", path.display())))?;
    }

    // Upsert into recents
    let title = story["title"]
        .as_str()
        .unwrap_or("Untitled")
        .to_string();
    let id = story["id"]
        .as_str()
        .map(String::from)
        .unwrap_or_else(|| format!("story-{}", now_iso()));
    let escaped_id = sql_escape(&id);
    let escaped_path = sql_escape(&path_str);
    let escaped_title = sql_escape(&title);
    let ts = now_iso();
    ctx.db().execute(
        &format!(
            "INSERT OR REPLACE INTO {RECENTS_TABLE} (id, path, title, opened_at) VALUES ('{escaped_id}', '{escaped_path}', '{escaped_title}', '{ts}')"
        ),
        &[],
    )?;

    Ok(json!({ "ok": true, "path": path_str }))
}

/// Remove a story from the recents list.
pub fn aireplay_remove_recent(
    args: Value,
    ctx: &dyn PluginContext,
) -> Result<Value, PluginError> {
    let id = args["id"]
        .as_str()
        .filter(|s| !s.is_empty())
        .ok_or_else(|| PluginError::Custom("missing required field: id".into()))?;

    let escaped = sql_escape(id);
    ctx.db().execute(
        &format!("DELETE FROM {RECENTS_TABLE} WHERE id = '{escaped}'"),
        &[],
    )?;

    Ok(json!({ "ok": true }))
}
