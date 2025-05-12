"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminNewsEditor from "@/components/AdminNewsEditor";

export default function EditNewsPage() {
    const [newsData, setNewsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        if (!params?.id) return;

        const fetchNews = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/news/${params.id}`);
                
                if (!response.ok) {
                    throw new Error('無法載入新聞數據');
                }
                
                const data = await response.json();
                // 確保數據格式與 AdminNewsEditor 組件期望的格式一致
                // 格式化參考資料，確保是數組格式
                const formattedReferences = Array.isArray(data.references) 
                    ? data.references.map(ref => ({
                        id: ref.id || '',
                        url: ref.url || '',
                        title: ref.title || ''
                    }))
                    : [];

                const formattedData = {
                    ...data,
                    // 確保 coverImage 是對象格式
                    coverImage: data.coverImage ? {
                        id: data.coverImage.id || '',
                        url: data.coverImage.url || data.coverImage,
                        path: data.coverImage.path || ''
                    } : null,
                    // 確保 tags 是數組格式
                    tags: Array.isArray(data.tags) ? data.tags : [],
                    // 設置參考資料
                    references: formattedReferences.length > 0 ? formattedReferences : ['']
                };
                setNewsData(formattedData);
            } catch (err) {
                console.error('載入新聞時出錯:', err);
                setError(err.message);
                // 可以選擇重定向到錯誤頁面或顯示錯誤信息
                // router.push('/admin?error=failed_to_load_news');
            } finally {
                setIsLoading(false);
            }
        };

        fetchNews();
    }, [params?.id]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
        );
    }


    if (error) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">載入失敗</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    重試
                </button>
            </div>
        );
    }

    return <div className="py-14"><AdminNewsEditor initialData={newsData} /></div>;
}