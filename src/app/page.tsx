"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

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
};

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const SAMPLE_MOVIES: Movie[] = [
  {
    id: 101,
    title: "Sample: The Great Adventure",
    poster_path: null,
    release_date: "2021-05-01",
    vote_average: 7.8,
  },
  {
    id: 102,
    title: "Sample: Quiet Moments",
    poster_path: null,
    release_date: "2019-09-10",
    vote_average: 7.1,
  },
  {
    id: 103,
    title: "Sample: Laugh Out Loud",
    poster_path: null,
    release_date: "2022-04-22",
    vote_average: 6.9,
  },
  {
    id: 104,
    title: "Sample: Space Between Stars",
    poster_path: null,
    release_date: "2020-11-12",
    vote_average: 8.0,
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
            className="p-2 rounded-full bg-white/80 dark:bg-black/80 shadow"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label={`${title} next`}
            className="p-2 rounded-full bg-white/80 dark:bg-black/80 shadow"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="carousel-track no-scrollbar"
        role="list"
      >
        {movies.map((m) => (
          <div
            key={m.id}
            role="listitem"
            className="min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px] flex-shrink-0 carousel-card"
          >
            <div className="aspect-[2/3] bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden carousel-poster">
              {m.poster_path ? (
                <Image
                  src={
                    m.poster_path
                      ? m.poster_path.startsWith("http")
                        ? m.poster_path
                        : `${IMAGE_BASE}${m.poster_path}`
                      : "/img/poster-placeholder.png"
                  }
                  alt={m.title}
                  width={200}
                  height={300}
                  sizes="(max-width: 640px) 40vw, (max-width: 1024px) 28vw, 200px"
                  style={{
                    objectFit: "cover",
                    objectPosition: "center",
                    position: "static",
                    width: "100%",
                    height: "auto",
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground px-2 text-center carousel-poster">
                  No image
                </div>
              )}
            </div>

            <h3 className="mt-2 text-sm font-medium truncate">{m.title}</h3>
            <p className="text-xs text-muted-foreground">
              {m.release_date ? m.release_date.slice(0, 4) : ""} ·{" "}
              {m.vote_average ?? ""}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const apiKey = (process.env.NEXT_PUBLIC_TMDB_API_KEY as string) || "";

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
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">MovieStack</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Discover popular and top-rated movies from The Movie Database.
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
