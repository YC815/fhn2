// ✅ app/api/news/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const allNews = await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(allNews);
}

export async function POST(request) {
  const body = await request.json();
  const news = await prisma.news.create({
    data: {
      homeTitle: body.homeTitle,
      tags: body.tags,
      contentMD: body.contentMD,
      coverImageId: body.coverImageId,
      images: {
        connect: body.imageIds?.map((id) => ({ id })) || [],
      },
    },
  });
  return NextResponse.json(news);
}
