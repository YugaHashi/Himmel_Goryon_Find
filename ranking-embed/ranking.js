import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

async function loadRanking() {
  const firstDay = `${new Date().getFullYear()}-${
    String(new Date().getMonth()+1).padStart(2,'0')
  }-01T00:00:00Z`;

  // 当月コメント数を取得
  const { data: comments = [] } = await supabase
    .from('find_comments_public')
    .select('menu_id')
    .gte('created_at', firstDay);

  const counts = comments.reduce((acc, { menu_id }) => {
    acc[menu_id] = (acc[menu_id] || 0) + 1;
    return acc;
  }, {});

  // 上位3つ
  const top3 = Object.entries(counts)
    .sort(([,a],[,b]) => b - a)
    .slice(0,3)
    .map(([id, cnt]) => ({ id: +id, cnt }));

  if (!top3.length) return;

  // メニュー詳細取得
  const { data: menus = [] } = await supabase
    .from('find_menus')
    .select('id,name_jp,description_jp,image_url')
    .in('id', top3.map(x => x.id));

  const menuMap = Object.fromEntries(menus.map(m => [m.id, m]));

  // 各順位に反映
  top3.forEach((item, idx) => {
    const rank = idx + 1;
    const li = document.querySelector(`.rank${rank}`);
    const menu = menuMap[item.id] || {};

    // 画像・人気度
    li.querySelector('img').src = menu.image_url || '';
    li.querySelector('.popularity').textContent = `★ 人気：${item.cnt}人`;

    // 名前
    li.querySelector('.name').textContent = menu.name_jp || '';

    // 説明は最初の「。」まで
    const full = menu.description_jp || '';
    const first = full.split('。')[0] + '。';
    li.querySelector('.desc').textContent = first;
  });
}

window.addEventListener('DOMContentLoaded', loadRanking);
supabase
  .from('find_comments_public')
  .on('INSERT', loadRanking)
  .subscribe();
