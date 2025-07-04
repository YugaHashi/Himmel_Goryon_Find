// /api/search.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

export default async function handler(req, res) {
  const { q, date } = req.query
  if (!q || !date) {
    return res.status(400).json({ error: 'Missing query or date' })
  }

  const { data, error } = await supabase
    .from('find_menus')
    .select('*')
    .ilike('name_jp', `%${q}%`)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error })

  res.status(200).json(data)
}
