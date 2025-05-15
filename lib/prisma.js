// lib/prisma.js
import { PrismaClient } from "@prisma/client";

// 記錄環境信息
console.log("Prisma 初始化:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- DATABASE_URL 存在:", Boolean(process.env.DATABASE_URL));
console.log(
  "- DATABASE_URL 長度:",
  process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
);

// 初始化 PrismaClient 並帶有更詳細的日誌配置
const prismaClientOptions = {
  log: ["error", "warn"],
};

// 如果在生產環境中希望看到查詢，可以啟用此選項
// if (process.env.DEBUG_PRISMA === 'true') {
//   prismaClientOptions.log.push('query');
// }

let prisma;

// 在開發環境避免每次熱重載都 new PrismaClient()
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient(prismaClientOptions);
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaClientOptions);
  }
  prisma = global.prisma;
}

// 新增一個連接測試函數
export async function testConnection() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Prisma 資料庫連接測試成功:", result);
    return { success: true, result };
  } catch (error) {
    console.error("❌ Prisma 資料庫連接測試失敗:", error.message);
    console.error(
      "詳細錯誤:",
      JSON.stringify(
        {
          name: error.name,
          code: error.code,
          clientVersion: error.clientVersion,
          meta: error.meta,
        },
        null,
        2
      )
    );
    return { success: false, error };
  }
}

// 命名導出
export { prisma };
