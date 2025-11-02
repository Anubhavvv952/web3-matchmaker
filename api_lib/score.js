// api/score.js
import { DB } from "../api_lib/_lib_db.js";
import { calculateScore } from "../api_lib/_lib_score.js";
import { fheDecrypt } from "../api_lib/fhe.js";

export default async function handler(req) {
  const { walletA, walletB, verbose } = await req.json();
  const logs = [];

  const encA = DB.answers[walletA];
  const encB = DB.answers[walletB];

  if (!encA || !encB) {
    return new Response(JSON.stringify({ error: "Missing answers" }), { status: 400 });
  }

  if (verbose) logs.push(`Fetching encrypted answers for ${walletA} and ${walletB}.`);
  if (verbose) logs.push(`Zama FHE decrypt: start`);

  // Simulated decrypt via your Zama helpers
  const ansA = encA.map(a => fheDecrypt(a));
  const ansB = encB.map(a => fheDecrypt(a));

  if (verbose) logs.push(`Zama FHE decrypt: done (len=${ansA.length}/${ansB.length}).`);
  if (verbose) logs.push(`Scoring answers…`);

  const score = calculateScore(ansA, ansB);

  if (verbose) logs.push(`Score computed for pair (${walletA.slice(0,6)}…, ${walletB.slice(0,6)}…): ${score}%`);

  return new Response(JSON.stringify({ score, logs }));
}
