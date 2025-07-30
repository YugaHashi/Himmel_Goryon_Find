import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const input       = document.getElementById('search-input');
const btn         = document.getElementById('search-btn');
const resultEl    = document.getElementById('result');
const suggestions = document.getElementById('menu-suggestions');
let menus = [];

async function loadMenus() {
  const { data, error } = await supabase
    .from('find_menus')
    .select('id, name_jp, image_url');
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

btn.addEventListener('click', async () => {
  const keyword = input.value.trim();
  if (!keyword) return;

  const menu = menus.find(m => m.name_jp === keyword);
  if (!menu) {
    resultEl.innerHTML = `<p class="not-found">メニューが見つかりませんでした。</p>`;
    return;
  }

  // 名前と写真だけ表示（クチコミ非表示）
  resultEl.innerHTML = `
    <img src="${menu.image_url}" alt="${menu.name_jp}">
    <p class="menu-name">${menu.name_jp}</p>
  `;
});
