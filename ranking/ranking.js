// ranking/ranking.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const ul = document.getElementById('ranking-list');

async function loadRanking() {
  ul.innerHTML = '<li>読み込み中...</li>';
  const firstDay = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01T00:00:00Z`;
  const { data: coms = [] } = await supabase
    .from('find_comments')
    .select('menu_id')
    .gte('created_at', firstDay);

  const counts = coms.reduce((a,{menu_id})=>{
    a[menu_id] = (a[menu_id]||0) + 1;
    return a;
  }, {});
  const top3 = Object.entries(counts)
    .sort(([,a],[,b])=>b-a)
    .slice(0,3)
    .map(([id,c])=>({ id, c }));

  const { data: menus = [] } = await supabase
    .from('find_menus')
    .select('id,name_jp')
    .in('id', top3.map(x=>x.id));

  const nameMap = Object.fromEntries(menus.map(m=>[m.id,m.name_jp]));
  ul.innerHTML = top3.map((x,i)=>
    `<li>${i+1}位：${nameMap[x.id]||'不明'} （${x.c}件）</li>`
  ).join('') || '<li>データがありません</li>';
}

window.addEventListener('DOMContentLoaded', ()=>{
  loadRanking();
  supabase.from('find_comments').on('INSERT', ()=>loadRanking()).subscribe();
});
