import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const MAX_PER_DAY  = 3;
const STORAGE_KEY  = 'posts_by_date';
const USERINFO_KEY = 'user_info_by_date';

const els = {
  form:    document.getElementById('comment-form'),
  menu:    document.getElementById('form-menu'),
  age:     document.getElementById('age-group'),
  gender:  document.getElementById('gender'),
  nick:    document.getElementById('nickname'),
  txt:     document.getElementById('comment'),
  submit:  document.getElementById('submit-btn'),
  prog:    document.getElementById('progress'),
  level:   document.getElementById('level-label')
};

const getToday    = () => new Date().toISOString().slice(0,10);
const getPageDate = () => {
  const p = new URLSearchParams(window.location.search).get('date');
  return /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : null;
};

window.addEventListener('DOMContentLoaded', async () => {
  const today    = getToday();
  const pageDate = getPageDate();
  if (pageDate && pageDate !== today) {
    alert('このページは本日用ではありません。');
    els.submit.disabled = true;
    return;
  }

  // メニュー取得
  const { data: menus, error: menuErr } = await supabase
    .from('find_menus')
    .select('id,name_jp');
  if (menuErr) {
    console.error('メニュー取得エラー:', menuErr);
    return alert('メニュー読み込み失敗');
  }
  menus.forEach(m => {
    els.menu.insertAdjacentHTML(
      'beforeend',
      `<option value="${m.id}">${m.name_jp}</option>`
    );
  });

  // 過去情報ロック
  const infos = JSON.parse(localStorage.getItem(USERINFO_KEY) || '{}');
  const saved = infos[today];
  if (saved) {
    els.age.value    = saved.age    || '';
    els.gender.value = saved.gender || '';
    els.nick.value   = saved.nick   || '';
    els.age.disabled    =
    els.gender.disabled =
    els.nick.disabled   = true;
  }

  updateUI();
});

els.form.addEventListener('submit', async e => {
  e.preventDefault();
  const today    = getToday();
  const pageDate = getPageDate();
  if (pageDate && pageDate !== today) {
    return alert('このページは本日用ではありません。');
  }

  const menuId  = +els.menu.value;
  const comment = els.txt.value.trim();
  if (!menuId)  return alert('メニューを選んでください');
  if (!comment) return alert('コメントを入力してください');

  const allPosts  = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const todayList = allPosts[today] || [];
  if (todayList.includes(menuId))           return alert('既に同じメニューに投稿済み');
  if (todayList.length >= MAX_PER_DAY)      return alert(`本日の上限(${MAX_PER_DAY})に到達`);

  // optional 情報を初回保存
  const allInfos = JSON.parse(localStorage.getItem(USERINFO_KEY) || '{}');
  if (!allInfos[today]) {
    allInfos[today] = {
      age:    els.age.value    || null,
      gender: els.gender.value || null,
      nick:   els.nick.value   || null
    };
    localStorage.setItem(USERINFO_KEY, JSON.stringify(allInfos));
    els.age.disabled    =
    els.gender.disabled =
    els.nick.disabled   = true;
  }

  // 🚀 payload をログで確認
  const payload = {
    menu_id:  menuId,
    nickname: els.nick.value   || null,
    age:      els.age.value    || null,
    gender:   els.gender.value || null,
    comment
  };
  console.log('▶️ 投稿データ:', payload);

  // 📦 insert + select を必ず付ける
  const { data, error } = await supabase
    .from('find_comments')
    .insert([ payload ])
    .select();  // ← これがミソ！

  if (error) {
    console.error('Supabaseエラー:', error);
    return alert(`投稿失敗：${error.message}`);
  }

  // localStorage へ
  todayList.push(menuId);
  allPosts[today] = todayList;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allPosts));

  // フォームクリア＆UI更新
  els.menu.value = '';
  els.txt.value  = '';
  updateUI();

  // ボタンフィードバック
  const orig = els.submit.textContent;
  els.submit.textContent = 'ありがとうございます';
  els.submit.disabled    = true;
  setTimeout(() => {
    els.submit.textContent = orig;
    els.submit.disabled    = false;
  }, 3000);
});

function updateUI() {
  const today = getToday();
  const cnt   = (JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')[today] || []).length;
  els.prog.value      = cnt;
  els.level.textContent = cnt >= MAX_PER_DAY ? 'Lv MAX' : `Lv ${cnt}`;
}
