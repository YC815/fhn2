"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminNewsEditor from "@/components/AdminNewsEditor";

export default function EditNewsPage() {
  const [newsData, setNewsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (!params?.id) return;

    const fetchNews = async () => {
      try {
        setIsLoading(true);
        console.log(`嘗試載入新聞 ID: ${params.id}`);

        const response = await fetch(`/api/news/${params.id}`, {
          // 添加緩存控制，避免瀏覽器緩存
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.details || errorData.error || "無法載入新聞數據";
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("成功獲取新聞數據:", {
          id: data.id,
          title: data.title,
          tagsCount: data.tags?.length || 0,
        });

        // 確保數據格式與 AdminNewsEditor 組件期望的格式一致
        // 格式化參考資料，確保是數組格式
        const formattedReferences = Array.isArray(data.references)
          ? data.references.map((ref) => ({
            id: ref.id || "",
            url: ref.url || "",
            title: ref.title || "",
          }))
          : [];

        const formattedData = {
          ...data,
          // 確保 coverImage 是對象格式
          coverImage: data.coverImage
            ? typeof data.coverImage === 'string'
              ? { url: data.coverImage }
              : {
                id: data.coverImage.id || "",
                url: data.coverImage.url || data.coverImage,
                path: data.coverImage.path || "",
              }
            : null,
          // 確保 tags 是數組格式
          tags: Array.isArray(data.tags) ? data.tags : [],
          // 設置參考資料
          references: formattedReferences.length > 0 ? formattedReferences : [""]
        };

        setNewsData(formattedData);
        setError(null);
      } catch (error) {
        console.error("載入新聞時出錯:", error);

        // 如果錯誤與資料庫連接相關，重試幾次
        if (
          error.message.includes("資料庫連接") ||
          error.message.includes("database") ||
          error.message.includes("prepared statement")
        ) {
          if (retryCount < 3) {
            console.log(`將在1秒後重試 (嘗試 ${retryCount + 1}/3)...`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000);
            return;
          }
        }

        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [params?.id, retryCount]);

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    setIsLoading(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-gray-100"></div>
        {retryCount > 0 && (
          <p className="ml-4 text-gray-600 dark:text-gray-300">
            正在重試 ({retryCount}/3)...
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
          載入失敗
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            重試
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            返回管理頁面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-14">
      <AdminNewsEditor initialData={newsData} />
    </div>
  );
}
