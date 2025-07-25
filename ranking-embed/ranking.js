import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

async function loadRanking() {
  const today    = new Date();
  // 今月の1日 00:00 UTC
  const firstDay = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01T00:00:00Z`;

  // ① find_comments から当月のコメントを取得
  const { data: comments = [], error: err1 } = await supabase
    .from('find_comments')
    .select('menu_id')
    .gte('created_at', firstDay);
  if (err1) {
    console.error('コメント取得エラー', err1);
    return;
  }

  // ② menu_id ごとに件数をカウント
  const counts = comments.reduce((acc, { menu_id }) => {
    acc[menu_id] = (acc[menu_id] || 0) + 1;
    return acc;
  }, {});

  // ③ 件数でソートして上位３件を抜き出し
  const top3 = Object.entries(counts)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 3)
    .map(([id, cnt]) => ({ id: +id, cnt }));

  if (!top3.length) return;  // 今月コメントがなければ何もせず返す

  // ④ 上位ID を使って find_menus から画像＋名称＋説明を取得
  const ids    = top3.map(x => x.id);
  const { data: menus = [], error: err2 } = await supabase
    .from('find_menus')
    .select('id, name_jp, description_jp, image_url')
    .in('id', ids);
  if (err2) {
    console.error('メニュー取得エラー', err2);
    return;
  }

  // ⑤ 取得データをマップ化して DOM を更新
  const menuMap = Object.fromEntries(menus.map(m => [m.id, m]));
  top3.forEach((item, idx) => {
    const rank = idx + 1;
    const li   = document.querySelector(`.rank${rank}`);
    const menu = menuMap[item.id] || {};

    // 画像
    const imgEl = li.querySelector('.menu-img');
    if (menu.image_url) imgEl.src = menu.image_url;

    // ★ 人気度を件数で表示
    li.querySelector('.popularity').textContent = `★ 人気：${item.cnt}人`;

    // 名前・説明
    li.querySelector('.name').textContent = menu.name_jp || '';
    const desc = menu.description_jp || '';
    // 「。」で切り出した最初の文だけ表示
    const shortDesc = desc.includes('。') ? desc.split('。')[0] + '。' : desc;
    li.querySelector('.desc').textContent = shortDesc;
  });
}

// 初回ロード
window.addEventListener('DOMContentLoaded', loadRanking);

// コメントが入ったら再ロード
supabase
  .from('find_comments')
  .on('INSERT', loadRanking)
  .subscribe();
