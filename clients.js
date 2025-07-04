async function searchMenu() {
  const keyword = document.getElementById("searchInput").value;
  if (!keyword) return;

  const response = await fetch(
    `https://himmel-goryon-find.vercel.app/api/search?q=${encodeURIComponent(keyword)}`
  );

  const resultBox = document.getElementById("result");
  resultBox.innerHTML = "";

  try {
    const data = await response.json();

    if (!data || data.length === 0) {
      resultBox.textContent = "該当するメニューが見つかりませんでした。";
      return;
    }

    data.forEach((item) => {
      const card = document.createElement("div");
      card.className = "card";

      const img = document.createElement("img");
      img.src = item.image_url;
      img.alt = item.name_jp;

      const name = document.createElement("h3");
      name.textContent = item.name_jp;

      const desc = document.createElement("p");
      desc.textContent = item.description_jp;

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(desc);
      resultBox.appendChild(card);
    });
  } catch (e) {
    resultBox.textContent = "エラーが発生しました。";
  }
}
