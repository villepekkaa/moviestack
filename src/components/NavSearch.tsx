"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * NavSearch - small search input placed in the header.
 *
 * Behavior:
 * - Submitting the form (Enter) navigates to /search?q=... using client-side navigation.
 * - Clear button (✕) clears the input and focuses it.
 * - Escape clears and blurs the input.
 *
 * The visible "Search" button has been removed per request; the input itself handles submit.
 */
export default function NavSearch(): React.JSX.Element {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  function goToSearch(q: string) {
    const trimmed = q.trim();
    const target = trimmed
      ? `/search?q=${encodeURIComponent(trimmed)}`
      : "/search";
    router.push(target);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    goToSearch(query);
    setQuery("");
  }

  function onClear() {
    setQuery("");
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      inputRef.current?.blur();
      onClear();
    }
  }

  return (
    <form
      role="search"
      aria-label="Search site"
      onSubmit={onSubmit}
      className="flex items-center"
    >
      <label htmlFor="nav-search" className="sr-only">
        Search movies
      </label>

      <div className="relative">
        <input
          id="nav-search"
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search movies..."
          className="w-48 sm:w-64 md:w-80 bg-white/90 dark:bg-black/80 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring focus:ring-offset-1"
          aria-label="Search movies"
        />

        {query ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        ) : null}
      </div>
    </form>
  );
}
