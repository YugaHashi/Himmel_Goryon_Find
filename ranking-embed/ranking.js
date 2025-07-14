import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

async function loadRanking() {
  const firstDay = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01T00:00:00Z`;

  // 月間コメント数を集計
  const { data: comments = [] } = await supabase
    .from('find_comments_public')
    .select('menu_id')
    .gte('created_at', firstDay);

  const counts = comments.reduce((acc, { menu_id }) => {
    acc[menu_id] = (acc[menu_id]||0) + 1;
    return acc;
  }, {});

  // 上位5つ
  const top5 = Object.entries(counts)
    .sort(([,a],[,b]) => b - a)
    .slice(0,5)
    .map(([id]) => id);

  if (!top5.length) {
    document.getElementById('ranking-list').innerHTML = '<li>データがありません</li>';
    return;
  }

  // メニュー情報取得
  const { data: menus } = await supabase
    .from('find_menus')
    .select('id,name_jp,image_url')
    .in('id', top5);

  const lookup = Object.fromEntries(menus.map(m => [m.id, m]));

  // 描画
  document.getElementById('ranking-list').innerHTML = top5.map(id => {
    const m = lookup[id];
    const cnt = counts[id] || 0;
    return `
      <li class="rank-item">
        <img src="${m.image_url}" alt="${m.name_jp}"/>
        <p class="name">${m.name_jp}</p>
        <p class="count">人気度: ${cnt}</p>
      </li>`;
  }).join('');
}

window.addEventListener('DOMContentLoaded', loadRanking);
supabase.from('find_comments_public').on('INSERT', loadRanking).subscribe();
