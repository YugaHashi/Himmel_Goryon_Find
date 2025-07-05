import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://labmhtrafdslfwqmzgky.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYm1odHJhZmRzbGZ3cW16Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTAzNzksImV4cCI6MjA2NTI2NjM3OX0.CviQ3lzngfvqDFwEtDw5cTRSEICWliunXngYCokhbNs'
const supabase = createClient(supabaseUrl, supabaseKey)

const searchBtn = document.getElementById('search-btn')
const input = document.getElementById('search-input')
const resultsDiv = document.getElementById('results')
const datalist = document.getElementById('menu-suggestions')

searchBtn.addEventListener('click', searchMenus)

window.addEventListener('load', async () => {
  const { data, error } = await supabase.from('find_menus').select('name_jp')
  if (data) {
    data.forEach(item => {
      const option = document.createElement('option')
      option.value = item.name_jp
      datalist.appendChild(option)
    })
  }
})

async function searchMenus() {
  const query = input.value.trim()
  resultsDiv.innerHTML = '検索中...'

  const { data, error } = await supabase
    .from('find_menus')
    .select('*')
    .ilike('name_jp', `%${query}%`)

  if (error || !data || data.length === 0) {
    resultsDiv.innerHTML = '該当メニューが見つかりませんでした。'
    return
  }

  resultsDiv.innerHTML = data.map(item => `
    <div class="menu-item">
      <h3 onclick="document.getElementById('search-input').value='${item.name_jp}'">${item.name_jp}</h3>
      <p>${item.name_en || ''}</p>
      ${item.image_url ? `<img src="${item.image_url}" alt="${item.name_jp}">` : ''}
    </div>
  `).join('')
}
