import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://labmhtrafdslfwqmzgky.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'; // 長いので省略可
const supabase = createClient(supabaseUrl, supabaseKey);

window.searchMenu = async () => {
  const q = document.getElementById('query').value.trim();
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '検索中...';

  if (!q) {
    resultDiv.innerHTML = 'キーワードを入力してください。';
    return;
  }

  const { data, error } = await supabase
    .from('find_menus')
    .select('*')
    .ilike('name_jp', `%${q}%`);

  if (error) {
    resultDiv.innerHTML = `エラー: ${error.message}`;
    return;
  }

  if (data.length === 0) {
    resultDiv.innerHTML = '該当メニューが見つかりませんでした。';
    return;
  }

  resultDiv.innerHTML = data.map(item => `
    <div>
      <h3>${item.name_jp}</h3>
      <p>${item.description_jp || '説明なし'}</p>
      ${item.photo_url ? `<img src="${item.photo_url}" width="100%">` : ''}
    </div>
    <hr />
  `).join('');
};
