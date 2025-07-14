import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const MAX_PER_DAY = 3;
const STORAGE_KEY = 'posts_by_date';
const el = {
  form:    document.getElementById('comment-form'),
  menu:    document.getElementById('form-menu'),
  age:     document.getElementById('age-group'),
  gender:  document.getElementById('gender'),
  nick:    document.getElementById('nickname'),
  txt:     document.getElementById('comment'),
  prog:    document.getElementById('progress'),
  level:   document.getElementById('level-label')
};

window.addEventListener('DOMContentLoaded', async () => {
  const { data: menus = [] } = await supabase.from('find_menus').select('id,name_jp');
  menus.forEach(m => {
    el.menu.insertAdjacentHTML(
      'beforeend',
      `<option value="${m.id}">${m.name_jp}</option>`
    );
  });
  updateUI();
});

el.form.addEventListener('submit', async e => {
  e.preventDefault();
  const menuId = +el.menu.value;
  const comment = el.txt.value.trim();
  if (!menuId || !comment) {
    return alert('必須項目を入力してください。');
  }

  const today = new Date().toISOString().slice(0,10);
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const list = all[today] || [];
  if (list.includes(menuId)) return alert('本日は既に共有済みです。');
  if (list.length >= MAX_PER_DAY) return alert(`本日の上限(${MAX_PER_DAY})に達しました。`);

  let imageFile = null; // 写真選択機能は削除済

  await supabase.from('find_comments').insert([{
    menu_id:    menuId,
    nickname:   el.nick.value || null,
    comment,
    image_user: imageFile
  }]);

  list.push(menuId);
  all[today] = list;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  el.form.reset();
  updateUI();
});

function updateUI() {
  const today = new Date().toISOString().slice(0,10);
  const cnt = (JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')[today]||[]).length;
  el.prog.value = cnt;
  el.level.textContent = `Lv ${cnt}`;
}
