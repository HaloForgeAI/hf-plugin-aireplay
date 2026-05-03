import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { auth } from "../middleware/auth";
import { postSchema } from "../schemas/post";
import { db } from "../db";
import { posts, users } from "../db/schema";
import { eq, desc, arrayContains } from "drizzle-orm";

const app = new Hono();

// 文章列表
app.get("/", async (c) => {
  const { page = "1", limit = "20", tag } = c.req.query();
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const where = tag ? arrayContains(posts.tags, [tag]) : undefined;

  const result = await db
    .select({
      id: posts.id,
      title: posts.title,
      tags: posts.tags,
      createdAt: posts.createdAt,
      author: { id: users.id, name: users.name },
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(where)
    .orderBy(desc(posts.createdAt))
    .limit(limitNum)
    .offset((pageNum - 1) * limitNum);

  return c.json({
    data: result,
    total: result.length, // TODO: 改用 count 查询
    page: pageNum,
  });
});

// 创建文章
app.post("/", auth(), zValidator("json", postSchema), async (c) => {
  const body = c.req.valid("json");
  const userId = c.get("userId");

  const [post] = await db
    .insert(posts)
    .values({ ...body, authorId: userId })
    .returning();

  return c.json(post, 201);
});

export default app;
