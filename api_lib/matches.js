// api/matches.js
import { DB } from "../api_lib/_lib_db.js";

export default async function handler(req) {
  const { wallet, verbose } = await req.json();
  const logs = [];
  const matches = [];

  if (verbose) logs.push(`Start matching for ${wallet}`);

  // Iterate over every other user who has answers
  for (const other of Object.keys(DB.answers)) {
    if (other.toLowerCase() === wallet.toLowerCase()) continue;

    if (verbose) logs.push(`Request score for ${other}…`);
    const r = await fetch(new URL("/api/score", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // pass through verbose so score returns its internal steps
      body: JSON.stringify({ walletA: wallet, walletB: other, verbose })
    });
    const j = await r.json();

    if (Array.isArray(j.logs) && verbose) j.logs.forEach(x => logs.push(x));

    matches.push({
      wallet: other,
      score: Number(j.score || 0),
      profile: DB.profiles[other] || {}
    });
  }

  // Highest first
  matches.sort((a, b) => b.score - a.score);

  if (verbose) logs.push(`Done. ${matches.length} matches computed.`);

  return new Response(JSON.stringify({ matches, logs }));
}
