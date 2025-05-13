// app/api/tags/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tags
export async function GET() {
  try {
    console.log('正在執行 GET /api/tags API');
    console.log('資料庫環境變數存在:', Boolean(process.env.DATABASE_URL));
    
    // 測試資料庫連接
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('資料庫連接測試成功');
    } catch (dbTestError) {
      console.error('資料庫連接測試失敗:', dbTestError);
      return NextResponse.json(
        { error: '資料庫連接失敗', details: dbTestError.message },
        { status: 500 }
      );
    }
    
    const all = await prisma.tag.findMany({ orderBy: { name: "asc" } });
    console.log(`成功獲取 ${all.length} 個標籤`);
    
    // 確保始終返回陰細組
    return NextResponse.json(all || []);
  } catch (error) {
    // 印出完整 error 物件
    console.error('🚨 /api/tags error:', error);
    return NextResponse.json(
      {
        error: '獲取標籤失敗',
        details: error.message,
        name: error.name,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        raw: process.env.NODE_ENV !== 'production' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/tags
// body: { name }
export async function POST(request) {
  const { name } = await request.json();
  const tag = await prisma.tag.create({ data: { name } });
  return NextResponse.json(tag, { status: 201 });
}
