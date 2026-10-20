import fxFallback from "@/data/fx_fallback.json";
import { kst } from "@/lib/format";
import { NextResponse } from "next/server";

export const revalidate = 60;

type RateRow = { date: string; base: string; quote: string; rate: number };

function buildFallback(): NextResponse {
  const rows = fxFallback.latest as RateRow[];
  const rate = (q: string) => rows.find((r) => r.quote === q)?.rate ?? 0;
  const date = rows.find((r) => r.quote === "KRW")?.date ?? rows[0]?.date ?? "—";
  const fetchedAt = new Date().toISOString();
  return NextResponse.json({
    date,
    base: "USD",
    rates: { KRW: rate("KRW"), EUR: rate("EUR"), JPY: rate("JPY"), CNY: rate("CNY") },
    fetchedAt,
    fetchedAtKst: kst(fetchedAt, true),
    provider: fxFallback.provider,
    fallback: true,
    savedAt: fxFallback.savedAt,
    savedAtKst: kst(fxFallback.savedAt, true),
  });
}

export async function GET() {
  if (process.env.FX_FORCE_FALLBACK === "1") return buildFallback();

  try {
    const res = await fetch(
      "https://api.frankfurter.dev/v2/rates?base=USD&quotes=KRW,EUR,JPY,CNY",
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return buildFallback();

    const rows: RateRow[] = await res.json();
    if (!Array.isArray(rows)) return buildFallback();

    const map: Record<string, number> = {};
    for (const r of rows) map[r.quote] = r.rate;

    const ok = (["KRW", "EUR", "JPY", "CNY"] as const).every(
      (q) => typeof map[q] === "number" && map[q] > 0,
    );
    if (!ok) return buildFallback();

    const date = rows.find((r) => r.quote === "KRW")?.date ?? rows[0]?.date ?? "—";
    const fetchedAt = new Date().toISOString();

    return NextResponse.json({
      date,
      base: "USD",
      rates: { KRW: map["KRW"], EUR: map["EUR"], JPY: map["JPY"], CNY: map["CNY"] },
      fetchedAt,
      fetchedAtKst: kst(fetchedAt, true),
      provider: "api.frankfurter.dev",
      fallback: false,
    });
  } catch {
    return buildFallback();
  }
}
