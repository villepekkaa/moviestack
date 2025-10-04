import { NextRequest, NextResponse } from "next/server";
import { justWatchClient } from "@/lib/justwatch/client";
import { verifyAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to get user from Authorization header
async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  return await prisma.user.findUnique({ where: { id: payload.userId } });
}

// GET /api/justwatch?tmdbId=123&title=Movie+Title
export async function GET(req: NextRequest) {
  try {
    console.log("[API /api/justwatch GET] Starting request");

    // Authentication is optional for testing purposes
    // const user = await getUserFromRequest(req);
    // if (!user) {
    //   console.log("[API /api/justwatch GET] Unauthorized - no user found");
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const tmdbIdStr = searchParams.get("tmdbId");
    const title = searchParams.get("title");

    if (!tmdbIdStr || !title) {
      return NextResponse.json(
        { error: "tmdbId and title parameters required" },
        { status: 400 },
      );
    }

    const tmdbId = parseInt(tmdbIdStr, 10);
    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: "Invalid tmdbId" }, { status: 400 });
    }

    console.log(
      `[API /api/justwatch GET] Fetching offers for TMDB ID: ${tmdbId}, Title: "${title}"`,
    );

    // Fetch offers from JustWatch
    const offers = await justWatchClient.getOffersByTmdbId(tmdbId, title);
    console.log(`[API /api/justwatch GET] Found ${offers.length} offers`);

    // Format offers
    const formatted = justWatchClient.formatOffers(offers);
    const cheapestRent = justWatchClient.getCheapestPrice(offers, "rent");
    const cheapestBuy = justWatchClient.getCheapestPrice(offers, "buy");

    // Convert to our streaming data format
    const streamingData = {
      movieId: tmdbId,
      tmdbId,
      country: "FI",
      offers: offers.map((o) => ({
        monetizationType: o.monetization_type,
        providerName: o.provider_name || `Provider ${o.provider_id}`,
        providerId: o.provider_id,
        price: o.retail_price,
        currency: o.currency,
        quality: o.presentation_type,
        url: o.urls?.standard_web,
      })),
      flatrate: formatted.flatrate.map((o) => ({
        monetizationType: "flatrate" as const,
        providerName: o.provider_name || `Provider ${o.provider_id}`,
        providerId: o.provider_id,
        price: o.retail_price,
        currency: o.currency,
        quality: o.presentation_type,
        url: o.urls?.standard_web,
      })),
      rent: formatted.rent.map((o) => ({
        monetizationType: "rent" as const,
        providerName: o.provider_name || `Provider ${o.provider_id}`,
        providerId: o.provider_id,
        price: o.retail_price,
        currency: o.currency,
        quality: o.presentation_type,
        url: o.urls?.standard_web,
      })),
      buy: formatted.buy.map((o) => ({
        monetizationType: "buy" as const,
        providerName: o.provider_name || `Provider ${o.provider_id}`,
        providerId: o.provider_id,
        price: o.retail_price,
        currency: o.currency,
        quality: o.presentation_type,
        url: o.urls?.standard_web,
      })),
      free: formatted.free.map((o) => ({
        monetizationType: "free" as const,
        providerName: o.provider_name || `Provider ${o.provider_id}`,
        providerId: o.provider_id,
        quality: o.presentation_type,
        url: o.urls?.standard_web,
      })),
      ads: formatted.ads.map((o) => ({
        monetizationType: "ads" as const,
        providerName: o.provider_name || `Provider ${o.provider_id}`,
        providerId: o.provider_id,
        quality: o.presentation_type,
        url: o.urls?.standard_web,
      })),
      cheapestRent,
      cheapestBuy,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: streamingData,
    });
  } catch (error: any) {
    console.error("[API /api/justwatch GET] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
