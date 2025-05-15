// utils/fetchWithRetry.js
/**
 * 帶重試和超時的數據獲取函數
 * @param {string} url - 要請求的URL
 * @param {Object} options - fetch參數選項
 * @param {number} maxRetries - 最大重試次數
 * @param {number} timeout - 請求超時時間(毫秒)
 * @param {boolean} showLogs - 是否顯示日誌
 * @returns {Promise<any>} - 返回JSON數據
 */
export async function fetchWithRetry(
  url,
  options = {},
  maxRetries = 3,
  timeout = 5000,
  showLogs = false
) {
  let lastError;

  const log = showLogs ? console.log : () => {};
  const logError = showLogs ? console.error : () => {};

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const { signal } = controller;

      // 設置超時
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      log(`🔄 嘗試獲取數據 (第${attempt + 1}次): ${url}`);

      const response = await fetch(url, {
        ...options,
        signal,
        cache: "no-store", // 確保不使用過期的快取
        next: { revalidate: 0 }, // 強制服務器端重新驗證
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      log(`✅ 成功獲取數據`);
      return data;
    } catch (error) {
      lastError = error;
      logError(
        `❌ 獲取失敗 (嘗試 ${attempt + 1}/${maxRetries}):`,
        error.message
      );

      // 如果不是最後一次嘗試，等待一段時間再重試
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 500; // 指數退避策略
        log(`⏱️ 等待 ${delay}ms 後重試...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // 所有嘗試都失敗
  logError(`❌ 所有 ${maxRetries} 次嘗試都失敗了`);
  throw lastError;
}
