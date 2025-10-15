import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

export async function GET() {
  function normalizeEnvValue(source?: string | null) {
    if (!source) {
      return undefined;
    }
    let normalized = source.trim();
    
    if (
      (normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'"))
    ) {
      normalized = normalized.slice(1, -1);
    }
    
    return normalized.length > 0 ? normalized : undefined;
  }

  const rawKey = process.env.PODCASTINDEX_API_KEY;
  const rawSecret = process.env.PODCASTINDEX_API_SECRET;
  
  const apiKey = normalizeEnvValue(rawKey);
  const apiSecret = normalizeEnvValue(rawSecret);
  
  const timestamp = "1760544744";
  const concatenated = `${apiKey}${apiSecret}${timestamp}`;
  const hash = createHash("sha1").update(concatenated).digest("hex");
  
  return NextResponse.json({
    debug: {
      rawKey,
      rawSecret,
      normalizedKey: apiKey,
      normalizedSecret: apiSecret,
      timestamp,
      concatenated,
      hash,
      expected: "44db09bc2d2a80db9fd0cbb4acea9946ccfb90bb",
      match: hash === "44db09bc2d2a80db9fd0cbb4acea9946ccfb90bb",
    },
  });
}
