async function searchMenu() {
  const query = document.getElementById("searchInput").value;
  const resultArea = document.getElementById("resultArea");
  resultArea.innerHTML = "検索中...";

  try {
    const res = await fetch(`https://himmel-goryon-find.vercel.app/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      resultArea.innerHTML = "該当するメニューが見つかりませんでした。";
      return;
    }

    resultArea.innerHTML = "";

    data.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${item.name_jp}</h3>
        <p>${item.description_jp}</p>
        <img src="${item.image_url}" alt="${item.name_jp}" />
      `;

      resultArea.appendChild(card);
    });
  } catch (error) {
    resultArea.innerHTML = "エラーが発生しました。";
    console.error(error);
  }
}
