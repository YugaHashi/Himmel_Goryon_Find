import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

async function loadRanking() {
  const firstDay = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01T00:00:00Z`;
  const { data: comments = [] } = await supabase
    .from('find_comments')
    .select('menu_id')
    .gte('created_at', firstDay);

  const counts = comments.reduce((acc, { menu_id }) => {
    acc[menu_id] = (acc[menu_id] || 0) + 1;
    return acc;
  }, {});

  const top3 = Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id);

  if (!top3.length) {
    document.getElementById('ranking-list').innerHTML = '<li>データがありません</li>';
    return;
  }

  const { data: menus } = await supabase
    .from('find_menus')
    .select('id,name_jp,image_url')
    .in('id', top3);

  const lookup = Object.fromEntries(menus.map(m => [m.id, m]));
  document.getElementById('ranking-list').innerHTML = top3.map(id => {
    const m = lookup[id];
    return `
      <li>
        <img src="${m.image_url}" alt="${m.name_jp}"/>
        <p>${m.name_jp}</p>
      </li>`;
  }).join('');
}

window.addEventListener('DOMContentLoaded', loadRanking);
supabase.from('find_comments').on('INSERT', loadRanking).subscribe();
