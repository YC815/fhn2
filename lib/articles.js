// lib/articles.js
// 這裡是一個簡單的靜態資料範例，實務上你可以改用讀檔、呼叫 CMS 或打資料庫

const articles = [
  {
    id: "ai-vs-journalist",
    title: "AI 是否會取代新聞記者？",
    subtitle: "機器學習時代的新聞倫理與挑戰",
    tags: ["AI", "未來", "新聞"],
    coverImage: "/news/ai.jpg",
    contentHTML: `
        <p>近年來，隨著大型語言模型（LLM）的興起，許多人開始討論：</p>
        <h2>新聞編輯自動化的可能性</h2>
        <p>……（此處可放更多 HTML 段落）……</p>
      `,
  },
  {
    id: "remote-media-strategy",
    title: "遠距時代的媒體策略",
    subtitle: "從居家辦公到全球協作的新常態",
    tags: ["媒體", "社會", "趨勢"],
    coverImage: "/news/media.jpg",
    contentHTML: `
        <p>疫情爆發後，新聞機構必須快速適應遠端採訪與編輯流程……</p>
      `,
  },
  {
    id: "open-data-transparency",
    title: "開放資料如何改變政府透明？",
    subtitle: "公民參與與政策監督的新工具",
    tags: ["開放資料", "政治", "透明化"],
    coverImage: "/news/data.jpg",
    contentHTML: `
        <p>政府開放資料平台上線後，許多公民團體開始……</p>
      `,
  },
];

/**
 * 根據 id 回傳文章物件，找不到回傳 null
 * @param {string} id
 * @returns {Promise<import("./articles").Article|null>}
 */
export async function getArticleById(id) {
  // 這裡模擬異步，你也可以改成同步回傳
  const article = articles.find((a) => a.id === id) ?? null;
  return article;
}
