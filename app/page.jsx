// app/page.jsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TagSelector } from "@/components/TagSelector";

const newsList = [
  {
    id: "ai-vs-journalist",
    title: "AI 是否會取代新聞記者？",
    image: "/news/ai.jpg",
    tags: ["AI", "未來", "新聞"],
  },
  {
    id: "remote-media-strategy",
    title: "遠距時代的媒體策略",
    image: "/news/media.jpg",
    tags: ["媒體", "社會", "趨勢"],
  },
  {
    id: "open-data-transparency",
    title: "開放資料如何改變政府透明？",
    image: "/news/data.jpg",
    tags: ["開放資料", "政治", "透明化"],
  },
];

export default function HomePage() {
  const [selectedTags, setSelectedTags] = useState([]);

  const filteredNews = selectedTags.length
    ? newsList.filter((n) => n.tags.some((t) => selectedTags.includes(t)))
    : newsList;

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-900 px-6 ">
      {/* Hero 區塊 */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">遠望地平線</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          站在地平線的邊緣，看見世界的裂縫。
        </p>
      </section>

      {/* Tag 選擇器 */}
      <section className="mb-10 flex justify-center">
        <TagSelector onChange={setSelectedTags} />
      </section>

      {/* 卡片區 */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredNews.length > 0 ? (
          filteredNews.map((news) => (
            <Link
              key={news.id}
              href={`/news/${news.id}`}
              className="relative block aspect-square rounded-xl overflow-hidden shadow-md border-2"
            >
              <Image
                src={news.image}
                alt={news.title}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4 space-y-2">
                <div className="flex gap-2 flex-wrap text-xs">
                  {news.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="bg-white/20 px-2 py-0.5 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-bold">{news.title}</h3>
              </div>
            </Link>
          ))
        ) : (
          <p className="col-span-full text-center text-zinc-500">
            找不到符合的新聞。請嘗試選擇其他 Tag。
          </p>
        )}
      </section>
    </main>
  );
}
