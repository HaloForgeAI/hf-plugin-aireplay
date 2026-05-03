import express from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { postSchema } from "../schemas/post";
import Post from "../models/Post";
import User from "../models/User";

const router = express.Router();

// 文章列表
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, tag } = req.query;
    const where: any = {};
    if (tag) where.tags = { [Op.contains]: [tag] };

    const posts = await Post.findAndCountAll({
      where,
      include: [{ model: User, as: "author", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
    });

    res.json({
      data: posts.rows,
      total: posts.count,
      page: Number(page),
    });
  } catch (err) {
    next(err);
  }
});

// 创建文章
router.post("/", authenticate, validate(postSchema), async (req, res, next) => {
  try {
    const post = await Post.create({
      ...req.body,
      authorId: req.user.id,
    });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

export default router;
