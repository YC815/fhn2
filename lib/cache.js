// lib/cache.js

// 新增記憶體快取機制
const CACHE_TTL = 60 * 1000; // 快取有效時間（毫秒）：1分鐘
const newsCache = {
  data: null,
  timestamp: 0,
  queries: {}, // 針對不同的查詢參數進行快取
};

// 從快取中獲取結果，如果快取不存在或過期則返回 null
export function getFromCache(cacheKey) {
  const cachedItem = newsCache.queries[cacheKey];
  const now = Date.now();

  // 檢查快取是否存在且未過期
  if (cachedItem && now - cachedItem.timestamp < CACHE_TTL) {
    console.log(`🟢 從快取中獲取結果，快取鍵: ${cacheKey}`);
    return cachedItem.data;
  }

  return null;
}

// 設置快取
export function setCache(cacheKey, data) {
  newsCache.queries[cacheKey] = {
    data,
    timestamp: Date.now(),
  };
  console.log(`🟢 已設置快取，快取鍵: ${cacheKey}`);
}

// 清空所有快取
export function clearCache() {
  newsCache.queries = {};
  newsCache.timestamp = 0;
  newsCache.data = null;
  console.log("🟢 已清空所有快取");
}
