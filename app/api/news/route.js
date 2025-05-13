// app/api/news/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/news?tags=AI,新聞
export async function GET(request) {
  try {
    console.log('正在執行 GET /api/news API');
    console.log('資料庫環境變數存在:', Boolean(process.env.DATABASE_URL));
    
    const { searchParams } = new URL(request.url);
    const tagsParam = searchParams.get("tags");
    console.log('標籤過濾參數:', tagsParam || '無');
    
    const filter = tagsParam
      ? {
          tags: { some: { name: { in: tagsParam.split(",") } } },
        }
      : {};

    // 測試資料庫連接
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('資料庫連接測試成功');
    } catch (dbTestError) {
      console.error('資料庫連接測試失敗:', dbTestError);
      return NextResponse.json(
        { error: '資料庫連接失敗', details: dbTestError.message },
        { status: 500 }
      );
    }

    const list = await prisma.news.findMany({
      where: filter,
      include: { images: true, tags: true },
      orderBy: { createdAt: "desc" },
    });
    
    console.log(`成功獲取 ${list.length} 條新聞記錄`);
    return NextResponse.json(list);
  } catch (error) {
    console.error('獲取新聞數據時出錯:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        error: '獲取新聞數據失敗', 
        details: error.message,
        // 僅在非生產環境顯示詳細堆疊
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
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
