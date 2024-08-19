// src/local-server.ts
import express from "express";

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello from local server!");
});

app.listen(port, () => {
  console.log(`Local server running on http://localhost:${port}`);
});
