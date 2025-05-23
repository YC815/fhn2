'use client';
// 降版本操作
import { UserButton, useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Switch } from "@/components/ui/switch";

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
  const [loadingItems, setLoadingItems] = useState({});
  const [verifyingHome, setVerifyingHome] = useState(false);

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

  // 驗證主頁顯示功能
  const verifyHomeDisplay = async (newsId) => {
    try {
      // 如果提供了特定新聞ID，就設置該新聞的載入狀態
      if (newsId) {
        setLoadingItems(prev => ({ ...prev, [`verify_${newsId}`]: true }));
      } else {
        setVerifyingHome(true);
      }

      // 清除前端緩存
      if (typeof window !== "undefined") {
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("news-cache")) {
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(`${key}-time`);
          }
        });
      }

      // 重新獲取新聞列表以確保數據同步
      await fetchNews();

      // 打開主頁在新視窗
      window.open('/', '_blank');

      // 提示用戶檢查主頁
      setTimeout(() => {
        if (newsId) {
          // 清除特定新聞的載入狀態
          setLoadingItems(prev => ({ ...prev, [`verify_${newsId}`]: false }));
        } else {
          setVerifyingHome(false);
        }
        alert('已為您打開主頁，請檢查新聞是否正確顯示。若仍未顯示，請嘗試在主頁重新整理(Ctrl+F5)。');
      }, 1000);

    } catch (error) {
      console.error("驗證顯示設置時出錯:", error);
      alert("驗證顯示設置失敗: " + error.message);
      // 清除載入狀態
      if (newsId) {
        setLoadingItems(prev => ({ ...prev, [`verify_${newsId}`]: false }));
      } else {
        setVerifyingHome(false);
      }
    }
  };

  // 如果正在檢查權限或加載中，顯示加載動畫
  if (isCheckingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-14">
      {/* 刪除確認彈出視窗 */}
      {deleteConfirmOpen && newsToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">確定要刪除這則新聞嗎？</h3>
            <p className="text-gray-600 dark:text-zinc-300 mb-4">{newsToDelete.title}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:text-gray-800 dark:bg-zinc-400 rounded-md hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-yellow-500 bg-red-600 rounded-md hover:bg-red-700"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">管理員儀表板</h1>
          <div className="flex items-center space-x-4">
            <UserButton afterSignOutUrl="/admin/login" />
          </div>
        </div>

        {/* 新增新聞表單 */}
        <div className="bg-white shadow rounded-lg dark:bg-zinc-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">新增新聞</h2>
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
        <div className="bg-white shadow rounded-lg dark:bg-zinc-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">編輯以前的新聞</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchNews()}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新載入
              </button>
              <button
                onClick={() => verifyHomeDisplay()}
                disabled={verifyingHome}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
              >
                {verifyingHome ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    驗證中...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    驗證主頁顯示
                  </>
                )}
              </button>
            </div>
          </div>

          {newsList.length === 0 ? (
            <p className="text-gray-500 text-center py-4">目前沒有新聞</p>
          ) : (
            <div className="space-y-4">
              {newsList.map((newsItem) => (
                <div
                  key={newsItem.id}
                  className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"
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
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {newsItem.title}
                      </h3>
                      {newsItem.subtitle && (
                        <p className="text-sm text-gray-500 dark:text-zinc-300 mb-1">{newsItem.subtitle}</p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-zinc-300 truncate">
                        {newsItem.contentMD.split('\n')[0]}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-zinc-400 mt-1">
                        {new Date(newsItem.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2 items-center">
                      <Link
                        href={`/admin/edit/${newsItem.id}`}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800"
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
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newsItem.showOnHome}
                          onCheckedChange={async (checked) => {
                            try {
                              // 設置此項目的載入狀態
                              setLoadingItems(prev => ({ ...prev, [newsItem.id]: true }));

                              const res = await fetch(`/api/news/${newsItem.id}/showOnHome`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ showOnHome: checked }),
                              });

                              if (res.ok) {
                                console.log(`更新成功：${newsItem.title} showOnHome = ${checked}`);

                                // 清除前端緩存
                                if (typeof window !== "undefined") {
                                  Object.keys(sessionStorage).forEach((key) => {
                                    if (key.startsWith("news-cache")) {
                                      sessionStorage.removeItem(key);
                                      sessionStorage.removeItem(`${key}-time`);
                                    }
                                  });
                                }

                                // 更新本地狀態，避免重新獲取整個列表
                                setNewsList(prev =>
                                  prev.map(item =>
                                    item.id === newsItem.id
                                      ? { ...item, showOnHome: checked }
                                      : item
                                  )
                                );
                              } else {
                                console.error(`更新失敗：${newsItem.title}`);
                                alert("更新顯示狀態失敗，請重試");
                              }
                            } catch (err) {
                              console.error("請求失敗", err);
                              alert("更新顯示狀態失敗：" + err.message);
                            } finally {
                              // 清除此項目的載入狀態
                              setLoadingItems(prev => ({ ...prev, [newsItem.id]: false }));
                            }
                          }}
                          aria-label={newsItem.showOnHome ? "在主頁隱藏" : "在主頁顯示"}
                        />
                        {loadingItems[newsItem.id] ? (
                          <div className="flex items-center justify-center w-16">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 dark:text-zinc-300">
                              {newsItem.showOnHome ? "主頁顯示" : "主頁隱藏"}
                            </span>
                            {newsItem.showOnHome && (
                              <button
                                onClick={() => verifyHomeDisplay(newsItem.id)}
                                className="text-xs text-green-600 hover:text-green-800 ml-1"
                                title="驗證此新聞是否顯示在主頁"
                                disabled={loadingItems[`verify_${newsItem.id}`]}
                              >
                                {loadingItems[`verify_${newsItem.id}`] ? (
                                  <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-green-500"></div>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
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
