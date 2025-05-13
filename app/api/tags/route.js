// app/api/tags/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

// GET /api/tags
export async function GET() {
  try {
    console.log("=====================================================");
    console.log(`🟢 開始執行 GET /api/tags API - ${new Date().toISOString()}`);
    console.log("環境變數檢查:");
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    console.log(
      "- SUPABASE_URL 存在:",
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
    );
    console.log(
      "- SUPABASE_KEY 存在:",
      Boolean(process.env.SUPABASE_SERVICE_KEY)
    );
    console.log("- DATABASE_URL 存在:", Boolean(process.env.DATABASE_URL));
    console.log(
      "- DATABASE_URL 長度:",
      process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
    );

    // 先嘗試使用 Prisma 查詢
    try {
      console.log("🔄 嘗試使用 Prisma 獲取標籤...");
      console.time("Prisma標籤查詢耗時");

      // 首先測試連接
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log("✅ Prisma 資料庫連接測試成功");
      } catch (connError) {
        console.error("❌ Prisma 資料庫連接測試失敗:", connError.message);
        console.error(
          "詳細錯誤:",
          JSON.stringify(
            {
              name: connError.name,
              code: connError.code,
              clientVersion: connError.clientVersion,
            },
            null,
            2
          )
        );
        throw connError;
      }

      const all = await prisma.tag.findMany({ orderBy: { name: "asc" } });

      console.timeEnd("Prisma標籤查詢耗時");
      console.log(`✅ 成功使用 Prisma 獲取 ${all.length} 個標籤`);
      console.log("=====================================================");

      return NextResponse.json(all || []);
    } catch (prismaError) {
      console.error("❌ 使用 Prisma 獲取標籤失敗:");
      console.error("錯誤類型:", prismaError.name);
      console.error("錯誤消息:", prismaError.message);
      console.error("錯誤代碼:", prismaError.code);

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

      // 檢查是否為連接錯誤
      if (
        prismaError.message &&
        prismaError.message.includes("Can't reach database server")
      ) {
        console.error("⚠️ Prisma 數據庫連接失敗 - 可能的原因:");
        console.error("1. 數據庫服務器可能暫時離線");
        console.error("2. 網絡連接問題");
        console.error("3. 數據庫憑證可能已過期");
        console.error("4. IP 白名單或防火牆設置問題");
        console.error("5. Vercel 和 Supabase 之間的連接波動");
      }

      console.log("🔄 Prisma 失敗，嘗試使用 Supabase 作為備用...");

      // 檢查 Supabase 客戶端
      if (!supabase) {
        console.error("❌ Supabase 客戶端未定義");
        throw new Error("無法使用 Prisma 或 Supabase: supabase 客戶端未定義");
      }

      console.time("Supabase標籤查詢耗時");

      // 如果 Prisma 失敗，嘗試使用 Supabase
      const { data: all, error } = await supabase
        .from("tags")
        .select("*")
        .order("name", { ascending: true });

      console.timeEnd("Supabase標籤查詢耗時");

      if (error) {
        console.error("❌ Supabase 查詢錯誤:", error);
        console.error(
          "錯誤詳情:",
          JSON.stringify(
            {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
            },
            null,
            2
          )
        );

        if (error.message && error.message.includes("permission denied")) {
          console.error("⚠️ Supabase 權限錯誤 - 可能的原因:");
          console.error("1. 服務角色密鑰 (service role key) 權限配置不正確");
          console.error("2. 數據庫 RLS (Row Level Security) 可能阻止訪問");
          console.error("3. Supabase 專案設置中的 SQL 權限問題");
        }

        throw new Error(`使用 Supabase 查詢失敗: ${error.message}`);
      }

      console.log(`✅ 成功使用 Supabase 獲取 ${all.length} 個標籤`);
      console.log("=====================================================");

      return NextResponse.json(all || []);
    }
  } catch (error) {
    // 印出完整 error 物件
    console.error("=====================================================");
    console.error(`🚨 /api/tags 整體錯誤 (${new Date().toISOString()}):`);
    console.error("錯誤類型:", error.name);
    console.error("錯誤消息:", error.message);

    // 嘗試序列化整個錯誤對象
    try {
      const errorObj = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        meta: error.meta,
        clientVersion: error.clientVersion,
      };
      console.error("錯誤詳情:", JSON.stringify(errorObj, null, 2));
    } catch (jsonErr) {
      console.error("無法序列化錯誤對象");
    }

    console.error("堆棧跟踪:", error.stack);
    console.error("=====================================================");

    return NextResponse.json(
      {
        error: "獲取標籤失敗",
        details: error.message,
        name: error.name,
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
        raw: process.env.NODE_ENV !== "production" ? error : undefined,
      },
      { status: 500 }
    );
  }
}

// POST /api/tags
// body: { name }
export async function POST(request) {
  try {
    console.log("=====================================================");
    console.log(`🟢 開始執行 POST /api/tags API - ${new Date().toISOString()}`);

    const { name } = await request.json();
    console.log("嘗試創建標籤:", name);

    // 先嘗試使用 Prisma
    try {
      console.log("🔄 使用 Prisma 檢查標籤是否存在...");

      // 先檢查標籤是否已存在
      const existingPrismaTag = await prisma.tag.findUnique({
        where: { name },
      });

      if (existingPrismaTag) {
        console.log(`ℹ️ 標籤 "${name}" 已存在，ID: ${existingPrismaTag.id}`);
        return NextResponse.json(
          { id: existingPrismaTag.id, name, error: "標籤已存在" },
          { status: 200 }
        );
      }

      console.log(`🔄 標籤 "${name}" 不存在，開始創建...`);

      // 創建新標籤
      const tag = await prisma.tag.create({ data: { name } });

      console.log(`✅ 成功創建標籤，ID: ${tag.id}, 名稱: ${tag.name}`);
      console.log("=====================================================");

      return NextResponse.json(tag, { status: 201 });
    } catch (prismaError) {
      console.error("❌ 使用 Prisma 創建/查詢標籤失敗:");
      console.error("錯誤類型:", prismaError.name);
      console.error("錯誤消息:", prismaError.message);
      console.error("錯誤代碼:", prismaError.code);

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

      console.log("🔄 嘗試使用 Supabase 作為備用...");

      // 如果 Prisma 失敗，嘗試 Supabase
      // 檢查標籤是否已存在
      const { data: existingTag, error: checkError } = await supabase
        .from("tags")
        .select("id")
        .eq("name", name)
        .maybeSingle();

      if (checkError) {
        console.error("❌ 檢查標籤存在性失敗:", checkError);
        console.error(
          "錯誤詳情:",
          JSON.stringify(
            {
              code: checkError.code,
              message: checkError.message,
              details: checkError.details,
            },
            null,
            2
          )
        );
        throw new Error(`檢查標籤失敗: ${checkError.message}`);
      }

      // 如果標籤已存在，返回現有標籤
      if (existingTag) {
        console.log(
          `ℹ️ 標籤 "${name}" 已存在於 Supabase，ID: ${existingTag.id}`
        );
        return NextResponse.json(
          { id: existingTag.id, name, error: "標籤已存在" },
          { status: 200 }
        );
      }

      console.log(`🔄 標籤 "${name}" 不存在於 Supabase，開始創建...`);

      // 創建新標籤
      const { data: tag, error: createError } = await supabase
        .from("tags")
        .insert({ name })
        .select()
        .single();

      if (createError) {
        console.error("❌ 使用 Supabase 創建標籤失敗:", createError);
        console.error(
          "錯誤詳情:",
          JSON.stringify(
            {
              code: createError.code,
              message: createError.message,
              details: createError.details,
            },
            null,
            2
          )
        );
        throw new Error(`創建標籤失敗: ${createError.message}`);
      }

      console.log(
        `✅ 成功使用 Supabase 創建標籤，ID: ${tag.id}, 名稱: ${tag.name}`
      );
      console.log("=====================================================");

      return NextResponse.json(tag, { status: 201 });
    }
  } catch (error) {
    console.error("=====================================================");
    console.error(`🚨 POST /api/tags 整體錯誤 (${new Date().toISOString()}):`);
    console.error("錯誤類型:", error.name);
    console.error("錯誤消息:", error.message);
    console.error("堆棧跟踪:", error.stack);
    console.error("=====================================================");

    return NextResponse.json(
      { error: "伺服器內部錯誤", details: error.message },
      { status: 500 }
    );
  }
}
