import { createClient } from '@supabase/supabase-js'

// ✅ Supabaseクライアント初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

// ✅ CORS対応ラッパー
function withCors(handler) {
  return async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*') // ← Carrd等からの呼び出しOK
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    return handler(req, res)
  }
}

// ✅ メイン処理
async function handler(req, res) {
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

// ✅ CORS対応バージョンをエクスポート
export default withCors(handler)
