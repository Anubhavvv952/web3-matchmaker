import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const addrs = await kv.smembers("people:index");

  const records = await Promise.all(
    addrs.map(async (a) => ({
      ...(await kv.hgetall(`person:${a}`)),
    }))
  );

  res.status(200).json({
    ok: true,
    people: records.map((p) => ({
      address: p.address,
      profile: p.profile,
      updatedAt: p.updatedAt,
    })),
  });
}
