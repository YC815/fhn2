// app/api/news/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/news?tags=AI,新聞
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tagsParam = searchParams.get("tags");
  const filter = tagsParam
    ? {
        tags: { some: { name: { in: tagsParam.split(",") } } },
      }
    : {};

  const list = await prisma.news.findMany({
    where: filter,
    include: { images: true, tags: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(list);
}

// POST /api/news
// body: { homeTitle, title, subtitle?, contentMD, contentHTML, coverImage?, tagNames: string[], images: [{url,path}] }
export async function POST(request) {
  const {
    homeTitle,
    title,
    subtitle,
    contentMD,
    contentHTML,
    coverImage,
    tagNames = [],
    images = [],
  } = await request.json();

  const created = await prisma.news.create({
    data: {
      homeTitle,
      title,
      subtitle,
      contentMD,
      contentHTML,
      coverImage,
      tags: {
        connectOrCreate: tagNames.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
      images: {
        create: images
          .filter((img) => !img.id)
          .map(({ url, path, newsId }) => ({ url, path, newsId })),
      },
    },
    include: { images: true, tags: true },
  });
  return NextResponse.json(created, { status: 201 });
}
