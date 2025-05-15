import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearCache } from "@/app/api/news/route";

export async function PATCH(request, context) {
  // 1. 從 URL 取得新聞 id - 注意使用 await
  const { id } = await context.params;

  // 2. 解析 body，取得 showOnHome 欄位
  let data;
  try {
    data = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "請求格式錯誤，需為 JSON" },
      { status: 400 }
    );
  }

  const { showOnHome } = data;

  // 3. 檢查 showOnHome 是否為布林值
  if (typeof showOnHome !== "boolean") {
    return NextResponse.json(
      { error: "showOnHome 欄位必須為布林值" },
      { status: 400 }
    );
  }

  try {
    // 4. 更新資料庫
    const updatedNews = await prisma.news.update({
      where: { id },
      data: { showOnHome },
    });

    // 新增: 清除緩存
    clearCache();

    // 5. 回傳成功訊息
    return NextResponse.json({
      message: "更新成功",
      news: updatedNews,
    });
  } catch (error) {
    // 6. 若找不到該新聞或其他錯誤
    return NextResponse.json(
      {
        error: "更新失敗，請確認新聞 ID 是否正確",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
