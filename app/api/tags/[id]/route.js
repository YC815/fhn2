import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(request, { params }) {
  await prisma.tag.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
