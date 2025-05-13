"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

export default function NewsContent({ news }) {
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
  // 調試信息：檢查 news 對象的內容
  useEffect(() => {
    console.log("[NewsContent] 接收到的新聞數據:", {
      id: news?.id,
      homeTitle: news?.homeTitle,
      title: news?.title,
      subtitle: news?.subtitle,
      contentFields: Object.keys(news || {}),
      hasContent: !!news?.content,
      contentType: typeof news?.content,
      contentLength: news?.content?.length,
      hasContentMD: !!news?.contentMD,
      hasContentHTML: !!news?.contentHTML,
      images: news?.images?.length || 0,
      tags: news?.tags?.length || 0,
    });
  }, [news]);

  const content = news.contentMD || news.contentHTML || "";

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
      <article className="relative max-w-3xl mx-auto px-4 lg:px-0">
        {/* 返回主頁按鈕 */}
        <div className="absolute left-0 top-0 ">
          <a href="/" className="inline-block">
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-2 rounded hover:bg-muted transition-colors border border-input bg-background text-foreground shadow-sm mt-2 ml-2"
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

        {/* 標題 & 副標題 */}
        <div className="mb-8 pt-20">
          <h1 className="text-4xl font-bold mb-2">{news.title}</h1>

          {news.subtitle && (
            <p className="italic text-lg mb-6">{news.subtitle}</p>
          )}

          {/* 標籤 */}
          <div className="flex flex-wrap gap-2 mt-4">
            {news.tags.map((tag) => (
              <span
                key={tag.id}
                className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full text-sm"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        </div>

        {/* 文章內容（Markdown 顯示，圖片自動置中） */}
        <div className="p-2 overflow-auto">
          <div className="prose prose-xl prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ node, ...props }) => <h1 {...props} />,
                h2: ({ node, ...props }) => <h2 {...props} />,
                h3: ({ node, ...props }) => <h3 {...props} />,
                h4: ({ node, ...props }) => <h4 {...props} />,
                h5: ({ node, ...props }) => <h5 {...props} />,
                h6: ({ node, ...props }) => <h6 {...props} />,
                img: ({ node, ...props }) => {
                  // 使用 span 替代 div，因為 div 不能是 p 的子元素
                  return (
                    <span className="block my-4">
                      <img
                        {...props}
                        className="mx-auto rounded shadow max-w-full h-auto"
                        onError={(e) => {
                          e.target.onerror = null; // 防止循環錯誤
                          e.target.src = "/placeholder.svg"; // 使用占位符圖片
                        }}
                      />
                    </span>
                  );
                },
                a: ({ href, children, ...props }) => {
                  const isExternal = href && !href.startsWith("/");
                  return (
                    <a
                      href={href}
                      {...props}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="text-blue-600 dark:text-blue-400 underline"
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
            
            {/* 參考資料區塊 */}
            {news.references && news.references.length > 0 && (
              <div className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8">
                <h3 className="text-xl font-bold mb-6">參考資料</h3>
                <div className="space-y-4">
                  {news.references.map((ref, idx) => (
                    <div key={ref.id || idx} className="flex items-start gap-2">
                      <div className="mt-0.5 w-6 flex-shrink-0 text-gray-700 dark:text-gray-300">{idx + 1}.</div>
                      <div className="flex-1">
                        {ref.url ? (
                          <a 
                            href={ref.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {ref.title || ref.url}
                          </a>
                        ) : (
                          <span>{ref.title}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
