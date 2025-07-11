// search/search.js
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
  els.placeholder.style.display = 'none';
  els.resultWrap.classList.add('visible');
  els.resultWrap.innerHTML = '<p>読み込み中…</p>';

  const { data: m, error } = await supabase
    .from('find_menus')
    .select('*')
    .eq('name_jp', name)
    .single();
  if (error || !m) {
    els.resultWrap.innerHTML = '<p>該当メニューがありません。</p>';
    return;
  }

  const firstDay = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01T00:00:00Z`;
  const { count } = await supabase
    .from('find_comments')
    .select('*', { count: 'exact' })
    .eq('menu_id', m.id)
    .gte('created_at', firstDay);

  const { data: cs = [] } = await supabase
    .from('find_kuchikomi')
    .select('nickname,age_group,gender,comment,image_user')
    .eq('menu_id', m.id)
    .order('created_at', { ascending: false })
    .limit(3);

  let html = `
    <div class="result-header">
      <p class="menu-name">${m.name_jp}</p>
      <p class="score">⭐${count}</p>
    </div>
    <img src="${m.image_url || ''}" alt="${m.name_jp}" width="285" class="menu-photo"/>
    <p class="description">${m.description || ''}</p>
    <div class="comment-list">`;

  if (cs.length) {
    cs.forEach(c => {
      const imageUrl = c.image_user
        ? `https://labmhtrafdslfwqmzgky.supabase.co/storage/v1/object/public/user-images/${c.image_user}`
        : 'https://himmel-goryon-find.vercel.app/default-avatar.png';
      html += `
        <div class="comment-item">
          <a href="${imageUrl}" target="_blank">
            <img src="${imageUrl}" class="user-icon"/>
          </a>
          <div class="text">
            <div class="meta">${c.nickname||'匿名'} (${c.age_group||'-'},${c.gender||'-'})</div>
            <div class="body">${c.comment}</div>
          </div>
        </div>`;
    });
  } else {
    html += `<p class="no-comment">まだコメントがありません。</p>`;
  }
  html += `</div>
    <button id="load-more" class="more-comments-btn">その他クチコミを下に表示</button>`;
  els.resultWrap.innerHTML = html;

  document.getElementById('load-more').onclick = async () => {
    const { data: more = [] } = await supabase
      .from('find_kuchikomi')
      .select('nickname,age_group,gender,comment,image_user')
      .eq('menu_id', m.id)
      .order('created_at', { ascending: false })
      .limit(8);
    const list = document.querySelector('.comment-list');
    more.forEach(c => {
      const imageUrl = c.image_user
        ? `https://labmhtrafdslfwqmzgky.supabase.co/storage/v1/object/public/user-images/${c.image_user}`
        : 'https://himmel-goryon-find.vercel.app/default-avatar.png';
      list.insertAdjacentHTML('beforeend', `
        <div class="comment-item">
          <a href="${imageUrl}" target="_blank">
            <img src="${imageUrl}" class="user-icon"/>
          </a>
          <div class="text">
            <div class="meta">${c.nickname||'匿名'} (${c.age_group||'-'},${c.gender||'-'})</div>
            <div class="body">${c.comment}</div>
          </div>
        </div>`);
    });
    document.getElementById('load-more').style.display = 'none';
  };
});
