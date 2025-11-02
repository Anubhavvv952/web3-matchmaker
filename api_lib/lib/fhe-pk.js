import { kv } from "@vercel/kv";
import { keygen } from "./_lib/fhe";

export default async function handler(req, res) {
  let pk = await kv.get("fhe:pk");
  let sk = await kv.get("fhe:sk");

  if (!pk || !sk) {
    const keys = keygen();
    await kv.set("fhe:pk", keys.pk);
    await kv.set("fhe:sk", keys.sk);
    pk = keys.pk;
    sk = keys.sk;
  }

  res.status(200).json({ ok: true, pk });
}
