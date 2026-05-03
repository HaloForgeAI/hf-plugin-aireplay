迁移总共花了两天，比预期多了半天，主要踩坑在 ORM 层。

## 顺利的部分

- Hono 的路由写法确实比 Express 简洁，中间件也更清晰
- Zod 替代 Joi 几乎无痛，而且和 TypeScript 配合好太多
- JWT 中间件迁移只改了几行

## 踩坑

1. **Drizzle 的关联查询**：比 Sequelize 的 `include` 灵活但更底层，需要手写 join。习惯了 Sequelize 的 eager loading 后最开始写得很别扭
2. **`eq()` 参数顺序**：AI 第一次生成的代码参数写反了，类型报错不直观。以后对 AI 生成的 ORM 代码要多留个心眼
3. **count 查询**：`result.length` 在分页场景下是错的（只是当前页条数），要单独 `db.select({ count: count() }).from(posts)` 才对
4. **错误处理**：Express 的 `next(err)` 模式 → Hono 用 `app.onError()`，写法差异比想象的大

## 收获

- 对 Drizzle 的查询 API 比以前熟悉多了
- 以后新项目会直接选 Hono + Drizzle 这套
- AI 在迁移这种"有明确对照"的任务上非常好用：告诉它旧代码长什么样、新框架 API 是什么，输出质量就很高
