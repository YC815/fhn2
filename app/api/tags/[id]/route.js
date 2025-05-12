// app/api/tags/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 輔助函數：處理 params
function getParams(params) {
  return new Promise((resolve) => {
    resolve(params);
  });
}

// GET /api/tags/:id
export async function GET(request, { params }) {
  const { id } = await getParams(params);
  try {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(tag);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tag" },
      { status: 500 }
    );
  }
}

// PUT /api/tags/:id
// body: { name }
export async function PUT(request, { params }) {
  const { id } = await getParams(params);
  try {
    const { name } = await request.json();
    const updated = await prisma.tag.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

// DELETE /api/tags/:id
export async function DELETE(request, { params }) {
  const { id } = await getParams(params);
  try {
    await prisma.tag.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
