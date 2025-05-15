// app/api/news/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
// 降版本操作
// GET /api/news?tags=AI,新聞
export async function GET(request) {
  try {
    console.log("=====================================================");
    console.log(`🟢 開始執行 GET /api/news API - ${new Date().toISOString()}`);
    console.log("環境變數檢查:");
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    console.log("- DATABASE_URL 存在:", Boolean(process.env.DATABASE_URL));
    console.log(
      "- DATABASE_URL 長度:",
      process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
    );
    console.log(
      "- SUPABASE_URL 存在:",
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
    );

    const { searchParams } = new URL(request.url);
    const tagsParam = searchParams.get("tags");
    console.log("標籤過濾參數:", tagsParam || "無");

    // 設置一個變數來保存最終返回結果
    let finalResult = [];

    try {
      // 使用 Prisma 獲取新聞列表
      const filter = tagsParam
        ? {
            tags: { some: { name: { in: tagsParam.split(",") } } },
          }
        : {};

      console.log("🔄 正在測試資料庫連接...");
      try {
        // 測試資料庫連接
        await prisma.$queryRaw`SELECT 1`;
        console.log("✅ 資料庫連接測試成功");
      } catch (connError) {
        console.error("❌ 資料庫連接測試失敗:", connError.message);
        console.error(
          "詳細錯誤:",
          JSON.stringify({
            name: connError.name,
            code: connError.code,
            clientVersion: connError.clientVersion,
            meta: connError.meta,
          })
        );
        throw connError; // 重新拋出錯誤以使用 Supabase 備用方案
      }

      console.log("🔄 正在查詢新聞數據...");
      console.time("新聞查詢耗時");

      const list = await prisma.news.findMany({
        where: filter,
        include: { images: true, tags: true },
        orderBy: { createdAt: "desc" },
      });

      console.timeEnd("新聞查詢耗時");
      console.log(`✅ 成功使用 Prisma 獲取 ${list.length} 條新聞記錄`);

      // 確保 list 是一個數組
      finalResult = Array.isArray(list) ? list : [];
    } catch (prismaError) {
      console.error(
        "❌ Prisma 查詢失敗，嘗試使用 Supabase 備用方案:",
        prismaError
      );

      try {
        // 使用 Supabase 作為備用方案
        console.log("🔄 使用 Supabase 備用方案查詢新聞...");

        let query = supabase
          .from("news")
          .select(
            `
            *,
            images (*),
            news_tags (tag_id, tags (name))
          `
          )
          .order("created_at", { ascending: false });

        // 如果有標籤過濾
        if (tagsParam) {
          // 注意：這裡的實現可能與 Prisma 的不同，可能需要單獨查詢標籤
          console.log(
            `⚠️ 在 Supabase 備用方案中暫時忽略標籤過濾: ${tagsParam}`
          );
        }

        const { data, error } = await query;

        if (error) {
          console.error("❌ Supabase 查詢失敗:", error);
          throw error;
        }

        // 轉換數據格式以符合前端期望
        const formattedList = data.map((item) => ({
          id: item.id,
          homeTitle: item.home_title || "",
          title: item.title || "",
          subtitle: item.subtitle || "",
          contentMD: item.content_md || "",
          contentHTML: item.content_html || "",
          coverImage: item.cover_image || "",
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString(),
          images: item.images || [],
          tags: (item.news_tags || []).map((nt) => ({
            name: nt && nt.tags && nt.tags.name ? nt.tags.name : "未知標籤",
          })),
        }));

        console.log(
          `✅ 成功使用 Supabase 獲取 ${formattedList.length} 條新聞記錄`
        );

        // 更新最終結果
        finalResult = Array.isArray(formattedList) ? formattedList : [];
      } catch (supabaseError) {
        console.error("❌ Supabase 查詢也失敗:", supabaseError);
        console.log("返回空數組作為最後的解決方案");
        // 保持 finalResult 為空數組
      }
    }

    console.log(
      `🟢 GET /api/news API 完成 - 返回 ${finalResult.length} 條記錄`
    );
    console.log("=====================================================");
    return NextResponse.json(finalResult);
  } catch (error) {
    // 印出完整 error 物件
    console.error("=====================================================");
    console.error(`🔴 /api/news 錯誤 (${new Date().toISOString()}):`);
    console.error("錯誤類型:", error.name);
    console.error("錯誤消息:", error.message);
    console.error("錯誤代碼:", error.code);

    // 檢查是否為連接錯誤
    if (
      error.message &&
      error.message.includes("Can't reach database server")
    ) {
      console.error("⚠️ 數據庫連接失敗 - 可能的原因:");
      console.error("1. 數據庫服務器可能暫時離線");
      console.error("2. 網絡連接問題");
      console.error("3. 數據庫憑證可能已過期");
      console.error("4. 防火牆設置可能阻止了連接");
    }

    // 檢查是否為權限錯誤
    if (error.message && error.message.includes("permission denied")) {
      console.error("⚠️ 數據庫權限錯誤 - 可能的原因:");
      console.error("1. 數據庫用戶權限不足");
      console.error("2. 環境變數中的數據庫用戶憑證可能不正確");
    }

    // 嘗試提取更多錯誤信息
    try {
      console.error(
        "詳細錯誤信息:",
        JSON.stringify({
          clientVersion: error.clientVersion,
          meta: error.meta,
          errorCode: error.errorCode,
          retryable: error.retryable,
        })
      );
    } catch (jsonError) {
      console.error("無法序列化錯誤對象");
    }

    console.error("堆棧跟踪:", error.stack);
    console.error("=====================================================");

    // 即使出錯，也返回空數組，避免前端出錯
    return NextResponse.json([]);
  }
}

// POST /api/news
// body: { homeTitle, title, subtitle?, contentMD, contentHTML, coverImage?, tagNames: string[], images: [{url,path}] }
export async function POST(request) {
  try {
    console.log(`🟢 開始執行 POST /api/news API - ${new Date().toISOString()}`);

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error("❌ 解析請求體失敗:", parseError);
      return NextResponse.json(
        { error: "無效的請求格式", details: parseError.message },
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
      images = [],
      references = [],
    } = requestBody;

    // 基本驗證
    if (!title || !title.trim()) {
      console.error("❌ 缺少必要欄位: title");
      return NextResponse.json(
        { error: "缺少必要欄位", details: "標題不能為空" },
        { status: 400 }
      );
    }

    if (!contentMD || !contentMD.trim()) {
      console.error("❌ 缺少必要欄位: contentMD");
      return NextResponse.json(
        { error: "缺少必要欄位", details: "內容不能為空" },
        { status: 400 }
      );
    }

    console.log("接收到的數據:", {
      homeTitle,
      title,
      subtitle: subtitle || "(無)",
      contentLength: contentMD ? contentMD.length : 0,
      coverImage: coverImage ? "有圖片" : "(無)",
      tagNames,
      imageCount: images.length,
      referencesCount: references.length,
    });

    // 先嘗試檢查數據庫連接
    try {
      console.log("🔍 測試數據庫連接...");
      await prisma.$queryRaw`SELECT 1`;
      console.log("✅ 數據庫連接測試成功");
    } catch (connError) {
      console.error("❌ 數據庫連接測試失敗:", connError);
      console.error("錯誤詳情:", {
        name: connError.name,
        message: connError.message,
        code: connError.code,
        clientVersion: connError.clientVersion,
        meta: connError.meta,
      });
      // 不立即拋出錯誤，繼續嘗試創建
    }

    // 先嘗試使用 Prisma
    try {
      console.log("🔄 嘗試使用 Prisma 創建新聞...");
      console.time("Prisma創建耗時");

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
          references: {
            create: references.filter(
              (ref) => ref.url && ref.url.trim() !== ""
            ),
          },
        },
        include: { images: true, tags: true, references: true },
      });

      console.timeEnd("Prisma創建耗時");
      console.log(`✅ 使用 Prisma 成功創建新聞，ID: ${created.id}`);
      console.log("=====================================================");

      return NextResponse.json(created, { status: 201 });
    } catch (prismaError) {
      console.error("❌ 使用 Prisma 創建新聞失敗:");
      console.error("錯誤類型:", prismaError.name);
      console.error("錯誤消息:", prismaError.message);
      console.error("錯誤代碼:", prismaError.code);
      console.error("錯誤堆疊:", prismaError.stack);

      // 檢查是否為資料庫連接錯誤
      if (
        prismaError.code === "P1001" ||
        prismaError.message.includes("connect")
      ) {
        console.error("⚠️ 資料庫連接錯誤，請檢查 DATABASE_URL 環境變數");
      }

      // 檢查是否為模型定義錯誤
      if (prismaError.code === "P2002") {
        console.error("⚠️ 違反唯一約束，可能是嘗試創建重複的記錄");
      }

      try {
        console.error(
          "詳細錯誤信息:",
          JSON.stringify(
            {
              clientVersion: prismaError.clientVersion,
              meta: prismaError.meta,
              errorCode: prismaError.errorCode,
            },
            null,
            2
          )
        );
      } catch (jsonError) {
        console.error("無法序列化 Prisma 錯誤對象");
      }

      if (!supabase) {
        console.error("⚠️ Supabase 客戶端未定義，無法進行故障轉移");
        throw prismaError;
      }

      console.log("🔄 嘗試使用 Supabase 作為備用方案...");
      console.time("Supabase創建耗時");

      try {
        // 1. 創建新聞文章
        console.log("🔄 創建新聞基本信息...");
        const { data: newsData, error: newsError } = await supabase
          .from("news")
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

        if (newsError) {
          console.error("❌ Supabase 創建新聞失敗:", newsError);
          console.error("詳細錯誤:", JSON.stringify(newsError, null, 2));
          throw newsError;
        }

        console.log(`✅ 成功創建新聞基本信息，ID: ${newsData.id}`);

        // 2. 處理標籤
        console.log("🔄 處理關聯標籤...");
        for (const tagName of tagNames) {
          console.log(`🔄 處理標籤: ${tagName}`);
          // 檢查標籤是否存在，不存在則創建
          const { data: existingTag, error: tagError } = await supabase
            .from("tags")
            .select("id")
            .eq("name", tagName)
            .maybeSingle();

          if (tagError) {
            console.error(`❌ 檢查標籤 "${tagName}" 失敗:`, tagError);
            throw tagError;
          }

          let tagId;
          if (existingTag) {
            console.log(`ℹ️ 標籤 "${tagName}" 已存在，ID: ${existingTag.id}`);
            tagId = existingTag.id;
          } else {
            console.log(`🔄 創建新標籤 "${tagName}"...`);
            // 創建新標籤
            const { data: newTag, error: createTagError } = await supabase
              .from("tags")
              .insert({ name: tagName })
              .select()
              .single();

            if (createTagError) {
              console.error(`❌ 創建標籤 "${tagName}" 失敗:`, createTagError);
              throw createTagError;
            }
            console.log(`✅ 成功創建標籤 "${tagName}"，ID: ${newTag.id}`);
            tagId = newTag.id;
          }

          // 關聯新聞和標籤
          console.log(`🔄 關聯新聞 ${newsData.id} 和標籤 ${tagId}...`);
          const { error: linkError } = await supabase.from("news_tags").insert({
            news_id: newsData.id,
            tag_id: tagId,
          });

          if (linkError) {
            console.error(`❌ 關聯新聞和標籤失敗:`, linkError);
            throw linkError;
          }
          console.log(`✅ 成功關聯新聞和標籤`);
        }

        // 3. 處理圖片
        if (images.length > 0) {
          console.log(`🔄 處理 ${images.length} 張圖片...`);
          for (const image of images.filter((img) => !img.id)) {
            console.log(`🔄 處理圖片 ${image.url}...`);
            const { error: imageError } = await supabase.from("images").insert({
              url: image.url,
              path: image.path,
              news_id: newsData.id,
            });

            if (imageError) {
              console.error("❌ 儲存圖片失敗:", imageError);
              throw imageError;
            }
            console.log(`✅ 成功儲存圖片`);
          }
        } else {
          console.log("ℹ️ 無圖片需處理");
        }

        // 3.5 處理參考資料 references
        if (references && references.length > 0) {
          console.log(`🔄 處理 ${references.length} 筆參考資料...`);

          const filteredReferences = references.filter(
            (ref) => ref.url && ref.url.trim() !== ""
          );

          if (filteredReferences.length > 0) {
            for (const reference of filteredReferences) {
              console.log(`🔄 處理參考資料 ${reference.url}...`);
              const { error: refError } = await supabase
                .from("references")
                .insert({
                  url: reference.url.trim(),
                  title: (reference.title || "").trim(),
                  news_id: newsData.id,
                  created_at: new Date().toISOString(),
                });

              if (refError) {
                console.error("❌ 儲存參考資料失敗:", refError);
                throw refError;
              }
              console.log(`✅ 成功儲存參考資料`);
            }
          } else {
            console.log("ℹ️ 參考資料均為空，跳過處理");
          }
        } else {
          console.log("ℹ️ 無參考資料需處理");
        }

        // 4. 獲取完整數據返回
        console.log("🔄 獲取最終完整數據...");
        const { data: created, error: fetchError } = await supabase
          .from("news")
          .select(
            `
            *,
            images (*),
            news_tags (tag_id, tags (name)),
            references (*)
          `
          )
          .eq("id", newsData.id)
          .single();

        if (fetchError) {
          console.error("❌ 獲取完整數據失敗:", fetchError);
          throw fetchError;
        }

        // 轉換數據格式以符合現有前端需求
        const formattedNews = {
          ...created,
          homeTitle: created.home_title,
          contentMD: created.content_md,
          contentHTML: created.content_html,
          coverImage: created.cover_image,
          createdAt: created.created_at,
          updatedAt: created.updated_at,
          tags: created.news_tags.map((nt) => ({ name: nt.tags.name })),
          references: created.references || [],
        };

        console.timeEnd("Supabase創建耗時");
        console.log(`✅ 使用 Supabase 成功創建新聞`);
        console.log("=====================================================");

        return NextResponse.json(formattedNews, { status: 201 });
      } catch (supabaseError) {
        console.error("❌ Supabase 備用方案失敗:", supabaseError);
        console.error(
          "詳細錯誤:",
          JSON.stringify(
            {
              message: supabaseError.message,
              code: supabaseError.code,
              details: supabaseError.details,
            },
            null,
            2
          )
        );
        throw new Error(
          "無法使用 Prisma 或 Supabase 創建新聞: " +
            (supabaseError.message || prismaError.message)
        );
      }
    }
  } catch (error) {
    console.error("=====================================================");
    console.error(`🔴 POST /api/news 整體錯誤 (${new Date().toISOString()}):`);
    console.error("錯誤類型:", error.name);
    console.error("錯誤消息:", error.message);
    console.error("堆棧跟踪:", error.stack);
    console.error("=====================================================");

    return NextResponse.json(
      { error: "建立新聞失敗", details: error.message },
      { status: 500 }
    );
  }
}
