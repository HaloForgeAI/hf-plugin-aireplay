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
