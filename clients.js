const resultBox = document.getElementById("result");
const searchInput = document.getElementById("searchInput");
const menuList = document.getElementById("menuList");

async function fetchMenus() {
  const res = await fetch('/api/search?q=');
  const data = await res.json();
  renderMenuList(data);
  return data;
}

function renderMenuList(menus) {
  menus.forEach(menu => {
    const div = document.createElement("div");
    div.className = "menu-item";
    div.textContent = menu.name_jp;
    div.onclick = () => {
      searchInput.value = menu.name_jp;
      displayResult(menu);
    };
    menuList.appendChild(div);
  });
}

function displayResult(menu) {
  resultBox.innerHTML = `
    <img src="${menu.image_url}" alt="${menu.name_jp}" />
    <strong>${menu.name_jp}</strong><br/>
    <em>${menu.name_en}</em><br/>
    <p>${menu.description_jp}</p>
    <p><em>${menu.description_en}</em></p>
  `;
  resultBox.style.display = "block";
}

searchInput.addEventListener("input", async () => {
  const query = searchInput.value.toLowerCase();
  if (!query) {
    resultBox.style.display = "none";
    return;
  }
  const res = await fetch(`/api/search?q=${query}`);
  const data = await res.json();
  if (data.length > 0) {
    displayResult(data[0]);
  } else {
    resultBox.innerHTML = `<p>一致するメニューが見つかりませんでした。</p>`;
    resultBox.style.display = "block";
  }
});

fetchMenus();
