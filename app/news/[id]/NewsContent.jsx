"use client";
import React from "react";
import MarkdownContent from "./MarkdownContent";
import Image from "next/image";

export default function NewsContent({ news }) {
  return (
    <article className="relative prose prose-lg mx-auto py-20 px-4 dark:prose-invert ">
      {/* 返回主頁按鈕 */}
      <div className="absolute left-0 top-0">
        <a href="/" className="inline-block">
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-2 rounded hover:bg-muted transition-colors border border-input bg-background text-foreground shadow-sm mt-2 ml-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            返回主頁
          </button>
        </a>
      </div>
      {/* 標題 & 副標題 */}
      <h1 className="text-4xl font-bold mb-2">{news.homeTitle}</h1>
      <h2 className="text-2xl text-zinc-600 dark:text-zinc-400 mb-6">
        {news.title}
      </h2>
      {news.subtitle && <p className="italic text-lg mb-6">{news.subtitle}</p>}

      {/* 標籤 */}
      <div className="flex flex-wrap gap-2 mb-8">
        {news.tags.map((tag) => (
          <span
            key={tag.id}
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full text-sm"
          >
            #{tag.name}
          </span>
        ))}
      </div>

      {/* 文章內容（Markdown 顯示，圖片自動置中） */}
      <MarkdownContent content={news.content} />

      {/* 圖片列表 */}
      {news.images.length > 0 && (
        <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.images.map((img) => (
            <Image
              key={img.id}
              src={img.url}
              alt={news.title}
              width={400}
              height={300}
              className="rounded-lg object-cover"
            />
          ))}
        </section>
      )}
    </article>
  );
}
