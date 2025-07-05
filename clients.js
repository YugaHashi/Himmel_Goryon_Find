// clients.js
(async function(){
  const API = 'https://himmel-goryon-find.vercel.app/api/search';
  const listEl = document.getElementById('menuList');
  const allList = document.getElementById('allList');
  const welcome = document.getElementById('welcome');
  const result  = document.getElementById('result');

  // URL パラメータから date を取得（Carrd側の他スクリプトで付与済み）
  const baseParams = new URLSearchParams(window.location.search);

  // 1. 全メニュー取得 → オートコンプ & スクロール一覧
  baseParams.set('q',''); // 空クエリで全件取る
  let urlAll = `${API}?${baseParams.toString()}`;
  const all = await fetch(urlAll).then(r=>r.json());
  all.forEach(item=>{
    // datalist
    let opt = document.createElement('option');
    opt.value = item.name_jp;
    listEl.appendChild(opt);
    // scroll list
    let row = document.createElement('div');
    row.style.padding = '6px 0';
    row.style.borderBottom = '1px solid #eee';
    row.style.cursor = 'pointer';
    row.textContent = item.name_jp;
    row.onclick = ()=> show(item);
    allList.appendChild(row);
  });

  // 2. 検索ボタン & Enter キーで検索
  document.getElementById('searchBtn').onclick = doSearch;
  document.getElementById('searchInput')
    .addEventListener('keydown', e=>{ if(e.key==='Enter') doSearch() });

  async function doSearch(){
    const q = document.getElementById('searchInput').value.trim();
    if(!q) return;
    let params = new URLSearchParams(window.location.search);
    params.set('q', q);
    const data = await fetch(`${API}?${params.toString()}`)
      .then(r=>r.json());
    if(data.length){
      show(data[0]);
    } else {
      alert('該当メニューが見つかりませんでした。');
    }
  }

  function show(item){
    welcome.style.display = 'none';
    document.getElementById('resImg').src      = item.image_url;
    document.getElementById('resName').innerText  = item.name_jp;
    document.getElementById('resDesc').innerText  = item.description_jp;
    result.style.display = 'block';
  }
})();
