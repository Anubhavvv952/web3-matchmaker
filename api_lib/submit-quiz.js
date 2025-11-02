import { kv } from "@vercel/kv";
import { encryptBool } from "./_lib/fhe.js";
const norm = (s) => String(s || "").trim().toLowerCase();
const arr = (v) =>
  Array.isArray(v)
    ? v.map(norm).filter(Boolean)
    : String(v || "").split(/[,\n]/).map(norm).filter(Boolean);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { address, ciphertext, profile, fhe } = req.body || {};

  if (!address || !ciphertext || !profile)
    return res.status(400).json({ ok: false, error: "missing_required_fields" });

  const addr = norm(address);

  let pk = await kv.get("fhe:pk");
  let sk = await kv.get("fhe:sk");

  let openToRemoteCt = fhe?.openToRemoteCt || null;

  if (!openToRemoteCt && typeof profile.openToRemote === "boolean") {
    openToRemoteCt = encryptBool(pk, profile.openToRemote ? 1 : 0);
  }

  const now = new Date().toISOString();

  const row = {
    address: addr,
    ciphertext,
    profile: {
      role: norm(profile.role),
      skills: arr(profile.skills),
      interests: arr(profile.interests),
      time: norm(profile.time),
      openToRemote: profile.openToRemote ?? null,
    },
    fhe: {
      openToRemoteCt,
    },
    updatedAt: now,
  };

  await kv.hset(`person:${addr}`, row);
  await kv.sadd("people:index", addr);

  res.status(200).json({ ok: true });
}
