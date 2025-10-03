"use client";
import React, { useEffect, useRef, useState } from "react";
import { useCollection } from "@/contexts/CollectionContext";
import { useAuth } from "@/contexts/AuthContext";

type TmdbMovie = {
  id: number;
  title: string;
  poster_path?: string | null;
  release_date?: string | null;
  vote_average?: number | null;
  overview?: string | null;
};

type SearchResponse = {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
};

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const PLACEHOLDER = "/img/poster-placeholder.png";

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

export default function SearchInstantClient({
  initialQuery,
  initialResults,
  initialTotalPages,
  initialPage,
}: {
  initialQuery: string;
  initialResults: TmdbMovie[];
  initialTotalPages: number;
  initialPage: number;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<TmdbMovie[]>(initialResults);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Collection hooks
  const { isAuthenticated } = useAuth();
  const {
    isInCollection,
    addToCollection,
    removeFromCollection,
    isSaving,
    isRemoving,
  } = useCollection();

  // Save/Unsave logic
  async function toggleSave(movie: TmdbMovie) {
    const inCollection = isInCollection(movie.id);
    if (inCollection) {
      await removeFromCollection(movie.id);
    } else {
      await addToCollection(movie);
    }
  }

  // Debounced search
  const fetchResults = useRef(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setTotalPages(0);
        setPage(1);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&page=1`,
        );
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }
        const data: SearchResponse = await res.json();
        setResults(data.results);
        setTotalPages(data.total_pages);
        setPage(1);
        setError(null);
      } catch (err: any) {
        setError(
          typeof err?.message === "string"
            ? err.message
            : "Failed to fetch search results.",
        );
      } finally {
        setLoading(false);
      }
    }, 350),
  ).current;

  // Watch query changes for instant search
  useEffect(() => {
    if (query !== initialQuery) {
      fetchResults(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Pagination (client-side only for instant search)
  async function goToPage(newPage: number) {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&page=${newPage}`,
      );
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data: SearchResponse = await res.json();
      setResults(data.results);
      setTotalPages(data.total_pages);
      setPage(newPage);
      setError(null);
    } catch (err: any) {
      setError(
        typeof err?.message === "string"
          ? err.message
          : "Failed to fetch search results.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form
        role="search"
        aria-label="Search movies"
        className="mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          // No-op: instant search handles updates
        }}
      >
        <div className="flex gap-2">
          <input
            name="q"
            value={query}
            aria-label="Search movies"
            placeholder="Search movies by title..."
            className="flex-1 rounded-md border px-3 py-2 focus:outline-none focus:ring"
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
      </form>

      {loading && (
        <div className="mb-4 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {!query.trim() ? (
        <div className="rounded-md border border-gray-200 dark:border-gray-800 p-6 text-center">
          <p className="text-sm">
            Enter a query above or use the search in the header.
          </p>
        </div>
      ) : results.length === 0 && !loading ? (
        <div className="rounded-md border border-gray-200 dark:border-gray-800 p-6 text-center">
          <p className="text-sm">
            No results found for “{query}”. Try another keyword.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map((m) => {
              const posterSrc = m.poster_path
                ? `${IMAGE_BASE}${m.poster_path}`
                : PLACEHOLDER;
              const isSaved = isInCollection(m.id);
              return (
                <article key={m.id} className="rounded-md bg-transparent">
                  <div className="rounded-md overflow-hidden shadow-sm bg-gray-900/10">
                    <div className="bg-gray-100 dark:bg-gray-800 w-full aspect-[2/3] relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={posterSrc}
                        alt={m.title}
                        width={500}
                        height={750}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center",
                        }}
                        loading="lazy"
                      />
                    </div>
                    <div className="px-3 py-2">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {m.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {m.release_date ? m.release_date.slice(0, 4) : "—"} ·{" "}
                        {m.vote_average
                          ? Number(m.vote_average).toFixed(1)
                          : "—"}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        {isAuthenticated && (
                          <button
                            type="button"
                            className={`save-toggle rounded px-3 py-1 text-sm font-medium border ${
                              isSaved ? "bg-foreground text-background" : ""
                            }`}
                            aria-pressed={isSaved}
                            onClick={() => toggleSave(m)}
                            disabled={isSaving || isRemoving}
                          >
                            {isSaving || isRemoving
                              ? "..."
                              : isSaved
                                ? "Saved"
                                : "Save"}
                          </button>
                        )}
                        <a
                          href={`https://www.themoviedb.org/movie/${m.id}`}
                          className="text-xs text-muted-foreground hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View on TMDB
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                className={`rounded-full p-2 border bg-white/5 ${
                  page <= 1 ? "opacity-40 pointer-events-none" : ""
                }`}
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                ‹
              </button>
              <div className="text-sm text-muted-foreground">
                Page {page} {totalPages ? `of ${totalPages}` : ""}
              </div>
              <button
                className={`rounded-full p-2 border bg-white/5 ${
                  page >= totalPages ? "opacity-40 pointer-events-none" : ""
                }`}
                aria-label="Next page"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
