import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const listEl = document.getElementById('menu-list');

window.addEventListener('DOMContentLoaded', async () => {
  const { data: menus = [] } = await supabase
    .from('find_menus')
    .select('name_jp');

  listEl.innerHTML = menus
    .map(m => `<div class="menu-item">${m.name_jp} 🌟0</div>`)
    .join('');
});
