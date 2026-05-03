# Skill: 从 Markdown 文档提取 AI Replay Story

## 概述

将一篇记录 AI 辅助编码过程的 Markdown 文档转换为 `.replay/` 文件夹格式，用于在 HaloForge AI Replay 插件中以交互式时间线展示。

## 输入

一篇 Markdown 文档，通常包含：
- 按时间/任务分组的章节（如 `## 任务1`、`## Phase 2`）
- 给 AI 的 Prompt（通常在折叠块、引用块或特定标题下）
- AI 的输出/回复
- 截图（`![...](path/to/image.png)`）
- 设计决策、反馈、代码片段
- 里程碑节点

## 输出格式

### 文件夹结构

一个故事是一个 `.replay/` 后缀的文件夹：

```
my-story.replay/
├── story.json          # 元数据 + 步骤索引（不含正文内容！）
└── steps/
    ├── 01-s01-milestone.md
    ├── 02-s02-prompt.md
    ├── 03-s03-ai-output.md
    ├── 04-s04-image.md
    └── ...
```

### story.json 结构

```json
{
  "id": "my-story-id",
  "title": "故事标题",
  "description": "简要描述",
  "created_at": "2026-04-09T10:00:00Z",
  "updated_at": "2026-04-17T18:00:00Z",
  "steps": [
    {
      "id": "s01",
      "type": "milestone",
      "title": "阶段标题",
      "file": "steps/01-s01-milestone.md",
      "timestamp": "2026-04-09"
    },
    {
      "id": "s02",
      "type": "prompt",
      "title": "Prompt 标题",
      "file": "steps/02-s02-prompt.md",
      "timestamp": "2026-04-09"
    },
    {
      "id": "s03",
      "type": "image",
      "title": "截图标题",
      "file": "steps/03-s03-image.md",
      "imageUrl": "../../../../path/to/image.png",
      "timestamp": "2026-04-09"
    }
  ]
}
```

**关键规则：`story.json` 中不包含 `content` 字段！** 每个步骤的正文内容存储在 `file` 指向的 `.md` 文件中。后端加载时会自动读取这些文件并填充 `content`。

### 步骤文件命名

`{序号}-{stepId}-{类型}.md`，例如：
- `01-s01-milestone.md`
- `02-s02-prompt.md`
- `03-s03-ai-output.md`
- `04-s04-image.md`
- `05-s05-note.md`
- `06-s06-document.md`
- `07-s07-code-diff.md`

### TypeScript 类型定义

```typescript
type StepType = "prompt" | "ai-output" | "document" | "code-diff" | "image" | "milestone" | "note";

interface ReplayStep {
  id: string;
  type: StepType;
  title: string;
  content: string;      // 运行时由后端从 file 读取填充
  file?: string;         // 相对于 .replay/ 文件夹的路径
  fileBefore?: string;   // code-diff 的 "before" 文件
  contentBefore?: string;
  language?: string;
  imageUrl?: string;
  timestamp?: string;
  meta?: Record<string, unknown>;
}

interface ReplayStory {
  id: string;
  title: string;
  description?: string;
  steps: ReplayStep[];
  created_at: string;
  updated_at: string;
}
```

## 步骤类型选择规则

| Markdown 特征 | → StepType | 说明 |
|---|---|---|
| `## 任务N` / `## Phase N` 等顶层章节标题 | `milestone` | 标记阶段开始/关键节点 |
| "Prompt" / "Tasks Prompt" 标题下的内容 | `prompt` | 用户给 AI 的指令 |
| AI 的回复/输出（含分析报告、调研结果等） | `ai-output` | AI 生成的内容 |
| 设计文档、架构描述、方案输出 | `document` | 结构化文档内容 |
| 代码片段 / diff 片段 | `code-diff` | 代码变更 |
| `![image](path)` 图片引用 | `image` | 在 story.json 中用 `imageUrl` |
| 反馈、决策记录、经验总结 | `note` | 侧边备注 |

## 提取规则

### 1. 识别任务/阶段分组

- `## 任务N`、`## Phase N`、`## Step N` 等二级标题 → 每个创建一个 `milestone` 步骤
- 提取标题文本和日期（如果有）作为 `title` 和 `timestamp`

### 2. 提取 Prompt

- 查找以下模式：
  - `- Tasks Prompt` / `- Prompt` 折叠块内的内容
  - `### Prompt` / `#### Prompt` 标题下的内容
  - 明显的指令性文本
- 步骤 `.md` 文件保留原始 Markdown 格式
- Prompt 很长也完整保留，不截断

### 3. 提取 AI 输出

- Prompt 之后、下一个 Prompt 或章节之前的 AI 回复/分析/报告
- 步骤 `.md` 文件支持完整 Markdown

### 4. 提取图片

- `![alt](path)` → `image` 步骤
- `imageUrl` 放在 **story.json** 的步骤定义中（不在 .md 文件里）
- 如果图片在文档附近的子目录中，`imageUrl` 使用相对于 `.replay/` 文件夹的路径
- URL 编码路径（如 `%20`）在 imageUrl 中**解码回原始路径**
- `.md` 文件填写图片的上下文说明

### 5. 提取代码

- 代码块 → `code-diff` 步骤
- 主文件为新代码/diff
- 如有旧代码对比，用 `fileBefore` 指向另一个 `.md` 文件

### 6. 提取反馈/笔记

- "反馈"、"决策"、"补充信息" 等 → `note`

## 图片路径处理

`.replay/` 文件夹和图片的相对关系示例：

```
project/
├── docs/
│   └── interaction-log.md          ← 源文档
├── images/
│   └── screenshot1.png             ← 图片
└── plugins/hf-plugin-aireplay/assets/
    └── my-story.replay/            ← 输出文件夹
        ├── story.json
        └── steps/
```

在 `imageUrl` 中使用相对于 `.replay/` 文件夹的路径：
```json
{
  "imageUrl": "../../../../images/screenshot1.png"
}
```

或者使用绝对路径（插件会自动通过 `convertFileSrc` 转换）。

## 完整示例

输入 Markdown 片段：

```markdown
## 任务1 调研工作 April 9, 2026

- Tasks Prompt

    我要对引擎的 IO 模块进行完整重构。

    ## Step 1：学习编译流程
    阅读 `.gitlab-ci.yml`，理解编译命令和参数。

![image.png](images/task1-result.png)

任务1反馈：调研结果全面，行业对比清晰。
```

输出文件夹结构：

```
my-story.replay/
├── story.json
└── steps/
    ├── 01-s01-milestone.md
    ├── 02-s02-prompt.md
    ├── 03-s03-image.md
    └── 04-s04-note.md
```

`story.json`：
```json
{
  "id": "my-story",
  "title": "任务调研",
  "steps": [
    {
      "id": "s01",
      "type": "milestone",
      "title": "任务1 调研工作",
      "file": "steps/01-s01-milestone.md",
      "timestamp": "2026-04-09"
    },
    {
      "id": "s02",
      "type": "prompt",
      "title": "任务1 Prompt：IO 模块重构调研",
      "file": "steps/02-s02-prompt.md",
      "timestamp": "2026-04-09"
    },
    {
      "id": "s03",
      "type": "image",
      "title": "截图：任务1 调研结果",
      "file": "steps/03-s03-image.md",
      "imageUrl": "../../../../images/task1-result.png",
      "timestamp": "2026-04-09"
    },
    {
      "id": "s04",
      "type": "note",
      "title": "任务1 反馈",
      "file": "steps/04-s04-note.md",
      "timestamp": "2026-04-09"
    }
  ]
}
```

`steps/01-s01-milestone.md`：
```
开始对引擎 IO 模块的调研工作。
```

`steps/02-s02-prompt.md`：
```
我要对引擎的 IO 模块进行完整重构。

## Step 1：学习编译流程
阅读 `.gitlab-ci.yml`，理解编译命令和参数。
```

`steps/03-s03-image.md`：
```
任务1 调研工作的执行结果截图。
```

`steps/04-s04-note.md`：
```
调研结果全面，行业对比清晰。
```

## 注意事项

1. **story.json 只放元数据**：`content` 字段不出现在 story.json 中，所有正文内容在独立的 `.md` 文件
2. **不截断长内容**：Prompt 和 AI 输出可能很长，在 `.md` 文件中完整保留
3. **ID 连续递增**：`s01`, `s02`, `s03`... 按出现顺序编号
4. **文件命名有序**：`01-s01-milestone.md`, `02-s02-prompt.md` 确保文件系统排序和逻辑顺序一致
5. **图片路径在 story.json**：`imageUrl` 放在 story.json 而不是 .md 文件中
6. **时间戳**：从章节标题或上下文推断日期，格式 `YYYY-MM-DD`
7. **向后兼容**：旧的 `.replay.json` 单文件格式仍被支持
