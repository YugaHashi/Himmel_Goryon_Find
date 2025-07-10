// comment.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const el = {
  form:    document.getElementById('comment-form'),
  menu:    document.getElementById('form-menu'),
  nick:    document.getElementById('nickname'),
  age:     document.getElementById('age-group'),
  gen:     document.getElementById('gender'),
  txt:     document.getElementById('comment'),
  imgIn:   document.getElementById('image_user'),
  vote:    document.getElementById('vote-checkbox'),
  submit:  document.querySelector('#comment-form button[type=submit]'),
  prog:    document.getElementById('progress'),
  panel:   document.getElementById('unlock-panel'),
  msg:     document.getElementById('unlock-message'),
  btns:    document.getElementById('unlock-buttons'),
};

const FEATURES = [
  { key: 'jsug',  text: '🤖 AIおすすめ' },
  { key: 'jquiz', text: '🧠 豆知識クイズ' },
  { key: 'jar',   text: '👼 AR体験' }
];
const COLORS = ['#77b8ff','#339aff','#0077ff'];
const STORAGE_KEY = 'posts_by_date';

window.addEventListener('DOMContentLoaded', async () => {
  // メニュー選択肢ロード
  const { data: menus = [] } = await supabase
    .from('find_menus')
    .select('id,name_jp');
  menus.forEach(m =>
    el.menu.insertAdjacentHTML('beforeend',
      `<option value="${m.id}">${m.name_jp}</option>`
    )
  );
  updateUI();
});

el.form.addEventListener('submit', async e => {
  e.preventDefault();

  const menuId = +el.menu.value;
  const comment = el.txt.value.trim();
  if (!menuId || !comment) {
    return alert('必要な情報を入力してください。');
  }

  // 日付／メニューごとの投稿制限チェック
  const today = new Date().toISOString().slice(0,10);
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const todayList = all[today] || [];
  if (todayList.includes(menuId)) {
    return alert('本日は既にこのメニューに投稿済みです。');
  }
  if (todayList.length >= 3) {
    return alert('本日の投稿上限（3件）に達しました。');
  }

  // 画像アップロード → ファイル名を取得
  let imageFileName = null;
  if (el.imgIn.files.length) {
    const file = el.imgIn.files[0];
    const ext = file.name.split('.').pop();
    const fname = `${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase
      .storage
      .from('user-images')
      .upload(fname, file, { upsert: false });

    if (upErr) {
      console.error(upErr);
      return alert('画像アップロードに失敗しました。');
    }
    // ここでは publicURL は取得せずファイル名だけを保持
    imageFileName = fname;
  }

  // コメントと（オプションの）画像ファイル名を insert
  await supabase
    .from('find_comments')
    .insert([{
      menu_id:    menuId,
      nickname:   el.nick.value || null,
      age_group:  el.age.value || null,
      gender:     el.gen.value || null,
      comment,
      image_user: imageFileName
    }]);

  // おすすめ投票
  if (el.vote.checked) {
    const menuName = el.menu.options[el.menu.selectedIndex].text;
    await supabase
      .from('find_votes')
      .insert([{ menu_id: menuId, menu_name: menuName }]);
  }

  // localStorage 更新
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

  // プログレスバー更新
  el.prog.value = cnt;
  el.prog.style.backgroundColor = COLORS[cnt - 1] || COLORS[0];
  document.getElementById('level-label').textContent =
    `Lv ${cnt}` + (cnt === 3 ? ' ごりょんさんマスター' : '');

  // 投稿ボタン制御
  const menuId = +el.menu.value;
  const posted = (all[today] || []).includes(menuId);
  el.submit.disabled = posted || cnt >= 3;
  el.submit.textContent = posted
    ? '本メニューは投稿済み'
    : (cnt >= 3 ? '本日の上限達成' : '投稿する');

  // 解放パネル表示
  el.panel.classList.toggle('hidden', cnt === 0);
  if (cnt > 0) {
    el.msg.textContent = cnt < FEATURES.length
      ? `レベル${cnt}達成！次は「${FEATURES[cnt].text}」`
      : 'レベル3達成！すべての体験が開放されました！';
    el.btns.innerHTML = FEATURES.slice(0, cnt).map((f, i) =>
      `<button data-key="${f.key}" style="background:${COLORS[i]};">${f.text}</button>`
    ).join('');
    el.btns.querySelectorAll('button').forEach(b =>
      b.addEventListener('click', () =>
        document.getElementById(b.dataset.key)
          .scrollIntoView({ behavior: 'smooth' })
      )
    );
  }
}
