'use client';

import { useEffect, useRef, useState } from "react";
import { fx, krw, usd } from "@/lib/format";

type FxData = {
  date: string;
  rates: { KRW: number };
  fetchedAtKst: string;
  provider: string;
  fallback: boolean;
  savedAtKst?: string;
};

export default function FxTile({
  cArUsd,
  overdueUsd,
  overdueCount,
  base,
}: {
  cArUsd: number;
  overdueUsd: number;
  overdueCount: number;
  base: { date: string; krw: number };
}) {
  const [data, setData] = useState<FxData | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchFx() {
    try {
      const res = await fetch("/api/fx");
      if (res.ok) setData(await res.json());
    } catch {
      // 네트워크 오류 무시
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFx();
    timerRef.current = setInterval(fetchFx, 60_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const rate = data?.rates.KRW ?? null;
  const cArKrw = rate != null ? Math.round(cArUsd * rate) : null;
  const baseKrw = Math.round(cArUsd * base.krw);
  const diff = cArKrw != null ? cArKrw - baseKrw : null;
  const overdueKrw = rate != null ? Math.round(overdueUsd * rate) : null;

  // "YYYY-MM-DD HH:MM:SS" → "HH:MM:SS" (뒤 8자)
  const fetchedTime = data?.fetchedAtKst ? data.fetchedAtKst.slice(-8) : "—";

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="mb-3 text-sm font-bold text-ink">지금 환율로 본 원화</p>

      {loading ? (
        <p className="text-sm text-muted">환율 받는 중…</p>
      ) : (
        <>
          {/* C등급 채권 원화 — 큰 숫자 */}
          <div className="mb-3">
            <p className="num text-2xl font-bold text-ink">{krw(cArKrw)}</p>
            <p className="text-xs text-muted">C등급 {usd(cArUsd)} × 오늘 환율</p>
          </div>

          {/* 받은 줄 */}
          <p className="num mb-1 break-keep text-sm text-ink">
            1 USD = {data ? fx(data.rates.KRW) : "—"} · {data?.date ?? "—"} ·{" "}
            {data?.provider ?? "—"} · 받은 시각 {fetchedTime}
          </p>

          {/* 9/30 기준 줄 */}
          <p className="num mb-1 break-keep text-sm text-muted">
            9/30 기준 {fx(base.krw)} → C등급 {usd(cArUsd)} = {krw(baseKrw)}
            {diff != null && (
              <span className={diff >= 0 ? " text-warn" : " text-accent"}>
                {" "}오늘 − 9/30 {diff >= 0 ? "+" : ""}
                {krw(diff)}
              </span>
            )}
          </p>

          {/* 연체 줄 */}
          <p className="num mb-2 break-keep text-sm text-muted">
            연체 {overdueCount}곳 {usd(overdueUsd)} = {krw(overdueKrw)}(오늘 환율)
          </p>

          {/* fallback 배지 */}
          {data?.fallback && (
            <p className="mb-2 rounded border border-warn px-2 py-1 text-sm font-semibold text-warn">
              대체 값 · 저장 시각 {data.savedAtKst ?? "—"}
            </p>
          )}

          {/* 면책 */}
          <p className="text-xs text-muted">환율은 참고값입니다 — 결제 · 회계 기준이 아닙니다</p>
        </>
      )}
    </div>
  );
}
