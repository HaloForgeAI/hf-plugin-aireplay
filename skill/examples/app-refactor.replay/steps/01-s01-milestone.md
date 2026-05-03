现有的 Express 后端跑了两年，代码越来越乱：
- 没有类型安全，全是 `any`
- ORM 用的 Sequelize，迁移脚本经常出问题
- 中间件嵌套很深，新人看不懂

决定用 AI 辅助做一次彻底重构，目标：
- **Express → Hono**（更轻量、类型安全、兼容 Cloudflare Workers）
- **Sequelize → Drizzle ORM**（类型推导好、迁移简单）
- 保持 API 接口不变，前端零改动
