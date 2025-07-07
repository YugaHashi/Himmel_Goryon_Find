import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://labmhtrafdslfwqmzgky.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'; // 本番は.env管理推奨
const supabase    = createClient(SUPABASE_URL, SUPABASE_KEY);

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

//── 初期ロード：メニュー取得 ───────────────────────────────
window.addEventListener('load', async () => {
  try {
    const { data: menus, error } = await supabase
      .from('find_menus')
      .select('*');
    if (error) throw error;

    menus.forEach(m => {
      // datalist
      const opt = document.createElement('option');
      opt.value = m.name_jp;
      els.datalist.appendChild(opt);

      // 一覧
      els.menuList.insertAdjacentHTML('beforeend', `
        <div class="menu-item" data-id="${m.id}" data-name="${m.name_jp}">
          ${m.name_jp} ★0
        </div>
      `);

      // フォーム選択肢
      els.formMenu.insertAdjacentHTML('beforeend',
        `<option value="${m.id}">${m.name_jp}</option>`
      );
    });
  } catch (err) {
    console.error('Menus load error:', err);
    els.results.innerHTML = '<p>メニューの読み込みに失敗しました。</p>';
  }
});

//── メニュー表示関数 ────────────────────────────────────
async function showMenu(id, name) {
  const menuId = Number(id);
  els.searchInput.value = name;
  els.results.innerHTML = '<p>読み込み中…</p>';

  try {
    // メニュー詳細取得
    const { data: menuArr, error: errM } = await supabase
      .from('find_menus')
      .select('*')
      .eq('id', menuId)
      .limit(1);
    if (errM || !menuArr.length) throw errM || new Error('メニューが見つかりません。');
    const m = menuArr[0];

    // おすすめ数取得
    const { count: voteCount, error: errV } = await supabase
      .from('find_votes')
      .select('*', { count: 'exact' })
      .eq('menu_id', menuId);
    if (errV) throw errV;

    // クチコミ取得
    const { data: comments, error: errC } = await supabase
      .from('find_comments')
      .select('*')
      .eq('menu_id', menuId)
      .order('created_at', { ascending: false })
      .limit(3);
    if (errC) throw errC;

    // 結果表示
    els.results.innerHTML = `
      <div class="menu-item">
        <h3>${m.name_jp} ★${voteCount}</h3>
        ${m.image_url ? `<img src="${m.image_url}" alt="">` : ''}
        <p>${m.description_jp || ''}</p>
        ${comments.map(c => `
          <p>💬 ${c.nickname || '匿名'} (${c.age_group || '-'}, ${c.gender || '-'})
          : ${c.comment}</p>
        `).join('')}
      </div>
    `;
  } catch (err) {
    console.error('Show menu error:', err);
    els.results.innerHTML = '<p>表示中にエラーが発生しました。</p>';
  }
}

//── 検索ボタン・一覧クリック設定 ───────────────────────────
els.searchBtn.addEventListener('click', () => {
  const name = els.searchInput.value.trim();
  if (!name) return;
  const item = document.querySelector(`.menu-item[data-name="${name}"]`);
  if (item) showMenu(item.dataset.id, item.dataset.name);
});

els.menuList.addEventListener('click', e => {
  const item = e.target.closest('.menu-item');
  if (item) showMenu(item.dataset.id, item.dataset.name);
});

//── コメント投稿 ────────────────────────────────────────
els.submitBtn.addEventListener('click', async () => {
  try {
    const menuId = Number(els.formMenu.value);
    if (!menuId) return alert('メニューを選択してください。');

    const today = new Date().toISOString().slice(0, 10);
    const key   = `voted_${menuId}_${today}`;
    if (localStorage.getItem(key)) {
      return alert('このメニューは今日1回投稿済みです。');
    }

    const text = els.comment.value.trim();
    if (!text) return alert('コメントを入力してください。');

    // AIチェック
    const resp = await fetch('/api/validateComment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: text })
    });
    if (!resp.ok) {
      const errData = await resp.json();
      throw new Error(errData.error || '不適切な内容が含まれています。');
    }

    // Supabase 保存
    const { error: errIns } = await supabase.from('find_comments').insert([{
      menu_id:   menuId,
      nickname:  els.nickname.value || null,
      age_group: els.ageGroup.value || null,
      gender:    els.gender.value || null,
      comment:   text,
      is_softened: false
    }]);
    if (errIns) throw errIns;

    if (els.voteCb.checked) {
      const { error: errV } = await supabase
        .from('find_votes')
        .insert([{ menu_id: menuId }]);
      if (errV) throw errV;
    }

    localStorage.setItem(key, 'true');
    alert('投稿ありがとうございました！');

    // 再表示
    const selectedOption = els.formMenu.selectedOptions[0];
    showMenu(menuId, selectedOption ? selectedOption.textContent : '');
  } catch (err) {
    console.error('Submit error:', err);
    alert(err.message || '投稿中にエラーが発生しました。');
  }
});
