import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Get refresh token from httpOnly cookie
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (refreshToken) {
      // Verify and get token ID
      const payload = await verifyRefreshToken(refreshToken);

      if (payload) {
        // Delete refresh token from database
        await prisma.refreshToken.deleteMany({
          where: {
            id: payload.tokenId,
          },
        });
      }
    }

    // Create response
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear refresh token cookie
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
