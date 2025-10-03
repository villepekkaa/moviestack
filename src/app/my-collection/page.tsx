"use client";
import React, { useEffect, useState } from "react";
import { useRequireAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";

type TmdbMovie = {
  id: number;
  title: string;
  poster_path?: string | null;
  release_date?: string | null;
  vote_average?: number | null;
  overview?: string | null;
};

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const PLACEHOLDER = "/img/poster-placeholder.png";
const STORAGE_KEY = "moviestack.collection.v1";

export default function MyCollectionPage() {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const [movies, setMovies] = useState<TmdbMovie[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCollection();
    }
  }, [isAuthenticated]);

  const loadCollection = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const collection = JSON.parse(raw);
        setMovies(Array.isArray(collection) ? collection : []);
      }
    } catch (error) {
      console.error("Failed to load collection:", error);
    }
  };

  const removeMovie = (movieId: number) => {
    try {
      const updated = movies.filter((m) => m.id !== movieId);
      setMovies(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to remove movie:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useRequireAuth
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">My Collection</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Movies you've saved for later. ({movies.length} item
          {movies.length !== 1 ? "s" : ""})
        </p>
      </header>

      {movies.length === 0 ? (
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
          {movies.map((movie) => {
            const posterSrc = movie.poster_path
              ? `${IMAGE_BASE}${movie.poster_path}`
              : PLACEHOLDER;

            return (
              <article key={movie.id} className="rounded-md bg-transparent">
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

                  <div className="px-3 py-2">
                    <h3 className="font-medium text-sm line-clamp-2">
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

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => removeMovie(movie.id)}
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
