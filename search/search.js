// search.js
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

window.addEventListener('DOMContentLoaded', async()=>{
  const { data: menus=[] } = await supabase.from('find_menus').select('name_jp');
  menus.forEach(m=>{
    const opt=document.createElement('option');
    opt.value=m.name_jp;
    els.list.appendChild(opt);
  });
});

els.btn.addEventListener('click', async()=>{
  const name=els.input.value.trim();
  if(!name) return;
  els.placeholder.style.display='none';
  els.resultWrap.innerHTML='<p>読み込み中…</p>';
  els.resultWrap.classList.add('visible');

  const { data: m }=await supabase
    .from('find_menus').select('*').eq('name_jp',name).single();
  if(!m){
    els.resultWrap.innerHTML='<p>該当メニューがありません。</p>';
    return;
  }

  const { count: v }=await supabase
    .from('find_votes').select('*',{count:'exact'}).eq('menu_id',m.id);

  const { data: cs=[] }=await supabase
    .from('find_kuchikomi')
    .select('nickname,age_group,gender,comment,image_user,created_at')
    .eq('menu_id',m.id)
    .order('created_at',{ascending:false})
    .limit(3);

  els.resultWrap.innerHTML=`
    <h3 style="text-align:center;">${m.name_jp} ★${v}</h3>
    ${m.image_url?`<img src="${m.image_url}" alt="">`:``}
    <p>${m.description_jp||''}</p>
    <div class="comment-list">
      ${cs.map(c=>{
        return `
          <div class="comment-item">
            <img src="${c.image_user||'default-avatar.png'}" class="user-icon" />
            <div>
              <div class="meta">${c.nickname||'匿名'} (${c.age_group||'-'},${c.gender||'-'})</div>
              <div class="body">${c.comment}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <button id="load-more" class="more-comments-btn">その他クチコミを下に表示</button>
  `;
  attachLoadMore(m.id);
});

function attachLoadMore(menuId){
  const btn=document.getElementById('load-more');
  btn.addEventListener('click', async()=>{
    const { data: cs=[] }=await supabase
      .from('find_kuchikomi')
      .select('nickname,age_group,gender,comment,image_user,created_at')
      .eq('menu_id',menuId)
      .order('created_at',{ascending:false})
      .limit(8);
    document.querySelector('.comment-list').innerHTML=cs.map(c=>{
      return `
        <div class="comment-item">
          <img src="${c.image_user||'default-avatar.png'}" class="user-icon" />
          <div>
            <div class="meta">${c.nickname||'匿名'} (${c.age_group||'-'},${c.gender||'-'})</div>
            <div class="body">${c.comment}</div>
          </div>
        </div>
      `;
    }).join('');
    btn.style.display='none';
  });
}
