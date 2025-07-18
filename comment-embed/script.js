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
  submit:  document.querySelector('#comment-form button[type=submit]'),
  prog:    document.getElementById('progress'),
  level:   document.getElementById('level-label')
};

// 今日の日付を "YYYY-MM-DD" で取得
const getToday = () => new Date().toISOString().slice(0,10);
// URLパラメータ date のみを受け付け
const getPageDate = () => {
  const params = new URLSearchParams(window.location.search);
  const d = params.get('date');
  return (/^\d{4}-\d{2}-\d{2}$/.test(d)) ? d : null;
};

window.addEventListener('DOMContentLoaded', async () => {
  const pageDate = getPageDate();
  const today = getToday();

  // URL の date が指定されていて、今日と異なる場合は投稿不可
  if (pageDate && pageDate !== today) {
    alert('このページは本日用のコンテンツではありません。');
    el.submit.disabled = true;
    return;
  }

  // メニュー取得
  const { data: menus = [] } = await supabase.from('find_menus').select('id,name_jp');
  menus.forEach(m => {
    el.menu.insertAdjacentHTML(
      'beforeend',
      `<option value="${m.id}">${m.name_jp}</option>`
    );
  });

  // すでに同日分のユーザー情報があれば、2回目以降は固定
  const allUserInfos = JSON.parse(localStorage.getItem(USER_INFO_KEY) || '{}');
  const userInfo = allUserInfos[today];
  if (userInfo) {
    el.age.value = userInfo.age;
    el.gender.value = userInfo.gender;
    el.nick.value = userInfo.nick;
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

  // 再チェック：URLの日付と本日が一致しない場合
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

  // 初回クチコミ時に optional フィールドを保存して固定
  const allUserInfos = JSON.parse(localStorage.getItem(USER_INFO_KEY) || '{}');
  if (!allUserInfos[today]) {
    allUserInfos[today] = {
      age:    el.age.value || null,
      gender: el.gender.value || null,
      nick:   el.nick.value || null
    };
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(allUserInfos));
    el.age.disabled = true;
    el.gender.disabled = true;
    el.nick.disabled = true;
  }

  // Supabase に保存
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

  // フォームはメニューとコメントのみクリア
  el.menu.value = '';
  el.txt.value = '';

  updateUI();

  // ボタンの文言を「共有が完了しました」に変えて 2秒後に戻す
  const orig = el.submit.textContent;
  el.submit.textContent = '共有が完了しました';
  setTimeout(() => {
    el.submit.textContent = orig;
  }, 2000);
});

function updateUI() {
  const today = getToday();
  const cnt = (JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')[today] || []).length;
  el.prog.value = cnt;
  el.level.textContent = `Lv ${cnt}`;
}
