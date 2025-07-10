// search.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const els = {
  input:       document.getElementById('search-input'),
  btn:         document.getElementById('search-btn'),
  list:        document.getElementById('menu-suggestions'),
  resultWrap:  document.getElementById('results'),
  placeholder: document.getElementById('placeholder')
};

window.addEventListener('DOMContentLoaded', async () => {
  // メニュー名候補読み込み
  const { data: menus = [] } = await supabase
    .from('find_menus').select('id,name_jp');
  menus.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name_jp;
    els.list.appendChild(opt);
  });
});

els.btn.addEventListener('click', async () => {
  const name = els.input.value.trim();
  if (!name) return;
  // プレースホルダー隠す
  els.placeholder.style.display = 'none';
  els.resultWrap.innerHTML = '<p>読み込み中…</p>';
  els.resultWrap.classList.add('visible');

  // メニュー詳細取得
  const { data: m } = await supabase
    .from('find_menus').select('*').eq('name_jp', name).single();
  if (!m) {
    els.resultWrap.innerHTML = '<p>該当メニューがありません。</p>';
    return;
  }

  // 今月の初日
  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01T00:00:00Z`;

  // コメント数カウント（今月分）
  const { count: c } = await supabase
    .from('find_comments')
    .select('*', { count: 'exact' })
    .eq('menu_id', m.id)
    .gte('created_at', firstDay);

  // 承認済みクチコミ3件取得
  const { data: cs = [] } = await supabase
    .from('find_kuchikomi')
    .select('nickname,age_group,gender,comment,image_user,created_at')
    .eq('menu_id', m.id)
    .order('created_at', { ascending: false })
    .limit(3);

  els.resultWrap.innerHTML = `
    <h3 style="text-align:center;">${m.name_jp} ★${c}</h3>
    ${m.image_url ? `<img src="${m.image_url}" alt="${m.name_jp}">` : ''}
    <p>${m.description_jp || ''}</p>
    <div class="comment-list">
      ${cs.map(c => {
        return `
        <div class="comment-item">
          <img src="${c.image_user||'default-avatar.png'}" class="user-icon" />
          <div>
            <div class="meta">${c.nickname||'匿名'} (${c.age_group||'-'},${c.gender||'-'})</div>
            <div class="body">${c.comment}</div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <button id="load-more" class="more-comments-btn">その他クチコミを下に表示</button>
  `;
  attachLoadMore(m.id);
});

function attachLoadMore(menuId) {
  const btn = document.getElementById('load-more');
  btn.addEventListener('click', async () => {
    // 最新8件取得
    const { data: cs = [] } = await supabase
      .from('find_kuchikomi')
      .select('nickname,age_group,gender,comment,image_user,created_at')
      .eq('menu_id', menuId)
      .order('created_at', { ascending: false })
      .limit(8);

    document.querySelector('.comment-list').innerHTML = cs.map(c => {
      return `
      <div class="comment-item">
        <img src="${c.image_user||'default-avatar.png'}" class="user-icon" />
        <div>
          <div class="meta">${c.nickname||'匿名'} (${c.age_group||'-'},${c.gender||'-'})</div>
          <div class="body">${c.comment}</div>
        </div>
      </div>`;
    }).join('');
    btn.style.display = 'none';
  });
}
