import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function handler(req, res) {
  const query = req.query.q || "";

  const { data, error } = await supabase
    .from("find_menus")
    .select("*")
    .ilike("name_jp", `%${query}%`)
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
}
