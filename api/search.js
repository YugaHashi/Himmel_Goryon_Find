// /api/search.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ✅ CORS wrapper
function withCors(handler) {
  return async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end(); // preflight
    }

    return handler(req, res);
  };
}

async function handler(req, res) {
  const { q, date } = req.query;

  if (!q || !date) {
    return res.status(400).json({ error: 'Missing query or date' });
  }

  const { data, error } = await supabase
    .from('find_menus')
    .select('*')
    .ilike('name_jp', `%${q}%`)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Database fetch error', detail: error.message });
  }

  return res.status(200).json(data);
}

export default withCors(handler);
