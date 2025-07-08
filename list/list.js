import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const listEl = document.getElementById('menu-list');

window.addEventListener('DOMContentLoaded', async () => {
  const { data: menus=[] } = await supabase.from('find_menus').select('id,name_jp');
  for (const m of menus) {
    const { count:v } = await supabase
      .from('find_votes').select('*',{count:'exact'}).eq('menu_id',m.id);
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.innerHTML = `<span>${m.name_jp}</span><span>★${v}</span>`;
    div.addEventListener('click', () => {
      window.parent.postMessage({ type:'showMenu', id:m.id, name:m.name_jp }, '*');
    });
    listEl.appendChild(div);
  }
});
