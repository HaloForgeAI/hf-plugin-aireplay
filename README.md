# AI Replay

An interactive timeline player for narrating AI-assisted coding sessions inside HaloForge.

## Features

- **Timeline view**: Vertical step axis with type-differentiated icons
- **Step types**: Prompt (typewriter), AI Output (streaming simulation), Document, Code Diff, Image, Milestone, Note
- **Playback controls**: Previous / Next / Auto-play / Speed (0.5×–2×)
- **Keyboard shortcuts**: ← → Space
- **Animations**: Framer Motion transitions between steps
- **Portable stories**: `.replay.json` files you can share alongside your repo

## Story format

```json
{
  "id": "unique-id",
  "title": "AI Refactoring IO Module",
  "description": "Timeline of the AI-assisted IO module rewrite",
  "steps": [
    {
      "id": "step-1",
      "type": "prompt",
      "title": "Phase 1: Research",
      "content": "I want to refactor the engine IO module...",
      "timestamp": "2026-04-09T10:00:00Z"
    }
  ],
  "created_at": "2026-04-09T10:00:00Z",
  "updated_at": "2026-04-09T10:00:00Z"
}
```

## Packaging

This repository builds independently from the main HaloForge app. The backend uses the published
`haloforge-plugin-api` crate, and the frontend uses `@haloforge/plugin-sdk`.

Local package check:

```bash
npx @haloforge/plugin-pack@0.2.11 check .
npx @haloforge/plugin-pack@0.2.11 pack . --release --out dist/plugin-release
```

GitHub release packaging uses `.github/workflows/plugin-release.yml` and the public `/plugin-pack` npm package. Set `HF_ADMIN_TOKEN` to submit generated catalog metadata to the production plugin catalog.

The panel now relies on the public `@haloforge/plugin-sdk` surface for plugin IPC, host app-state reads, and host file dialogs instead of private HaloForge bridge commands.
