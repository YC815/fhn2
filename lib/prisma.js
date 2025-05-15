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

// 添加連接重試工具函數
async function retryOperation(operation, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // 捕獲特定的 Prisma 連接錯誤
      if (
        error.message.includes("prepared statement") ||
        error.message.includes("Connection") ||
        error.message.includes("PrismaClientUnknownRequestError") ||
        error.message.includes("Invalid `prisma")
      ) {
        console.log(`🔄 嘗試重新連接數據庫 (嘗試 ${attempt}/${maxRetries})...`);
        // 如果是連接問題，我們等待短暫時間後重試
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        lastError = error;
        // 在每次重試前嘗試重新連接
        await reconnectPrisma();
      } else {
        // 如果不是連接問題，直接拋出錯誤
        throw error;
      }
    }
  }
  // 如果所有重試都失敗，拋出最後一個錯誤
  throw lastError;
}

// 重新連接 Prisma 客戶端
async function reconnectPrisma() {
  try {
    // 顯式斷開現有連接
    await prisma.$disconnect();

    // 等待一下確保連接被完全釋放
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 重新創建 Prisma 實例
    if (process.env.NODE_ENV === "production") {
      prisma = new PrismaClient(prismaClientOptions);
    } else {
      global.prisma = new PrismaClient(prismaClientOptions);
      prisma = global.prisma;
    }

    console.log("🔄 Prisma 客戶端已重新初始化");
  } catch (error) {
    console.error("❌ 重新連接 Prisma 失敗:", error);
  }
}

// 新增一個連接測試函數
export async function testConnection() {
  try {
    const result = await retryOperation(async () => {
      return await prisma.$queryRaw`SELECT 1 as test`;
    });
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

// 增強版 Prisma 客戶端
const enhancedPrisma = new Proxy(prisma, {
  get(target, prop) {
    const original = target[prop];

    // 如果是函數並且不是內部方法（不以 $ 開頭的方法）
    if (typeof original === "function" && !prop.toString().startsWith("$")) {
      return async (...args) => {
        // 使用重試機制包裝原始操作
        return await retryOperation(() => original.apply(target, args));
      };
    }

    // 如果是模型（如 prisma.user, prisma.news 等）
    if (
      typeof original === "object" &&
      original !== null &&
      !prop.toString().startsWith("$")
    ) {
      return new Proxy(original, {
        get(modelTarget, modelProp) {
          const modelMethod = modelTarget[modelProp];

          if (typeof modelMethod === "function") {
            return async (...args) => {
              // 使用重試機制包裝模型方法
              return await retryOperation(() =>
                modelMethod.apply(modelTarget, args)
              );
            };
          }

          return modelMethod;
        },
      });
    }

    return original;
  },
});

// 命名導出增強版 Prisma 客戶端
export { enhancedPrisma as prisma };
