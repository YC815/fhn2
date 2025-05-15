// app/page.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { TagSelector } from "@/components/TagSelector";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { motion, useSpring, useTransform, useMotionValue } from "framer-motion";

// 定義新聞數據結構
// 注意：這裡使用 JSDoc 註解來提供類型提示
/**
 * @typedef {Object} NewsItem
 * @property {string} id - 新聞 ID
 * @property {string} homeTitle - 首頁顯示的標題
 * @property {string} [coverImage] - 封面圖片 URL（可選）
 * @property {Array<{name: string}>} tags - 標籤列表
 * @property {string} date - 發布日期
 */

// 自定義圖片組件，解決載入過程中的色彩問題
const AdaptiveImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // 檢測深色模式
  useEffect(() => {
    // 初始檢測
    setIsDark(document.documentElement.classList.contains('dark'));

    // 監聽深色模式變化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* 背景色層，在圖片載入前顯示 */}
      <div
        className={`absolute inset-0 ${isDark ? 'bg-zinc-800' : 'bg-gray-200'} transition-opacity duration-300`}
        style={{ opacity: isLoaded ? 0 : 1 }}
      />
      <Image
        src={src}
        alt={alt}
        onLoadingComplete={() => setIsLoaded(true)}
        className={`object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        {...props}
      />
    </>
  );
};

// 傾斜卡片組件
const TiltCard = ({ children, className }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseDistance = useMotionValue(0); // 新增距離追蹤
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 檢測深色模式
  useEffect(() => {
    // 初始檢測
    setIsDarkMode(document.documentElement.classList.contains('dark'));

    // 監聽深色模式變化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  // 使用 useSpring 創建平滑的動畫效果 - 調整角度範圍以適應縮小後的卡片
  const rotateX = useSpring(useTransform(y, [-100, 100], [6, -6]), {
    stiffness: 300,
    damping: 20
  });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-6, 6]), {
    stiffness: 300,
    damping: 20
  });

  // 動態Z軸提升效果
  const translateZ = useSpring(isHovered ? 8 : 0, {
    stiffness: 300,
    damping: 20
  });

  // 動態陰影效果
  const shadowX = useSpring(useTransform(x, [-100, 100], [-12, 12]), {
    stiffness: 300,
    damping: 30
  });
  const shadowY = useSpring(useTransform(y, [-100, 100], [-12, 12]), {
    stiffness: 300,
    damping: 30
  });
  const shadowBlur = useSpring(useTransform(
    mouseDistance, // 使用距離值來控制陰影模糊
    [0, 100],
    [8, 20]
  ), {
    stiffness: 400,
    damping: 25
  });

  // 動態光源效果 - 深色模式下特別有用
  const lightIntensity = useSpring(
    isHovered ? (isDarkMode ? 0.8 : 0.15) : (isDarkMode ? 0.05 : 0.1),
    { stiffness: 300, damping: 20 }
  );

  // 計算合成的陰影效果 - 根據深色模式使用不同顏色
  const boxShadow = useTransform(
    [shadowX, shadowY, shadowBlur, translateZ, lightIntensity],
    ([latestX, latestY, latestBlur, latestZ, latestIntensity]) => {
      // 根據深色模式使用不同的陰影顏色
      const shadowColor = isDarkMode
        ? `rgba(255, 255, 255, ${latestIntensity * 0.5})` // 深色模式下使用白色陰影，增加不透明度
        : `rgba(0, 0, 0, 0.5)`; // 淺色模式下使用黑色陰影

      // 添加多層陰影效果，更好地模擬3D光照
      const intensity = isHovered ? 1.5 : 1.2; // 懸停時增強陰影效果

      // 深色模式下的邊緣高光效果 - 只在懸停時顯示
      const edgeShadow = isDarkMode && isHovered
        ? `, 0px 0px 3px rgba(255, 255, 255, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.2)`
        : '';

      // 深色模式下添加額外的環境光效果 - 只在懸停時顯示
      const ambientLight = isDarkMode && isHovered
        ? `, 0 0 20px 5px rgba(255, 255, 255, 0.15)`
        : '';

      // 在深色模式下，非懸停狀態幾乎不顯示陰影，淺色模式下保持明顯陰影
      const baseShadowOpacity = isDarkMode ? (isHovered ? 0.35 : 0) : (isHovered ? 0.35 : 0.15);

      // 調整陰影大小以適應縮小後的卡片
      const shadowSize = isHovered ? 8 : 6;
      const shadowOffset = isHovered ? 3 : 2;

      // 淺色模式下添加額外的環境陰影
      const lightModeAmbient = !isDarkMode
        ? `, 0 4px 15px rgba(0, 0, 0, ${isHovered ? 0.12 : 0.08})`
        : '';

      return `
        ${-latestX * 0.5}px ${-latestY * 0.5}px ${latestBlur * 0.7 * intensity}px ${shadowColor},
        0px ${shadowOffset + latestZ * 0.2}px ${shadowSize + latestZ}px rgba(${isDarkMode ? '255, 255, 255' : '0, 0, 0'}, ${baseShadowOpacity})${edgeShadow}${ambientLight}${lightModeAmbient}
      `;
    }
  );

  // 卡片邊框效果 - 深色模式下只在懸停時顯示，淺色模式下始終顯示
  const border = isDarkMode
    ? isHovered
      ? "1px solid rgba(255, 255, 255, 0.2)"
      : "1px solid rgba(255, 255, 255, 0)"
    : "1px solid rgba(0, 0, 0, 0.1)";

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    // 計算鼠標相對於卡片中心的位置
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 更新 motion values
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);

    // 計算距離來更新陰影模糊度
    const distance = Math.sqrt(
      Math.pow(event.clientX - centerX, 2) +
      Math.pow(event.clientY - centerY, 2)
    );
    mouseDistance.set(Math.min(distance, 100));
  }

  function handleMouseEnter() {
    setIsHovered(true);
  }

  function handleMouseLeave() {
    // 重置為初始狀態
    x.set(0);
    y.set(0);
    mouseDistance.set(0);
    setIsHovered(false);
  }

  return (
    <motion.div
      className={`${className} perspective-1000 ${isDarkMode ? 'dark-tilt-card' : ''}`}
      style={{
        rotateX,
        rotateY,
        boxShadow,
        z: translateZ,
        border,
        borderRadius: "0.75rem", // 確保邊框圓角與卡片一致
        transformStyle: "preserve-3d",
        transformOrigin: "center center",
        willChange: "transform, box-shadow, border" // 提高性能
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      transition={{
        scale: { type: "spring", stiffness: 400, damping: 17 },
        boxShadow: { type: "spring", stiffness: 300, damping: 20 }
      }}
    >
      <motion.div style={{
        transform: "translateZ(12px)", // 稍微降低Z軸高度
        transformStyle: "preserve-3d",
        // 深色模式下僅在懸停時添加微妙發光效果
        filter: isDarkMode && isHovered ? 'brightness(1.15) contrast(1.05)' : 'none',
        transition: 'filter 0.3s ease',
        position: 'relative',
        zIndex: 2
      }}>
        {children}
      </motion.div>

      {isDarkMode && (
        <motion.div
          className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
          style={{
            background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%)',
            opacity: 0, // 初始不顯示
            zIndex: 1,
            transition: 'opacity 0.3s ease'
          }}
          animate={{
            opacity: isHovered ? 0.8 : 0
          }}
          transition={{
            opacity: { duration: 0.3 }
          }}
          onMouseMove={(e) => {
            if (!isHovered) return; // 非懸停狀態不更新光暈位置
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
            e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
          }}
        />
      )}
    </motion.div>
  );
};

export default function HomePage() {
  const [selectedTags, setSelectedTags] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredNewsList, setFilteredNewsList] = useState([]);
  const [sortOrder, setSortOrder] = useState("newest"); // newest 或 oldest

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
        const cachedData =
          typeof window !== "undefined"
            ? sessionStorage.getItem(cacheKey)
            : null;
        const cachedTime =
          typeof window !== "undefined"
            ? sessionStorage.getItem(`${cacheKey}-time`)
            : null;
        const now = new Date().getTime();

        // 檢查緩存是否存在且未過期（設定為5分鐘）
        if (
          cachedData &&
          cachedTime &&
          now - parseInt(cachedTime) < 5 * 60 * 1000
        ) {
          setNewsList(JSON.parse(cachedData));
          setIsLoading(false);
          return;
        }

        // 如果沒有緩存或緩存已過期，則從 API 獲取數據
        // 添加時間戳參數防止瀏覽器快取
        const timestamp = new Date().getTime();

        // 獲取當前 hostname 和 port
        const baseUrl = window.location.origin;
        const apiUrl = `${baseUrl}/api/news${tagQuery}${tagQuery ? "&" : "?"
          }t=${timestamp}`;
        console.log("請求 API:", apiUrl);

        const response = await fetchWithRetry(apiUrl);

        // 檢查 API 回傳的資料結構
        console.log("API 回傳資料:", response);

        // 正確處理 API 回傳的資料結構
        const newsData = response.news || [];
        setNewsList(newsData);

        // 儲存到 sessionStorage
        if (typeof window !== "undefined") {
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

  // 篩選並排序新聞列表
  useEffect(() => {
    // 先依據搜尋詞篩選
    let filtered = newsList;

    if (searchTerm.trim()) {
      filtered = newsList.filter((news) =>
        news.homeTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 再依據排序選項排序
    const sorted = [...filtered].sort((a, b) => {
      // 優先使用日期字段進行排序
      let aValue, bValue;

      if (a.date && b.date) {
        // 如果兩個項目都有日期，直接用日期比較
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else if (a.createdAt && b.createdAt) {
        // 如果有 createdAt 字段，使用它
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else if (a.updatedAt && b.updatedAt) {
        // 如果有 updatedAt 字段，使用它
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
      } else {
        // 如果都沒有，則使用 id 作為排序依據
        // 假設較大的 id 代表較新的內容
        aValue = parseInt(a.id, 10) || 0;
        bValue = parseInt(b.id, 10) || 0;
      }

      // 根據排序方式返回比較結果
      return sortOrder === "newest" ? bValue - aValue : aValue - bValue;
    });

    setFilteredNewsList(sorted);
  }, [searchTerm, newsList, sortOrder]);

  // 處理標籤變化
  const handleTagChange = (tags) => {
    setSelectedTags(tags);
  };

  // 處理搜尋詞變化
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  // 處理排序方式變化
  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
  };

  // 手動刷新函數
  const handleRefresh = () => {
    // 清除緩存並重新載入
    if (typeof window !== "undefined") {
      // 刪除所有與新聞相關的緩存
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("news-cache")) {
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
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <>
      <NavBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />
      <main className="min-h-screen bg-white dark:bg-zinc-900 px-6 pb-24 pt-20">
        <div className="relative max-w-7xl mx-auto">
          {/* Hero 區塊 */}
          <section className="text-center pt-12 pb-8">
            <h1 className="text-4xl font-bold mb-2">遠望地平線</h1>
            <p className="text-zinc-500 dark:text-zinc-400 pt-2">
              選讀國際，望向遠方。<br />遠望地平線 Far Horizon News｜讓新聞不只是新聞。
            </p>
          </section>

          {/* 標籤選擇器區域 - 移除固定定位 */}
          <div className="bg-white dark:bg-zinc-900 -mx-6 px-6 pt-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="flex justify-between w-full max-w-2xl mb-2">
                  <TagSelector onChange={handleTagChange} className="flex-1" />
                  {/* 添加排序選擇器 */}
                  <div className="ml-2 relative">
                    <select
                      value={sortOrder}
                      onChange={handleSortChange}
                      className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-md py-1 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-30 h-10 appearance-none"
                    >
                      <option value="newest">最新發布</option>
                      <option value="oldest">最早發布</option>
                    </select>
                    {/* 自定義下拉箭頭 */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-700 dark:text-zinc-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 無結果提示 - 放在標籤選擇器下方 */}
          {/* 新增：網站開發階段紅色提示卡片 */}
          <div
            className="
            max-w-5xl mx-auto mt-4 p-4
            bg-red-50 border border-red-300 text-red-900
            rounded-lg text-center shadow
            dark:bg-red-900 dark:border-red-700 dark:text-red-100
            transition-colors
          "
          >
            {/* 主要提示訊息 */}
            <p className="font-semibold mb-1">
              目前網站仍處於剛完成開發階段，資料獲取速度可能稍慢，亦有機會出現預期之外的錯誤。
            </p>
            {/* 聯絡方式 */}
            <p className="text-sm">
              若您發現任何問題，歡迎於社群平台留言，或透過 Discord 私訊技術總監 Yushun（
              <a href="https://discordapp.com/users/843219121122181140" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">@yc815</a>）與我們聯繫，感謝您的理解與協助！
            </p>
          </div>
          {!isLoading && !error && filteredNewsList.length === 0 && (
            <div className="max-w-5xl mx-auto mt-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-center">
              <p className="text-zinc-700 dark:text-zinc-300">
                {searchTerm.trim()
                  ? "找不到符合搜尋條件的新聞。"
                  : "找不到符合的新聞。請嘗試選擇其他標籤。"}
              </p>
            </div>
          )}

          {/* 卡片區 - 使用 relative 確保在正確的圖層 */}
          <div className="relative z-10 mt-8 max-w-6xl mx-auto px-2">
            <section className="grid gap-8 sm:gap-10 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                // 改進的骨架屏
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="col-span-1 aspect-square rounded-xl overflow-hidden shadow-md  bg-gray-200 dark:bg-zinc-800 
                     relative scale-95 transform-gpu"
                  >
                    {/* 模擬圖片區域 */}
                    <div className="w-full h-full animate-pulse" />

                    {/* 模擬標題和標籤區域 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-300/80 dark:from-zinc-700/80 to-transparent p-4 space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        {Array.from({ length: 2 }).map((_, j) => (
                          <div key={j} className="h-5 w-14 bg-gray-300 dark:bg-zinc-600 rounded animate-pulse" />
                        ))}
                      </div>
                      <div className="h-6 bg-gray-300 dark:bg-zinc-600 rounded w-5/6 animate-pulse" />
                      <div className="h-6 bg-gray-300 dark:bg-zinc-600 rounded w-4/6 animate-pulse" />
                    </div>
                  </div>
                ))
              ) : error ? (
                <div className="col-span-full text-center py-10">
                  <p className="text-red-500 dark:text-red-400">{error}</p>
                </div>
              ) : filteredNewsList.length > 0 ? (
                filteredNewsList
                  .filter((news) => news.showOnHome) // 只顯示 showOnHome 為 true 的新聞
                  .map((news) => (
                    <TiltCard
                      key={news.id}
                      className="col-span-1 scale-95 transform-gpu"
                    >
                      <motion.div
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="w-full h-full overflow-hidden rounded-xl"
                      >
                        <Link
                          href={`/news/${news.id}`}
                          className="relative block aspect-square rounded-xl overflow-hidden shadow-md border border-stone-300 dark:border-stone-700 hover:shadow-lg transition-shadow w-full h-full"
                          prefetch={true}
                        >
                          {news.coverImage ? (
                            <AdaptiveImage
                              src={news.coverImage}
                              alt={news.homeTitle}
                              fill
                              sizes="(max-width: 640px) 95vw, (max-width: 1024px) 45vw, 30vw"
                              loading={filteredNewsList.indexOf(news) < 3 ? undefined : "lazy"}
                              placeholder="blur"
                              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwAEDQIEXXbLDwAAAABJRU5ErkJggg=="
                              priority={filteredNewsList.indexOf(news) < 3}
                            />
                          ) : (
                            <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                              <span className="text-zinc-400">無封面圖片</span>
                            </div>
                          )}
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4 space-y-2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                          >
                            <motion.div
                              className="flex gap-2 flex-wrap text-xs"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2, duration: 0.3 }}
                            >
                              {news.tags.slice(0, 3).map((tag, index) => (
                                <motion.span
                                  key={tag.name}
                                  className="bg-white/20 px-2 py-0.5 rounded"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.2 + index * 0.1, duration: 0.2 }}
                                  whileHover={{
                                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                                    scale: 1.05
                                  }}
                                >
                                  #{tag.name}
                                </motion.span>
                              ))}
                            </motion.div>
                            <motion.h3
                              className="text-xl font-bold line-clamp-2"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3, duration: 0.3 }}
                            >
                              {news.homeTitle}
                            </motion.h3>
                          </motion.div>
                        </Link>
                      </motion.div>
                    </TiltCard>
                  ))
              ) : null}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

//                   乖乖保佑程式碼一切正常。部署到Vercel後Database不要出錯！！
//                                `-+syhddmmmddhyo+:`
//                             .+hmmdddddddddddddddmmds/`      ``...`
//                          `/hmddddddddddddddddddddddddmy++osyhyyyhhs.
//                        `ommddddddddddddddddddddddddddddmmdys+++syhhh:
//            .`         /mmddddddddddddddddddddddddddddmmhyyyyyyyyh/
//        `:sdNy`      .ymddddddddddddddddddddddddddddddddmdhhhyyyyyh-
//    `.+hmmmddmo     -mmddddddddddddddddddddddddddddddddddmmhhhhhhhh+
//   odmmdddddddms` `+mmddddddddddddddddddddddddddddddddddddmmddhhhhh+
//   ymdmmmmmmmmdmmdmmdddddddddddddmmddddddddddddddddddddddddddddmd:ydhhd:
//   :Nmmmmmmmmmmmmmmddy+::+ydddms/:::/+osydmdddddddddddddddddddN-`:+o:
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
//        `+hhhhhyyyyhhs-----y--o/------:+hyyyyhhyyys-``....```..--..//`
//          `.:+oossyyyy:---:ssoy:------+hyyyyhhyyys-`````..``````-o.
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
