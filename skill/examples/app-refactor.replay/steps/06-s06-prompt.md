迁移 posts 路由到 Drizzle 后，TypeScript 报了一堆类型错误：

```
Type 'PgColumn<...>' is not assignable to type 'SQL<unknown>'
```

具体是在 `leftJoin` 和 `where` 组合使用时。AI 之前生成的代码把 `eq()` 的参数顺序写反了。

请帮我修复 `src-new/routes/posts.ts` 中所有的 Drizzle 查询类型错误，并确保：
1. 分页查询正常
2. tag 过滤正常
3. 关联查询 author 信息正常
4. 别忘了 `total` 要用 `count()` 单独查，之前那个 `result.length` 是错的
