// app/news/[id]/page.jsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import NewsContent from "./NewsContent";

export default async function NewsPage({ params }) {
  const { id } = await Promise.resolve(params);
  // await headers() 新寫法
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const url = `${protocol}://${host}/api/news/${id}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return notFound();
  const news = await res.json();

  return (
    <article className="prose prose-lg mx-auto py-12 px-4 dark:prose-invert">
      {/* 封面圖片 */}
      {news.coverImage && (
        <div className="mb-8">
          <Image
            src={news.coverImage}
            alt={news.title}
            width={1200}
            height={600}
            className="rounded-lg object-cover"
          />
        </div>
      )}

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

      {/* 文章內容（已安全轉譯成 HTML） */}
      <div
        className="prose prose-zinc dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: news.contentHTML }}
      />

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
