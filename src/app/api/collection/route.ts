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

// GET /api/collection - Get current user's collection
export async function GET(req: NextRequest) {
  try {
    console.log("[API /api/collection GET] Starting request");
    const user = await getUserFromRequest(req);
    if (!user) {
      console.log("[API /api/collection GET] Unauthorized - no user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[API /api/collection GET] User authenticated:", user.id);
    const items = await prisma.collectionItem.findMany({
      where: { userId: user.id },
      orderBy: { addedAt: "desc" },
    });

    console.log("[API /api/collection GET] Found", items.length, "items");
    return NextResponse.json({
      collection: items.map((item) => ({
        id: item.id,
        movieId: item.movieId,
        addedAt: item.addedAt,
        movieData: item.movieData,
      })),
    });
  } catch (error: any) {
    console.error("[API /api/collection GET] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/collection - Add a movie to user's collection
export async function POST(req: NextRequest) {
  try {
    console.log("[API /api/collection POST] Starting request");
    const user = await getUserFromRequest(req);
    if (!user) {
      console.log("[API /api/collection POST] Unauthorized - no user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      console.log("[API /api/collection POST] Invalid JSON in request body");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { movieId, movieData } = body;
    if (
      typeof movieId !== "number" ||
      !movieData ||
      typeof movieData !== "object"
    ) {
      console.log("[API /api/collection POST] Invalid request body format");
      return NextResponse.json(
        { error: "movieId (number) and movieData (object) required" },
        { status: 400 },
      );
    }

    // Prevent duplicates (unique per user/movie)
    const existing = await prisma.collectionItem.findUnique({
      where: { userId_movieId: { userId: user.id, movieId } },
    });
    if (existing) {
      console.log(
        "[API /api/collection POST] Movie already in collection:",
        movieId,
      );
      return NextResponse.json(
        { error: "Movie already in collection" },
        { status: 409 },
      );
    }

    const item = await prisma.collectionItem.create({
      data: {
        userId: user.id,
        movieId,
        movieData,
        // addedAt defaults to now
      },
    });

    console.log(
      "[API /api/collection POST] Movie added successfully:",
      item.id,
    );
    return NextResponse.json({
      id: item.id,
      movieId: item.movieId,
      addedAt: item.addedAt,
      movieData: item.movieData,
    });
  } catch (error: any) {
    console.error("[API /api/collection POST] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
