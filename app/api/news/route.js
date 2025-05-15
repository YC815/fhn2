// app/api/news/route.js
import { NextResponse } from "next/server";
import { prisma, testConnection } from "@/lib/prisma";

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

    const { searchParams } = new URL(request.url);
    const tagsParam = searchParams.get("tags");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const skip = (page - 1) * pageSize;

    console.log("查詢參數:", {
      tagsParam,
      page,
      pageSize,
      skip,
    });

    // 使用連接測試函數
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      throw new Error(`資料庫連接失敗: ${connectionTest.error.message}`);
    }

    // 分析標籤參數
    const tags = tagsParam
      ? tagsParam
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [];

    console.log("過濾標籤:", tags);

    // 構建查詢
    const where = {};

    // 如果有標籤過濾條件
    if (tags.length > 0) {
      where.tags = {
        some: {
          name: {
            in: tags,
          },
        },
      };
    }

    // 執行查詢，包括分頁
    const news = await prisma.news.findMany({
      where,
      include: {
        tags: true,
        images: true,
        references: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    });

    // 獲取總數以支持分頁
    const total = await prisma.news.count({ where });

    console.log(`✅ 成功查詢到 ${news.length} 筆新聞記錄，總共 ${total} 筆`);
    console.log("=====================================================");

    return NextResponse.json({
      news,
      pagination: {
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("=====================================================");
    console.error(`🔴 GET /api/news 錯誤 (${new Date().toISOString()}):`);
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
        error: "獲取新聞列表失敗",
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

// POST /api/news
// body: { homeTitle, title, subtitle?, contentMD, contentHTML, coverImage?, tagNames: string[] }
export async function POST(request) {
  try {
    console.log("=====================================================");
    console.log(`🟢 開始執行 POST /api/news API - ${new Date().toISOString()}`);

    // 解析請求數據
    let data;
    try {
      data = await request.json();
      console.log("接收到的數據摘要:");
      console.log("- homeTitle:", data.homeTitle || "(空)");
      console.log("- title:", data.title || "(空)");
      console.log("- subtitle:", data.subtitle || "(空)");
      console.log(
        "- contentMD 長度:",
        data.contentMD ? data.contentMD.length : 0
      );
      console.log(
        "- contentHTML 長度:",
        data.contentHTML ? data.contentHTML.length : 0
      );
      console.log("- coverImage:", data.coverImage ? "存在" : "不存在");
      console.log(
        "- tagNames 數量:",
        Array.isArray(data.tagNames) ? data.tagNames.length : 0
      );
    } catch (parseError) {
      console.error("❌ 解析請求體失敗:", parseError);
      return NextResponse.json(
        { error: "無效的請求格式", details: parseError.message },
        { status: 400 }
      );
    }

    // 驗證必要欄位
    const {
      homeTitle,
      title,
      subtitle,
      contentMD,
      contentHTML,
      coverImage,
      tagNames = [],
    } = data;

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

    // 確保 tagNames 是陣列
    const safeTagNames = Array.isArray(tagNames) ? tagNames : [];

    // 使用連接測試函數
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      throw new Error(`資料庫連接失敗: ${connectionTest.error.message}`);
    }

    // 創建新聞
    const news = await prisma.news.create({
      data: {
        homeTitle: homeTitle || "",
        title,
        subtitle: subtitle || "",
        contentMD,
        contentHTML: contentHTML || "",
        coverImage: coverImage || "",
        // 處理標籤
        tags: {
          connectOrCreate: safeTagNames
            .filter((name) => typeof name === "string" && name.trim() !== "")
            .map((name) => ({
              where: { name },
              create: { name },
            })),
        },
      },
      include: {
        tags: true,
        images: true,
        references: true,
      },
    });

    console.log(`✅ 成功創建新聞，ID: ${news.id}`);
    console.log("=====================================================");

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error("=====================================================");
    console.error(`🔴 POST /api/news 錯誤 (${new Date().toISOString()}):`);
    console.error("錯誤類型:", error.name);
    console.error("錯誤消息:", error.message);
    console.error("錯誤堆棧:", error.stack);

    // 檢查具體錯誤類型並提供更明確的訊息
    let errorDetails = error.message;
    let statusCode = 500;

    if (error.message.includes("資料庫連接失敗")) {
      errorDetails = "無法連接到資料庫，請檢查連接字串或網路狀態";
    } else if (error.code === "P2002") {
      errorDetails = "違反唯一約束，記錄已存在";
      statusCode = 409;
    }

    console.error("=====================================================");

    // 在生產環境中返回更簡潔的錯誤信息
    const isProd = process.env.NODE_ENV === "production";
    return NextResponse.json(
      {
        error: "創建新聞失敗",
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
