// ✅ app/api/news/[id]/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  const news = await prisma.news.findUnique({
    where: { id: params.id },
    include: { images: true },
  });
  return NextResponse.json(news);
}

export async function PATCH(request, { params }) {
  const body = await request.json();
  const news = await prisma.news.update({
    where: { id: params.id },
    data: {
      homeTitle: body.homeTitle,
      tags: body.tags,
      contentMD: body.contentMD,
      coverImageId: body.coverImageId,
      images: {
        set: body.imageIds?.map((id) => ({ id })) || [],
      },
    },
  });
  return NextResponse.json(news);
}

export async function DELETE(_, { params }) {
  await prisma.news.delete({
    where: { id: params.id },
  });
  return NextResponse.json({ success: true });
}
