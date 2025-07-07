import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://labmhtrafdslfwqmzgky.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'; // 本番は.env管理推奨
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const els = {
  searchInput: document.getElementById('search-input'),
  searchBtn:   document.getElementById('search-btn'),
  results:     document.getElementById('results'),
  menuList:    document.getElementById('menu-list'),
  formMenu:    document.getElementById('form-menu'),
  nickname:    document.getElementById('nickname'),
  ageGroup:    document.getElementById('age-group'),
  gender:      document.getElementById('gender'),
  comment:     document.getElementById('comment'),
  voteCb:      document.getElementById('vote-checkbox'),
  submitBtn:   document.getElementById('submit-btn'),
  datalist:    document.getElementById('menu-suggestions'),
};

// 初期ロード：メニュー取得
window.addEventListener('load', async () => {
  const { data: menus } = await supabase.from('find_menus').select('*');
  menus.forEach(m => {
    els.datalist.innerHTML += `<option value="${m.name_jp}">`;
    els.menuList.innerHTML += `
      <div class="menu-item" data-id="${m.id}" data-name="${m.name_jp}">
        ${m.name_jp} ★0
      </div>`;
    els.formMenu.insertAdjacentHTML('beforeend',
      `<option value="${m.id}">${m.name_jp}</option>`);
  });
});

// メニュー表示関数
async function showMenu(id, name) {
  els.searchInput.value = name;
  els.results.innerHTML = '<p>読み込み中…</p>';

  const [{ data: menuArr }] = await Promise.all([
    supabase.from('find_menus').select('*').eq('id', id).limit(1),
  ]);
  const m = menuArr[0];

  const { count: voteCount } = await supabase
    .from('find_votes').select('*',{count:'exact'}).eq('menu_id', id);
  const { data: comments } = await supabase
    .from('find_comments').select('*')
    .eq('menu_id', id).order('created_at',{ascending:false}).limit(3);

  els.results.innerHTML = `
    <div class="menu-item">
      <h3>${m.name_jp} ★${voteCount}</h3>
      ${m.image_url? `<img src="${m.image_url}" alt="">` : ''}
      <p>${m.description_jp||''}</p>
      ${comments.map(c=>`
        <p>💬 ${c.nickname||'匿名'}(${c.age_group||'-'},${c.gender||'-'}):
        ${c.comment}</p>`).join('')}
    </div>`;
}

// 検索／一覧クリック
els.searchBtn.addEventListener('click', () => {
  const name = els.searchInput.value.trim();
  const item = document.querySelector(`.menu-item[data-name="${name}"]`);
  if (item) showMenu(item.dataset.id, name);
});
els.menuList.addEventListener('click', e => {
  const item = e.target.closest('.menu-item');
  if (item) showMenu(item.dataset.id, item.dataset.name);
});

// コメント投稿
els.submitBtn.addEventListener('click', async () => {
  const menuId = Number(els.formMenu.value);
  const today  = new Date().toISOString().slice(0,10);
  const key    = `voted_${menuId}_${today}`;
  if (localStorage.getItem(key)) {
    return alert('このメニューは今日1回投稿済みです。');
  }
  const text = els.comment.value.trim();
  if (!text) return alert('コメントを入力してください。');

  // AIチェック
  const resp = await fetch('/api/validateComment', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ comment: text })
  });
  if (!resp.ok) {
    const e = await resp.json();
    return alert(e.error);
  }

  // Supabase 保存
  await supabase.from('find_comments').insert([{
    menu_id:    menuId,
    nickname:   els.nickname.value||null,
    age_group:  els.ageGroup.value||null,
    gender:     els.gender.value||null,
    comment:    text,
    is_softened:false
  }]);
  if (els.voteCb.checked) {
    await supabase.from('find_votes').insert([{ menu_id: menuId }]);
  }

  localStorage.setItem(key,'true');
  alert('投稿ありがとうございました！');
  showMenu(menuId, document.querySelector(`option[value="${menuId}"]`).textContent);
});
