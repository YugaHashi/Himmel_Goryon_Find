import { Configuration, OpenAIApi } from "openai";

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

export default async function handler(req, res) {
  const { comment } = req.body;
  if (!comment || typeof comment !== "string") {
    return res.status(400).json({ error: "コメントが空です。" });
  }
  const mod = await openai.createModeration({ input: comment });
  if (mod.data.results[0].flagged) {
    return res.status(400).json({ error: "不適切な表現が含まれています。" });
  }
  res.status(200).json({ ok: true });
}
