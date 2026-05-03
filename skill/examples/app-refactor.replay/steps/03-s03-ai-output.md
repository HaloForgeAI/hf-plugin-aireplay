## 代码分析报告

### 项目结构

```
src/
├── app.ts            # Express 入口，挂载中间件
├── routes/
│   ├── users.ts      # /api/users  (CRUD)
│   ├── posts.ts      # /api/posts  (CRUD + 搜索)
│   └── auth.ts       # /api/auth   (登录/注册/刷新)
├── middleware/
│   ├── auth.ts       # JWT 校验
│   ├── validate.ts   # Joi 参数校验
│   └── errorHandler.ts
├── models/           # Sequelize 模型
│   ├── User.ts
│   ├── Post.ts
│   └── index.ts
└── utils/
    ├── db.ts         # Sequelize 连接
    └── logger.ts     # winston 日志
```

### API 端点清单

| 方法 | 路径 | 中间件 | 说明 |
|------|------|--------|------|
| POST | /api/auth/register | validate | 注册 |
| POST | /api/auth/login | validate | 登录 |
| POST | /api/auth/refresh | auth | 刷新 token |
| GET | /api/users/:id | auth | 获取用户 |
| PUT | /api/users/:id | auth, validate | 更新用户 |
| GET | /api/posts | - | 文章列表 |
| GET | /api/posts/:id | - | 文章详情 |
| POST | /api/posts | auth, validate | 发文章 |
| PUT | /api/posts/:id | auth, validate | 改文章 |
| DELETE | /api/posts/:id | auth | 删文章 |

### Express 耦合点分析

**需要改的：**
- `app.ts` — 入口初始化方式完全不同
- `routes/*.ts` — `req.params` / `req.body` 取值方式不同
- `middleware/*.ts` — 中间件签名 `(req, res, next)` → Hono 的 `(c, next)`
- `models/*.ts` — Sequelize 模型定义 → Drizzle schema

**可以复用的：**
- 业务逻辑（数据处理、格式转换）
- JWT 签发/校验逻辑
- winston 日志（不需要改）

### 风险点

1. Sequelize 的 `include` 关联查询 → Drizzle 用 `with` 语法，需要逐一改写
2. Joi 参数校验 → 建议换成 Zod（和 Hono 生态更搭）
3. 错误处理中间件的写法差异较大
