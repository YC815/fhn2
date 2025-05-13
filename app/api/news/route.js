// app/api/news/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/news?tags=AI,新聞
export async function GET(request) {
  try {
    console.log('正在執行 GET /api/news API');
    console.log('Prisma 環境變數存在:', Boolean(process.env.DATABASE_URL));
    
    const { searchParams } = new URL(request.url);
    const tagsParam = searchParams.get("tags");
    console.log('標籤過濾參數:', tagsParam || '無');
    
    // 使用 Prisma 獲取新聞列表
    const filter = tagsParam
      ? {
          tags: { some: { name: { in: tagsParam.split(",") } } },
        }
      : {};

    // 測試資料庫連接
    await prisma.$queryRaw`SELECT 1`;
    console.log('資料庫連接測試成功');
    
    const list = await prisma.news.findMany({
      where: filter,
      include: { images: true, tags: true },
      orderBy: { createdAt: "desc" },
    });
      
    console.log(`成功使用 Prisma 獲取 ${list.length} 條新聞記錄`);
    return NextResponse.json(list);
  } catch (error) {
    // 印出完整 error 物件
    console.error('🔴 /api/news error:', error);
    return NextResponse.json(
      {
        error: '獲取新聞數據失敗',
        details: error.message,
        name: error.name,
        // 完整回傳 error 內容（僅非生產環境時回傳 stack）
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        raw: process.env.NODE_ENV !== 'production' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/news
// body: { homeTitle, title, subtitle?, contentMD, contentHTML, coverImage?, tagNames: string[], images: [{url,path}] }
export async function POST(request) {
  try {
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

    // 先嘗試使用 Prisma
    try {
      // 使用 Prisma 創建新聞
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
    } catch (prismaError) {
      console.log('使用 Prisma 創建新聞失敗，嘗試 Supabase:', prismaError.message);
      
      // 如果 Prisma 失敗，嘗試使用 Supabase
      // 1. 創建新聞文章
      const { data: newsData, error: newsError } = await supabase
        .from('news')
        .insert({
          home_title: homeTitle,
          title,
          subtitle,
          content_md: contentMD,
          content_html: contentHTML,
          cover_image: coverImage,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (newsError) throw newsError;

      // 2. 處理標籤
      for (const tagName of tagNames) {
        // 檢查標籤是否存在，不存在則創建
        const { data: existingTag, error: tagError } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .maybeSingle();

        if (tagError) throw tagError;

        let tagId;
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          // 創建新標籤
          const { data: newTag, error: createTagError } = await supabase
            .from('tags')
            .insert({ name: tagName })
            .select()
            .single();

          if (createTagError) throw createTagError;
          tagId = newTag.id;
        }

        // 關聯新聞和標籤
        const { error: linkError } = await supabase
          .from('news_tags')
          .insert({
            news_id: newsData.id,
            tag_id: tagId
          });

        if (linkError) throw linkError;
      }

      // 3. 處理圖片
      for (const image of images.filter(img => !img.id)) {
        const { error: imageError } = await supabase
          .from('images')
          .insert({
            url: image.url,
            path: image.path,
            news_id: newsData.id
          });

        if (imageError) throw imageError;
      }

      // 4. 獲取完整數據返回
      const { data: created, error: fetchError } = await supabase
        .from('news')
        .select(`
          *,
          images (*),
          news_tags (tag_id, tags (name))
        `)
        .eq('id', newsData.id)
        .single();

      if (fetchError) throw fetchError;

      // 轉換數據格式以符合現有前端需求
      const formattedNews = {
        ...created,
        homeTitle: created.home_title,
        contentMD: created.content_md,
        contentHTML: created.content_html,
        coverImage: created.cover_image,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
        tags: created.news_tags.map(nt => ({ name: nt.tags.name })),
      };

      return NextResponse.json(formattedNews, { status: 201 });
    }
  } catch (error) {
    console.error('建立新聞失敗:', error);
    return NextResponse.json(
      { error: '建立新聞失敗', details: error.message },
      { status: 500 }
    );
  }
}
