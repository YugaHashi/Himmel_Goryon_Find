import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const el = {
  form: document.getElementById('comment-form'),
  menu: document.getElementById('form-menu'),
  nick: document.getElementById('nickname'),
  age:  document.getElementById('age-group'),
  gen:  document.getElementById('gender'),
  txt:  document.getElementById('comment'),
  vote: document.getElementById('vote-checkbox'),
  prog: document.getElementById('progress'),
  panel: document.getElementById('unlock-panel'),
  msg: document.getElementById('unlock-message'),
  btns: document.getElementById('unlock-buttons'),
  secs: {
    jsug: document.getElementById('jsuggestion'),
    jquiz: document.getElementById('jquiz'),
    jar: document.getElementById('jar')
  }
};

const FEATURES = [
  { key: 'jsug', text: '🤖 AIおすすめ' },
  { key: 'jquiz', text: '🧠 豆知識クイズ' },
  { key: 'jar', text: '👼 AR体験' }
];

window.addEventListener('DOMContentLoaded', async () => {
  // メニュー選択肢
  const { data: menus = [] } = await supabase.from('find_menus').select('id,name_jp');
  menus.forEach(m => {
    el.menu.insertAdjacentHTML('beforeend',
      `<option value="${m.id}">${m.name_jp}</option>`
    );
  });
  if (!localStorage.getItem('comment_count')) {
    localStorage.setItem('comment_count','0');
  }
  updateUI();
});

el.form.addEventListener('submit', async e => {
  e.preventDefault();
  const menuId = +el.menu.value;
  const comment = el.txt.value.trim();
  if (!menuId || !comment) return alert('必要な情報を入力してください。');

  // Supabaseに保存
  await supabase.from('find_comments').insert([{
    menu_id: menuId,
    nickname: el.nick.value||null,
    age_group: el.age.value||null,
    gender: el.gen.value||null,
    comment,
    is_softened: false
  }]);
  if (el.vote.checked) {
    await supabase.from('find_votes').insert([{ menu_id: menuId }]);
  }

  let cnt = +localStorage.getItem('comment_count') + 1;
  if (cnt > 3) cnt = 3;
  localStorage.setItem('comment_count', String(cnt));

  alert('投稿ありがとうございました！');
  el.form.reset();
  updateUI();
});

function updateUI() {
  const cnt = +localStorage.getItem('comment_count');
  el.prog.value = cnt;

  FEATURES.forEach((f,i) => {
    if (i < cnt && el.secs[f.key]) {
      el.secs[f.key].classList.remove('hidden');
    }
  });

  if (cnt > 0) {
    el.panel.classList.remove('hidden');
    const unlocked = FEATURES.slice(0, cnt);
    const next = FEATURES[cnt];
    el.msg.textContent = `レベル${cnt}達成！` +
      (next ? ` 次は「${next.text}」を開放しよう。` : ' すべての体験が開放されました！');

    el.btns.innerHTML = unlocked.map(f =>
      `<button data-key="${f.key}">${f.text}</button>`
    ).join('');
    el.btns.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        document.getElementById(b.dataset.key)
          .scrollIntoView({ behavior:'smooth' });
      });
    });
  }
}
