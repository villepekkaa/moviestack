import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { justWatchClient } from "@/lib/justwatch/client";

// Helper to get user from Authorization header
async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  return await prisma.user.findUnique({ where: { id: payload.userId } });
}

// POST /api/wishlist/streaming - Update streaming data for a wishlist item
export async function POST(req: NextRequest) {
  try {
    console.log("[API /api/wishlist/streaming POST] Starting request");
    const user = await getUserFromRequest(req);
    if (!user) {
      console.log(
        "[API /api/wishlist/streaming POST] Unauthorized - no user found",
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      console.log(
        "[API /api/wishlist/streaming POST] Invalid JSON in request body",
      );
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { movieId, title } = body;
    if (typeof movieId !== "number" || !title) {
      console.log(
        "[API /api/wishlist/streaming POST] Invalid request body format",
      );
      return NextResponse.json(
        { error: "movieId (number) and title (string) required" },
        { status: 400 },
      );
    }

    // Find the wishlist item
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: { userId_movieId: { userId: user.id, movieId } },
    });

    if (!wishlistItem) {
      console.log(
        "[API /api/wishlist/streaming POST] Movie not in wishlist:",
        movieId,
      );
      return NextResponse.json(
        { error: "Movie not in wishlist" },
        { status: 404 },
      );
    }

    console.log(
      `[API /api/wishlist/streaming POST] Fetching streaming data for TMDB ID: ${movieId}, Title: "${title}"`,
    );

    // Helper to parse price from string (removes currency symbols)
    const parsePrice = (priceValue: any): number => {
      if (typeof priceValue === "number") return priceValue;
      if (typeof priceValue === "string") {
        // Remove currency symbols and other non-numeric characters except . and ,
        const cleaned = priceValue.replace(/[^0-9.,]/g, "").replace(",", ".");
        return parseFloat(cleaned);
      }
      return NaN;
    };

    // Fetch offers from JustWatch
    const offers = await justWatchClient.getOffersByTmdbId(movieId, title);
    console.log(
      `[API /api/wishlist/streaming POST] Found ${offers.length} offers`,
    );
    console.log(
      `[API /api/wishlist/streaming POST] Offers:`,
      JSON.stringify(offers, null, 2),
    );

    // Format offers
    const formatted = justWatchClient.formatOffers(offers);
    const cheapestRent = justWatchClient.getCheapestPrice(offers, "rent");
    const cheapestBuy = justWatchClient.getCheapestPrice(offers, "buy");

    // Parse prices to numbers if they come as strings with currency symbols
    if (cheapestRent && cheapestRent.price) {
      const parsed = parsePrice(cheapestRent.price);
      if (!isNaN(parsed)) {
        cheapestRent.price = parsed;
      }
    }
    if (cheapestBuy && cheapestBuy.price) {
      const parsed = parsePrice(cheapestBuy.price);
      if (!isNaN(parsed)) {
        cheapestBuy.price = parsed;
      }
    }

    console.log(`[API /api/wishlist/streaming POST] Formatted offers:`, {
      flatrate: formatted.flatrate.length,
      rent: formatted.rent.length,
      buy: formatted.buy.length,
      free: formatted.free.length,
      ads: formatted.ads.length,
      cheapestRent,
      cheapestBuy,
    });

    // Convert to our streaming data format
    const streamingData = {
      movieId,
      tmdbId: movieId,
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

    // Update the wishlist item with streaming data
    const updatedItem = await prisma.wishlistItem.update({
      where: { id: wishlistItem.id },
      data: {
        streamingData: streamingData as any,
        lastStreamingUpdate: new Date(),
      },
    });

    console.log(
      "[API /api/wishlist/streaming POST] Updated streaming data for:",
      movieId,
    );
    console.log("[API /api/wishlist/streaming POST] Streaming data saved:", {
      movieId: updatedItem.movieId,
      hasStreamingData: !!updatedItem.streamingData,
      lastUpdate: updatedItem.lastStreamingUpdate,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedItem.id,
        movieId: updatedItem.movieId,
        streamingData: updatedItem.streamingData,
        lastStreamingUpdate: updatedItem.lastStreamingUpdate,
      },
    });
  } catch (error: any) {
    console.error("[API /api/wishlist/streaming POST] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
