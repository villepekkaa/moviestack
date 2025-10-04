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

// DELETE /api/wishlist/[id] - Remove a movie from user's wishlist
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
      { error: "Missing wishlist item id" },
      { status: 400 }
    );
  }

  // Find the wishlist item and ensure it belongs to the user
  const item = await prisma.wishlistItem.findUnique({
    where: { id },
  });

  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.wishlistItem.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
