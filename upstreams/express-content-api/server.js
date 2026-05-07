import express from "express";

const app = express();

const articles = [
  { id: "first",  title: "First post",  preview: "Free teaser.",  content: "Full article body, paid." },
  { id: "second", title: "Second post", preview: "Another teaser.", content: "Another full article." },
];

app.get("/", (_req, res) => {
  res.json({
    name: "Demo content API",
    endpoints: {
      "GET /articles": "List previews (free)",
      "GET /articles/:id/preview": "Article preview (free)",
      "GET /articles/:id": "Full article (paid via Chest Gate)",
    },
  });
});

app.get("/articles", (_req, res) => {
  res.json({
    articles: articles.map(({ id, title, preview }) => ({ id, title, preview })),
  });
});

app.get("/articles/:id/preview", (req, res) => {
  const article = articles.find((a) => a.id === req.params.id);
  if (!article) return res.status(404).json({ error: "not found" });
  const { content, ...preview } = article;
  res.json(preview);
});

app.get("/articles/:id", (req, res) => {
  const article = articles.find((a) => a.id === req.params.id);
  if (!article) return res.status(404).json({ error: "not found" });
  res.json(article);
});

const PORT = 8006;
app.listen(PORT, () => console.log(`Demo content API on http://localhost:${PORT}`));
