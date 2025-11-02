import { kv } from "@vercel/kv";
import { andCipher, decryptBool } from "./_lib/fhe";

const norm = (s) => String(s || "").trim().toLowerCase();

export default async function handler(req, res) {
  const me = norm(req.query.me || "");
  const them = norm(req.query.them || "");

  if (!me || !them)
    return res.status(400).json({ ok: false, error: "me_and_them_required" });

  const [A, B, sk] = await Promise.all([
    kv.hgetall(`person:${me}`),
    kv.hgetall(`person:${them}`),
    kv.get("fhe:sk")
  ]);

  if (!A || !B) return res.status(404).json({ ok: false, error: "profile_not_found" });
  if (!A.fhe?.openToRemoteCt || !B.fhe?.openToRemoteCt)
    return res.status(400).json({ ok: false, error: "missing_fhe_ciphertext" });

  const ctOut = andCipher(A.fhe.openToRemoteCt, B.fhe.openToRemoteCt);
  const result = decryptBool(sk, ctOut);

  res.status(200).json({ ok: true, result });
}
