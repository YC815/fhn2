import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ← 改這裡

export async function GET() {
  const tags = await prisma.tag.findMany();
  return NextResponse.json(tags);
}

export async function POST(request) {
  const { name } = await request.json();
  const tag = await prisma.tag.create({ data: { name } });
  return NextResponse.json(tag);
}
