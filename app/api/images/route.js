import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

// GET：讀取所有圖片
export async function GET() {
  try {
    console.log("📥 收到 GET /api/images 請求");

    const images = await prisma.image.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ 成功取得 ${images.length} 張圖片`);
    return NextResponse.json(images);
  } catch (err) {
    console.error("🔥 讀取圖片發生錯誤：", err);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

// POST：上傳圖片
export async function POST(request) {
  try {
    console.log("📤 收到 POST /api/images 請求");

    const formData = await request.formData();
    const file = formData.get("file");
    const newsId = formData.get("newsId")?.toString() || null;

    if (!file || typeof file === "string") {
      console.warn("⚠️ 沒有提供有效圖片");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const timestamp = Date.now();
    const originalName = file.name;
    const fileName = `${timestamp}-${originalName}`;

    console.log(`📦 上傳檔案名稱：${fileName}`);

    const { data: up, error: upErr } = await supabase.storage
      .from("images")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (upErr) {
      console.error("🔥 Supabase 上傳錯誤：", upErr.message);
      throw new Error(`Supabase upload error: ${upErr.message}`);
    }

    const { data: urlData, error: urlErr } = supabase.storage
      .from("images")
      .getPublicUrl(up.path);

    if (urlErr) {
      console.error("🔥 Supabase URL 錯誤：", urlErr.message);
      throw new Error(`Supabase getPublicUrl error: ${urlErr.message}`);
    }

    const publicUrl = urlData.publicUrl;
    if (!publicUrl) {
      console.error("❌ Supabase 回傳空的 publicUrl");
      throw new Error("Supabase returned empty publicUrl");
    }

    console.log("🌐 圖片 public URL：", publicUrl);

    const img = await prisma.image.create({
      data: {
        url: publicUrl,
        path: up.path,
        newsId: newsId,
      },
    });

    console.log("✅ Prisma 資料建立成功，圖片 ID：", img.id);
    return NextResponse.json(img);
  } catch (err) {
    console.error("🔥 /api/images 發生例外：", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
