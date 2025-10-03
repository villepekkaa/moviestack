import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

// Helper to get user from Authorization header
async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  return await prisma.user.findUnique({ where: { id: payload.userId } });
}

// DELETE /api/collection/[id] - Remove a movie from user's collection
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: "Missing collection item id" },
      { status: 400 }
    );
  }

  // Find the collection item and ensure it belongs to the user
  const item = await prisma.collectionItem.findUnique({
    where: { id },
  });

  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.collectionItem.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
