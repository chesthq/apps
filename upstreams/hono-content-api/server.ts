import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

const articles = [
  { id: "first",  title: "First post",  preview: "Free teaser.",  content: "Full article body, paid." },
  { id: "second", title: "Second post", preview: "Another teaser.", content: "Another full article." },
];

app.get("/", (c) =>
  c.json({
    name: "Demo content API",
    endpoints: {
      "GET /articles": "List previews (free)",
      "GET /articles/:id/preview": "Article preview (free)",
      "GET /articles/:id": "Full article (paid via Chest Gate)",
    },
  }),
);

app.get("/articles", (c) =>
  c.json({
    articles: articles.map(({ id, title, preview }) => ({ id, title, preview })),
  }),
);

app.get("/articles/:id/preview", (c) => {
  const article = articles.find((a) => a.id === c.req.param("id"));
  if (!article) return c.json({ error: "not found" }, 404);
  const { content, ...preview } = article;
  return c.json(preview);
});

app.get("/articles/:id", (c) => {
  const article = articles.find((a) => a.id === c.req.param("id"));
  if (!article) return c.json({ error: "not found" }, 404);
  return c.json(article);
});

const PORT = 8005;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`Demo content API on http://localhost:${PORT}`);
  serve({ fetch: app.fetch, port: PORT });
}

export default app;
