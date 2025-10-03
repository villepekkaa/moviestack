"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useCollection } from "@/contexts/CollectionContext";

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

function useTmdbFetcher(endpoint: string, _apiKey: string | undefined) {
  const [items, setItems] = useState<Movie[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const proxyRes = await fetch(`/api/tmdb/${endpoint}`);
        if (!proxyRes.ok) {
          const payload = await proxyRes.json().catch(() => null);
          throw new Error(payload?.error || `Proxy error ${proxyRes.status}`);
        }
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
  }, [endpoint]);

  return { items, error };
}

// Fetch genres from TMDB
function useGenresFetcher() {
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchGenres() {
      try {
        const res = await fetch("/api/tmdb/genre/movie/list");
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error || `Proxy error ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        setGenres(data.genres || []);
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message ?? "Fetch error");
        setGenres([]);
      }
    }
    fetchGenres();
    return () => {
      cancelled = true;
    };
  }, []);

  return { genres, error };
}

// Fetch movies for a genre
function useGenreMoviesFetcher(genreId: number | null) {
  const [items, setItems] = useState<Movie[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!genreId) {
      setItems(null);
      setError(null);
      return;
    }
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await fetch(
          `/api/tmdb/discover/movie?with_genres=${genreId}`,
        );
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error || `Proxy error ${res.status}`);
        }
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
  }, [genreId]);

  return { items, error };
}

function Carousel({ movies, title }: { movies: Movie[]; title: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isAuthenticated } = useAuth();
  const {
    isInCollection,
    addToCollection,
    removeFromCollection,
    isSaving,
    isRemoving,
  } = useCollection();

  async function toggleSave(movie: Movie) {
    const inCollection = isInCollection(movie.id);
    if (inCollection) {
      await removeFromCollection(movie.id);
    } else {
      await addToCollection(movie);
    }
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
          const isSaved = isInCollection(m.id);
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
                    disabled={isSaving || isRemoving}
                    className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all disabled:opacity-50 ${
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

  const { items: trending, error: trendingError } = useTmdbFetcher(
    "trending/movie/day",
    apiKey,
  );
  const { items: popular, error: popularError } = useTmdbFetcher(
    "movie/popular",
    apiKey,
  );
  const { items: topRated, error: topRatedError } = useTmdbFetcher(
    "movie/top_rated",
    apiKey,
  );

  const trendingMovies = trending ?? SAMPLE_MOVIES;
  const popularMovies = popular ?? SAMPLE_MOVIES;
  const topRatedMovies = topRated ?? SAMPLE_MOVIES;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">MovieStack</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Discover trending, popular, top-rated, and genre movies from The Movie
          Database.
          {isAuthenticated &&
            " Click the + icon to save movies to your collection!"}
        </p>
      </header>

      <main>
        <Carousel movies={trendingMovies} title="Trending Now" />
        <Carousel movies={popularMovies} title="Most Popular" />
        <Carousel movies={topRatedMovies} title="Top Rated" />

        {(trendingError || popularError || topRatedError) && (
          <div className="mt-4 text-sm text-red-600">
            {trendingError && <div>Trending fetch error: {trendingError}</div>}
            {popularError && <div>Popular fetch error: {popularError}</div>}
            {topRatedError && <div>Top rated fetch error: {topRatedError}</div>}
          </div>
        )}

        {/* Genre Listing and Genre Movies */}
        <GenreSection />
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

// GenreSection component
function GenreSection() {
  const { genres, error: genresError } = useGenresFetcher();
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const { items: genreMovies, error: genreMoviesError } =
    useGenreMoviesFetcher(selectedGenre);

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold mb-4">Browse by Genre</h2>
      {genresError && (
        <div className="mb-4 text-red-600 text-sm">
          Genre fetch error: {genresError}
        </div>
      )}
      <div className="relative mb-6">
        {/* Left arrow */}
        <button
          type="button"
          aria-label="Scroll genres left"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 rounded-full shadow p-1.5 border
            bg-white text-black border-gray-300 hover:bg-gray-100
            dark:bg-white dark:text-black dark:border-gray-300 dark:hover:bg-gray-200
            transition-colors"
          style={{ display: "block" }}
          onClick={() => {
            const el = document.getElementById("genre-scroll-bar");
            if (el) el.scrollBy({ left: -200, behavior: "smooth" });
          }}
        >
          <svg width={18} height={18} viewBox="0 0 20 20" fill="none">
            <path
              d="M13 16l-5-6 5-6"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* Genre scroll bar */}
        <div
          id="genre-scroll-bar"
          className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-8"
          style={{ scrollBehavior: "smooth" }}
        >
          {genres.map((genre) => (
            <button
              key={genre.id}
              className={`px-4 py-1.5 rounded-full border text-sm whitespace-nowrap transition-colors ${
                selectedGenre === genre.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-foreground hover:bg-gray-100 dark:hover:bg-gray-900"
              }`}
              onClick={() =>
                setSelectedGenre(selectedGenre === genre.id ? null : genre.id)
              }
            >
              {genre.name}
            </button>
          ))}
        </div>
        {/* Right arrow */}
        <button
          type="button"
          aria-label="Scroll genres right"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 rounded-full shadow p-1.5 border
            bg-white text-black border-gray-300 hover:bg-gray-100
            dark:bg-white dark:text-black dark:border-gray-300 dark:hover:bg-gray-200
            transition-colors"
          style={{ display: "block" }}
          onClick={() => {
            const el = document.getElementById("genre-scroll-bar");
            if (el) el.scrollBy({ left: 200, behavior: "smooth" });
          }}
        >
          <svg width={18} height={18} viewBox="0 0 20 20" fill="none">
            <path
              d="M7 4l5 6-5 6"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* Fade overlays */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-8 z-10"
          style={{
            background:
              "linear-gradient(to right, var(--background, #fff) 70%, transparent 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-8 z-10"
          style={{
            background:
              "linear-gradient(to left, var(--background, #fff) 70%, transparent 100%)",
          }}
        />
      </div>
      {selectedGenre && (
        <>
          <h3 className="text-lg font-medium mb-2">
            {genres.find((g) => g.id === selectedGenre)?.name} Movies
          </h3>
          {genreMoviesError && (
            <div className="mb-4 text-red-600 text-sm">
              Genre movies fetch error: {genreMoviesError}
            </div>
          )}
          {genreMovies ? (
            <Carousel movies={genreMovies} title="" />
          ) : (
            <div className="text-muted-foreground text-sm">
              Loading movies...
            </div>
          )}
        </>
      )}
    </section>
  );
}
