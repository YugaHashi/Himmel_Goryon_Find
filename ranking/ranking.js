import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

async function loadRanking() {
  const ul = document.getElementById('ranking-list');
  ul.innerHTML = '<li>読み込み中…</li>';

  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01T00:00:00Z`;

  const { data: votes, error } = await supabase
    .from('find_votes')
    .select('menu_name, created_at')
    .gte('created_at', firstDay);

  if (error) {
    ul.innerHTML = `<li>データ取得エラー: ${error.message}</li>`;
    console.error(error);
    return;
  }
  if (!votes || votes.length === 0) {
    ul.innerHTML = '<li>今月の投票データがありません。</li>';
    return;
  }

  // 投票数を集計
  const counts = votes.reduce((acc, { menu_name }) => {
    acc[menu_name] = (acc[menu_name] || 0) + 1;
    return acc;
  }, {});

  // 上位3件
  const top3 = Object.entries(counts)
    .sort(([,a],[,b]) => b - a)
    .slice(0,3);

  ul.innerHTML = '';
  top3.forEach(([menu, cnt], i) => {
    ul.insertAdjacentHTML('beforeend',
      `<li>${i+1}位：${menu} （${cnt}票）</li>`
    );
  });
}

window.addEventListener('DOMContentLoaded', loadRanking);
