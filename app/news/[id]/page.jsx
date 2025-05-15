// app/news/[id]/page.jsx
import { headers } from "next/headers";
import NewsContent from "./NewsContent";

// 將動態路由參數標記為強制動態，避免靜態優化
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 主頁面組件
export default async function NewsPage({ params }) {
  const { id } = params;

  // 獲取當前主機信息，用於客戶端獲取數據
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const apiUrl = `${protocol}://${host}/api/news/${id}`;

  console.log(`🔍 準備渲染新聞頁面，ID: ${id}`);

  // 直接渲染 NewsContent 組件，將 API URL 和 ID 傳入
  // NewsContent 組件將自行處理數據載入和顯示
  return <NewsContent newsId={id} apiUrl={apiUrl} />;
}
