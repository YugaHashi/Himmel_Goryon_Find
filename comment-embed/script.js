import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const MAX_PER_DAY = 3;
const STORAGE_KEY = 'posts_by_date';
const USER_INFO_KEY = 'user_info_by_date';

const el = {
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

const getToday = () => new Date().toISOString().slice(0,10);
const getPageDate = () => {
  const params = new URLSearchParams(window.location.search);
  const d = params.get('date');
  return (/^\d{4}-\d{2}-\d{2}$/.test(d)) ? d : null;
};

window.addEventListener('DOMContentLoaded', async () => {
  const pageDate = getPageDate();
  const today = getToday();

  if (pageDate && pageDate !== today) {
    alert('このページは本日用のコンテンツではありません。');
    el.submit.disabled = true;
    return;
  }

  // メニューを取得してプルダウンに追加
  const { data: menus = [] } = await supabase.from('find_menus').select('id,name_jp');
  menus.forEach(m => {
    el.menu.insertAdjacentHTML('beforeend',
      `<option value="${m.id}">${m.name_jp}</option>`
    );
  });

  // ユーザー情報があれば固定
  const allUserInfos = JSON.parse(localStorage.getItem(USER_INFO_KEY) || '{}');
  const userInfo = allUserInfos[today];
  if (userInfo) {
    el.age.value = userInfo.age || '';
    el.gender.value = userInfo.gender || '';
    el.nick.value = userInfo.nick || '';
    el.age.disabled = true;
    el.gender.disabled = true;
    el.nick.disabled = true;
  }

  updateUI();
});

el.form.addEventListener('submit', async e => {
  e.preventDefault();
  const today = getToday();
  const pageDate = getPageDate();
  if (pageDate && pageDate !== today) {
    return alert('このページは本日用のコンテンツではありません。');
  }

  const menuId = +el.menu.value;
  const comment = el.txt.value.trim();
  if (!menuId || !comment) {
    return alert('必須項目を入力してください。');
  }

  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const list = all[today] || [];
  if (list.includes(menuId)) {
    return alert('本日の同じメニューへのクチコミはすでに行われています。');
  }
  if (list.length >= MAX_PER_DAY) {
    return alert(`本日の上限(${MAX_PER_DAY}件)に達しました。`);
  }

  // optional 情報を初回のみ保存
  const allInfos = JSON.parse(localStorage.getItem(USER_INFO_KEY) || '{}');
  if (!allInfos[today]) {
    allInfos[today] = {
      age:    el.age.value || null,
      gender: el.gender.value || null,
      nick:   el.nick.value || null
    };
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(allInfos));
    el.age.disabled = true;
    el.gender.disabled = true;
    el.nick.disabled = true;
  }

  // Supabase にコメントを挿入
  await supabase.from('find_comments').insert([{
    menu_id:    menuId,
    nickname:   el.nick.value || null,
    comment,
    image_user: null
  }]);

  // localStorage に記録
  list.push(menuId);
  all[today] = list;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  // フォームをクリア
  el.menu.value = '';
  el.txt.value = '';

  updateUI();

  // ボタン文言を「ありがとうございます」にして4秒後に戻す
  const orig = el.submit.textContent;
  el.submit.textContent = 'ありがとうございます';
  el.submit.disabled = true;
  setTimeout(() => {
    el.submit.textContent = orig;
    el.submit.disabled = false;
  }, 4000);
});

function updateUI() {
  const today = getToday();
  const cnt = (JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')[today] || []).length;
  el.prog.value = cnt;
  if (cnt >= MAX_PER_DAY) {
    el.level.textContent = 'Lv MAX';
  } else {
    el.level.textContent = `Lv ${cnt}`;
  }
}
