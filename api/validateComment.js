// 動的NGワード＋Moderationチェックのみ。提案はしない
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { Configuration, OpenAIApi } from "openai";

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

export default async function handler(req, res) {
  const { comment } = req.body;
  if (!comment || typeof comment !== "string") {
    return res.status(400).json({ error: "コメントが空です。" });
  }
  // 動的NGワード取得
  const { data: ngs = [] } = await supabase.from('ng_words').select('word').eq('active', true);
  const badWords = ngs.map(r => r.word);
  // キーワードチェック
  for (const w of badWords) {
    if (comment.includes(w)) {
      return res.status(400).json({ error: "不適切な表現が含まれています。" });
    }
  }
  // Moderation API
  const mod = await openai.createModeration({ input: comment });
  if (mod.data.results[0].flagged) {
    return res.status(400).json({ error: "不適切な表現が含まれています。" });
  }
  res.status(200).json({ ok: true });
}
