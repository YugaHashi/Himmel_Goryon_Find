// comment/comment.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const BTN_COLOR = '#339aff';
const MAX_PER_DAY = 3;
const STORAGE_KEY = 'posts_by_date';
const FEATURES = [
  { key: 'jsuggestion', text: 'AIおすすめ' },
  { key: 'jquiz',      text: '豆知識クイズ' },
  { key: 'jar',        text: 'AR体験' }
];

const el = {
  form:    document.getElementById('comment-form'),
  menu:    document.getElementById('form-menu'),
  nick:    document.getElementById('nickname'),
  age:     document.getElementById('age-group'),
  gen:     document.getElementById('gender'),
  txt:     document.getElementById('comment'),
  imgIn:   document.getElementById('image_user'),
  vote:    document.getElementById('vote-checkbox'),
  submit:  document.querySelector('#comment-form button'),
  prog:    document.getElementById('progress'),
  feats: {
    jsuggestion: document.getElementById('btn-jsuggestion'),
    jquiz:      document.getElementById('btn-jquiz'),
    jar:        document.getElementById('btn-jar')
  }
};

window.addEventListener('DOMContentLoaded', async () => {
  const { data: menus = [] } = await supabase.from('find_menus').select('id,name_jp');
  menus.forEach(m => {
    el.menu.insertAdjacentHTML('beforeend',
      `<option value="${m.id}">${m.name_jp}</option>`
    );
  });
  updateUI();
});

el.form.addEventListener('submit', async e => {
  e.preventDefault();
  const menuId = +el.menu.value;
  const comment = el.txt.value.trim();
  if (!menuId || !comment) return alert('必要な情報を入力してください。');

  const today = new Date().toISOString().slice(0,10);
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const todayList = all[today] || [];
  if (todayList.includes(menuId)) return alert('本日は既にこのメニューに共有済みです。');
  if (todayList.length >= MAX_PER_DAY) return alert(`本日の共有上限（${MAX_PER_DAY}件）に達しました。`);

  // 画像アップロード
  let imageFile = null;
  if (el.imgIn.files.length) {
    const file = el.imgIn.files[0];
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type)) {
      return alert('対応形式は .jpg/.jpeg, .png, .webp のみです');
    }
    const ext = file.name.split('.').pop();
    const fname = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase
      .storage
      .from('user-images')
      .upload(fname, file, { upsert: true });
    if (upErr) {
      console.error(upErr);
      return alert('画像のアップロードに失敗しました。');
    }
    imageFile = fname;
  }

  await supabase.from('find_comments').insert([{
    menu_id:    menuId,
    nickname:   el.nick.value || null,
    age_group:  el.age.value || null,
    gender:     el.gen.value || null,
    comment,
    image_user: imageFile
  }]);

  if (el.vote.checked) {
    const menuName = el.menu.options[el.menu.selectedIndex].text;
    await supabase.from('find_votes').insert([{ menu_id: menuId, menu_name: menuName }]);
  }

  todayList.push(menuId);
  all[today] = todayList;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  el.form.reset();
  updateUI();
});

function updateUI() {
  const today = new Date().toISOString().slice(0,10);
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const cnt = (all[today] || []).length;

  // プログレス＆ラベル
  el.prog.value = cnt;
  el.prog.style.backgroundColor = BTN_COLOR;
  document.getElementById('level-label').textContent = `Lv ${cnt}`;

  // 共有ボタン
  const posted = (all[today] || []).includes(+el.menu.value);
  el.submit.disabled = posted || cnt >= MAX_PER_DAY;
  el.submit.textContent = posted ? '共有済み' : (cnt >= MAX_PER_DAY ? '本日の上限達成' : '共有する');

  // 機能ボタン
  FEATURES.forEach((f, i) => {
    const btn = el.feats[f.key];
    btn.disabled = cnt <= i;
    btn.textContent = `${f.text}（${i+1}回の共有で利用可）`;
    btn.style.background = BTN_COLOR;
    btn.onclick = () => {
      if (!btn.disabled) {
        window.location.hash = f.key;
        const sec = document.getElementById(f.key);
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      }
    };
  });
}
