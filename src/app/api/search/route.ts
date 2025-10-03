import { NextRequest, NextResponse } from "next/server";

const TMDB_API_URL = "https://api.themoviedb.org/3/search/movie";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function getEnvKey(): { keyV3?: string; keyV4?: string } {
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

  return { keyV3, keyV4 };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);

  if (!q) {
    return NextResponse.json(
      {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      },
      { status: 200 }
    );
  }

  const { keyV3, keyV4 } = getEnvKey();

  if (!keyV3 && !keyV4) {
    return NextResponse.json(
      { error: "TMDB server key not configured." },
      { status: 500 }
    );
  }

  try {
    const tmdbUrl = new URL(TMDB_API_URL);
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
      return NextResponse.json(
        { error: `TMDB error ${res.status} - ${body}` },
        { status: res.status }
      );
    }
    const data = await res.json();

    // Only return the fields needed by the client
    const results = Array.isArray(data.results)
      ? data.results.map((m: any) => ({
          id: m.id,
          title: m.title,
          poster_path: m.poster_path,
          release_date: m.release_date,
          vote_average: m.vote_average,
          overview: m.overview,
        }))
      : [];

    return NextResponse.json({
      page: data.page || 1,
      results,
      total_pages: data.total_pages || 0,
      total_results: data.total_results || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          typeof err?.message === "string"
            ? err.message
            : "Failed to fetch search results.",
      },
      { status: 500 }
    );
  }
}
