import { saveAnswers, getAnswers } from "./_lib/_lib_db.js";

export default async function handler(req, res) {
  if (req.method === "POST") {
    return res.status(200).json(saveAnswers(req.body));
  }
  if (req.method === "GET") {
    const { userId } = req.query;
    return res.status(200).json(getAnswers(userId) || {});
  }
  res.status(405).end();
}
