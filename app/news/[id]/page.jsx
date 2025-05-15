// app/news/[id]/page.jsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import NewsContent from "./NewsContent";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

// 將動態路由參數標記為強制動態，避免靜態優化
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 主頁面組件
export default async function NewsPage({ params }) {
  const { id } = params;

  console.log(`🔍 開始獲取新聞數據，ID: ${id}`);

  // 獲取當前主機信息
  const headersList = headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const url = `${protocol}://${host}/api/news/${id}`;

  try {
    // 使用帶有重試機制的獲取函數
    const news = await fetchWithRetry(url, {}, 3, 5000, true);

    // 檢查新聞數據是否有效
    if (!news || !news.id) {
      console.error("❌ 獲取到無效的新聞數據");
      return notFound();
    }

    console.log(`📰 渲染新聞, 標題: ${news.homeTitle}`);
    return <NewsContent news={news} />;
  } catch (error) {
    console.error("❌ 獲取新聞數據最終失敗:", error);
    return notFound();
  }
}
