// app/api/news/[id]/route.js
import { NextResponse } from "next/server";
import supabase from "@/utils/supabase";
import { prisma } from "@/lib/prisma";

// GET /api/news/:id
export async function GET(request, { params }) {
  try {
    const { id } = await Promise.resolve(params);
    console.log(`[API] Fetching news with id: ${id}`);
    console.log('Prisma 環境變數存在:', Boolean(process.env.DATABASE_URL));
    console.log('Supabase 環境變數存在:', Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL));
    
    // 先嘗試使用 Prisma
    try {
      // 測試資料庫連接
      await prisma.$queryRaw`SELECT 1`;
      console.log('資料庫連接測試成功');
      
      const record = await prisma.news.findUnique({
        where: { id },
        include: { 
          images: true, 
          tags: true,
          references: true
        },
      });
      
      if (!record) {
        console.log(`[API] News with id ${id} not found`);
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      
      // 調試信息：檢查返回的數據結構
      console.log(`[API] News record found with Prisma:`, {
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
    } catch (prismaError) {
      console.log(`[API] 使用 Prisma 獲取新聞失敗，嘗試 Supabase:`, prismaError);
    
      // 如果 Prisma 失敗，嘗試使用 Supabase
      // 獲取新聞詳情，包括相關的圖片、標籤和參考資料
      const { data: record, error } = await supabase
        .from('news')
        .select(`
          *,
          images (*),
          news_tags (tag_id, tags (name)),
          references (*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.log(`[API] Error fetching news with id ${id}:`, error);
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      
      if (!record) {
        console.log(`[API] News with id ${id} not found`);
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      
      // 轉換數據格式以符合現有前端需求
      const formattedRecord = {
        ...record,
        homeTitle: record.home_title,
        contentMD: record.content_md,
        contentHTML: record.content_html,
        coverImage: record.cover_image,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        tags: record.news_tags.map(nt => ({ name: nt.tags.name })),
      };
      
      // 調試信息：檢查返回的數據結構
      console.log(`[API] News record found with Supabase:`, {
        id: formattedRecord.id,
        homeTitle: formattedRecord.homeTitle,
        title: formattedRecord.title,
        contentKeys: Object.keys(formattedRecord),
        hasContent: !!formattedRecord.content,
        hasContentMD: !!formattedRecord.contentMD,
        hasContentHTML: !!formattedRecord.contentHTML,
        imagesCount: formattedRecord.images?.length || 0,
        tagsCount: formattedRecord.tags?.length || 0
      });
      
      return NextResponse.json(formattedRecord);
    }
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
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

    // 先嘗試使用 Prisma
    try {
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

        // 處理參考資料：先刪除所有現有的，再新增
        await tx.reference.deleteMany({
          where: { newsId: id },
        });
        
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

      console.log(`[API] News with id ${id} updated with Prisma`);
      return NextResponse.json(updated);
    } catch (prismaError) {
      console.log(`[API] 使用 Prisma 更新新聞失敗，嘗試 Supabase:`, prismaError);
      
      // 如果 Prisma 失敗，嘗試使用 Supabase
      // 1. 更新新聞基本資料
      const { error: updateError } = await supabase
        .from('news')
        .update({
          home_title: homeTitle,
          title,
          subtitle,
          content_md: contentMD,
          content_html: contentHTML,
          cover_image: coverImage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. 處理標籤：刪除原有標籤關聯，再建立新的
      // 2.1 刪除現有標籤關聯
      const { error: deleteTagsError } = await supabase
        .from('news_tags')
        .delete()
        .eq('news_id', id);

      if (deleteTagsError) throw deleteTagsError;

      // 2.2 建立新標籤關聯
      for (const tagName of tagNames.filter(name => typeof name === 'string')) {
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
            news_id: id,
            tag_id: tagId
          });

        if (linkError) throw linkError;
      }

      // 3. 處理圖片：刪除指定的圖片，並新增新的圖片
      // 3.1 刪除指定的圖片
      if (imageIdsToDelete.length > 0) {
        const { error: deleteImagesError } = await supabase
          .from('images')
          .delete()
          .in('id', imageIdsToDelete);

        if (deleteImagesError) throw deleteImagesError;
      }

      // 3.2 新增新圖片
      for (const image of imagesToCreate) {
        const { error: imageError } = await supabase
          .from('images')
          .insert({
            url: image.url,
            path: image.path,
            news_id: id
          });

        if (imageError) throw imageError;
      }

      // 4. 處理參考資料：刪除所有現有的，再新增
      // 4.1 刪除現有參考資料
      const { error: deleteRefsError } = await supabase
        .from('references')
        .delete()
        .eq('news_id', id);

      if (deleteRefsError) throw deleteRefsError;

      // 4.2 新增參考資料
      if (references && references.length > 0) {
        const { error: addRefsError } = await supabase
          .from('references')
          .insert(
            references.map(ref => ({
              ...ref,
              news_id: id
            }))
          );

        if (addRefsError) throw addRefsError;
      }

      // 5. 獲取更新後的完整記錄
      const { data: updated, error: fetchError } = await supabase
        .from('news')
        .select(`
          *,
          images (*),
          news_tags (tag_id, tags (name)),
          references (*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // 轉換資料格式以符合前端期望
      const formattedNews = {
        ...updated,
        homeTitle: updated.home_title,
        contentMD: updated.content_md,
        contentHTML: updated.content_html,
        coverImage: updated.cover_image,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
        tags: updated.news_tags.map(nt => ({ name: nt.tags.name })),
      };

      console.log(`[API] News with id ${id} updated with Supabase`);
      return NextResponse.json(formattedNews);
    }
  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/news/:id
export async function DELETE(request, { params }) {
  try {
    const { id } = await Promise.resolve(params);
    console.log(`[API] Deleting news with id: ${id}`);
    console.log('Prisma 環境變數存在:', Boolean(process.env.DATABASE_URL));
    console.log('Supabase 環境變數存在:', Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL));

    // 先嘗試使用 Prisma
    try {
      // 測試資料庫連接
      await prisma.$queryRaw`SELECT 1`;
      console.log('[API] 資料庫連接測試成功');

      // 在 Prisma 中刪除新聞（關聯將通過資料庫關係自動處理）
      await prisma.news.delete({
        where: { id },
      });

      console.log(`[API] News with id ${id} deleted successfully with Prisma`);
      return NextResponse.json({ message: '新聞已成功刪除' });
    } catch (prismaError) {
      console.log(`[API] 使用 Prisma 刪除新聞失敗，嘗試 Supabase:`, prismaError);
      
      // 如果 Prisma 失敗，嘗試使用 Supabase
      try {
        // 1. 刪除相關的標籤關聯
        const { error: tagDeleteError } = await supabase
          .from('news_tags')
          .delete()
          .eq('news_id', id);
          
        if (tagDeleteError) throw tagDeleteError;
        
        // 2. 刪除相關的圖片
        const { error: imageDeleteError } = await supabase
          .from('images')
          .delete()
          .eq('news_id', id);
          
        if (imageDeleteError) throw imageDeleteError;
        
        // 3. 刪除相關的參考資料
        const { error: refDeleteError } = await supabase
          .from('references')
          .delete()
          .eq('news_id', id);
          
        if (refDeleteError) throw refDeleteError;
        
        // 4. 最後刪除新聞本身
        const { error: newsDeleteError } = await supabase
          .from('news')
          .delete()
          .eq('id', id);
          
        if (newsDeleteError) throw newsDeleteError;
        
        console.log(`[API] News with id ${id} deleted successfully with Supabase`);
        return NextResponse.json({ message: '新聞已成功刪除' });
      } catch (supabaseError) {
        console.error('Error in Supabase deletion:', supabaseError);
        return NextResponse.json(
          { error: '刪除新聞失敗', details: supabaseError.message },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json(
      { error: '伺服器內部錯誤', details: error.message },
      { status: 500 }
    );
  }
}
