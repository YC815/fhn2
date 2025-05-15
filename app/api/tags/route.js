// app/api/tags/route.js
import { NextResponse } from "next/server";
import { prisma, testConnection } from "@/lib/prisma";

// 新增記憶體快取機制
const CACHE_TTL = 5 * 60 * 1000; // 快取有效時間（毫秒）：5分鐘
const tagsCache = {
  data: null,
  timestamp: 0,
};

// 從快取中獲取結果，如果快取不存在或過期則返回 null
function getFromCache() {
  const now = Date.now();

  // 檢查快取是否存在且未過期
  if (tagsCache.data && now - tagsCache.timestamp < CACHE_TTL) {
    console.log(
      `🟢 從快取中獲取標籤結果，快取時間: ${new Date(
        tagsCache.timestamp
      ).toISOString()}`
    );
    return tagsCache.data;
  }

  return null;
}

// 設置快取
function setCache(data) {
  tagsCache.data = data;
  tagsCache.timestamp = Date.now();
  console.log(`🟢 已設置標籤快取，標籤數量: ${data.length}`);
}

// 清空快取
function clearCache() {
  tagsCache.data = null;
  tagsCache.timestamp = 0;
  console.log("🟢 已清空標籤快取");
}

// GET /api/tags
export async function GET() {
  try {
    console.log("=====================================================");
    console.log(`🟢 開始執行 GET /api/tags API - ${new Date().toISOString()}`);
    console.log("環境變數檢查:");
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    console.log("- DATABASE_URL 存在:", Boolean(process.env.DATABASE_URL));
    console.log(
      "- DATABASE_URL 長度:",
      process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
    );

    // 檢查快取
    const cachedTags = getFromCache();
    if (cachedTags) {
      console.log(`✅ 從快取返回 ${cachedTags.length} 個標籤`);
      console.log("=====================================================");
      return NextResponse.json(cachedTags);
    }

    // 使用連接測試函數
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      throw new Error(`資料庫連接失敗: ${connectionTest.error.message}`);
    }

    console.log("🔄 正在查詢標籤...");
    console.time("標籤查詢耗時");

    const all = await prisma.tag.findMany({ orderBy: { name: "asc" } });

    console.timeEnd("標籤查詢耗時");
    console.log(`✅ 成功查詢到 ${all.length} 個標籤`);
    console.log("=====================================================");

    // 確保返回的是陣列
    const safeResult = Array.isArray(all) ? all : [];

    // 設置快取
    setCache(safeResult);

    return NextResponse.json(safeResult);
  } catch (error) {
    console.error("=====================================================");
    console.error(`🚨 GET /api/tags 錯誤 (${new Date().toISOString()}):`);
    console.error("錯誤類型:", error.name);
    console.error("錯誤消息:", error.message);

    // 檢查具體錯誤類型並提供更明確的訊息
    let errorDetails = error.message;
    let statusCode = 500;

    if (error.message.includes("資料庫連接失敗")) {
      errorDetails = "無法連接到資料庫，請檢查連接字串或網路狀態";
    } else if (error.code === "P2002") {
      errorDetails = "違反唯一約束，記錄已存在";
      statusCode = 409;
    } else if (error.code === "P2025") {
      errorDetails = "找不到請求的記錄";
      statusCode = 404;
    }

    console.error("錯誤詳情:", errorDetails);
    console.error("堆棧跟踪:", error.stack);
    console.error("=====================================================");

    // 在生產環境中返回更簡潔的錯誤信息
    const isProd = process.env.NODE_ENV === "production";
    return NextResponse.json(
      {
        error: "獲取標籤失敗",
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

// POST /api/tags
// body: { name }
export async function POST(request) {
  try {
    console.log("=====================================================");
    console.log(`🟢 開始執行 POST /api/tags API - ${new Date().toISOString()}`);

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

    const { name } = requestBody;

    // 基本驗證
    if (!name || typeof name !== "string" || !name.trim()) {
      console.error("❌ 缺少必要欄位: name");
      return NextResponse.json(
        { error: "缺少必要欄位", details: "標籤名稱不能為空" },
        { status: 400 }
      );
    }

    console.log("嘗試創建標籤:", name);

    // 使用連接測試函數
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      throw new Error(`資料庫連接失敗: ${connectionTest.error.message}`);
    }

    console.log("🔄 檢查標籤是否存在...");

    // 先檢查標籤是否已存在
    const existingTag = await prisma.tag.findUnique({
      where: { name },
    });

    if (existingTag) {
      console.log(`ℹ️ 標籤 "${name}" 已存在，ID: ${existingTag.id}`);
      return NextResponse.json(
        { id: existingTag.id, name, error: "標籤已存在" },
        { status: 200 }
      );
    }

    console.log(`🔄 標籤 "${name}" 不存在，開始創建...`);

    // 創建新標籤
    const tag = await prisma.tag.create({ data: { name } });

    console.log(`✅ 成功創建標籤，ID: ${tag.id}, 名稱: ${tag.name}`);
    console.log("=====================================================");

    // 清空快取因為有新標籤被創建
    clearCache();

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("=====================================================");
    console.error(`🚨 POST /api/tags 錯誤 (${new Date().toISOString()}):`);
    console.error("錯誤類型:", error.name);
    console.error("錯誤消息:", error.message);

    // 檢查具體錯誤類型並提供更明確的訊息
    let errorDetails = error.message;
    let statusCode = 500;

    if (error.message.includes("資料庫連接失敗")) {
      errorDetails = "無法連接到資料庫，請檢查連接字串或網路狀態";
    } else if (error.code === "P2002") {
      errorDetails = "違反唯一約束，標籤名稱已存在";
      statusCode = 409;
    }

    console.error("錯誤詳情:", errorDetails);
    console.error("堆棧跟踪:", error.stack);
    console.error("=====================================================");

    // 在生產環境中返回更簡潔的錯誤信息
    const isProd = process.env.NODE_ENV === "production";
    return NextResponse.json(
      {
        error: "創建標籤失敗",
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
