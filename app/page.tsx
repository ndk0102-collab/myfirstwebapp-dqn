import Link from "next/link";
import DeployBadge from "@/components/DeployBadge";
import DunningDraft from "@/components/DunningDraft";
import GradeBadge from "@/components/GradeBadge";
import KpiCard from "@/components/KpiCard";
import UrgentAlert from "@/components/UrgentAlert";
import { getBuyers } from "@/lib/buyers";
import { int, kst, pct, usd } from "@/lib/format";
import { getRecentReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  "확인 필요": "border-warn text-warn",
  "확인 완료": "border-accent text-accent",
  "보류":      "border-line text-muted",
};

function IconAlert() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
      <line x1="2"  y1="20" x2="22" y2="20"/>
    </svg>
  );
}

function IconNote() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9"  x2="8" y2="9"/>
    </svg>
  );
}

function ChapterHead({
  chapter,
  title,
  color,
  icon,
  badge,
}: {
  chapter: string;
  title: string;
  color: "warn" | "accent" | "grade-s";
  icon: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const lineColor =
    color === "warn"    ? "border-warn"    :
    color === "accent"  ? "border-accent"  :
                          "border-grade-s";
  const textColor =
    color === "warn"    ? "text-warn"    :
    color === "accent"  ? "text-accent"  :
                          "text-grade-s";

  return (
    <div className={`mb-4 flex items-center gap-3 border-b-2 pb-3 ${lineColor}`}>
      <span className={textColor}>{icon}</span>
      <div className="flex-1">
        <p className={`text-xs font-bold ${textColor}`}>{chapter}</p>
        <h2 className="text-xl font-bold text-ink">{title}</h2>
      </div>
      {badge}
    </div>
  );
}

export default async function Home() {
  const [buyers, recentReviews] = await Promise.all([getBuyers(), getRecentReviews(5)]);

  const total     = buyers.length;
  const gradeC    = buyers.filter((b) => b.grade === "C");
  const urgentBuyers = [...gradeC].sort((a, b) => b.openArUsd - a.openArUsd);
  const arAll     = buyers.reduce((sum, b) => sum + b.openArUsd, 0);
  const arC       = gradeC.reduce((sum, b) => sum + b.openArUsd, 0);

  return (
    <div className="space-y-10">
      {/* 머리글 */}
      <div className="border-b border-line pb-4">
        <p className="text-xs text-muted">2026-09-30 기준 · (가상) 한빛정밀(주) 합성 데이터</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">채권 현황 보고서</h1>
        <p className="mt-1 text-sm text-muted">바이어 채권 · 등급을 한눈에 — 휴대폰에서도 바로 확인</p>
      </div>

      <UrgentAlert count={urgentBuyers.length} />

      {/* 1장: 긴급 */}
      <section aria-labelledby="ch1-title">
        <ChapterHead
          chapter="1장"
          title="지금 당장 연락하세요"
          color="warn"
          icon={<IconAlert />}
          badge={
            <span className="num rounded-lg border-2 border-warn px-3 py-1 text-lg font-bold text-warn">
              {int(urgentBuyers.length)}곳
            </span>
          }
        />
        <h2 id="ch1-title" className="sr-only">지금 당장 연락하세요</h2>

        {urgentBuyers.length === 0 ? (
          <p className="text-sm text-muted">C등급 바이어가 없습니다</p>
        ) : (
          <ul className="space-y-4">
            {urgentBuyers.map((b, i) => (
              <li key={b.id} className="rounded-lg border-l-4 border-warn bg-surface p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <span className="num mt-0.5 text-xs font-bold text-warn">{i + 1}.</span>
                  <div className="flex-1">
                    <Link
                      href={`/buyers/${b.id}`}
                      className="inline-flex min-h-11 flex-col justify-center hover:underline"
                    >
                      <span className="font-bold text-ink">{b.name}</span>
                      <span className="text-xs text-muted">{b.id} · {b.countryKo} · {b.industry}</span>
                    </Link>
                  </div>
                  <div className="text-right">
                    <p className="num text-base font-bold text-ink">{usd(b.openArUsd)}</p>
                    {b.overdueUsd > 0 && (
                      <p className="num text-xs font-semibold text-warn">연체 {usd(b.overdueUsd)}</p>
                    )}
                    <div className="mt-1 flex justify-end">
                      <GradeBadge grade={b.grade} />
                    </div>
                  </div>
                </div>
                <DunningDraft buyer={b} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2장: 채권 현황 */}
      <section aria-labelledby="ch2-title">
        <ChapterHead
          chapter="2장"
          title="오늘의 채권 현황"
          color="accent"
          icon={<IconChart />}
        />
        <h2 id="ch2-title" className="sr-only">오늘의 채권 현황</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard label="전체 바이어" value={`${int(total)}곳`} sub="Supabase DB에서 읽음" />
          <KpiCard label="위험(C등급)" value={`${int(gradeC.length)}곳`} sub="등급은 데이터의 grade 칸 그대로" />
          <KpiCard label="C등급 채권" value={usd(arC)} sub={`전체 미결 ${usd(arAll)}의 ${pct(arAll > 0 ? arC / arAll : null)}`} />
        </div>
        <p className="mt-3 text-right">
          <Link href="/buyers" className="inline-flex min-h-11 items-center gap-1 rounded-md border border-accent px-4 text-sm font-semibold text-accent hover:bg-surface">
            바이어 전체 목록 보기
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </p>
      </section>

      {/* 3장: 확인 기록 */}
      <section aria-labelledby="ch3-title">
        <ChapterHead
          chapter="3장"
          title="팀의 최근 확인 기록"
          color="grade-s"
          icon={<IconNote />}
          badge={
            recentReviews.length > 0 ? (
              <span className="num rounded-lg border-2 border-grade-s px-3 py-1 text-lg font-bold text-grade-s">
                최신 {recentReviews.length}건
              </span>
            ) : undefined
          }
        />
        <h2 id="ch3-title" className="sr-only">팀의 최근 확인 기록</h2>

        {recentReviews.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface p-6 text-center">
            <p className="text-sm text-muted">아직 확인 기록이 없습니다</p>
            <p className="mt-1 text-xs text-muted">바이어 상세 쪽에서 기록을 남기면 여기에 보입니다</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {recentReviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/buyers/${r.buyerId}`}
                    className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline"
                  >
                    {r.buyerId} · {r.buyer.name}
                  </Link>
                  <span
                    className={`inline-flex items-center rounded border px-1.5 text-sm font-semibold ${STATUS_STYLE[r.status] ?? "border-line text-muted"}`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{r.memo}</p>
                <p className="mt-1 text-xs text-muted">{r.reviewer} · {kst(r.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DeployBadge />
    </div>
  );
}
