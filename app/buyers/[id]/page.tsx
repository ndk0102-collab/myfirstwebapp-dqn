import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GradeBadge from "@/components/GradeBadge";
import PageHeader from "@/components/PageHeader";
import ReviewForm from "@/components/ReviewForm";
import { getBuyer } from "@/lib/buyers";
import { int, kst, pct, usd } from "@/lib/format";
import { getReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const buyer = await getBuyer(id);

  return { title: buyer ? `${id} · ${buyer.name}` : "바이어를 찾을 수 없습니다" };
}

const STATUS_STYLE: Record<string, string> = {
  "확인 필요": "border-warn text-warn",
  "확인 완료": "border-accent text-accent",
  "보류":     "border-line text-muted",
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const [buyer, reviews] = await Promise.all([getBuyer(id), getReviews(id.toUpperCase())]);
  if (!buyer) notFound();

  const details = [
    { label: "나라", value: buyer.countryKo },
    { label: "지역", value: buyer.region },
    { label: "업종", value: buyer.industry },
    { label: "결제방식", value: buyer.paymentMethod },
    { label: "결제기간", value: `${int(buyer.termsDays)}일`, numeric: true },
    { label: "채권", value: usd(buyer.openArUsd), numeric: true },
    { label: "연체", value: usd(buyer.overdueUsd), numeric: true },
    { label: "31일 넘긴 채권 비중", value: pct(buyer.pctAr31p), numeric: true },
    { label: "가장 오래 밀린 인보이스", value: `${int(buyer.oldestOpenDays)}일`, numeric: true },
    {
      label: "최근 1년 평균 지연",
      value: buyer.avgDaysLate12m === null ? "—" : `${buyer.avgDaysLate12m.toFixed(1)}일`,
      numeric: true,
    },
    { label: "위험 점수", value: pct(buyer.pd30d), numeric: true },
    { label: "등급", value: <GradeBadge grade={buyer.grade} /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={buyer.name}
        asof="2026-09-30 · (가상) 합성 데이터"
        line={`${buyer.id} · ${buyer.countryKo} · ${buyer.region}`}
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {details.map((detail) => (
          <div key={detail.label} className="rounded-lg border border-line bg-surface p-4">
            <dt className="text-sm text-muted">{detail.label}</dt>
            <dd className={`mt-1 font-semibold text-ink ${detail.numeric ? "num" : ""}`}>{detail.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="signals-title" className="space-y-3">
        <h2 id="signals-title" className="text-lg font-semibold">위험 신호</h2>
        <ul className="list-inside list-disc space-y-2">
          {buyer.signals.map((signal, index) => <li key={`${index}-${signal}`}>{signal}</li>)}
        </ul>
        <p className="text-sm text-muted">이 신호들은 확인해 볼 이유이지, 연체의 원인이라는 뜻은 아닙니다.</p>
      </section>

      <section aria-labelledby="reviews-title" className="space-y-4">
        <h2 id="reviews-title" className="text-lg font-semibold">확인 기록</h2>
        <ReviewForm buyerId={buyer.id} />
        {reviews.length === 0 ? (
          <p className="text-sm text-muted">아직 확인 기록이 없습니다</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-line bg-surface p-4 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded border px-1.5 text-sm font-semibold ${STATUS_STYLE[r.status] ?? "border-line text-muted"}`}
                  >
                    {r.status}
                  </span>
                  <span className="text-xs text-muted">{r.reviewer} · {kst(r.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-ink">{r.memo}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/buyers" className="inline-flex min-h-11 items-center rounded-md px-3 text-accent hover:bg-surface">
        바이어 목록으로
      </Link>
    </div>
  );
}
