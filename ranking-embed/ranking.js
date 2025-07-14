import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

async function loadRanking() {
  // 当月1日以降のコメント数を集計
  const firstDay = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01T00:00:00Z`;
  const { data: comments = [] } = await supabase
    .from('find_comments_public')
    .select('menu_id')
    .gte('created_at', firstDay);

  const counts = comments.reduce((acc, { menu_id }) => {
    acc[menu_id] = (acc[menu_id] || 0) + 1;
    return acc;
  }, {});

  // 上位3を抽出
  const top3 = Object.entries(counts)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 3)
    .map(([id, cnt]) => ({ id: +id, cnt }));

  // メニュー画像を取得
  const { data: menus = [] } = await supabase
    .from('find_menus')
    .select('id,image_url')
    .in('id', top3.map(x => x.id));

  const urlMap = Object.fromEntries(menus.map(m => [m.id, m.image_url]));

  // DOM に反映
  top3.forEach((item, idx) => {
    const rank = idx + 1;
    const container = document.querySelector(`.rank${rank}`);
    const imgEl = container.querySelector('img');
    const countEl = container.querySelector('.count');

    imgEl.src = urlMap[item.id] || '';
    countEl.textContent = `${item.cnt}人`;
  });
}

window.addEventListener('DOMContentLoaded', loadRanking);
supabase.from('find_comments_public').on('INSERT', loadRanking).subscribe();
