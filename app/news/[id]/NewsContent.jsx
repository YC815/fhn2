"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

export default function NewsContent({ news }) {
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
      <article className="relative max-w-4xl mx-auto px-4">
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
          <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
            <style jsx global>{`
              .prose h1 {
                font-size: 2.5rem;
                line-height: 1.2;
                margin-top: 1.5em;
                margin-bottom: 0.8em;
              }
              .prose h2 {
                font-size: 2rem;
                line-height: 1.25;
                margin-top: 1.3em;
                margin-bottom: 0.7em;
              }
              .prose h3 {
                font-size: 1.75rem;
                line-height: 1.3;
                margin-top: 1.2em;
                margin-bottom: 0.6em;
              }
              .prose h4 {
                font-size: 1.5rem;
                line-height: 1.35;
                margin-top: 1.1em;
                margin-bottom: 0.5em;
              }
              .prose h5 {
                font-size: 1.25rem;
                line-height: 1.4;
                margin-top: 1em;
                margin-bottom: 0.4em;
              }
              .prose h6 {
                font-size: 1rem;
                line-height: 1.5;
                margin-top: 0.9em;
                margin-bottom: 0.3em;
              }
              .prose hr {
                margin-top: 2em;
                margin-bottom: 2em;
              }
            `}</style>
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
          </div>
        </div>
      </article>
    </div>
  );
}
