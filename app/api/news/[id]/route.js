// app/api/news/[id]/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

// GET /api/news/:id
export async function GET(request, { params }) {
  try {
    const { id } = await Promise.resolve(params);
    console.log(`[API] Fetching news with id: ${id}`);
    console.log("Prisma 環境變數存在:", Boolean(process.env.DATABASE_URL));
    console.log(
      "Supabase 環境變數存在:",
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
    );

    // 先嘗試使用 Prisma
    try {
      // 測試資料庫連接
      await prisma.$queryRaw`SELECT 1`;
      console.log("資料庫連接測試成功");

      const record = await prisma.news.findUnique({
        where: { id },
        include: {
          images: true,
          tags: true,
          references: true,
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
        tagsCount: record.tags?.length || 0,
      });

      return NextResponse.json(record);
    } catch (prismaError) {
      console.log(
        `[API] 使用 Prisma 獲取新聞失敗，嘗試 Supabase:`,
        prismaError
      );

      // 如果 Prisma 失敗，嘗試使用 Supabase
      // 獲取新聞詳情，包括相關的圖片、標籤和參考資料
      const { data: record, error } = await supabase
        .from("news")
        .select(
          `
          *,
          images (*),
          news_tags (tag_id, tags (name)),
          references (*)
        `
        )
        .eq("id", id)
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
        homeTitle: record.home_title || "",
        contentMD: record.content_md || "",
        contentHTML: record.content_html || "",
        coverImage: record.cover_image || "",
        createdAt: record.created_at || new Date().toISOString(),
        updatedAt: record.updated_at || new Date().toISOString(),
        tags: (record.news_tags || []).map((nt) => ({
          name: nt && nt.tags && nt.tags.name ? nt.tags.name : "未知標籤",
        })),
        references: record.references || [],
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
        tagsCount: formattedRecord.tags?.length || 0,
      });

      return NextResponse.json(formattedRecord);
    }
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
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
    console.log(
      `[API] 開始更新 ID 為 ${id} 的新聞 - ${new Date().toISOString()}`
    );

    // 解析請求數據
    let requestData;
    try {
      requestData = await request.json();
      console.log("=====================================================");
      console.log(`🔵 收到的請求數據摘要 (ID: ${id}):`);
      console.log("- homeTitle:", requestData.homeTitle ? "存在" : "不存在");
      console.log("- title:", requestData.title || "不存在");
      console.log("- subtitle:", requestData.subtitle || "不存在");
      console.log(
        "- contentMD 長度:",
        requestData.contentMD ? requestData.contentMD.length : 0
      );
      console.log(
        "- contentHTML 長度:",
        requestData.contentHTML ? requestData.contentHTML.length : 0
      );
      console.log("- coverImage:", requestData.coverImage ? "存在" : "不存在");
      console.log(
        "- tagNames 數量:",
        Array.isArray(requestData.tagNames) ? requestData.tagNames.length : 0
      );
      console.log(
        "- imagesToCreate 數量:",
        Array.isArray(requestData.imagesToCreate)
          ? requestData.imagesToCreate.length
          : 0
      );
      console.log(
        "- imageIdsToDelete 數量:",
        Array.isArray(requestData.imageIdsToDelete)
          ? requestData.imageIdsToDelete.length
          : 0
      );
      console.log(
        "- references 數量:",
        Array.isArray(requestData.references)
          ? requestData.references.length
          : 0
      );
      console.log("=====================================================");
    } catch (parseError) {
      console.error("❌ 解析請求體失敗:", parseError);
      return NextResponse.json(
        { error: "無效的請求格式", details: parseError.message },
        { status: 400 }
      );
    }

    // 驗證必要字段
    if (!requestData.title || !requestData.title.trim()) {
      console.error("❌ 缺少必要欄位: title");
      return NextResponse.json(
        { error: "缺少必要欄位", details: "標題不能為空" },
        { status: 400 }
      );
    }

    if (!requestData.contentMD || !requestData.contentMD.trim()) {
      console.error("❌ 缺少必要欄位: contentMD");
      return NextResponse.json(
        { error: "缺少必要欄位", details: "內容不能為空" },
        { status: 400 }
      );
    }

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
    } = requestData;

    // 確保陣列是有效的
    const safeTagNames = Array.isArray(tagNames) ? tagNames : [];
    const safeImagesToCreate = Array.isArray(imagesToCreate)
      ? imagesToCreate
      : [];
    const safeImageIdsToDelete = Array.isArray(imageIdsToDelete)
      ? imageIdsToDelete
      : [];
    const safeReferences = Array.isArray(references) ? references : [];

    // 測試 Supabase 客戶端連接
    try {
      console.log("🔄 正在測試 Supabase 連接...");
      const { data, error } = await supabase
        .from("_test")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error && !error.message.includes("does not exist")) {
        console.error("❌ Supabase 連接測試失敗:", error);
      } else {
        console.log("✅ Supabase 連接測試成功");
      }
    } catch (supabaseTestError) {
      console.error("❌ Supabase 連接測試拋出異常:", supabaseTestError);
    }

    try {
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
                connectOrCreate: safeTagNames
                  .filter(
                    (name) => typeof name === "string" && name.trim() !== ""
                  ) // 過濾掉非字符串的元素
                  .map((name) => ({
                    where: { name },
                    create: { name },
                  })),
              },
              // 刪除舊圖 + 新增新圖
              images: {
                deleteMany: {
                  id: { in: safeImageIdsToDelete.filter((id) => id) },
                },
                create: safeImagesToCreate
                  .filter((img) => img && img.url && img.path) // 確保url和path存在
                  .map((img) => ({
                    url: img.url,
                    path: img.path,
                  })),
              },
            },
            include: {
              images: true,
              tags: true,
              references: true,
            },
          });

          // 處理參考資料：先刪除所有現有的，再新增
          await tx.reference.deleteMany({
            where: { newsId: id },
          });

          if (safeReferences.length > 0) {
            // 過濾有效的參考資料
            const validReferences = safeReferences.filter(
              (ref) =>
                ref &&
                typeof ref === "object" &&
                ref.url &&
                typeof ref.url === "string"
            );

            console.log(
              `找到 ${validReferences.length} 個有效參考資料，準備新增`
            );

            await Promise.all(
              validReferences.map((ref) =>
                tx.reference.create({
                  data: {
                    url: ref.url.trim(),
                    title: ref.title ? ref.title.trim() : "",
                    news: { connect: { id } },
                  },
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
              references: true,
            },
          });
        });

        console.log(`[API] News with id ${id} updated with Prisma`);
        return NextResponse.json(updated);
      } catch (prismaError) {
        console.log(
          `[API] 使用 Prisma 更新新聞失敗，嘗試 Supabase:`,
          prismaError
        );

        // 改用 Supabase 作為備用方案
        try {
          // 1. 更新新聞基本資料
          console.log("🔍 準備使用 Supabase 更新新聞，資料摘要:");
          console.log("- ID:", id);
          console.log("- homeTitle:", homeTitle || "(空)");
          console.log("- title:", title || "(空)");
          console.log("- contentMD 長度:", contentMD ? contentMD.length : 0);
          console.log(
            "- contentHTML 長度:",
            contentHTML ? contentHTML.length : 0
          );

          const { error: updateError } = await supabase
            .from("news")
            .update({
              home_title: homeTitle || "",
              title: title || "",
              subtitle: subtitle || "",
              content_md: contentMD || "",
              content_html: contentHTML || "",
              cover_image: coverImage || "",
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);

          if (updateError) {
            console.error("❌ Supabase 更新基本資料失敗:", updateError);
            throw updateError;
          }
          console.log("✅ Supabase 更新基本資料成功");

          // 2. 處理標籤：刪除原有標籤關聯，再建立新的
          // 2.1 刪除現有標籤關聯
          const { error: deleteTagsError } = await supabase
            .from("news_tags")
            .delete()
            .eq("news_id", id);

          if (deleteTagsError) throw deleteTagsError;

          // 2.2 建立新標籤關聯
          for (const tagName of safeTagNames.filter(
            (name) => typeof name === "string" && name.trim() !== ""
          )) {
            // 檢查標籤是否存在，不存在則創建
            const { data: existingTag, error: tagError } = await supabase
              .from("tags")
              .select("id")
              .eq("name", tagName)
              .maybeSingle();

            if (tagError) throw tagError;

            let tagId;
            if (existingTag) {
              tagId = existingTag.id;
            } else {
              // 創建新標籤
              const { data: newTag, error: createTagError } = await supabase
                .from("tags")
                .insert({ name: tagName })
                .select()
                .single();

              if (createTagError) throw createTagError;
              tagId = newTag.id;
            }

            // 關聯新聞和標籤
            const { error: linkError } = await supabase
              .from("news_tags")
              .insert({
                news_id: id,
                tag_id: tagId,
              });

            if (linkError) throw linkError;
          }

          // 3. 處理圖片：刪除指定的圖片，並新增新的圖片
          // 3.1 刪除指定的圖片
          if (safeImageIdsToDelete.length > 0) {
            const validIds = safeImageIdsToDelete.filter((id) => id);
            if (validIds.length > 0) {
              const { error: deleteImagesError } = await supabase
                .from("images")
                .delete()
                .in("id", validIds);

              if (deleteImagesError) throw deleteImagesError;
            }
          }

          // 3.2 新增新圖片
          for (const image of safeImagesToCreate.filter(
            (img) => img && img.url && img.path
          )) {
            const { error: imageError } = await supabase.from("images").insert({
              url: image.url,
              path: image.path,
              news_id: id,
            });

            if (imageError) throw imageError;
          }

          // 4. 處理參考資料：刪除所有現有的，再新增
          // 4.1 刪除現有參考資料
          const { error: deleteRefsError } = await supabase
            .from("references")
            .delete()
            .eq("news_id", id);

          if (deleteRefsError) throw deleteRefsError;

          // 4.2 新增參考資料
          if (safeReferences.length > 0) {
            console.log(`🔍 處理 ${safeReferences.length} 筆參考資料...`);

            // 檢查參考資料結構有效性
            const validReferences = safeReferences.filter(
              (ref) =>
                ref &&
                typeof ref === "object" &&
                ref.url &&
                typeof ref.url === "string"
            );

            console.log(
              "參考資料預覽:",
              validReferences.map((ref) => ({
                url:
                  ref.url && ref.url.length > 30
                    ? ref.url.substring(0, 30) + "..."
                    : ref.url,
                title: ref.title || "",
              }))
            );

            if (validReferences.length !== safeReferences.length) {
              console.warn(
                `⚠️ 發現 ${
                  safeReferences.length - validReferences.length
                } 筆無效的參考資料`
              );
            }

            if (validReferences.length > 0) {
              const { error: addRefsError } = await supabase
                .from("references")
                .insert(
                  validReferences.map((ref) => ({
                    url: ref.url.trim(),
                    title: ref.title ? ref.title.trim() : "",
                    news_id: id,
                  }))
                );

              if (addRefsError) {
                console.error("❌ 新增參考資料失敗:", addRefsError);
                throw addRefsError;
              }
              console.log("✅ 成功新增參考資料");
            } else {
              console.log("ℹ️ 無有效參考資料需處理");
            }
          } else {
            console.log("ℹ️ 無參考資料需處理");
          }

          // 5. 獲取更新後的完整記錄
          console.log("🔍 獲取更新後的完整記錄...");
          const { data: updated, error: fetchError } = await supabase
            .from("news")
            .select(
              `
              *,
              images (*),
              news_tags (tag_id, tags (name)),
              references (*)
            `
            )
            .eq("id", id)
            .single();

          if (fetchError) {
            console.error("❌ 獲取更新後的完整記錄失敗:", fetchError);
            throw fetchError;
          }

          console.log("✅ 獲取更新後的完整記錄成功");
          console.log("🔍 檢查返回數據結構:");
          console.log("- updated 存在:", Boolean(updated));
          console.log("- updated.home_title:", updated?.home_title || "(空)");
          console.log(
            "- updated.content_md 長度:",
            updated?.content_md ? updated.content_md.length : 0
          );
          console.log(
            "- updated.content_html 長度:",
            updated?.content_html ? updated.content_html.length : 0
          );
          console.log(
            "- updated.news_tags 數量:",
            updated?.news_tags?.length || 0
          );
          console.log("- updated.images 數量:", updated?.images?.length || 0);

          // 轉換資料格式以符合前端期望
          try {
            const formattedNews = {
              ...updated,
              homeTitle: updated.home_title || "",
              contentMD: updated.content_md || "",
              contentHTML: updated.content_html || "",
              coverImage: updated.cover_image || "",
              createdAt: updated.created_at || new Date().toISOString(),
              updatedAt: updated.updated_at || new Date().toISOString(),
              tags: (updated?.news_tags || []).map((nt) => {
                if (!nt || !nt.tags) {
                  console.error("❌ 發現無效的 news_tag 項目:", nt);
                  return { name: "未知標籤" };
                }
                return { name: nt.tags.name || "未知標籤" };
              }),
              references: updated?.references || [],
              images: updated?.images || [],
            };

            console.log("✅ 成功格式化數據回傳");
            console.log(`[API] News with id ${id} updated with Supabase`);
            return NextResponse.json(formattedNews);
          } catch (formatError) {
            console.error("❌ 格式化返回數據時出錯:", formatError);
            console.error("原始數據:", updated);
            throw new Error(`格式化數據失敗: ${formatError.message}`);
          }
        } catch (supabaseError) {
          // 處理 Supabase 錯誤
          console.error(
            "====================================================="
          );
          console.error(
            `🔴 PUT /api/news/${id} 更新失敗 (Supabase) (${new Date().toISOString()}):`
          );
          console.error("錯誤類型:", supabaseError.name);
          console.error("錯誤消息:", supabaseError.message);
          console.error("錯誤代碼:", supabaseError.code || "無");
          console.error("錯誤詳情:", supabaseError.details || "無");
          console.error(
            "====================================================="
          );

          // 拋出更明確的錯誤
          throw new Error(`更新失敗: ${supabaseError.message || "未知錯誤"}`);
        }
      }
    } catch (error) {
      // 最終錯誤處理
      console.error("=====================================================");
      console.error(
        `🔴 PUT /api/news/${id} 總體錯誤 (${new Date().toISOString()}):`
      );
      console.error("錯誤類型:", error.name);
      console.error("錯誤消息:", error.message);
      console.error("錯誤堆棧:", error.stack);
      console.error("=====================================================");

      // 嘗試提供更清晰的錯誤消息給客戶端
      let clientErrorMessage = "更新新聞失敗";
      let errorDetails = error.message;

      // 根據錯誤類型提供更具體的錯誤消息
      if (error.message.includes("內容過大")) {
        clientErrorMessage = "內容過大，無法儲存";
        errorDetails = "請縮減文章長度或分割為多個記錄";
      } else if (error.message.includes("數據結構")) {
        clientErrorMessage = "資料格式錯誤";
        errorDetails = "請檢查輸入的資料格式是否正確";
      } else if (error.message.includes("權限")) {
        clientErrorMessage = "權限不足";
        errorDetails = "您沒有權限執行此操作";
      } else if (error.message.includes("連接")) {
        clientErrorMessage = "伺服器連接問題";
        errorDetails = "請稍後再試";
      }

      return NextResponse.json(
        { error: clientErrorMessage, details: errorDetails },
        { status: 500 }
      );
    }
  } catch (outerError) {
    // 未預期的錯誤處理
    console.error("=====================================================");
    console.error(
      `🔴 PUT /api/news/${params.id} 未預期錯誤 (${new Date().toISOString()}):`
    );
    console.error("錯誤類型:", outerError.name);
    console.error("錯誤消息:", outerError.message);
    console.error("錯誤堆棧:", outerError.stack);
    console.error("=====================================================");

    return NextResponse.json(
      {
        error: "伺服器內部錯誤",
        details: "發生未預期的錯誤，請聯絡系統管理員",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/news/:id
export async function DELETE(request, { params }) {
  try {
    const { id } = await Promise.resolve(params);
    console.log(`[API] Deleting news with id: ${id}`);
    console.log("Prisma 環境變數存在:", Boolean(process.env.DATABASE_URL));
    console.log(
      "Supabase 環境變數存在:",
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
    );

    // 驗證ID的有效性
    if (!id) {
      console.error("❌ 缺少有效的新聞ID");
      return NextResponse.json({ error: "缺少有效的新聞ID" }, { status: 400 });
    }

    // 先嘗試使用 Prisma
    try {
      // 測試資料庫連接
      await prisma.$queryRaw`SELECT 1`;
      console.log("[API] 資料庫連接測試成功");

      // 確認新聞存在
      const existingNews = await prisma.news.findUnique({
        where: { id },
      });

      if (!existingNews) {
        console.log(`[API] 新聞 ID ${id} 不存在，無法刪除`);
        return NextResponse.json(
          { error: "找不到指定新聞", details: "指定的新聞不存在或已被刪除" },
          { status: 404 }
        );
      }

      // 在 Prisma 中刪除新聞（關聯將通過資料庫關係自動處理）
      await prisma.news.delete({
        where: { id },
      });

      console.log(`[API] News with id ${id} deleted successfully with Prisma`);
      return NextResponse.json({ message: "新聞已成功刪除" });
    } catch (prismaError) {
      console.log(
        `[API] 使用 Prisma 刪除新聞失敗，嘗試 Supabase:`,
        prismaError
      );

      // 如果 Prisma 失敗，嘗試使用 Supabase
      try {
        // 先檢查新聞是否存在
        const { data: existingNews, error: checkError } = await supabase
          .from("news")
          .select("id")
          .eq("id", id)
          .maybeSingle();

        if (checkError) {
          console.error("❌ 檢查新聞存在性失敗:", checkError);
          throw checkError;
        }

        if (!existingNews) {
          console.log(`[API] 新聞 ID ${id} 不存在，無法刪除`);
          return NextResponse.json(
            { error: "找不到指定新聞", details: "指定的新聞不存在或已被刪除" },
            { status: 404 }
          );
        }

        // 1. 刪除相關的標籤關聯
        console.log("🔄 刪除標籤關聯...");
        const { error: tagDeleteError } = await supabase
          .from("news_tags")
          .delete()
          .eq("news_id", id);

        if (tagDeleteError && !tagDeleteError.message.includes("no rows")) {
          console.error("❌ 刪除標籤關聯失敗:", tagDeleteError);
          throw tagDeleteError;
        }

        // 2. 刪除相關的圖片
        console.log("🔄 刪除相關圖片...");
        const { error: imageDeleteError } = await supabase
          .from("images")
          .delete()
          .eq("news_id", id);

        if (imageDeleteError && !imageDeleteError.message.includes("no rows")) {
          console.error("❌ 刪除相關圖片失敗:", imageDeleteError);
          throw imageDeleteError;
        }

        // 3. 刪除相關的參考資料
        console.log("🔄 刪除參考資料...");
        const { error: refDeleteError } = await supabase
          .from("references")
          .delete()
          .eq("news_id", id);

        if (refDeleteError && !refDeleteError.message.includes("no rows")) {
          console.error("❌ 刪除參考資料失敗:", refDeleteError);
          throw refDeleteError;
        }

        // 4. 最後刪除新聞本身
        console.log("🔄 刪除新聞本體...");
        const { error: newsDeleteError } = await supabase
          .from("news")
          .delete()
          .eq("id", id);

        if (newsDeleteError) {
          console.error("❌ 刪除新聞失敗:", newsDeleteError);
          throw newsDeleteError;
        }

        console.log(
          `[API] News with id ${id} deleted successfully with Supabase`
        );
        return NextResponse.json({ message: "新聞已成功刪除" });
      } catch (supabaseError) {
        console.error("Error in Supabase deletion:", supabaseError);
        return NextResponse.json(
          {
            error: "刪除新聞失敗",
            details: supabaseError.message || "無法刪除新聞，請稍後再試",
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("=====================================================");
    console.error(
      `🔴 DELETE /api/news/${params.id} 錯誤 (${new Date().toISOString()}):`
    );
    console.error("錯誤類型:", error.name);
    console.error("錯誤消息:", error.message);
    console.error("錯誤堆棧:", error.stack);
    console.error("=====================================================");

    return NextResponse.json(
      {
        error: "伺服器內部錯誤",
        details: "刪除新聞時發生錯誤，請稍後再試或聯絡系統管理員",
      },
      { status: 500 }
    );
  }
}
