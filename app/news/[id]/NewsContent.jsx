"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

export default function NewsContent({ news }) {
  const [isLoading, setIsLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);

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

  // 模擬內容載入
  useEffect(() => {
    if (news) {
      // 延遲一點點顯示內容，確保轉場感覺平滑
      const timer = setTimeout(() => {
        setIsLoading(false);
        setContentReady(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [news]);

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
      titleDisplay: "使用 homeTitle 以與主頁保持一致"
    });
  }, [news]);

  const content = news.contentMD || news.contentHTML || "";

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

        {/* 標籤骨架 */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-6 w-16 bg-gray-200 dark:bg-zinc-700 rounded-full"></div>
          ))}
        </div>
      </div>

      {/* 內容骨架 */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-11/12"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-10/12"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-9/12"></div>

        {/* 圖片骨架 */}
        <div className="h-52 bg-gray-200 dark:bg-zinc-700 rounded-md w-full my-8"></div>

        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-11/12"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-md w-10/12"></div>
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
      <article className="relative max-w-3xl mx-auto px-4 lg:px-0">
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

        {/* 根據加載狀態顯示骨架屏或內容 */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* 標題 & 副標題 */}
            <div className="mb-8 pt-20">
              <h1 className="text-4xl font-bold mb-2">{news.homeTitle}</h1>

              {news.subtitle && (
                <p className="italic text-lg mb-6">{news.subtitle}</p>
              )}

              {/* 發佈時間和更新時間 */}
              <div className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                <div>
                  <span className="font-semibold">發佈時間：</span>
                  {new Date(news.createdAt).toLocaleString('zh-TW', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
                {news.updatedAt && news.updatedAt !== news.createdAt && (
                  <div>
                    <span className="font-semibold">更新時間：</span>
                    {new Date(news.updatedAt).toLocaleString('zh-TW', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                )}
              </div>

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

            {/* 封面圖片 - 使用懶加載 */}
            {/* {news.coverImage && (
              <div className="my-8 rounded-xl overflow-hidden shadow-md">
                <Image
                  src={news.coverImage}
                  alt={news.homeTitle}
                  width={1200}
                  height={600}
                  className="w-full h-auto rounded-xl object-cover"
                  priority={true} // 封面圖片優先載入
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                />
              </div>
            )} */}

            {/* 處理 Markdown 或 HTML 內容 */}
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              {news.contentMD ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={customRenderers}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: content }} />
              )}
            </div>

            {/* 圖片列表 - 加入懶加載 */}
            {/* {news.images && news.images.length > 0 && (
              <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.images.map((img, index) => (
                  <div key={img.id || index} className="relative overflow-hidden rounded-lg shadow-md aspect-[4/3]">
                    <Image
                      src={img.url}
                      alt={`${news.title} - 圖片 ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                    />
                  </div>
                ))}
              </section>
            )} */}

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
          </>
        )}
      </article>
    </div>
  );
}
