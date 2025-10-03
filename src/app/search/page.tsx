import React from "react";
import dynamic from "next/dynamic";
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

type SearchResponse = {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
};

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const PLACEHOLDER = "/img/poster-placeholder.png";

/**
 * Server-rendered Search Page
 *
 * - Reads `q` and `page` from searchParams (server side).
 * - Fetches TMDB search results server-side using server env keys.
 * - Renders results server-side for fast first paint and SEO.
 * - Adds a small client script to handle Save/unsave to localStorage and toggle UI.
 *
 * Note: This file is a server component (no "use client" at top). A light client script
 * is injected to provide interactivity (saving to localStorage) without converting the
 * whole page to a client component.
 */
import SearchInstantClientWrapper from "../../components/SearchInstantClientWrapper";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string; page?: string };
}) {
  const q = (searchParams?.q ?? "").trim();
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);

  let data: SearchResponse | null = null;
  let fetchError: string | null = null;

  if (q) {
    try {
      // Determine server-side key: support v4 bearer tokens or v3 api_key
      const rawKey = process.env.TMDB_API_KEY;
      const explicitV4 =
        process.env.TMDB_V4_READ_TOKEN ||
        process.env.TMDB_READ_ACCESS_TOKEN ||
        process.env.TMDB_V4_TOKEN;

      let keyV3: string | undefined;
      let keyV4: string | undefined;

      if (typeof rawKey === "string" && rawKey.trim()) {
        const k = rawKey.trim();
        if (/^eyJ/.test(k)) keyV4 = k;
        else keyV3 = k;
      }
      if (!keyV4 && explicitV4) keyV4 = explicitV4;

      if (!keyV3 && !keyV4) {
        throw new Error("TMDB server key not configured.");
      }

      const tmdbUrl = new URL("https://api.themoviedb.org/3/search/movie");
      tmdbUrl.searchParams.set("query", q);
      tmdbUrl.searchParams.set("page", String(page));
      tmdbUrl.searchParams.set("language", "en-US");

      const headers: Record<string, string> = { Accept: "application/json" };
      if (keyV4) {
        headers["Authorization"] = `Bearer ${keyV4}`;
      } else if (keyV3) {
        tmdbUrl.searchParams.set("api_key", keyV3);
      }

      const res = await fetch(tmdbUrl.toString(), { headers });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`TMDB error ${res.status} - ${body}`);
      }
      data = (await res.json()) as SearchResponse;
    } catch (err: any) {
      fetchError =
        typeof err?.message === "string"
          ? err.message
          : "Failed to fetch search results.";
      data = null;
    }
  }

  // Normalize results for rendering
  const results = data?.results ?? [];
  const totalPages = data?.total_pages ?? 0;
  const currentPage = data?.page ?? page;

  // Render hybrid: server-rendered initial state, client-side instant search
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Search</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Server-rendered search results from The Movie Database.
        </p>
      </header>
      <SearchInstantClientWrapper
        initialQuery={q}
        initialResults={results}
        initialTotalPages={totalPages}
        initialPage={currentPage}
      />
    </div>
  );
}
