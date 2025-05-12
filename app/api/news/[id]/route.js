// app/api/news/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/news/:id
export async function GET(request, { params }) {
  const record = await prisma.news.findUnique({
    where: { id: params.id },
    include: { images: true, tags: true },
  });
  if (!record)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

// PUT /api/news/:id
// body: { homeTitle, title, subtitle?, contentMD, contentHTML, coverImage?, tagNames: string[],
//         imagesToCreate: [{url,path}], imageIdsToDelete: string[] }
export async function PUT(request, { params }) {
  const {
    homeTitle,
    title,
    subtitle,
    contentMD,
    contentHTML,
    coverImage,
    tagNames = [],
    imagesToCreate = [],
    imageIdsToDelete = [],
  } = await request.json();

  const updated = await prisma.news.update({
    where: { id: params.id },
    data: {
      homeTitle,
      title,
      subtitle,
      contentMD,
      contentHTML,
      coverImage,
      // 重置 tags 再 connectOrCreate
      tags: {
        set: [],
        connectOrCreate: tagNames.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
      // 刪除舊圖 + 新增新圖
      images: {
        deleteMany: { id: { in: imageIdsToDelete } },
        create: imagesToCreate.map(({ url, path }) => ({ url, path })),
      },
    },
    include: { images: true, tags: true },
  });
  return NextResponse.json(updated);
}

// DELETE /api/news/:id
export async function DELETE(request, { params }) {
  await prisma.news.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
