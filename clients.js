import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://labmhtrafdslfwqmzgky.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs';

const supabase = createClient(supabaseUrl, supabaseKey);

document.getElementById('search-btn').addEventListener('click', searchMenus);

async function searchMenus() {
  const query = document.getElementById('search-input').value;
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '検索中...';

  const { data, error } = await supabase
    .from('find_menus')
    .select('*')
    .ilike('name_jp', `%${query}%`);

  if (error) {
    resultsDiv.innerHTML = 'エラーが発生しました。';
    return;
  }

  if (data.length === 0) {
    resultsDiv.innerHTML = '該当メニューが見つかりませんでした。';
    return;
  }

  // 検索結果を整形して表示
  resultsDiv.innerHTML = data.map(item => `
    <div class="menu-item">
      <h3>${item.name_jp}</h3>
      <p>${item.name_en || ''}</p>
    </div>
  `).join('');
}
