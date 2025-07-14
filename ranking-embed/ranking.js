import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

async function loadRanking() {
  const firstDay = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01T00:00:00Z`;
  // 1) 当月のコメント数を集計
  const { data: pages = [] } = await supabase
    .from('find_comments_public')
    .select('menu_id')
    .gte('created_at', firstDay);

  const counts = pages.reduce((acc, { menu_id }) => {
    acc[menu_id] = (acc[menu_id]||0) + 1;
    return acc;
  }, {});

  // 2) 上位3を抽出
  const top3 = Object.entries(counts)
    .sort(([,a],[,b]) => b - a)
    .slice(0,3)
    .map(([id, cnt]) => ({ id: +id, cnt }));

  if (top3.length === 0) return;

  // 3) メニュー名＋画像＋説明 を取得
  const { data: menus = [] } = await supabase
    .from('find_menus')
    .select('id,name_jp,description_jp,image_url')
    .in('id', top3.map(x => x.id));

  const menuMap = Object.fromEntries(
    menus.map(m => [m.id, m])
  );

  // 4) 各順位に反映
  top3.forEach((item, idx) => {
    const rank = idx + 1;
    const ctr = document.querySelector(`.rank${rank}`);
    const menu = menuMap[item.id] || {};

    // 画像＆カウント
    ctr.querySelector('img').src = menu.image_url || '';
    ctr.querySelector('.count').textContent = `${item.cnt}人`;

    // 名前
    ctr.querySelector('.name').textContent = menu.name_jp || '';

    // 説明を「最初の句点(。)」まで
    const fullDesc = menu.description_jp || '';
    const firstSentence = fullDesc.split('。')[0] + '。';
    ctr.querySelector('.desc').textContent = firstSentence;
  });
}

window.addEventListener('DOMContentLoaded', loadRanking);
supabase
  .from('find_comments_public')
  .on('INSERT', loadRanking)
  .subscribe();
