"use client";
import React from "react";
import { useRequireAuth } from "@/contexts/AuthContext";
import { useCollection } from "@/contexts/CollectionContext";
import Image from "next/image";
import Link from "next/link";

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

export default function MyCollectionPage() {
  useRequireAuth();
  const { collection, isLoading, removeFromCollection } = useCollection();

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">My Collection</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Movies you've saved for later. ({collection.length} item
          {collection.length !== 1 ? "s" : ""})
        </p>
      </header>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading...</div>
      ) : collection.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
          <p className="text-lg mb-3">No items in your collection yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Use the search to find movies and add them to your collection.
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
          {collection.map((item) => {
            const movie = item.movieData;
            const posterSrc = movie.poster_path
              ? `${IMAGE_BASE}${movie.poster_path}`
              : PLACEHOLDER;

            return (
              <article key={item.id} className="rounded-md bg-transparent">
                <div className="rounded-md overflow-hidden shadow-sm bg-gray-900/10">
                  <div className="bg-gray-100 dark:bg-gray-800 w-full aspect-[2/3] relative overflow-hidden">
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

                  <div className="px-3 py-2 flex flex-col h-full">
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

                    <div className="mt-3 flex items-end justify-between gap-2 flex-1">
                      <button
                        type="button"
                        onClick={() => removeFromCollection(movie.id)}
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
