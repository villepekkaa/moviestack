"use client";
import React, { useEffect, useRef } from "react";
import { useRequireAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import Image from "next/image";
import Link from "next/link";
import { StreamingData } from "@/types/justwatch";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const PLACEHOLDER = "/img/poster-placeholder.png";

// Helper to format date
function formatAddedAt(iso: string | undefined) {
  if (!iso) return "Unknown";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "Unknown";
  return `Added ${date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
}

export default function MyWishlistPage() {
  useRequireAuth();
  const {
    wishlist,
    isLoading,
    removeFromWishlist,
    fetchStreamingData,
    isFetchingStreaming,
  } = useWishlist();

  // Fetch streaming data for all wishlist items on mount and when list changes
  useEffect(() => {
    if (wishlist.length === 0) return;

    // Fetch streaming data for each item
    const fetchAll = async () => {
      for (const item of wishlist) {
        // Check if item already has recent streaming data
        if (item.streamingData && item.lastStreamingUpdate) {
          const lastUpdate = new Date(item.lastStreamingUpdate);
          const hoursSinceUpdate =
            (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
          if (hoursSinceUpdate < 24) {
            continue; // Skip if data is less than 24 hours old
          }
        }
        // Fetch streaming data for this item
        await fetchStreamingData(item.movieId);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlist.length]); // Only re-run when wishlist length changes

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">My Wishlist 🎬</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Movies you want to watch with streaming availability in Finland. (
          {wishlist.length} item
          {wishlist.length !== 1 ? "s" : ""})
        </p>
        {isFetchingStreaming && (
          <p className="mt-2 text-xs text-blue-600">
            Fetching streaming availability...
          </p>
        )}
      </header>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading...</div>
      ) : wishlist.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
          <p className="text-lg mb-3">No items in your wishlist yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Use the search to find movies and add them to your wishlist.
          </p>
          <Link
            href="/search"
            className="inline-block px-4 py-2 bg-foreground text-background rounded-md hover:opacity-90 transition-opacity"
          >
            Browse Movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((item) => {
            const movie = item.movieData;
            const posterSrc = movie.poster_path
              ? `${IMAGE_BASE}${movie.poster_path}`
              : PLACEHOLDER;
            const streaming = item.streamingData as StreamingData | null;

            // Debug log
            console.log(`Movie ${movie.title} streaming data:`, streaming);
            console.log(`  - Has streamingData: ${!!streaming}`);
            console.log(
              `  - flatrate count: ${streaming?.flatrate?.length || 0}`,
            );
            console.log(`  - rent count: ${streaming?.rent?.length || 0}`);
            console.log(`  - buy count: ${streaming?.buy?.length || 0}`);
            console.log(
              `  - cheapestRent: ${streaming?.cheapestRent ? JSON.stringify(streaming.cheapestRent) : "null"}`,
            );
            console.log(
              `  - cheapestBuy: ${streaming?.cheapestBuy ? JSON.stringify(streaming.cheapestBuy) : "null"}`,
            );
            if (streaming?.flatrate && streaming.flatrate.length > 0) {
              console.log(
                `  - flatrate providers:`,
                streaming.flatrate.map((o) => o.providerName),
              );
            }

            return (
              <article
                key={item.id}
                className="rounded-md bg-transparent flex flex-col h-full"
              >
                <div className="rounded-md overflow-hidden shadow-sm bg-gray-900/10 flex flex-col h-full">
                  <div className="bg-gray-100 dark:bg-gray-800 w-full aspect-[2/3] relative overflow-hidden flex-shrink-0">
                    <Image
                      src={posterSrc}
                      alt={movie.title}
                      width={500}
                      height={750}
                      sizes="(max-width: 640px) 40vw, (max-width: 1024px) 28vw, 200px"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                      }}
                    />
                  </div>

                  <div className="px-3 py-3 flex flex-col flex-1">
                    <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5em]">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {movie.release_date
                        ? movie.release_date.slice(0, 4)
                        : "—"}{" "}
                      ·{" "}
                      {movie.vote_average
                        ? Number(movie.vote_average).toFixed(1)
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatAddedAt(item.addedAt)}
                    </p>

                    {/* Streaming availability */}
                    <div className="mt-2 text-xs flex-1">
                      {!streaming && !isFetchingStreaming && (
                        <div className="text-yellow-600 dark:text-yellow-400 italic">
                          Loading streaming data...
                        </div>
                      )}
                      {streaming && (
                        <>
                          {streaming.flatrate &&
                            streaming.flatrate.length > 0 && (
                              <div className="mb-1">
                                <span className="font-semibold text-green-700 dark:text-green-400">
                                  Streaming:
                                </span>{" "}
                                <span className="text-muted-foreground">
                                  {[
                                    ...new Set(
                                      streaming.flatrate.map(
                                        (o) => o.providerName,
                                      ),
                                    ),
                                  ].join(", ")}
                                </span>
                              </div>
                            )}
                          {streaming.cheapestRent &&
                            !isNaN(Number(streaming.cheapestRent.price)) &&
                            Number(streaming.cheapestRent.price) > 0 && (
                              <div className="mb-1">
                                <span className="font-semibold text-blue-700 dark:text-blue-400">
                                  Rent:
                                </span>{" "}
                                <span className="text-muted-foreground">
                                  {Number(streaming.cheapestRent.price).toFixed(
                                    2,
                                  )}{" "}
                                  {streaming.cheapestRent.currency} (
                                  {streaming.cheapestRent.provider})
                                </span>
                              </div>
                            )}
                          {streaming.cheapestBuy &&
                            !isNaN(Number(streaming.cheapestBuy.price)) &&
                            Number(streaming.cheapestBuy.price) > 0 && (
                              <div className="mb-1">
                                <span className="font-semibold text-purple-700 dark:text-purple-400">
                                  Buy:
                                </span>{" "}
                                <span className="text-muted-foreground">
                                  {Number(streaming.cheapestBuy.price).toFixed(
                                    2,
                                  )}{" "}
                                  {streaming.cheapestBuy.currency} (
                                  {streaming.cheapestBuy.provider})
                                </span>
                              </div>
                            )}
                          {(!streaming.flatrate ||
                            streaming.flatrate.length === 0) &&
                            !streaming.cheapestRent &&
                            !streaming.cheapestBuy && (
                              <div className="text-muted-foreground italic">
                                Not available in Finland
                              </div>
                            )}
                        </>
                      )}
                    </div>

                    <div className="mt-auto pt-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(movie.id)}
                          className="rounded px-3 py-1 text-sm font-medium border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>

                        <Link
                          href={`https://www.themoviedb.org/movie/${movie.id}`}
                          className="text-xs text-muted-foreground hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View on TMDB
                        </Link>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          console.log(
                            `Manually fetching streaming data for ${movie.title} (${movie.id})`,
                          );
                          fetchStreamingData(movie.id);
                        }}
                        disabled={isFetchingStreaming}
                        className="rounded px-3 py-1 text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        {isFetchingStreaming
                          ? "Fetching..."
                          : "🔄 Refresh Streaming Data"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
