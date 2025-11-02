import { upsertProfile, getProfile, allProfiles } from "./_lib/_lib_db.js";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const data = upsertProfile(req.body);
    return res.status(200).json({ ok: true, user: data });
  }
  if (req.method === "GET") {
    const { userId } = req.query;
    return res.status(200).json(userId ? getProfile(userId) : allProfiles());
  }
  res.status(405).end();
}
