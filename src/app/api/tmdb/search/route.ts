import { NextResponse } from "next/server";

/**
 * Server-side proxy for TMDB search endpoint.
 * Route: GET /api/tmdb/search?q=...&page=1
 *
 * - Supports v3 API keys (TMDB_API_KEY) and v4 read access tokens
 *   (TMDB_V4_READ_TOKEN or TMDB_READ_ACCESS_TOKEN or TMDB_V4_TOKEN).
 * - Prefers v4 bearer token when present; falls back to v3 api_key query param.
 * - Returns TMDB JSON as-is, or a helpful error JSON when misconfigured.
 *
 * Security: This route only runs server-side and never returns secret values.
 */

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();
    const page = url.searchParams.get("page") || "1";
    const language = url.searchParams.get("language") || "en-US";

    if (!q) {
      // Return an empty result set when no query provided
      return NextResponse.json({ results: [], total_results: 0 });
    }

    // Read env keys server-side (do not expose them)
    const rawKey = process.env.TMDB_API_KEY;
    const explicitV4 =
      process.env.TMDB_V4_READ_TOKEN ||
      process.env.TMDB_READ_ACCESS_TOKEN ||
      process.env.TMDB_V4_TOKEN;

    let keyV3: string | undefined = undefined;
    let keyV4: string | undefined = undefined;

    if (typeof rawKey === "string" && rawKey.trim()) {
      const k = rawKey.trim();
      if (/^eyJ/.test(k)) keyV4 = k;
      else keyV3 = k;
    }
    if (!keyV4 && explicitV4) keyV4 = explicitV4;

    if (!keyV3 && !keyV4) {
      return NextResponse.json(
        { error: "TMDB key not configured on server" },
        { status: 500 }
      );
    }

    // Build TMDB search URL
    const apiUrl = new URL("https://api.themoviedb.org/3/search/movie");
    apiUrl.searchParams.set("query", q);
    apiUrl.searchParams.set("page", page);
    apiUrl.searchParams.set("language", language);

    const headers: Record<string, string> = { Accept: "application/json" };
    const looksLikeV4 = (s?: string) =>
      typeof s === "string" && /^eyJ/.test(s.trim());
    const bearer = keyV4 ?? (looksLikeV4(keyV3) ? keyV3 : undefined);

    if (bearer) {
      headers["Authorization"] = `Bearer ${bearer}`;
    } else if (keyV3) {
      apiUrl.searchParams.set("api_key", keyV3);
    }

    const res = await fetch(apiUrl.toString(), { headers });
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Fallback: return raw text
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType || "text/plain" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 502 }
    );
  }
}
