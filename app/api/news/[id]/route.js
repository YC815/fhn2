// app/api/news/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/news/:id
export async function GET(request, { params }) {
  try {
    const { id } = await Promise.resolve(params);
    console.log(`[API] Fetching news with id: ${id}`);
    
    const record = await prisma.news.findUnique({
      where: { id },
      include: { 
        images: true, 
        tags: true,
        references: true // 包含參考資料
      },
    });
    
    if (!record) {
      console.log(`[API] News with id ${id} not found`);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    
    // 調試信息：檢查返回的數據結構
    console.log(`[API] News record found:`, {
      id: record.id,
      homeTitle: record.homeTitle,
      title: record.title,
      contentKeys: Object.keys(record),
      hasContent: !!record.content,
      hasContentMD: !!record.contentMD,
      hasContentHTML: !!record.contentHTML,
      imagesCount: record.images?.length || 0,
      tagsCount: record.tags?.length || 0
    });
    
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT /api/news/:id
// body: { homeTitle, title, subtitle?, contentMD, contentHTML, coverImage?, tagNames: string[],
//         imagesToCreate: [{url,path}], imageIdsToDelete: string[] }
export async function PUT(request, { params }) {
  try {
    const { id } = await Promise.resolve(params);
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
      references = [],
    } = await request.json();

    // 開始事務
    const updated = await prisma.$transaction(async (tx) => {
      // 先更新新聞基本資料
      const updatedNews = await tx.news.update({
        where: { id },
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
            connectOrCreate: tagNames
              .filter((name) => typeof name === 'string') // 過濾掉非字符串的元素
              .map((name) => ({
                where: { name },
                create: { name },
              })),
          },
          // 刪除舊圖 + 新增新圖
          images: {
            deleteMany: { id: { in: imageIdsToDelete } },
            create: imagesToCreate.map((img) => ({
              url: img.url,
              path: img.path,
            })),
          },
        },
        include: { 
          images: true, 
          tags: true,
          references: true 
        },
      });

      // 處理參考資料
      // 1. 刪除所有現有的參考資料
      await tx.reference.deleteMany({
        where: { newsId: id }
      });

      // 2. 創建新的參考資料
      if (references && references.length > 0) {
        await Promise.all(
          references.map(ref => 
            tx.reference.create({
              data: {
                url: ref.url,
                title: ref.title || '',
                news: { connect: { id } }
              }
            })
          )
        );
      }

      // 返回更新後的新聞數據，包含新的參考資料
      return tx.news.findUnique({
        where: { id },
        include: { 
          images: true, 
          tags: true,
          references: true 
        },
      });
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/news/:id
export async function DELETE(request, { params }) {
  try {
    const { id } = await Promise.resolve(params);
    await prisma.news.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
