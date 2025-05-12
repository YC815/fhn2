// app/api/tags/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tags
export async function GET() {
  const all = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(all);
}

// POST /api/tags
// body: { name }
export async function POST(request) {
  const { name } = await request.json();
  const tag = await prisma.tag.create({ data: { name } });
  return NextResponse.json(tag, { status: 201 });
}
