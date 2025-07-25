import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const input       = document.getElementById('search-input');
const btn         = document.getElementById('search-btn');
const resultEl    = document.getElementById('result');
const reviewsEl   = document.getElementById('reviews');
const suggestions = document.getElementById('menu-suggestions');

let menus = [];

// 1) メニュー一覧をロードして datalist にセット
async function loadMenus() {
  const { data, error } = await supabase
    .from('find_menus')
    .select('id, name_jp, description_jp, image_url');
  if (error) {
    console.error(error);
    return alert('メニュー読み込みに失敗しました。');
  }
  menus = data;
  data.forEach(m => {
    suggestions.insertAdjacentHTML('beforeend', `<option value="${m.name_jp}">`);
  });
}
loadMenus();

// 2) 検索ボタン押下時の処理
btn.addEventListener('click', async () => {
  const keyword = input.value.trim();
  if (!keyword) return;

  // 名前一致するメニューを探す
  const menu = menus.find(m => m.name_jp === keyword);
  if (!menu) {
    resultEl.innerHTML  = `<p class="not-found">メニューが見つかりませんでした。</p>`;
    reviewsEl.innerHTML = '';
    return;
  }

  // find_comments からコメントを取得
  const { data: comments, error: commentError } = await supabase
    .from('find_comments')
    .select('nickname, age, gender, comment')
    .eq('menu_id', menu.id)
    .order('created_at', { ascending: false });
  if (commentError) {
    console.error(commentError);
    alert('クチコミ読み込みエラー');
    return;
  }

  // 3) 検索結果領域に写真・名前・人気度・説明を表示
  resultEl.innerHTML = `
    <img src="${menu.image_url}" alt="${menu.name_jp}">
    <p class="menu-name">${menu.name_jp}</p>
    <p class="popularity">⭐ ${comments.length}</p>
    <p class="description">${menu.description_jp}</p>
  `;

  // 4) クチコミリストを表示
  if (!comments.length) {
    reviewsEl.innerHTML = `<p class="no-reviews">まだクチコミがありません。</p>`;
  } else {
    reviewsEl.innerHTML = '<h3>クチコミ</h3>';
    comments.forEach(c => {
      reviewsEl.insertAdjacentHTML('beforeend', `
        <div class="review-item">
          <div class="review-header">
            <span class="nick">${c.nickname || '匿名'}</span>
            <span class="meta">${c.age || ''} ${c.gender || ''}</span>
          </div>
          <div class="body">${c.comment}</div>
        </div>
      `);
    });
  }
});
