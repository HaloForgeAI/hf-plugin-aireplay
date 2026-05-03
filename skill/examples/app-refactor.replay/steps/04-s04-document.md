# Express → Hono 迁移方案

## 迁移原则

1. **API 签名不变** — 前端零改动
2. **逐路由迁移** — 不一次性全改，按模块推进
3. **先跑通再优化** — 功能对齐优先，后续再加 RPC 模式

## 迁移顺序（按风险从低到高）

### Phase 1：基础设施（半天）

| 任务 | 说明 |
|------|------|
| 初始化 Hono 项目 | 保持同一仓库，新建 `src-new/` |
| 配置 Drizzle | 定义 schema，生成迁移 |
| 迁移 JWT 中间件 | `(req, res, next)` → `(c, next)` |
| 迁移 Zod 校验 | 替换 Joi → Zod，搭配 `@hono/zod-validator` |

### Phase 2：路由迁移（一天）

按独立程度排序：
1. `auth` — 最独立，适合先动手
2. `users` — 依赖 auth 中间件
3. `posts` — 最复杂：搜索、分页、关联查询

### Phase 3：清理和部署（半天）

- 删除 Express 依赖
- 更新 Dockerfile
- 跑完整测试套件
- 部署到 staging 验证

## 测试策略

保留现有的 API 测试（supertest），只替换 HTTP client 适配层：

```typescript
// 迁移前
const res = await request(app).get("/api/posts");

// 迁移后
const res = await app.request("/api/posts");
```

## 回滚方案

在 `src-new/` 开发，旧代码保留在 `src/`，随时可以切回。
