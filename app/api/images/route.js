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

    if (!file) {
      console.warn("⚠️ 沒有提供有效圖片");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 確保檔案是 File 或 Blob 類型
    if (!(file instanceof File) && !(file instanceof Blob)) {
      console.warn("⚠️ 無效的檔案類型:", typeof file);
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const timestamp = Date.now();
    const originalName = file.name;
    // 移除特殊字元，只保留英數字、點和連字號
    const safeFileName = originalName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_')  // 將非英數字、點、連字號替換為底線
      .replace(/_{2,}/g, '_')         // 將多個底線替換為單個
      .replace(/^[^a-z0-9]+/g, '')    // 移除開頭的非英數字
      .replace(/[^a-z0-9]+$/g, '');   // 移除結尾的非英數字
    
    // 如果處理後檔名過短，使用隨機字串
    const randomStr = Math.random().toString(36).substring(2, 8);
    const safeName = safeFileName || `image_${randomStr}`;
    const fileName = `${timestamp}-${safeName}`;

    console.log(`📦 上傳檔案名稱：${fileName}`, '檔案類型:', file.type, '檔案大小:', file.size);

    // 讀取檔案內容為 ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    
    // 確保檔案名稱有副檔名
    const fileExt = originalName.split('.').pop() || 'jpg';
    const finalFileName = fileName.endsWith(`.${fileExt}`) 
      ? fileName 
      : `${fileName}.${fileExt}`;
    
    console.log('🔧 處理後的檔案名稱:', finalFileName);
    
    // 上傳到 Supabase
    const { data: up, error: upErr } = await supabase.storage
      .from("images")
      .upload(finalFileName, fileBuffer, { 
        cacheControl: '3600', 
        upsert: false,
        contentType: file.type || 'image/jpeg',
        // 確保使用正確的編碼
        contentType: file.type || 'image/jpeg',
        // 明確指定檔名編碼
        filename: finalFileName,
        // 禁用自動偵測內容類型
        detectContentType: true
      });

    if (upErr) {
      console.error("🔥 Supabase 上傳錯誤:", upErr);
      // 檢查是否為重複檔案錯誤
      if (upErr.error === 'Duplicate' || upErr.statusCode === '23505') {
        console.log("🔄 檔案已存在，嘗試使用新檔名重新上傳...");
        const newFileName = `${Date.now()}-${file.name}`;
        const retryUpload = await supabase.storage
          .from("images")
          .upload(newFileName, fileBuffer, { 
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'image/jpeg'
          });
          
        if (retryUpload.error) {
          throw new Error(`重試上傳失敗: ${retryUpload.error.message}`);
        }
        up = retryUpload.data;
        fileName = newFileName; // 使用新檔名更新後續流程
      } else {
        throw upErr;
      }
    }

    const path = up.path || up.Key?.replace(/^.*?\//, '') || fileName;
    console.log("🔍 檔案路徑:", path);
    
    const { data: urlData, error: urlErr } = supabase.storage
      .from("images")
      .getPublicUrl(path);

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
