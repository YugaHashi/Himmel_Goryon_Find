import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://labmhtrafdslfwqmzgky.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
);

const els = {
  input:  document.getElementById('search-input'),
  btn:    document.getElementById('search-btn'),
  list:   document.getElementById('menu-suggestions'),
  result: document.getElementById('results')
};

window.addEventListener('DOMContentLoaded', async () => {
  // メニュー候補読み込み
  const { data: menus = [] } = await supabase.from('find_menus').select('name_jp');
  menus.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name_jp;
    els.list.appendChild(opt);
  });
});

els.btn.addEventListener('click', async () => {
  const name = els.input.value.trim();
  if (!name) return;
  els.result.innerHTML = '<p>読み込み中…</p>';
  els.result.classList.remove('visible');

  // メニュー取得
  const { data: m } = await supabase
    .from('find_menus').select('*').eq('name_jp', name).single();
  if (!m) {
    els.result.innerHTML = '<p>該当メニューがありません。</p>';
    els.result.classList.add('visible');
    return;
  }

  // 投票数
  const { count: v } = await supabase
    .from('find_votes').select('*', { count: 'exact' }).eq('menu_id', m.id);

  // クチコミ3件
  const { data: cs } = await supabase
    .from('find_comments')
    .select('*')
    .eq('menu_id', m.id)
    .order('created_at', { ascending: false })
    .limit(3);

  // 表示
  els.result.innerHTML = `
    <h3>${m.name_jp} ★${v}</h3>
    ${m.image_url ? `<img src="${m.image_url}" alt="">` : ''}
    <p>${m.description_jp || ''}</p>
    ${cs.map(c => `<p>💬 ${c.nickname||'匿名'} (${c.age_group||'-'},${c.gender||'-'})：${c.comment}</p>`).join('')}
  `;
  els.result.classList.add('visible');
});
