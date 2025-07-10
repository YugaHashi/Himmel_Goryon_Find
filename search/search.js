import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const els = {
  input:       document.getElementById('search-input'),
  btn:         document.getElementById('search-btn'),
  list:        document.getElementById('menu-suggestions'),
  resultWrap:  document.getElementById('results'),
  placeholder: document.getElementById('placeholder')
};

window.addEventListener('DOMContentLoaded', async ()=>{
  const { data: menus=[] } = await supabase.from('find_menus').select('name_jp');
  menus.forEach(m=>{
    const opt = document.createElement('option');
    opt.value = m.name_jp;
    els.list.appendChild(opt);
  });
});

els.btn.addEventListener('click', async ()=>{
  const name = els.input.value.trim();
  if (!name) return;
  els.placeholder.style.display='none';
  els.resultWrap.classList.add('visible');
  els.resultWrap.innerHTML='<p>読み込み中…</p>';

  const { data: m } = await supabase
    .from('find_menus').select('*').eq('name_jp',name).single();
  if (!m) {
    els.resultWrap.innerHTML='<p>該当メニューがありません。</p>';
    return;
  }

  const firstDay = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01T00:00:00Z`;
  const { count } = await supabase
    .from('find_comments')
    .select('*',{count:'exact'})
    .eq('menu_id',m.id)
    .gte('created_at',firstDay);

  const { data: cs=[] } = await supabase
    .from('find_kuchikomi')
    .select('nickname,age_group,gender,comment,image_user')
    .eq('menu_id',m.id)
    .order('created_at',{ascending:false})
    .limit(3);

  // 検索結果テンプレート
  let html = `
    <div class="result-header">
      <p class="menu-name">${m.name_jp}</p>
      <p class="score">⭐${count}</p>
    </div>
    <div class="comment-list">`;
  if (cs.length) {
    cs.forEach(c=>{
      html += `
        <div class="comment-item">
          <img src="${c.image_user||'default-avatar.png'}" class="user-icon"/>
          <div class="text">
            <div class="meta">${c.nickname||'匿名'} (${c.age_group||'-'},${c.gender||'-'})</div>
            <div class="body">${c.comment}</div>
          </div>
        </div>`;
    });
  } else {
    html += `<p class="no-comment">まだコメントがありません。</p>`;
  }
  html += `</div>`;
  // “その他”ボタンは常に出すが、押しても空なら消える
  html += `<button id="load-more" class="more-comments-btn">その他クチコミを下に表示</button>`;
  els.resultWrap.innerHTML = html;

  // ボタン設置
  document.getElementById('load-more').onclick = async ()=>{
    const { data: more=[] } = await supabase
      .from('find_kuchikomi')
      .select('nickname,age_group,gender,comment,image_user')
      .eq('menu_id',m.id)
      .order('created_at',{ascending:false})
      .limit(8);
    const list = document.querySelector('.comment-list');
    list.innerHTML = more.map(c=>`
      <div class="comment-item">
        <img src="${c.image_user||'default-avatar.png'}" class="user-icon"/>
        <div class="text">
          <div class="meta">${c.nickname||'匿名'} (${c.age_group||'-'},${c.gender||'-'})</div>
          <div class="body">${c.comment}</div>
        </div>
      </div>
    `).join('') || '<p class="no-comment">コメントがありません。</p>';
    document.getElementById('load-more').style.display='none';
  };
});
