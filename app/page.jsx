// app/page.jsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { TagSelector } from "@/components/TagSelector";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

// 定義新聞數據結構
// 注意：這裡使用 JSDoc 註解來提供類型提示
/**
 * @typedef {Object} NewsItem
 * @property {string} id - 新聞 ID
 * @property {string} homeTitle - 首頁顯示的標題
 * @property {string} [coverImage] - 封面圖片 URL（可選）
 * @property {Array<{name: string}>} tags - 標籤列表
 */

export default function HomePage() {
  const [selectedTags, setSelectedTags] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 獲取新聞數據
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const tagQuery =
          selectedTags.length > 0 ? `?tags=${selectedTags.join(",")}` : "";

        // 嘗試從 sessionStorage 讀取緩存
        const cacheKey = `news-cache${tagQuery}`;
        const cachedData = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null;
        const cachedTime = typeof window !== 'undefined' ? sessionStorage.getItem(`${cacheKey}-time`) : null;
        const now = new Date().getTime();

        // 檢查緩存是否存在且未過期（設定為5分鐘）
        if (cachedData && cachedTime && (now - parseInt(cachedTime)) < 5 * 60 * 1000) {
          setNewsList(JSON.parse(cachedData));
          setIsLoading(false);
          return;
        }

        // 如果沒有緩存或緩存已過期，則從 API 獲取數據
        // 添加時間戳參數防止瀏覽器快取
        const timestamp = new Date().getTime();

        // 獲取當前 hostname 和 port
        const baseUrl = window.location.origin;
        const apiUrl = `${baseUrl}/api/news${tagQuery}${tagQuery ? '&' : '?'}t=${timestamp}`;
        console.log("請求 API:", apiUrl);

        const response = await fetchWithRetry(apiUrl);

        // 檢查 API 回傳的資料結構
        console.log("API 回傳資料:", response);

        // 正確處理 API 回傳的資料結構
        const newsData = response.news || [];
        setNewsList(newsData);

        // 儲存到 sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, JSON.stringify(newsData));
          sessionStorage.setItem(`${cacheKey}-time`, now.toString());
        }
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("無法載入新聞，請稍後再試");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [selectedTags]);

  // 處理標籤變化
  const handleTagChange = (tags) => {
    setSelectedTags(tags);
  };

  // 手動刷新函數
  const handleRefresh = () => {
    // 清除緩存並重新載入
    if (typeof window !== 'undefined') {
      // 刪除所有與新聞相關的緩存
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('news-cache')) {
          sessionStorage.removeItem(key);
        }
      });
    }
    setSelectedTags([...selectedTags]); // 創建新陣列觸發 useEffect
  };

  // 深色模式切換
  useEffect(() => {
    // 頁面載入時自動偵測
    if (
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // 切換深色/淺色模式的函數
  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-900 px-6 pb-24">
      <div className="relative">
        {/* Hero 區塊 */}
        <section className="text-center pt-12 pb-8">
          <h1 className="text-4xl font-bold mb-2">遠望地平線</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            站在地平線的邊緣，看見世界的裂縫。
          </p>
        </section>

        {/* 頂部固定區域 - 包含標題和標籤選擇器 */}
        <div className="sticky top-0 z-20 bg-white dark:bg-zinc-900 -mx-6 px-6 pt-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="flex justify-between w-full max-w-2xl mb-2">
                <TagSelector
                  onChange={handleTagChange}
                  className="flex-1"
                />
                <button
                  onClick={handleRefresh}
                  className="ml-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
                  title="刷新內容"
                >
                  重新載入
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 無結果提示 - 放在標籤選擇器下方 */}
        {/* 新增：網站開發階段紅色提示卡片 */}
        <div className="
          max-w-4xl mx-auto mt-4 p-4
          bg-red-50 border border-red-300 text-red-900
          rounded-lg text-center shadow
          dark:bg-red-900 dark:border-red-700 dark:text-red-100
          transition-colors
        ">
          {/* 主要提示訊息 */}
          <p className="font-semibold mb-1">
            目前網站仍處於剛完成開發階段，資料獲取速度可能稍慢，亦有機會出現預期之外的錯誤。
          </p>
          {/* 聯絡方式 */}
          <p className="text-sm">
            若您發現任何問題，歡迎於社群平台留言，或透過 Discord 私訊技術總監 Yushun（@yc815）與我們聯繫，感謝您的理解與協助！
          </p>
        </div>
        {!isLoading && !error && newsList.length === 0 && (
          <div className="max-w-4xl mx-auto mt-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-center">
            <p className="text-zinc-700 dark:text-zinc-300">
              找不到符合的新聞。請嘗試選擇其他標籤。
            </p>
          </div>
        )}

        {/* 卡片區 - 使用 relative 確保在正確的圖層 */}
        <div className="relative z-10 mt-8">
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              // 骨架屏
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse col-span-1"
                />
              ))
            ) : error ? (
              <div className="col-span-full text-center py-10">
                <p className="text-red-500">{error}</p>
              </div>
            ) : newsList.length > 0 ? (
              newsList.map((news) => (
                <Link
                  key={news.id}
                  href={`/news/${news.id}`}
                  className="relative block aspect-square rounded-xl overflow-hidden shadow-md border-2 hover:shadow-lg transition-shadow"
                >
                  {news.coverImage ? (
                    <Image
                      src={news.coverImage}
                      alt={news.homeTitle}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <span className="text-zinc-400">無封面圖片</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4 space-y-2">
                    <div className="flex gap-2 flex-wrap text-xs">
                      {news.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.name}
                          className="bg-white/20 px-2 py-0.5 rounded"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-xl font-bold line-clamp-2">
                      {news.homeTitle}
                    </h3>
                  </div>
                </Link>
              ))
            ) : null}
          </section>
        </div>
      </div>
      {/* 深色模式切換按鈕 */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 z-50 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
      >
        切換深色模式
      </button>
    </main>
  );
}

//                   乖乖保佑程式碼一切正常。部署到Vercel後Database不要出錯！！
//                                `-+syhddmmmddhyo+:`
//                             .+hmmdddddddddddddddmmds/`      ``...`
//                          `/hmddddddddddddddddddddddddmy++osyhyyyhhs.
//                        `ommddddddddddddddddddddddddddddmmdys+++syhhh:
//            .`         /mmddddddddddddddddddddddddddddddddmmhyyyyyyyyh/
//        `:sdNy`      .ymddddddddddddddddddddddddddddddddddddmdhhhyyyyyh-
//    `.+hmmmddmo     -mmddddddddddddddddddddddddddddddddddddddmmhhhhhhhh+
//   odmmdddddddms` `+mmddddddddddddddddddddddddddddddddddddddddmmddhhhhh+
//   ymdmmmmmmmmdmmdmmdddddddddddddmmddddddddddddddddddddddddddddmd:ydhhd:
//   :Nmmmmmmmmmmmmmmddy+::+ydddms/:::/+osydmdddddddddddddddddddddN-`:+o:
//    ymmmmmmmmmmmmmmdo.`.``/hmm/+hdd/``````-+ydmdddddddddddddddddmy
//    .mmmmmmmmmmmmmmh:`-o+`:hm/`-o:.```````os/./ymddddddddddddddddN`
//     /Nmmmmmmmmmmmmh:..::-od/``dMs````````/hNm:`-ymddddddddddddddN-
//      sNmmmmmmmmmmmd+-:/-.`..`.hh:`...``:hh..:```:NdmmmmmmmdmddddN/
//   `::/dmmmmmmmmmmmmdo:```./d/````-..:`-mdd.````.dmdmmmmmmmmmmmdmmy
// ./::-..+dmmmmmmmmmmh/````-dNms-```..``.+/`````-dmds/:-:ohmmmmmmmmN.
// -/.``--`/dmmmdysydmy.````omNd+.-::-...-:os:..`-hs-``.``./hmmmmmmmmd.       .os`
// /:---.`.`-/sy:```omy-````hddo` `s.``/NNNNo...`````-+o/``/dmmmmmmmmmms:..:+ymmN:
// :/.``.``````-``./dNh/````syyyhshd-``:mNmy.````````.```./hmmmmmmmmmmmmmmmmmmmmmd
//  .::-```...````+dNNNs-```//::/+ooosyhdds.``````-----:+ydmmmmmmmmmmmmmmmmmmmmmmN:
//    `:/````..``-shhdmms-``./::/:::::::+/``````.+dmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmd
//      ./:-```.-oyyhyhhhy+.`.:/::::///:.````..:ymNNmmo:/ymmmmmmmmmmmmmmmmmmmmmmmmN
//        `:y:./yyyyyyyyhh///:..--:--.````..-/ymNNNNNy.``-hNNNNNmmmmmmmmmmmmmmNmh+-
//        `ymdyhyyyyyyhhy/---o+///:::::://oyhmNNNNNNNo```:osyho/---:ymmNNNNmho:`
//        `+hhhhhyyyyhhs-----y--o/------:+hhhhhhhddds.````````..-..-+dNds+-`
//          `.:+oossyyyy:---:ssoy:------+hyyyyhhyyys-``....```..--..//`
//                     syysyysssho:-----ohyyyyhyhhyy/`````..``````-o.
//                    `hssssssoyhhyo+++syyhhhhyyhyyh+:::-..-:::::::.
//                    :hysssyo/yhhssyysssssyhyhhhyhdmmy....`
//                    shyyyyyyhhhhyyyyyyyyyyhh/-+syhdo`
//                   `hhhhhhhhhhhhhhhhhhhhhhhhy`
//                    -:yhyyyysyhhyyyyyyyyyyyyh-
//                      -hysssssyydsyyssssssssyh.
//                       /hsysyyyyd-.+yyyssyyssyh-
//           -/+oo++/-`   +hhyhhhso`  .ohyyyyyyhho:`   `-:/++++/:.
//        -+ooooooooooso+/ssss.yy:      `//+ds/oysss+ossoooooooo+os/.
//     `:o+:/oooooooooooooooossyh:          oyyssooooooooooooooo+/:os+`
//    -ssoooooooooooooooooosssssy+          .hyssssssooooooooooooooooss-
//    /syysssssssssssssssyyyyyyyh-           shyyyysyyysssssssssssssssyy
//      `-/+ossyyyysso+/:-./++//.             .---` `.-:/+oossssoo++/:-`
