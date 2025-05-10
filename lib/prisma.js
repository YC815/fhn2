// lib/prisma.js
import { PrismaClient } from "@prisma/client";

let prisma;

// 在开发环境避免每次热重载都 new PrismaClient()
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // @ts-ignore
  global.prisma = global.prisma || new PrismaClient();
  // @ts-ignore
  prisma = global.prisma;
}

// ✅ 这里是关键，做一个命名导出
export { prisma };
