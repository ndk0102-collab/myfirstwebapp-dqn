import Link from "next/link";
import DeployBadge from "@/components/DeployBadge";
import GradeBadge from "@/components/GradeBadge";
import KpiCard from "@/components/KpiCard";
import Notice from "@/components/Notice";
import PageHeader from "@/components/PageHeader";
import UrgentAlert from "@/components/UrgentAlert";
import { getBuyers } from "@/lib/buyers";
import { int, kst, pct, usd } from "@/lib/format";
import { getRecentReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  "확인 필요": "border-warn text-warn",
  "확인 완료": "border-accent text-accent",
  "보류":     "border-line text-muted",
};

// 첫 화면 — 숫자는 Supabase DB에서 그때그때 계산한다(손으로 적은 숫자 없음).
export default async function Home() {
  const [buyers, recentReviews] = await Promise.all([getBuyers(), getRecentReviews(5)]);
  const total = buyers.length;
  const gradeC = buyers.filter((b) => b.grade === "C");
  const urgentBuyers = [...gradeC].sort((a, b) => b.openArUsd - a.openArUsd);
  const arAll = buyers.reduce((sum, b) => sum + b.openArUsd, 0);
  const arC = gradeC.reduce((sum, b) => sum + b.openArUsd, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="한빛정밀 웹 작업대"
        asof="2026-09-30 · (가상) 합성 데이터"
        line="바이어 채권 · 등급을 휴대폰에서 보는 사내 웹앱입니다. 쪽은 실습에서 하나씩 더합니다."
      />

      <UrgentAlert count={urgentBuyers.length} />

      <section aria-labelledby="urgent-title" className="space-y-3 rounded-lg border-l-4 border-warn bg-surface p-4 sm:p-6">
        <h2 id="urgent-title" className="text-lg font-bold text-warn">
          지금 확인이 필요한 바이어 — {int(urgentBuyers.length)}곳
        </h2>
        {urgentBuyers.length === 0 ? (
          <p className="text-sm text-muted">C등급 바이어가 없습니다</p>
        ) : (
          <ul className="divide-y divide-line">
            {urgentBuyers.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 py-3">
                <Link
                  href={`/buyers/${b.id}`}
                  className="inline-flex min-h-11 flex-1 flex-col justify-center hover:underline"
                >
                  <span className="font-semibold text-ink">{b.name}</span>
                  <span className="text-xs text-muted">{b.id} · {b.countryKo}</span>
                </Link>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="num text-sm font-semibold text-ink">{usd(b.openArUsd)}</p>
                    {b.overdueUsd > 0 && (
                      <p className="num text-xs text-warn">연체 {usd(b.overdueUsd)}</p>
                    )}
                  </div>
                  <GradeBadge grade={b.grade} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="요약 숫자" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="바이어" value={`${int(total)}곳`} sub="Supabase DB에서 읽음" />
        <KpiCard label="C등급" value={`${int(gradeC.length)}곳`} sub="등급은 데이터의 grade 칸 그대로" />
        <KpiCard label="C등급 채권" value={usd(arC)} sub={`전체 미결 ${usd(arAll)}의 ${pct(arAll > 0 ? arC / arAll : null)}`} />
      </section>

      <Notice tone="ok" title="이 쪽이 보이면 배포 성공">
        휴대폰으로도 같은 주소를 열어 보세요. 아래 배지가 <span className="num">production · 커밋 7자리 · icn1</span>이면
        Vercel 서버(서울)에서 도는 중이고, <span className="num">내 PC · development</span>이면 내 PC에서 도는 중입니다.
      </Notice>

      <section aria-labelledby="recent-reviews-title" className="space-y-3">
        <h2 id="recent-reviews-title" className="text-lg font-semibold">최근 확인 기록</h2>
        {recentReviews.length === 0 ? (
          <p className="text-sm text-muted">아직 확인 기록이 없습니다</p>
        ) : (
          <ul className="space-y-3">
            {recentReviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-line bg-surface p-4 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/buyers/${r.buyerId}`}
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline"
                  >
                    {r.buyerId} · {r.buyer.name}
                  </Link>
                  <span
                    className={`inline-flex items-center rounded border px-1.5 text-sm font-semibold ${STATUS_STYLE[r.status] ?? "border-line text-muted"}`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-ink">{r.memo}</p>
                <p className="text-xs text-muted">{r.reviewer} · {kst(r.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DeployBadge />
    </div>
  );
}
