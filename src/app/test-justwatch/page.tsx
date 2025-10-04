"use client";
import React, { useState } from "react";

export default function TestJustWatchPage() {
  const [movieTitle, setMovieTitle] = useState("The Matrix");
  const [tmdbId, setTmdbId] = useState("603");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function testJustWatch() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log(`Testing JustWatch API for: ${movieTitle} (TMDB: ${tmdbId})`);

      const res = await fetch(
        `/api/justwatch?tmdbId=${tmdbId}&title=${encodeURIComponent(movieTitle)}`,
      );

      const data = await res.json();
      console.log("API Response:", data);

      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      console.error("Test error:", err);
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">JustWatch API Test (Finland)</h1>

      <div className="bg-white dark:bg-gray-900 border rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Movie Title</label>
          <input
            type="text"
            value={movieTitle}
            onChange={(e) => setMovieTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter movie title"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">TMDB ID</label>
          <input
            type="text"
            value={tmdbId}
            onChange={(e) => setTmdbId(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter TMDB ID"
          />
        </div>

        <button
          onClick={testJustWatch}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test JustWatch API"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          <h3 className="font-bold mb-2">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-gray-50 dark:bg-gray-800 border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Results:</h2>

          {result.data ? (
            <>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">
                  Country: {result.data.country}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last Updated:{" "}
                  {new Date(result.data.lastUpdated).toLocaleString()}
                </p>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">
                  Streaming Services (Flatrate):
                </h3>
                {result.data.flatrate && result.data.flatrate.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {result.data.flatrate.map((offer: any, idx: number) => (
                      <li key={idx}>
                        {offer.providerName} - {offer.quality || "N/A"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No streaming services</p>
                )}
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Rental Options:</h3>
                {result.data.rent && result.data.rent.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {result.data.rent.map((offer: any, idx: number) => (
                      <li key={idx}>
                        {offer.providerName} - {offer.price} {offer.currency}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No rental options</p>
                )}
                {result.data.cheapestRent && (
                  <p className="mt-2 text-green-700 font-semibold">
                    Cheapest: {result.data.cheapestRent.price}{" "}
                    {result.data.cheapestRent.currency} (
                    {result.data.cheapestRent.provider})
                  </p>
                )}
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Purchase Options:</h3>
                {result.data.buy && result.data.buy.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {result.data.buy.map((offer: any, idx: number) => (
                      <li key={idx}>
                        {offer.providerName} - {offer.price} {offer.currency}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No purchase options</p>
                )}
                {result.data.cheapestBuy && (
                  <p className="mt-2 text-green-700 font-semibold">
                    Cheapest: {result.data.cheapestBuy.price}{" "}
                    {result.data.cheapestBuy.currency} (
                    {result.data.cheapestBuy.provider})
                  </p>
                )}
              </div>

              <details className="mt-6">
                <summary className="cursor-pointer font-semibold">
                  View Raw JSON
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded overflow-auto text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </>
          ) : (
            <p>No data returned</p>
          )}
        </div>
      )}

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-bold mb-2">Test Examples:</h3>
        <div className="space-y-2 text-sm">
          <button
            onClick={() => {
              setMovieTitle("The Matrix");
              setTmdbId("603");
            }}
            className="block text-blue-600 hover:underline"
          >
            The Matrix (TMDB: 603)
          </button>
          <button
            onClick={() => {
              setMovieTitle("Inception");
              setTmdbId("27205");
            }}
            className="block text-blue-600 hover:underline"
          >
            Inception (TMDB: 27205)
          </button>
          <button
            onClick={() => {
              setMovieTitle("Interstellar");
              setTmdbId("157336");
            }}
            className="block text-blue-600 hover:underline"
          >
            Interstellar (TMDB: 157336)
          </button>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        <p>
          <strong>Note:</strong> This page tests the JustWatch API integration
          for Finland (FI) locale. Check your browser console (F12) for detailed
          logs from the API.
        </p>
        <p className="mt-2">
          <strong>No authentication required</strong> - This endpoint is open
          for testing.
        </p>
      </div>
    </div>
  );
}
