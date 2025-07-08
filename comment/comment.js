import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const el = {
  form: document.getElementById('comment-form'),
  menu: document.getElementById('form-menu'),
  nick: document.getElementById('nickname'),
  age: document.getElementById('age-group'),
  gen: document.getElementById('gender'),
  txt: document.getElementById('comment'),
  vote: document.getElementById('vote-checkbox'),
  prog: document.getElementById('progress'),
  unlocked: document.getElementById('unlocked-content'),
  list: document.getElementById('unlock-list')
};

// 初期ロード：メニュー取得＆進捗初期化
window.addEventListener('DOMContentLoaded', async () => {
  const { data: menus = [] } = await supabase.from('find_menus').select('id,name_jp');
  menus.forEach(m => {
    el.menu.insertAdjacentHTML('beforeend',
      `<option value="${m.id}">${m.name_jp}</option>`
    );
  });
  if (!localStorage.getItem('comment_count')) {
    localStorage.setItem('comment_count', '0');
  }
  updateProgress();
});

// 投稿処理
el.form.addEventListener('submit', async e => {
  e.preventDefault();
  const menuId = +el.menu.value;
  const comment = el.txt.value.trim();
  if (!menuId || !comment) return alert('必要な情報を入力してください。');

  const today = new Date().toISOString().slice(0, 10);
  const key = `voted_${menuId}_${today}`;
  if (localStorage.getItem(key)) {
    return alert('本日は既に投稿済みです。');
  }

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

  localStorage.setItem(key, 'true');
  let count = Number(localStorage.getItem('comment_count')) + 1;
  if (count > 3) count = 3;
  localStorage.setItem('comment_count', String(count));

  alert('コメントを投稿しました！');
  el.form.reset();
  updateProgress();
});

// UI更新＆アンロックリンク生成
function updateProgress() {
  const count = Number(localStorage.getItem('comment_count'));
  el.prog.value = count;

  const items = [];
  if (count >= 1) items.push({ text: '🤖 AIおすすめを体験', anchor: 'jsuggestion' });
  if (count >= 2) items.push({ text: '🧠 クイズに挑戦', anchor: 'jquiz' });
  if (count >= 3) items.push({ text: '👼 AR体験を開く', anchor: 'jar' });

  if (items.length) {
    el.unlocked.classList.remove('hidden');
    el.list.innerHTML = items.map(item =>
      `<li><a href="#" data-anchor="${item.anchor}">${item.text}</a></li>`
    ).join('');
    // イベント付与
    el.list.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const target = e.currentTarget.dataset.anchor;
        window.parent.location.hash = target;
      });
    });
  }
}
