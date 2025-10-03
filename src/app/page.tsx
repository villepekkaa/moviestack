"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Home page: fetches popular + top-rated movies from TMDB (if NEXT_PUBLIC_TMDB_API_KEY is present)
 * and renders them in simple, modern horizontal carousels.
 *
 * Notes for deployment / testing:
 * - Provide your TMDB API key as NEXT_PUBLIC_TMDB_API_KEY in your environment.
 *   Example: NEXT_PUBLIC_TMDB_API_KEY=your_key_here
 * - If the API key is missing, the page will show a helpful message and a small set of sample movies.
 */

type Movie = {
  id: number;
  title: string;
  poster_path?: string | null;
  release_date?: string;
  vote_average?: number;
  overview?: string | null;
};

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const STORAGE_KEY = "moviestack.collection.v1";

const SAMPLE_MOVIES: Movie[] = [
  {
    id: 101,
    title: "Sample: The Great Adventure",
    poster_path: null,
    release_date: "2021-05-01",
    vote_average: 7.8,
    overview: "Sample movie description",
  },
  {
    id: 102,
    title: "Sample: Quiet Moments",
    poster_path: null,
    release_date: "2019-09-10",
    vote_average: 7.1,
    overview: "Sample movie description",
  },
  {
    id: 103,
    title: "Sample: Laugh Out Loud",
    poster_path: null,
    release_date: "2022-04-22",
    vote_average: 6.9,
    overview: "Sample movie description",
  },
  {
    id: 104,
    title: "Sample: Space Between Stars",
    poster_path: null,
    release_date: "2020-11-12",
    vote_average: 8.0,
    overview: "Sample movie description",
  },
];

function useTmdbFetcher(endpoint: string, apiKey: string | undefined) {
  const [items, setItems] = useState<Movie[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      // First try the server proxy route (/api/tmdb/:endpoint). This keeps your TMDB key secret if it's
      // configured server-side as TMDB_API_KEY and the proxy is available.
      try {
        const proxyRes = await fetch(`/api/tmdb/${endpoint}`);
        if (proxyRes.ok) {
          const data = await proxyRes.json();
          if (cancelled) return;
          const mapped: Movie[] = (data.results || []).map((r: any) => ({
            id: r.id,
            title: r.title || r.name,
            poster_path: r.poster_path,
            release_date: r.release_date,
            vote_average: r.vote_average,
            overview: r.overview,
          }));
          setItems(mapped);
          setError(null);
          return;
        } else {
          // If proxy returned JSON with an error field, we'll fall back to client fetch below.
          try {
            const payload = await proxyRes.json();
            if (!payload || !payload.error) {
              throw new Error(`Proxy error ${proxyRes.status}`);
            }
            // else: continue to client-side fallback
          } catch (e) {
            // Parsing failed or other error — fall through to client fetch
          }
        }
      } catch (proxyErr) {
        // Proxy unavailable or network error — fall back to client-side fetch
      }

      // Fallback: attempt client-side fetch using NEXT_PUBLIC_TMDB_API_KEY if provided
      if (!apiKey) {
        setItems(null);
        setError("No API key provided (and server proxy unavailable)");
        return;
      }

      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${encodeURIComponent(
            apiKey,
          )}&language=en-US&page=1`,
        );
        if (!res.ok) throw new Error(`TMDB error ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const mapped: Movie[] = (data.results || []).map((r: any) => ({
          id: r.id,
          title: r.title || r.name,
          poster_path: r.poster_path,
          release_date: r.release_date,
          vote_average: r.vote_average,
          overview: r.overview,
        }));
        setItems(mapped);
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message ?? "Fetch error");
        setItems(null);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [endpoint, apiKey]);

  return { items, error };
}

function Carousel({ movies, title }: { movies: Movie[]; title: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isAuthenticated } = useAuth();
  const [savedMovies, setSavedMovies] = useState<{ [id: string]: Movie }>({});

  // Load saved movies from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        const map: { [id: string]: Movie } = {};
        arr.forEach((m: Movie) => (map[String(m.id)] = m));
        setSavedMovies(map);
      }
    } catch {}
  }, []);

  function toggleSave(movie: Movie) {
    setSavedMovies((prev) => {
      const newMap = { ...prev };
      const key = String(movie.id);
      if (newMap[key]) {
        delete newMap[key];
      } else {
        newMap[key] = movie;
      }
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(Object.values(newMap)),
        );
      } catch {}
      return newMap;
    });
  }

  function scrollByOffset(offset: number) {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: offset, behavior: "smooth" });
  }

  function prev() {
    const el = containerRef.current;
    if (!el) return;
    scrollByOffset(-el.clientWidth * 0.7);
  }

  function next() {
    const el = containerRef.current;
    if (!el) return;
    scrollByOffset(el.clientWidth * 0.7);
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={prev}
            aria-label={`${title} previous`}
            className="p-2 rounded-full bg-white/80 dark:bg-black/80 shadow hover:bg-white dark:hover:bg-black transition-colors"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label={`${title} next`}
            className="p-2 rounded-full bg-white/80 dark:bg-black/80 shadow hover:bg-white dark:hover:bg-black transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-2"
        role="list"
      >
        {movies.map((m) => {
          const isSaved = !!savedMovies[String(m.id)];
          const posterSrc = m.poster_path
            ? m.poster_path.startsWith("http")
              ? m.poster_path
              : `${IMAGE_BASE}${m.poster_path}`
            : "/img/poster-placeholder.png";

          return (
            <div
              key={m.id}
              role="listitem"
              className="flex-shrink-0 w-[150px] sm:w-[170px] md:w-[190px] snap-start group"
            >
              <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 transition-transform duration-200 group-hover:-translate-y-2 group-hover:shadow-xl">
                {/* Poster with fixed aspect ratio */}
                <div className="relative w-full aspect-[2/3] overflow-hidden">
                  {m.poster_path ? (
                    <Image
                      src={posterSrc}
                      alt={m.title}
                      fill
                      sizes="(max-width: 640px) 150px, (max-width: 768px) 170px, 190px"
                      className="object-cover"
                      priority={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground px-2 text-center">
                      No image
                    </div>
                  )}
                </div>

                {/* Save button overlay */}
                {isAuthenticated && (
                  <button
                    onClick={() => toggleSave(m)}
                    className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all ${
                      isSaved
                        ? "bg-green-500/90 text-white"
                        : "bg-black/50 text-white hover:bg-black/70"
                    }`}
                    aria-label={
                      isSaved ? "Remove from collection" : "Add to collection"
                    }
                    title={
                      isSaved ? "Remove from collection" : "Add to collection"
                    }
                  >
                    {isSaved ? (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {/* Movie info */}
              <div className="mt-2 px-1">
                <h3 className="text-sm font-medium truncate" title={m.title}>
                  {m.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {m.release_date ? m.release_date.slice(0, 4) : "—"} ·{" "}
                  {m.vote_average ? Number(m.vote_average).toFixed(1) : "—"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  const apiKey = (process.env.NEXT_PUBLIC_TMDB_API_KEY as string) || "";
  const { isAuthenticated } = useAuth();

  const { items: popular, error: popularError } = useTmdbFetcher(
    "popular",
    apiKey,
  );
  const { items: topRated, error: topRatedError } = useTmdbFetcher(
    "top_rated",
    apiKey,
  );

  const popularMovies = popular ?? SAMPLE_MOVIES;
  const topRatedMovies = topRated ?? SAMPLE_MOVIES;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">MovieStack</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Discover popular and top-rated movies from The Movie Database.
          {isAuthenticated &&
            " Click the + icon to save movies to your collection!"}
        </p>
      </header>

      <main>
        <Carousel movies={popularMovies} title="Most Popular" />
        <Carousel movies={topRatedMovies} title="Top Rated" />

        {(popularError || topRatedError) && (
          <div className="mt-4 text-sm text-red-600">
            {popularError && <div>Popular fetch error: {popularError}</div>}
            {topRatedError && <div>Top rated fetch error: {topRatedError}</div>}
          </div>
        )}
      </main>

      <footer className="mt-12 text-sm text-center text-muted-foreground">
        Data from{" "}
        <a href="https://www.themoviedb.org/" className="underline">
          themoviedb.org
        </a>
      </footer>
    </div>
  );
}
