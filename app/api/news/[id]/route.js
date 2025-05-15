// app/api/news/[id]/route.js
import { NextResponse } from "next/server";
import { prisma, testConnection } from "@/lib/prisma";

// 為單一新聞添加快取機制
const CACHE_TTL = 60 * 1000; // 1分鐘快取
const newsDetailCache = new Map();

// 從快取中獲取
function getFromCache(id) {
  if (!newsDetailCache.has(id)) return null;

  const { data, timestamp } = newsDetailCache.get(id);
  const now = Date.now();

  // 檢查快取是否過期
  if (now - timestamp < CACHE_TTL) {
    console.log(`[API] 從快取獲取新聞 ID: ${id}`);
    return data;
  }

  // 清除過期的快取
  newsDetailCache.delete(id);
  return null;
}

// 設置快取
function setCache(id, data) {
  newsDetailCache.set(id, {
    data,
    timestamp: Date.now(),
  });
  console.log(`[API] 設置快取，新聞 ID: ${id}`);
}

// 清空特定ID的快取
function clearCache(id) {
  if (id) {
    newsDetailCache.delete(id);
    console.log(`[API] 清除新聞快取，ID: ${id}`);
  } else {
    newsDetailCache.clear();
    console.log(`[API] 清除所有新聞快取`);
  }
}

// GET /api/news/:id
export async function GET(request, { params }) {
  try {
    const { id } = await Promise.resolve(params);
    console.log(`[API] Fetching news with id: ${id}`);
    console.log("Prisma 環境變數存在:", Boolean(process.env.DATABASE_URL));

    // 驗證ID
    if (!id) {
      console.error("❌ 缺少有效的新聞ID");
      return NextResponse.json({ error: "缺少有效的新聞ID" }, { status: 400 });
    }

    // 檢查快取
    const cachedNews = getFromCache(id);
    if (cachedNews) {
      return NextResponse.json(cachedNews);
    }

    // 使用連接測試函數
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      throw new Error(`資料庫連接失敗: ${connectionTest.error.message}`);
    }

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
      imagesCount: record.images?.length || 0,
      tagsCount: record.tags?.length || 0,
      referencesCount: record.references?.length || 0,
    });

    // 設置快取
    setCache(id, record);

    return NextResponse.json(record);
  } catch (error) {
    console.error("=====================================================");
    console.error(
      `🔴 GET /api/news/${params.id} 錯誤 (${new Date().toISOString()}):`
    );
    console.error("錯誤類型:", error.name);
    console.error("錯誤消息:", error.message);
    console.error("錯誤堆棧:", error.stack);

    // 檢查具體錯誤類型並提供更明確的訊息
    let errorDetails = error.message;
    let statusCode = 500;

    if (error.message.includes("資料庫連接失敗")) {
      errorDetails = "無法連接到資料庫，請檢查連接字串或網路狀態";
    } else if (error.code === "P2025") {
      errorDetails = "找不到請求的記錄";
      statusCode = 404;
    }

    console.error("=====================================================");

    // 在生產環境中返回更簡潔的錯誤信息
    const isProd = process.env.NODE_ENV === "production";
    return NextResponse.json(
      {
        error: "查詢新聞失敗",
        details: errorDetails,
        ...(isProd
          ? {}
          : {
              name: error.name,
              stack: error.stack,
            }),
      },
      { status: statusCode }
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

    // 驗證ID
    if (!id) {
      console.error("❌ 缺少有效的新聞ID");
      return NextResponse.json({ error: "缺少有效的新聞ID" }, { status: 400 });
    }

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

    // 使用連接測試函數
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      throw new Error(`資料庫連接失敗: ${connectionTest.error.message}`);
    }

    // 檢查新聞是否存在
    const existingNews = await prisma.news.findUnique({
      where: { id },
    });

    if (!existingNews) {
      console.log(`[API] 新聞 ID ${id} 不存在，無法更新`);
      return NextResponse.json(
        { error: "找不到指定新聞", details: "指定的新聞不存在或已被刪除" },
        { status: 404 }
      );
    }

    // 步驟 1: 更新新聞基本資料
    console.log(`[API] 步驟 1: 更新新聞基本資料 (ID: ${id})`);
    const updatedNews = await prisma.news.update({
      where: { id },
      data: {
        homeTitle,
        title,
        subtitle,
        contentMD,
        contentHTML,
        coverImage,
      },
    });

    // 步驟 2: 更新標籤
    console.log(`[API] 步驟 2: 處理標籤關聯 (${safeTagNames.length} 個標籤)`);
    await prisma.news.update({
      where: { id },
      data: {
        tags: {
          set: [],
          connectOrCreate: safeTagNames
            .filter((name) => typeof name === "string" && name.trim() !== "")
            .map((name) => ({
              where: { name },
              create: { name },
            })),
        },
      },
    });

    // 步驟 3: 處理刪除圖片
    if (safeImageIdsToDelete.length > 0) {
      console.log(
        `[API] 步驟 3: 刪除舊圖片 (${safeImageIdsToDelete.length} 張)`
      );
      await prisma.image.deleteMany({
        where: {
          id: { in: safeImageIdsToDelete.filter((id) => id) },
          newsId: id,
        },
      });
    }

    // 步驟 4: 添加新圖片
    if (safeImagesToCreate.length > 0) {
      console.log(`[API] 步驟 4: 新增圖片 (${safeImagesToCreate.length} 張)`);
      const validImages = safeImagesToCreate.filter(
        (img) => img && img.url && img.path
      );

      for (const img of validImages) {
        await prisma.image.create({
          data: {
            url: img.url,
            path: img.path,
            news: { connect: { id } },
          },
        });
      }
    }

    // 步驟 5: 處理參考資料
    console.log(`[API] 步驟 5: 處理參考資料 (${safeReferences.length} 條)`);
    await prisma.reference.deleteMany({
      where: { newsId: id },
    });

    if (safeReferences.length > 0) {
      const validReferences = safeReferences.filter(
        (ref) =>
          ref &&
          typeof ref === "object" &&
          ref.url &&
          typeof ref.url === "string"
      );

      console.log(`找到 ${validReferences.length} 個有效參考資料，準備新增`);

      for (const ref of validReferences) {
        await prisma.reference.create({
          data: {
            url: ref.url.trim(),
            title: ref.title ? ref.title.trim() : "",
            newsId: id,
          },
        });
      }
    }

    // 步驟 6: 獲取更新後的完整數據
    console.log(`[API] 步驟 6: 獲取更新後的完整數據`);
    const result = await prisma.news.findUnique({
      where: { id },
      include: {
        images: true,
        tags: true,
        references: true,
      },
    });

    console.log(`[API] News with id ${id} updated successfully`);
    console.log("=====================================================");

    // 清除此ID的快取
    clearCache(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("=====================================================");
    console.error(
      `🔴 PUT /api/news/${params.id} 錯誤 (${new Date().toISOString()}):`
    );
    console.error("錯誤類型:", error.name);
    console.error("錯誤消息:", error.message);
    console.error("錯誤堆棧:", error.stack);

    // 檢查具體錯誤類型並提供更明確的訊息
    let errorDetails = error.message;
    let statusCode = 500;

    if (error.message.includes("資料庫連接失敗")) {
      errorDetails = "無法連接到資料庫，請檢查連接字串或網路狀態";
    } else if (error.code === "P2025") {
      errorDetails = "找不到請求的記錄";
      statusCode = 404;
    } else if (error.code === "P2002") {
      errorDetails = "違反唯一約束";
      statusCode = 409;
    }

    console.error("=====================================================");

    // 在生產環境中返回更簡潔的錯誤信息
    const isProd = process.env.NODE_ENV === "production";
    return NextResponse.json(
      {
        error: "更新新聞失敗",
        details: errorDetails,
        ...(isProd
          ? {}
          : {
              name: error.name,
              stack: error.stack,
            }),
      },
      { status: statusCode }
    );
  }
}

// DELETE /api/news/:id
export async function DELETE(request, { params }) {
  try {
    const { id } = await Promise.resolve(params);
    console.log(`[API] Deleting news with id: ${id}`);
    console.log("Prisma 環境變數存在:", Boolean(process.env.DATABASE_URL));

    // 驗證ID的有效性
    if (!id) {
      console.error("❌ 缺少有效的新聞ID");
      return NextResponse.json({ error: "缺少有效的新聞ID" }, { status: 400 });
    }

    // 使用連接測試函數
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      throw new Error(`資料庫連接失敗: ${connectionTest.error.message}`);
    }

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

    console.log(`[API] News with id ${id} deleted successfully`);
    console.log("=====================================================");

    // 清除此ID的快取
    clearCache(id);

    return NextResponse.json({
      success: true,
      message: `新聞 ${id} 已成功刪除`,
    });
  } catch (error) {
    console.error("=====================================================");
    console.error(
      `🔴 DELETE /api/news/${params.id} 錯誤 (${new Date().toISOString()}):`
    );
    console.error("錯誤類型:", error.name);
    console.error("錯誤消息:", error.message);
    console.error("錯誤堆棧:", error.stack);

    // 檢查具體錯誤類型並提供更明確的訊息
    let errorDetails = error.message;
    let statusCode = 500;

    if (error.message.includes("資料庫連接失敗")) {
      errorDetails = "無法連接到資料庫，請檢查連接字串或網路狀態";
    } else if (error.code === "P2025") {
      errorDetails = "找不到請求的記錄";
      statusCode = 404;
    }

    console.error("=====================================================");

    // 在生產環境中返回更簡潔的錯誤信息
    const isProd = process.env.NODE_ENV === "production";
    return NextResponse.json(
      {
        error: "刪除新聞失敗",
        details: errorDetails,
        ...(isProd
          ? {}
          : {
              name: error.name,
              stack: error.stack,
            }),
      },
      { status: statusCode }
    );
  }
}
