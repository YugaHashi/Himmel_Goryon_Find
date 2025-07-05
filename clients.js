// 必要に応じて公開リポジトリに置き、「https://…/clients.js」で参照できるようにします。
// Supabase 情報
const SUPABASE_URL = 'https://labmhtrafdslfwqmzgky.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs';

// Supabase クライアント初期化
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

;(async function(){
  const listInput = document.getElementById('menuList');
  const allList   = document.getElementById('allList');
  const welcome   = document.getElementById('welcome');
  const result    = document.getElementById('result');

  // 1. 全メニューを取得し、オートコンプ & 一覧表示
  const { data: all } = await supabase
    .from('find_menus')
    .select('name_jp')
    .order('created_at', { ascending: true });

  all.forEach(item => {
    // datalist 用 option
    const opt = document.createElement('option');
    opt.value = item.name_jp;
    listInput.appendChild(opt);

    // スクロール一覧用要素
    const row = document.createElement('div');
    row.textContent = item.name_jp;
    row.onclick = () => show(item.name_jp);
    allList.appendChild(row);
  });

  // 2. 検索＆Enterキーイベント
  document.getElementById('searchBtn').onclick = doSearch;
  document.getElementById('searchInput')
    .addEventListener('keydown', e=>{ if(e.key==='Enter') doSearch(); });

  // 検索処理
  async function doSearch() {
    const q = document.getElementById('searchInput').value.trim();
    if (!q) return;
    const { data } = await supabase
      .from('find_menus')
      .select('*')
      .ilike('name_jp', `%${q}%`)
      .limit(1);
    if (data && data.length) {
      show(data[0]);
    } else {
      alert('該当メニューが見つかりませんでした。');
    }
  }

  // 結果表示
  function show(itemOrName) {
    // itemOrName が文字列なら再度データ取得
    if (typeof itemOrName === 'string') {
      supabase
        .from('find_menus')
        .select('*')
        .eq('name_jp', itemOrName)
        .limit(1)
        .then(({ data }) => data[0] && display(data[0]));
    } else {
      display(itemOrName);
    }
  }

  function display(item) {
    welcome.style.display = 'none';
    document.getElementById('resImg').src      = item.image_url;
    document.getElementById('resName').innerText  = item.name_jp;
    document.getElementById('resDesc').innerText  = item.description_jp;
    result.style.display = 'block';
  }
})();
