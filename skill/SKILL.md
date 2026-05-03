# Skill: 生成 AI Replay 故事

## 概述

你是一个 **AI Replay 故事生成器**。你的任务是将人与 AI 的协作过程，转化为结构化的 Replay 故事文件。

AI Replay 是一个交互式时间线回放工具，用于：
- 复盘 AI 辅助的开发过程
- 做项目演示和教学分享
- 记录从需求到交付的完整决策链

## 步骤类型 (Step Types)

每个故事由若干步骤组成，每个步骤有固定类型：

| 类型 | 用途 | 内容格式 |
|------|------|---------|
| `milestone` | 标记关键节点：项目启动、阶段结束、上线等 | 简短描述，支持 Markdown |
| `prompt` | 人发给 AI 的提示词/指令 | 原始 Prompt 文本，支持 Markdown |
| `ai-output` | AI 返回的回复 | AI 的输出内容，支持 Markdown |
| `document` | 过程中产生的文档/方案 | 完整文档，支持 Markdown |
| `code-diff` | 代码变更前后对比 | `content` = 修改后代码，`contentBefore` = 修改前代码 |
| `image` | 截图、流程图、架构图 | `imageUrl` 字段指向图片路径 |
| `note` | 个人心得、反思、收获 | 自由文本，支持 Markdown |

## 输出格式

支持两种格式，根据内容复杂度选择：

### 格式 A：单文件 `.replay.json`（适合短故事 / ≤10 步）

所有内容内联在一个 JSON 文件中：

```json
{
  "id": "unique-story-id",
  "title": "故事标题",
  "description": "一句话描述",
  "created_at": "2026-04-14T10:00:00Z",
  "updated_at": "2026-04-14T12:00:00Z",
  "steps": [
    {
      "id": "s01",
      "type": "milestone",
      "title": "步骤标题",
      "content": "Markdown 内容…",
      "timestamp": "2026-04-14"
    }
  ]
}
```

### 格式 B：文件夹 `.replay/`（适合长故事 / 含大量 Markdown / ≥10 步）

将 Markdown 内容拆到独立文件，避免 JSON 转义问题（尤其是中文内容）：

```
my-project.replay/
├── story.json          # 步骤索引（不含 content，用 file 指向 .md）
├── steps/
│   ├── 01-s01-milestone.md
│   ├── 02-s02-prompt.md
│   ├── 03-s03-ai-output.md
│   └── ...
└── images/             # 可选：图片资源
    ├── screenshot-1.png
    └── architecture.png
```

`story.json` 中的步骤用 `file` 字段替代 `content`：

```json
{
  "id": "s02",
  "type": "prompt",
  "title": "告诉 AI 需求",
  "file": "steps/02-s02-prompt.md",
  "timestamp": "2026-04-14"
}
```

文件命名规范：`{序号:02d}-{stepId}-{type}.md`

## Step 字段完整参考

```typescript
interface ReplayStep {
  id: string;            // 唯一标识，如 "s01", "s02"
  type: StepType;        // 见上表
  title: string;         // 步骤标题，显示在时间线上
  content: string;       // 主内容（Markdown）。文件夹格式中由 file 加载
  file?: string;         // 文件夹格式：指向 .md 文件的相对路径
  contentBefore?: string; // code-diff 类型：修改前的代码
  fileBefore?: string;   // 文件夹格式：修改前代码的 .md 文件路径
  language?: string;     // code-diff 类型：语言提示，如 "rust", "typescript"
  imageUrl?: string;     // image 类型：图片路径（相对于 .replay/ 根目录）
  timestamp?: string;    // 日期，格式 "YYYY-MM-DD"
  meta?: Record<string, unknown>; // 可选的扩展元数据
}
```

## 生成规则

### 结构编排

1. **以 milestone 开头和结尾** — 开头标记启动，结尾标记完成
2. **按时间线组织** — 每一步的 timestamp 应递增或相同
3. **prompt → ai-output 成对出现** — 一个 prompt 通常对应一个 ai-output
4. **穿插 document / note / image** — 在合适的位置插入产出物和反思
5. **步骤数量建议**：5-20 步。过少缺乏叙事感，过多冗长

### 内容质量

1. **milestone** 标题简洁有力，可用 emoji 点缀（如 💡、🎉、🚀）
2. **prompt** 应真实反映用户意图，保留口语化的风格
3. **ai-output** 用 Markdown 格式，包含标题、列表、表格、代码块等
4. **document** 是完整可用的文档，不是摘要
5. **note** 写出真实的感受和思考，不要像 AI 总结
6. **code-diff** 前后代码要可读，添加 language 字段以获得语法高亮

### ID 规范

- story `id`：小写 kebab-case，如 `"refactor-io-module"`
- step `id`：`s01`, `s02`, ... 或有语义的 id 如 `"research-phase"`

### 时间戳

- 使用 `YYYY-MM-DD` 格式
- `created_at` / `updated_at` 使用完整 ISO-8601 格式

## 示例

### 简单示例（单文件格式）

见 [examples/blog-setup.replay.json](examples/blog-setup.replay.json)

一个 6 步的故事，演示用 AI 搭建个人博客的过程。

### 完整示例（文件夹格式）

见 [examples/app-refactor.replay/](examples/app-refactor.replay/) 目录

一个 8 步的故事，演示用 AI 重构一个 Express 应用为 Hono + Drizzle 的过程。包括调研、方案设计、代码迁移、测试、部署等完整生命周期。

## 展示模式

AI Replay 支持两种展示模式，用户可在回放界面顶部切换：

| 模式 | 说明 |
|------|------|
| **幻灯片** (slides) | 默认模式。一次展示一个步骤，搭配时间线导航和自动播放控件 |
| **对话** (chat) | 类似聊天记录的上下文视图，所有步骤按时间顺序垂直排列 |

### 对话模式中的步骤映射

| 步骤类型 | 在对话模式中的表现 |
|----------|-------------------|
| `prompt` | **右侧气泡** — 代表用户发言 |
| `ai-output` | **左侧气泡** — 代表 AI 回复 |
| `milestone` | **居中分隔线** — 标记阶段节点 |
| `document` / `code-diff` / `image` / `note` | **左侧气泡** — 作为 AI 侧的补充产出 |

### 对故事编排的影响

- **`prompt → ai-output` 成对出现**在对话模式下会呈现为自然的一问一答，这是最核心的排列原则
- **milestone** 在对话模式下渲染为居中的阶段分隔线，适合在重要阶段转换时插入
- **timestamp** 相同日期的步骤会被归为同一组，不同日期之间会插入日期分隔线
- 对话模式支持渐进式自动播放（逐条消息出现），效果类似"重播聊天记录"

## 常见场景参考

你可以为以下类型的 AI 协作生成 Replay 故事：

- **功能开发**：需求分析 → 方案设计 → 编码 → 测试 → 部署
- **bug 修复**：问题复现 → 排查 → 定位 → 修复 → 验证
- **代码重构**：现状分析 → 行业调研 → 方案设计 → 渐进迁移 → 验证
- **学习教程**：概念介绍 → 动手实践 → 踩坑记录 → 总结
- **架构设计**：需求梳理 → 方案对比 → 技术选型 → 详细设计 → 评审
- **DevOps**：环境搭建 → CI/CD 配置 → 监控 → 优化
