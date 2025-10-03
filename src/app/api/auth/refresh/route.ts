import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Get refresh token from httpOnly cookie
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      );
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Find refresh token in database
    const refreshTokenRecord = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: { user: true },
    });

    if (!refreshTokenRecord) {
      return NextResponse.json(
        { error: "Refresh token not found" },
        { status: 401 }
      );
    }

    // Check if token matches and hasn't expired
    if (
      refreshTokenRecord.token !== refreshToken ||
      refreshTokenRecord.expiresAt < new Date()
    ) {
      // Delete invalid/expired token
      await prisma.refreshToken.delete({
        where: { id: refreshTokenRecord.id },
      });

      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Token rotation: Delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: refreshTokenRecord.id },
    });

    // Create new refresh token record
    const newRefreshTokenExpiry = new Date();
    newRefreshTokenExpiry.setDate(newRefreshTokenExpiry.getDate() + 7); // 7 days

    const newRefreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: refreshTokenRecord.user.id,
        token: "", // Will be updated below
        expiresAt: newRefreshTokenExpiry,
      },
    });

    // Generate new tokens
    const newAccessToken = await generateAccessToken({
      userId: refreshTokenRecord.user.id,
      email: refreshTokenRecord.user.email,
    });

    const newRefreshToken = await generateRefreshToken({
      userId: refreshTokenRecord.user.id,
      tokenId: newRefreshTokenRecord.id,
    });

    // Update refresh token record with actual token
    await prisma.refreshToken.update({
      where: { id: newRefreshTokenRecord.id },
      data: { token: newRefreshToken },
    });

    // Create response
    const response = NextResponse.json(
      {
        user: {
          id: refreshTokenRecord.user.id,
          email: refreshTokenRecord.user.email,
        },
        accessToken: newAccessToken,
      },
      { status: 200 }
    );

    // Set new httpOnly cookie for refresh token
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
