import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const els = {
  input: document.getElementById('search-input'),
  btn:   document.getElementById('search-btn'),
  list:  document.getElementById('menu-suggestions'),
  result:  document.getElementById('result'),
  reviews: document.getElementById('reviews'),
};

window.addEventListener('DOMContentLoaded', async () => {
  // オートコンプリート用リスト取得
  const { data: menus = [] } = await supabase
    .from('find_menus')
    .select('name_jp');
  menus.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name_jp;
    els.list.appendChild(opt);
  });
});

els.btn.addEventListener('click', async () => {
  const name = els.input.value.trim();
  if (!name) return;

  // クリア
  els.result.innerHTML = '<p>読み込み中…</p>';
  els.reviews.innerHTML = '';

  // メニュー情報取得
  const { data: m, error } = await supabase
    .from('find_menus')
    .select('name_jp,image_url')
    .eq('name_jp', name)
    .single();

  if (error || !m) {
    els.result.innerHTML = '<p>該当メニューがありません。</p>';
    return;
  }

  // メニュー表示
  els.result.innerHTML = `
    <img src="${m.image_url}" alt="${m.name_jp}"/>
    <p class="menu-name">${m.name_jp}</p>
  `;

  // 最新3件クチコミ取得
  const { data: cs = [] } = await supabase
    .from('find_comments_public')
    .select('nickname,comment,image_user')
    .eq('menu_id', m.id)
    .order('created_at', { ascending: false })
    .limit(3);

  // クチコミ表示
  if (cs.length) {
    els.reviews.innerHTML = '<h3>最新のクチコミ</h3>';
    cs.forEach(c => {
      const thumb = c.image_user
        ? `https://labmhtrafdslfwqmzgky.supabase.co/storage/v1/object/public/user-images/${c.image_user}`
        : 'https://himmel-goryon-find.vercel.app/default-avatar.png';
      els.reviews.insertAdjacentHTML('beforeend', `
        <div class="review-item">
          <img src="${thumb}" alt="user"/>
          <div class="text">
            <div class="nick">${c.nickname||'匿名'}</div>
            <div class="body">${c.comment}</div>
          </div>
        </div>
      `);
    });
  } else {
    els.reviews.innerHTML = '<p>まだクチコミがありません。</p>';
  }
});
