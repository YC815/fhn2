import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

// DELETE: 刪除圖片
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    console.log(`🗑️ 收到刪除圖片請求，ID: ${id}`);

    // 1. 從資料庫中獲取圖片資訊
    const image = await prisma.image.findUnique({
      where: { id },
    });

    if (!image) {
      console.error(`❌ 找不到圖片，ID: ${id}`);
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    console.log(`🔍 找到圖片:`, image);

    // 2. 從 Supabase 儲存空間刪除檔案
    if (image.path) {
      console.log(`🗑️ 正在從 Supabase 刪除檔案: ${image.path}`);
      const { error: deleteError } = await supabase.storage
        .from("images")
        .remove([image.path]);

      if (deleteError) {
        console.error("❌ 從 Supabase 刪除檔案時出錯:", deleteError);
        // 不中斷執行，繼續刪除資料庫記錄
      } else {
        console.log("✅ 已從 Supabase 刪除檔案");
      }
    }

    // 3. 從資料庫中刪除圖片記錄
    await prisma.image.delete({
      where: { id },
    });

    console.log(`✅ 已刪除圖片記錄，ID: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ 刪除圖片時發生錯誤:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete image",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
