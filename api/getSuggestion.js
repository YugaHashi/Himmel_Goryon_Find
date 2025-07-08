import { Configuration, OpenAIApi } from "openai";

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

export default async function handler(req, res) {
  const { menuId, comment } = req.body;
  if (!menuId || !comment) {
    return res.status(400).json({ error: "Invalid request" });
  }
  const prompt = `
あなたはレストランのマスターです。
メニューID:${menuId} に対し、ユーザーが「${comment}」とコメントしました。
今の気分にぴったりの一品を、一言で提案してください。
`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });
  const suggestion = completion.data.choices[0].message.content.trim();
  res.status(200).json({ suggestion });
}
