// server/index.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { keygen, encrypt, decrypt } from "../api/_lib/fhe.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// simple in-memory KV for local dev
const store = new Map();
const kv = {
  async get(k) { return store.get(k); },
  async set(k, v) { store.set(k, v); return "OK"; }
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/keygen", async (_req, res) => {
  res.json(await keygen());
});

app.post("/api/submit-quiz", async (req, res) => {
  const { wallet, answers } = req.body || {};
  if (!wallet || !answers) return res.status(400).json({ error: "wallet & answers required" });
  const cipher = await encrypt(JSON.stringify(answers));
  await kv.set(`profile:${wallet}`, JSON.stringify({ wallet, cipher, ts: Date.now() }));
  res.json({ ok: true });
});

app.post("/api/matches", async (req, res) => {
  const { wallet } = req.body || {};
  if (!wallet) return res.status(400).json({ error: "wallet required" });

  // naive demo list: everyone except me
  const results = [];
  for (const [k, v] of store.entries()) {
    if (!k.startsWith("profile:")) continue;
    const w = k.slice("profile:".length);
    if (w === wallet) continue;
    const obj = JSON.parse(v);
    const plain = JSON.parse(await decrypt(obj.cipher));
    const score = 40 + Math.floor(Math.random() * 60);
    results.push({ wallet: w, score, preview: plain?.[0] ?? null });
  }
  results.sort((a, b) => b.score - a.score);
  res.json({ matches: results });
});

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`);
});
