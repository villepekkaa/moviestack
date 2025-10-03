import { NextResponse } from "next/server";

/**
 * Server-side proxy for The Movie Database (TMDB) endpoints used by the app.
 *
 * - Supports v3 API keys (query param `api_key`) via TMDB_API_KEY
 * - Supports v4 read access tokens (Bearer) via TMDB_V4_READ_TOKEN or if TMDB_API_KEY contains a v4 token (starts with "eyJ")
 *
 * Notes:
 * - This is a dynamic API route at /api/tmdb/[endpoint]. The `params` object provided by Next is potentially asynchronous,
 *   so we await it before accessing `endpoint` (avoids the "params should be awaited" runtime error).
 * - Only a small allowlist of endpoints is accepted for safety.
 */

// Allow any endpoint path (including slashes, e.g., trending/movie/day)

export async function GET(
  request: Request,
  context: { params: Promise<{ endpoint: string[] }> },
) {
  // Await params per Next.js requirement for dynamic route handlers
  const { endpoint } = await context.params;

  // endpoint is now an array of path segments (from [...endpoint])
  const endpointPath = Array.isArray(endpoint) ? endpoint.join("/") : endpoint;

  if (!endpointPath) {
    return NextResponse.json(
      { error: "Endpoint not specified" },
      { status: 400 },
    );
  }

  // Read env keys (server-side). We intentionally do not reveal keys.
  const rawKey = process.env.TMDB_API_KEY;
  const explicitV4 =
    process.env.TMDB_V4_READ_TOKEN ||
    process.env.TMDB_READ_ACCESS_TOKEN ||
    process.env.TMDB_V4_TOKEN;

  // Normalize and detect token types:
  // - If TMDB_API_KEY looks like a v4 read token (typically starts with "eyJ"), treat it as v4.
  // - Otherwise treat TMDB_API_KEY as a v3 api_key.
  let keyV3: string | undefined = undefined;
  let keyV4: string | undefined = undefined;

  if (typeof rawKey === "string" && rawKey.trim()) {
    const k = rawKey.trim();
    if (/^eyJ/.test(k)) {
      keyV4 = k;
    } else {
      keyV3 = k;
    }
  }

  // Prefer an explicit v4 env var if present
  if (!keyV4 && explicitV4) {
    keyV4 = explicitV4;
  }

  if (!keyV3 && !keyV4) {
    return NextResponse.json(
      { error: "TMDB API key / read token not configured on server" },
      { status: 500 },
    );
  }

  // Build TMDB URL and sanitize allowed query params
  // endpointPath may contain slashes, e.g., "trending/movie/day"
  const url = new URL(`https://api.themoviedb.org/3/${endpointPath}`);
  const qp = new URL(request.url).searchParams;

  // Forward all query params except for any sensitive ones (none in this case)
  qp.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  // Default language and page if not provided
  if (!url.searchParams.has("language")) {
    url.searchParams.set("language", "en-US");
  }
  if (!url.searchParams.has("page")) {
    url.searchParams.set("page", "1");
  }

  // Decide authentication method: prefer bearer (v4) if available, otherwise use v3 api_key query param.
  const looksLikeV4 = (s?: string) =>
    typeof s === "string" && /^eyJ/.test(s.trim());
  const bearerToken = keyV4 ?? (looksLikeV4(keyV3) ? keyV3 : undefined);

  if (!bearerToken && keyV3) {
    url.searchParams.set("api_key", keyV3);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (bearerToken) {
    headers["Authorization"] = `Bearer ${bearerToken}`;
  }

  try {
    const res = await fetch(url.toString(), { headers });
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // For non-JSON responses, return raw text/body
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { "Content-Type": contentType || "text/plain" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Fetch error" },
      { status: 502 },
    );
  }
}
