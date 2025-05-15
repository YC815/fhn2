"use client";
import React, { useEffect, useState } from "react";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

export default function PageContent({ pageName, mdFileName }) {
    const [isLoading, setIsLoading] = useState(true);
    const [contentReady, setContentReady] = useState(false);
    const [pageData, setPageData] = useState(null);
    const [error, setError] = useState(null);

    // 從 markdown 檔案獲取數據並包裝成仿 DB 格式
    useEffect(() => {
        const fetchContent = async () => {
            try {
                setIsLoading(true);
                console.log(`🔍 開始獲取頁面內容: ${mdFileName || pageName}.md`);

                const response = await fetch(`/${mdFileName || pageName}.md`);
                const text = await response.text();

                if (!text) {
                    console.error("❌ 獲取到無效的頁面內容");
                    setError("無法載入頁面內容");
                    setIsLoading(false);
                    return;
                }

                // 從 Markdown 文本提取標題 (第一個 # 開頭的行)
                const titleMatch = text.match(/^#\s+(.*)/m);
                const title = titleMatch ? titleMatch[1].trim() : pageName;

                // 模擬新聞數據結構
                const mockPageData = {
                    id: pageName,
                    homeTitle: title,
                    title: title,
                    subtitle: "",
                    contentMD: text,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    tags: [{ id: "page", name: pageName }]
                };

                console.log(`✅ 成功獲取頁面內容, 標題: ${title}`);
                setPageData(mockPageData);

                // 延遲一點點顯示內容，確保轉場感覺平滑
                setTimeout(() => {
                    setIsLoading(false);
                    setContentReady(true);
                }, 300);
            } catch (err) {
                console.error("❌ 獲取頁面內容失敗:", err);
                setError("載入頁面內容時出錯");
                setIsLoading(false);
            }
        };

        fetchContent();
    }, [pageName, mdFileName]);

    // 添加閱讀進度指示器
    useEffect(() => {
        const progressBar = document.createElement("div");
        progressBar.className = "reading-progress-bar";
        document.body.appendChild(progressBar);

        const updateProgress = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight =
                document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercentage = (scrollTop / scrollHeight) * 100;
            progressBar.style.width = `${scrollPercentage}%`;
        };

        window.addEventListener("scroll", updateProgress);
        updateProgress(); // 初始化進度條

        return () => {
            window.removeEventListener("scroll", updateProgress);
            document.body.removeChild(progressBar);
        };
    }, []);

    const content = pageData?.contentMD || "";

    // 自定義圖片渲染，實現markdown內圖片的懶加載
    const customRenderers = {
        img: ({ node, ...props }) => {
            return (
                <span className="block my-4 relative">
                    {props.src ? (
                        <img
                            src={props.src}
                            alt={props.alt || ""}
                            className="mx-auto rounded shadow max-w-full h-auto max-h-[500px] object-contain"
                            loading="lazy"
                        />
                    ) : (
                        <img
                            {...props}
                            className="mx-auto rounded shadow max-w-full h-auto max-h-[500px] object-contain"
                            loading="lazy"
                        />
                    )}
                </span>
            );
        },
        a: ({ node, ...props }) => {
            return (
                <a
                    {...props}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                    target={props.href?.startsWith("http") ? "_blank" : undefined}
                    rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                    {props.children}
                </a>
            );
        },
        em: ({ node, ...props }) => {
            return (
                <em {...props} className="text-gray-600 dark:text-gray-400 italic">
                    {props.children}
                </em>
            );
        }
    };

    // 載入中的骨架屏
    const LoadingSkeleton = () => (
        <div className="animate-pulse space-y-8">
            {/* 標題骨架 */}
            <div className="pt-20">
                <div className="h-10 bg-gray-200 dark:bg-zinc-700 rounded-md w-3/4 mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded-md w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-1/3 mb-8"></div>
            </div>

            {/* 內容骨架 */}
            <div className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-11/12"></div>
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-10/12"></div>
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-9/12"></div>
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-11/12"></div>
            </div>
        </div>
    );

    // 錯誤顯示組件
    const ErrorDisplay = () => (
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-lg mx-auto text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 dark:text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">載入失敗</h2>
                <p className="text-red-600 dark:text-red-300 mb-4">{error || "無法載入頁面內容，請稍後再試"}</p>
                <a href="/" className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors">
                    返回主頁
                </a>
            </div>
        </div>
    );

    return (
        <div className="py-20">
            <style jsx global>{`
        .reading-progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 4px;
          background: linear-gradient(to right, #3b82f6, #60a5fa);
          z-index: 50;
          width: 0%;
          transition: width 0.1s ease;
        }

        .prose {
          font-size: 1.125rem;
          line-height: 1.8;
          color: hsl(222.2, 84%, 4.9%);
        }

        .dark .prose {
          color: hsl(210, 40%, 98%);
        }

        .prose p {
          margin-top: 1.25em;
          margin-bottom: 1.25em;
          font-size: 1.2rem;
          line-height: 1.8;
          letter-spacing: 0.015em;
        }

        .prose h1 {
          font-size: 2.75rem;
          line-height: 1.2;
          margin-top: 1.5em;
          margin-bottom: 0.8em;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        .prose h2 {
          font-size: 2.2rem;
          line-height: 1.25;
          margin-top: 1.5em;
          margin-bottom: 0.8em;
          font-weight: 700;
          letter-spacing: -0.015em;
        }

        .prose h3 {
          font-size: 1.85rem;
          line-height: 1.3;
          margin-top: 1.3em;
          margin-bottom: 0.7em;
          font-weight: 700;
        }

        .prose h4 {
          font-size: 1.6rem;
          line-height: 1.35;
          margin-top: 1.2em;
          margin-bottom: 0.6em;
          font-weight: 600;
        }

        .prose h5 {
          font-size: 1.35rem;
          line-height: 1.4;
          margin-top: 1.1em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }

        .prose h6 {
          font-size: 1.1rem;
          line-height: 1.5;
          margin-top: 1em;
          margin-bottom: 0.4em;
          font-weight: 500;
        }

        .prose hr {
          margin-top: 2.5em;
          margin-bottom: 2.5em;
          border-width: 1px;
        }

        .prose ul li,
        .prose ol li {
          margin-top: 0.6em;
          margin-bottom: 0.6em;
          font-size: 1.2rem;
          line-height: 1.7;
        }

        .prose blockquote {
          font-style: italic;
          border-left-width: 4px;
          border-left-color: hsl(214.3, 31.8%, 91.4%);
          padding-left: 1.5rem;
          margin-left: 0;
          margin-right: 0;
        }

        .dark .prose blockquote {
          border-left-color: hsl(215, 20.2%, 15.1%);
        }

        .prose a {
          text-decoration-thickness: 1px;
          text-underline-offset: 2px;
          transition: color 0.2s ease;
        }

        .prose pre {
          border-radius: 0.5rem;
          padding: 1.25rem;
          overflow-x: auto;
        }

        .prose code {
          font-size: 0.9em;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            monospace;
        }

        .prose img {
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
          margin: 2rem auto;
        }

        .prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
        }

        .prose table th,
        .prose table td {
          padding: 0.75rem 1rem;
          border: 1px solid hsl(214.3, 31.8%, 91.4%);
        }

        .dark .prose table th,
        .dark .prose table td {
          border-color: hsl(215, 20.2%, 15.1%);
        }
      `}</style>

            {/* 返回主頁按鈕 - 始終顯示 */}
            <div className="fixed left-4 top-4 z-40 mt-20">
                <a href="/" className="inline-block">
                    <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-2 rounded-md bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors border border-gray-300 dark:border-zinc-600 text-gray-900 dark:text-white shadow-lg"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        返回主頁
                    </button>
                </a>
            </div>

            {/* 主要內容區 */}
            <div className="relative max-w-3xl mx-auto px-4 lg:px-8">
                <article className="relative w-full">
                    {/* 根據狀態顯示不同內容 */}
                    {isLoading ? (
                        <LoadingSkeleton />
                    ) : error ? (
                        <ErrorDisplay />
                    ) : contentReady && pageData ? (
                        <>
                            {/* 標題 & 副標題 */}
                            {/* <div className="mb-8 pt-20">
                                <h1 className="text-4xl font-bold mb-2">{pageData.homeTitle}</h1>

                                {pageData.subtitle && (
                                    <p className="italic text-lg mb-6">{pageData.subtitle}</p>
                                )}
                            </div> */}

                            {/* 處理 Markdown 內容 */}
                            <div className="prose prose-zinc dark:prose-invert max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw]}
                                    components={customRenderers}
                                >
                                    {content}
                                </ReactMarkdown>
                            </div>
                        </>
                    ) : (
                        <LoadingSkeleton />
                    )}
                </article>
            </div>
        </div>
    );
} 