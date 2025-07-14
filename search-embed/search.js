import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const els = {
  input:   document.getElementById('search-input'),
  btn:     document.getElementById('search-btn'),
  list:    document.getElementById('menu-suggestions'),
  result:  document.getElementById('result'),
  reviews: document.getElementById('reviews'),
};

window.addEventListener('DOMContentLoaded', async () => {
  const { data: menus = [] } = await supabase.from('find_menus').select('name_jp');
  menus.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name_jp;
    els.list.appendChild(opt);
  });
});

els.btn.addEventListener('click', async () => {
  const name = els.input.value.trim();
  if (!name) return;

  els.result.innerHTML = '<div class="placeholder"></div>';
  els.reviews.innerHTML = '';

  // 1) メニュー情報
  const { data: m, error } = await supabase
    .from('find_menus')
    .select('id,name_jp,description_jp,image_url')
    .eq('name_jp', name)
    .single();
  if (error || !m) {
    els.result.innerHTML = '<p>該当メニューがありません。</p>';
    return;
  }

  // 2) 人気度カウント (全期間)
  const { count } = await supabase
    .from('find_comments_public')
    .select('*', { count: 'exact' })
    .eq('menu_id', m.id);

  // 3) 表示：写真＋名前＋人気度＋説明（句点で改行）
  const descLines = m.description_jp.split('。').filter(s => s).map(s => s+'。').join('\n');
  els.result.innerHTML = `
    <img src="${m.image_url}" alt="${m.name_jp}"/>
    <p class="menu-name">${m.name_jp}</p>
    <p class="popularity">人気度: ${count}</p>
    <p class="description">${descLines}</p>
  `;

  // 4) 最新3件クチコミ取得＆表示
  const { data: cs = [] } = await supabase
    .from('find_comments_public')
    .select('age,gender,nickname,comment')
    .eq('menu_id', m.id)
    .order('created_at',{ ascending: false })
    .limit(3);

  if (cs.length) {
    els.reviews.innerHTML = '<h3>最新のクチコミ</h3>';
    cs.forEach(c => {
      els.reviews.insertAdjacentHTML('beforeend', `
        <div class="review-item">
          <div class="meta">
            <span>${c.age||'-'}</span>
            <span>${c.gender||'-'}</span>
          </div>
          <div class="nick">${c.nickname||'匿名'}</div>
          <div class="body">${c.comment}</div>
        </div>
      `);
    });
  } else {
    els.reviews.innerHTML = '<p>まだクチコミがありません。</p>';
  }
});
