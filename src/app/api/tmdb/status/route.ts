import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const cwd = process.cwd();
  const envPath = path.join(cwd, ".env.local");

  let envFilePresent = false;
  let envFileSize: number | null = null;
  const keys: Array<{ key: string; masked: string | null }> = [];

  try {
    envFilePresent = fs.existsSync(envPath);
    if (envFilePresent) {
      const stat = fs.statSync(envPath);
      envFileSize = stat.size;

      // Read and parse the file safely — do NOT return raw values
      const raw = fs.readFileSync(envPath, { encoding: "utf8" });
      const lines = raw.split(/\r?\n/);
      for (const ln of lines) {
        const line = ln.trim();
        if (!line || line.startsWith("#")) continue;
        const idx = line.indexOf("=");
        if (idx === -1) continue;
        const k = line.slice(0, idx).trim();
        let v = line.slice(idx + 1).trim();

        // Strip surrounding quotes if any
        v = v.replace(/^['"]|['"]$/g, "");

        // Mask values: keep first 2 and last 2 characters if length > 4, else replace with stars
        let masked: string | null = null;
        if (v.length === 0) masked = null;
        else if (v.length <= 4) masked = "*".repeat(v.length);
        else masked = `${v.slice(0, 2)}...${v.slice(-2)}`;

        keys.push({ key: k, masked });
      }
    }
  } catch (err) {
    // Swallow errors — we don't want this endpoint to crash the server while debugging env issues
  }

  const serverConfigured = Boolean(process.env.TMDB_API_KEY);
  const publicConfigured = Boolean(process.env.NEXT_PUBLIC_TMDB_API_KEY);

  return NextResponse.json({
    configured: serverConfigured,
    clientFallbackConfigured: publicConfigured,
    envFilePresent,
    envFileSize,
    cwd,
    envPath,
    keys,
    // NOTE: this response intentionally does not include any secret values.
  });
}
