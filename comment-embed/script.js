// script.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const MAX_PER_DAY = 3;
const STORAGE_KEY    = 'posts_by_date';
const USERINFO_KEY   = 'user_info_by_date';

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

// 今日の日付 (YYYY-MM-DD)
const getToday = () => new Date().toISOString().slice(0,10);
// URL の ?date=YYYY-MM-DD があれば返す（正規表現チェック）
const getPageDate = () => {
  const p = new URLSearchParams(window.location.search).get('date');
  return /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : null;
};

window.addEventListener('DOMContentLoaded', async () => {
  const today    = getToday();
  const pageDate = getPageDate();
  if (pageDate && pageDate !== today) {
    alert('このページは本日用のコンテンツではありません。');
    els.submit.disabled = true;
    return;
  }

  // メニューを取得してプルダウンに追加
  const { data: menus = [] } = await supabase
    .from('find_menus')
    .select('id,name_jp');
  menus.forEach(m => {
    els.menu.insertAdjacentHTML(
      'beforeend',
      `<option value="${m.id}">${m.name_jp}</option>`
    );
  });

  // 初回 or 過去に保存された optional 情報 (age/gender/nick) があれば固定
  const infos   = JSON.parse(localStorage.getItem(USERINFO_KEY) || '{}');
  const saved   = infos[today];
  if (saved) {
    els.age.value    = saved.age    || '';
    els.gender.value = saved.gender || '';
    els.nick.value   = saved.nick   || '';
    els.age.disabled    = true;
    els.gender.disabled = true;
    els.nick.disabled   = true;
  }

  updateUI();
});

els.form.addEventListener('submit', async e => {
  e.preventDefault();
  const today    = getToday();
  const pageDate = getPageDate();
  if (pageDate && pageDate !== today) {
    return alert('このページは本日用のコンテンツではありません。');
  }

  // 必須項目チェック
  const menuId  = +els.menu.value;
  const comment = els.txt.value.trim();
  if (!menuId || !comment) {
    return alert('必須項目を入力してください。');
  }

  // localStorage から本日の投稿履歴取得
  const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const todayList = allPosts[today] || [];
  if (todayList.includes(menuId)) {
    return alert('本日の同じメニューへのクチコミはすでに行われています。');
  }
  if (todayList.length >= MAX_PER_DAY) {
    return alert(`本日の上限(${MAX_PER_DAY}件)に達しました。`);
  }

  // 初回のみ、optional 情報を保存してフォームを固定
  const allInfos = JSON.parse(localStorage.getItem(USERINFO_KEY) || '{}');
  if (!allInfos[today]) {
    allInfos[today] = {
      age:    els.age.value    || null,
      gender: els.gender.value || null,
      nick:   els.nick.value   || null
    };
    localStorage.setItem(USERINFO_KEY, JSON.stringify(allInfos));
    els.age.disabled    = true;
    els.gender.disabled = true;
    els.nick.disabled   = true;
  }

  // Supabase にコメントを挿入（age/gender も含む）
  const { error } = await supabase
    .from('find_comments')
    .insert([{
      menu_id:    menuId,
      nickname:   els.nick.value   || null,
      age:        els.age.value    || null,
      gender:     els.gender.value || null,
      comment,
      image_user: null
    }]);
  if (error) {
    console.error(error);
    return alert('サーバーへの保存に失敗しました。');
  }

  // localStorage に投稿履歴を追加
  todayList.push(menuId);
  allPosts[today] = todayList;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allPosts));

  // フォームをクリア
  els.menu.value = '';
  els.txt.value  = '';

  updateUI();

  // ボタン文言を「ありがとうございます」にして 4秒後に戻す
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
  const count = (JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')[today] || []).length;
  els.prog.value = count;
  els.level.textContent = count >= MAX_PER_DAY
    ? 'Lv MAX'
    : `Lv ${count}`;
}
