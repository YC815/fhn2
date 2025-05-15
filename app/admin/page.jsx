'use client';
// 降版本操作
import { UserButton, useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// 管理員電子郵件白名單
const ADMIN_EMAILS = [
  'yushun@fhn.com',
  'admin@example.com',
  'yushun@chen.zone',
  'heyiamzhengxun@gmail.com'
];

export default function AdminDashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [newsList, setNewsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);

  // 檢查登入狀態和權限
  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoaded) return;

      // 如果未登入，重定向到登入頁面
      if (!isSignedIn) {
        router.push('/admin/login');
        return;
      }

      try {
        // 檢查用戶電子郵件是否在白名單中
        const email = user.primaryEmailAddress?.emailAddress;
        console.log('Current user email:', email);

        if (!email) {
          throw new Error('無法獲取用戶電子郵件');
        }

        const isAdmin = ADMIN_EMAILS.includes(email);
        console.log('Is admin:', isAdmin);

        if (!isAdmin) {
          // 如果不是管理員，重定向到首頁
          console.log('權限不足，重定向到首頁');
          router.push('/');
          return;
        }

        // 如果是管理員，設置已授權標記
        setIsAuthorized(true);
      } catch (error) {
        console.error('檢查權限時出錯:', error);
        router.push('/');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [isLoaded, isSignedIn, user, router]);

  // 載入新聞列表
  useEffect(() => {
    if (isAuthorized && isSignedIn) {
      fetchNews();
    }
  }, [isAuthorized, isSignedIn]);

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/news');
      const data = await response.json();
      setNewsList(data.news || []);
    } catch (error) {
      console.error('載入新聞失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 刪除新聞的處理函數
  const handleDeleteClick = (newsItem, e) => {
    e.preventDefault(); // 防止連結跳轉
    e.stopPropagation(); // 阻止事件冒泡
    setNewsToDelete(newsItem);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!newsToDelete) return;

    try {
      setIsLoading(true);
      console.log(`嘗試刪除新聞 ID: ${newsToDelete.id}`);

      let retryCount = 0;
      let success = false;

      // 最多重試3次
      while (retryCount < 3 && !success) {
        try {
          const response = await fetch(`/api/news/${newsToDelete.id}`, {
            method: 'DELETE',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            }
          });

          if (response.ok) {
            success = true;
            console.log(`成功刪除新聞 ID: ${newsToDelete.id}`);
            // 刪除成功後重新獲取新聞列表
            fetchNews();
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('刪除新聞失敗:', errorData.details || errorData.error || '未知錯誤');

            // 如果不是與數據庫連接相關的錯誤，不再重試
            if (!(errorData.details?.includes('資料庫連接') ||
              errorData.details?.includes('prepared statement'))) {
              break;
            }

            retryCount++;
            if (retryCount < 3) {
              console.log(`將在1秒後重試刪除 (嘗試 ${retryCount}/3)...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (error) {
          console.error('刪除新聞時出錯:', error);
          retryCount++;

          if (retryCount < 3) {
            console.log(`將在1秒後重試刪除 (嘗試 ${retryCount}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (!success) {
        alert('刪除新聞失敗，請稍後再試');
      }
    } catch (error) {
      console.error('刪除新聞時出錯:', error);
      alert('刪除新聞失敗：' + error.message);
    } finally {
      setDeleteConfirmOpen(false);
      setNewsToDelete(null);
      setIsLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setNewsToDelete(null);
  };

  // 如果正在檢查權限或加載中，顯示加載動畫
  if (isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-14">
      {/* 刪除確認彈出視窗 */}
      {deleteConfirmOpen && newsToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">確定要刪除這則新聞嗎？</h3>
            <p className="text-gray-600 mb-4">{newsToDelete.title}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div
                  key={newsItem.id}
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
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/edit/${newsItem.id}`}
                        className="p-2 text-blue-600 hover:text-blue-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15.9 9 16l.1-2.828 6.586-6.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={(e) => handleDeleteClick(newsItem, e)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
