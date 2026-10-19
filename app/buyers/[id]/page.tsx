import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GradeBadge from "@/components/GradeBadge";
import PageHeader from "@/components/PageHeader";
import { getBuyer } from "@/lib/buyers";
import { int, pct, usd } from "@/lib/format";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const buyer = await getBuyer(id);

  return { title: buyer ? `${id} · ${buyer.name}` : "바이어를 찾을 수 없습니다" };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const buyer = await getBuyer(id);
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

      <Link href="/buyers" className="inline-flex min-h-11 items-center rounded-md px-3 text-accent hover:bg-surface">
        바이어 목록으로
      </Link>
    </div>
  );
}
