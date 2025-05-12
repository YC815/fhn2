'use client';

import { UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [newsList, setNewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 檢查登入狀態
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/admin/login');
    }
  }, [isLoaded, isSignedIn, router]);

  // 載入新聞列表
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news');
        const data = await response.json();
        setNewsList(data);
      } catch (error) {
        console.error('載入新聞失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded && isSignedIn) {
      fetchNews();
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理員儀表板</h1>
          <div className="flex items-center space-x-4">
            <UserButton afterSignOutUrl="/admin/login" />
          </div>
        </div>
        
        {/* 新增新聞表單 */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">新增新聞</h2>
          <div className="flex justify-center">
            <Link 
              href="/admin/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              新增新聞
            </Link>
          </div>
        </div>

        {/* 編輯現有新聞 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">編輯以前的新聞</h2>
          
          {newsList.length === 0 ? (
            <p className="text-gray-500 text-center py-4">目前沒有新聞</p>
          ) : (
            <div className="space-y-4">
              {newsList.map((newsItem) => (
                <Link 
                  key={newsItem.id} 
                  href={`/admin/edit/${newsItem.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    {newsItem.coverImage && (
                      <div className="flex-shrink-0">
                        <img 
                          src={newsItem.coverImage} 
                          alt={newsItem.title}
                          className="h-20 w-20 object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {newsItem.title}
                      </h3>
                      {newsItem.subtitle && (
                        <p className="text-sm text-gray-500 mb-1">{newsItem.subtitle}</p>
                      )}
                      <p className="text-sm text-gray-500 truncate">
                        {newsItem.contentMD.split('\n')[0]}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(newsItem.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
