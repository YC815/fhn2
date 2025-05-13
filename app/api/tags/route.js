// app/api/tags/route.js
import { NextResponse } from "next/server";
import supabase from "@/utils/supabase";
import { prisma } from "@/lib/prisma";

// GET /api/tags
export async function GET() {
  try {
    console.log('正在執行 GET /api/tags API');
    console.log('Supabase 環境變數存在:', Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL));
    console.log('Prisma 環境變數存在:', Boolean(process.env.DATABASE_URL));

    // 先嘗試使用 Prisma 查詢
    try {
      const all = await prisma.tag.findMany({ orderBy: { name: "asc" } });
      console.log(`成功使用 Prisma 獲取 ${all.length} 個標籤`);
      return NextResponse.json(all || []);
    } catch (prismaError) {
      console.log('使用 Prisma 失敗，嘗試 Supabase:', prismaError.message);
      
      // 如果 Prisma 失敗，嘗試使用 Supabase
      const { data: all, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Supabase 查詢錯誤:', error);
        throw new Error(`使用 Supabase 查詢失敗: ${error.message}`);
      }
      
      console.log(`成功使用 Supabase 獲取 ${all.length} 個標籤`);
      return NextResponse.json(all || []);
    }
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
  try {
    const { name } = await request.json();
    
    // 先嘗試使用 Prisma
    try {
      // 先檢查標籤是否已存在
      const existingPrismaTag = await prisma.tag.findUnique({
        where: { name },
      });
      
      if (existingPrismaTag) {
        return NextResponse.json(
          { id: existingPrismaTag.id, name, error: '標籤已存在' },
          { status: 200 }
        );
      }
      
      // 創建新標籤
      const tag = await prisma.tag.create({ data: { name } });
      return NextResponse.json(tag, { status: 201 });
    } catch (prismaError) {
      console.log('使用 Prisma 創建標籤失敗，嘗試 Supabase:', prismaError.message);
      
      // 如果 Prisma 失敗，嘗試 Supabase
      // 檢查標籤是否已存在
      const { data: existingTag, error: checkError } = await supabase
        .from('tags')
        .select('id')
        .eq('name', name)
        .maybeSingle();
      
      if (checkError) {
        console.error('檢查標籤存在性失敗:', checkError);
        throw new Error(`檢查標籤失敗: ${checkError.message}`);
      }
      
      // 如果標籤已存在，返回現有標籤
      if (existingTag) {
        return NextResponse.json(
          { id: existingTag.id, name, error: '標籤已存在' },
          { status: 200 }
        );
      }
      
      // 創建新標籤
      const { data: tag, error: createError } = await supabase
        .from('tags')
        .insert({ name })
        .select()
        .single();
      
      if (createError) {
        console.error('創建標籤失敗:', createError);
        throw new Error(`創建標籤失敗: ${createError.message}`);
      }
      
      return NextResponse.json(tag, { status: 201 });
    }
  } catch (error) {
    console.error('創建標籤錯誤:', error);
    return NextResponse.json(
      { error: '伺服器內部錯誤', details: error.message },
      { status: 500 }
    );
  }
}
