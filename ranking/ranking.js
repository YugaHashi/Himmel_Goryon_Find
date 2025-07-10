// ranking.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const ul = document.getElementById('ranking-list');
async function loadRanking(){
  ul.innerHTML = '<li>読み込み中…</li>';
  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01T00:00:00Z`;
  const { data: votes=[] } = await supabase
    .from('find_votes')
    .select('menu_name,created_at')
    .gte('created_at', firstDay);

  const counts = votes.reduce((a,v)=>{ a[v.menu_name]=(a[v.menu_name]||0)+1; return a; }, {});
  const top3 = Object.entries(counts).sort(([,a],[,b])=>b-a).slice(0,3);
  ul.innerHTML = top3.map(([_m,c],i)=>`<li>${i+1}位：${_m} （${c}票）</li>`).join('');
}

window.addEventListener('DOMContentLoaded', ()=>{
  loadRanking();
  supabase.from('find_votes').on('INSERT',()=>loadRanking()).subscribe();
});
