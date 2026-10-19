import Link from "next/link";
import BarRow from "@/components/BarRow";
import DataTable, { type Column } from "@/components/DataTable";
import GradeBadge from "@/components/GradeBadge";
import KpiCard from "@/components/KpiCard";
import PageHeader from "@/components/PageHeader";
import { byRegion, filterByGrade, gradeCounts, kpis, topRisk } from "@/lib/metrics";
import { getBuyers, type Buyer, type Grade } from "@/lib/buyers";
import { int, pct, usd } from "@/lib/format";

const GRADES: Grade[] = ["S", "A", "B", "C"];
const isGrade = (value: string): value is Grade => GRADES.some((grade) => grade === value);

function buyerLink(buyer: Buyer, rank?: number) {
  return (
    <Link href={`/buyers/${buyer.id}`} className="inline-flex min-h-11 flex-col justify-center text-accent hover:underline">
      <span>{rank === undefined ? buyer.name : `${rank}. ${buyer.name}`}</span>
      <span className="text-xs font-normal text-muted">{buyer.id}</span>
    </Link>
  );
}

function buyerListHref(grade?: Grade, query?: string) {
  const params = new URLSearchParams();
  if (grade) params.set("grade", grade);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/buyers?${search}` : "/buyers";
}

const riskColumns: Column[] = [
  { key: "buyer", label: "바이어" },
  { key: "country", label: "나라" },
  { key: "grade", label: "등급" },
  { key: "risk", label: "위험 점수", align: "right" },
  { key: "openAr", label: "채권", align: "right" },
  { key: "overdue", label: "연체", align: "right" },
  { key: "signal", label: "첫 신호" },
];

const buyerColumns: Column[] = riskColumns.slice(0, 6);

export const metadata = { title: "바이어" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string | string[]; q?: string | string[] }>;
}) {
  const allBuyers = await getBuyers();
  const params = await searchParams;
  const selectedGrade = typeof params.grade === "string" && isGrade(params.grade) ? params.grade : undefined;
  const searchTerm = typeof params.q === "string" ? params.q.trim() : "";
  const stats = kpis(allBuyers);
  const counts = gradeCounts(allBuyers);
  const riskBuyers = topRisk(allBuyers);
  const regions = byRegion(allBuyers).slice(0, 6);
  const normalizedSearchTerm = searchTerm.toLocaleLowerCase();
  const filteredBuyers = filterByGrade(allBuyers, selectedGrade).filter((buyer) =>
    [buyer.id, buyer.name, buyer.countryKo, buyer.region, buyer.industry]
      .some((value) => value.toLocaleLowerCase().includes(normalizedSearchTerm)),
  );
  const highestCShareRegion = regions.reduce<(typeof regions)[number] | undefined>(
    (highest, region) =>
      region.cGradeShare !== null && (highest === undefined || region.cGradeShare > (highest.cGradeShare ?? -1))
        ? region
        : highest,
    undefined,
  );

  const riskRows = riskBuyers.map((buyer, index) => ({
    buyer: buyerLink(buyer, index + 1),
    country: buyer.countryKo,
    grade: <GradeBadge grade={buyer.grade} />,
    risk: <span className="num">{pct(buyer.pd30d)}</span>,
    openAr: <span className="num">{usd(buyer.openArUsd)}</span>,
    overdue: <span className="num">{usd(buyer.overdueUsd)}</span>,
    signal: buyer.signals[0],
  }));

  const buyerRows = filteredBuyers.map((buyer) => ({
    buyer: buyerLink(buyer),
    country: buyer.countryKo,
    grade: <GradeBadge grade={buyer.grade} />,
    risk: <span className="num">{pct(buyer.pd30d)}</span>,
    openAr: <span className="num">{usd(buyer.openArUsd)}</span>,
    overdue: <span className="num">{usd(buyer.overdueUsd)}</span>,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title={`바이어 ${int(stats.buyerCount)}곳`}
        asof="2026-09-30 · (가상) 합성 데이터"
        line="위험 점수는 판단을 돕는 값이고, 결정은 사람이 합니다."
      />

      <section aria-labelledby="buyer-search-title" className="space-y-4 rounded-lg border border-accent bg-surface p-4 sm:p-6">
        <div>
          <h2 id="buyer-search-title" className="text-xl font-bold text-ink">바이어 바로 찾기</h2>
          <p className="mt-1 text-sm text-muted">번호 · 이름 · 나라 · 지역 · 업종으로 검색하세요.</p>
        </div>
        <form action="/buyers" method="get" className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="buyer-search" className="sr-only">바이어 번호, 이름, 나라, 지역, 업종으로 검색</label>
          <input
            id="buyer-search"
            name="q"
            type="search"
            defaultValue={searchTerm}
            placeholder="예: B048, 중국, 동아시아"
            className="min-h-12 min-w-0 flex-1 rounded-md border border-line bg-bg px-4 text-base text-ink placeholder:text-muted"
          />
          {selectedGrade ? <input type="hidden" name="grade" value={selectedGrade} /> : null}
          <button type="submit" className="min-h-12 rounded-md border border-accent bg-accent px-6 font-semibold text-white">
            바이어 검색
          </button>
          {searchTerm || selectedGrade ? (
            <Link
              href="/buyers"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-line bg-bg px-4 text-ink"
            >
              조건 초기화
            </Link>
          ) : null}
        </form>
        <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="등급별 바이어" className="flex flex-wrap gap-2">
            <Link
              href={buyerListHref(undefined, searchTerm)}
              aria-current={selectedGrade === undefined ? "page" : undefined}
              className={`flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm ${
                selectedGrade === undefined ? "border-accent bg-accent text-white" : "border-line bg-bg text-ink hover:bg-surface"
              }`}
            >
              전체 <span className="num">{int(stats.buyerCount)}</span>
            </Link>
            {GRADES.map((grade) => (
              <Link
                key={grade}
                href={buyerListHref(grade, searchTerm)}
                aria-current={selectedGrade === grade ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm ${
                  selectedGrade === grade ? "border-accent bg-accent text-white" : "border-line bg-bg text-ink hover:bg-surface"
                }`}
              >
                {grade} <span className="num">{int(counts[grade])}</span>
              </Link>
            ))}
          </nav>
          <p className="text-sm text-muted" aria-live="polite">
            {searchTerm ? `“${searchTerm}” · ` : ""}
            {selectedGrade ? `${selectedGrade}등급 · ` : ""}
            결과 <span className="num font-semibold text-ink">{int(filteredBuyers.length)}</span>곳
          </p>
        </div>
      </section>

      <section aria-label="요약 숫자" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="위험 바이어(C등급)" value={`${int(stats.cGradeBuyerCount)}곳`} />
        <KpiCard label="C등급 채권" value={usd(stats.cGradeOpenArUsd)} sub={`전체의 ${pct(stats.cGradeOpenArShare)}`} />
        <KpiCard label="전체 채권" value={usd(stats.totalOpenArUsd)} sub={`${int(stats.buyerCount)}곳`} />
        <KpiCard label="연체 금액" value={usd(stats.overdueUsd)} sub={`${int(stats.overdueBuyerCount)}곳`} />
      </section>

      <section aria-labelledby="top-risk-title" className="space-y-3">
        <h2 id="top-risk-title" className="text-lg font-semibold">위험 상위 10</h2>
        <DataTable columns={riskColumns} rows={riskRows} caption="위험 점수 순" />
      </section>

      <section aria-labelledby="region-title" className="space-y-3">
        <h2 id="region-title" className="text-lg font-semibold">지역별 채권</h2>
        <div>
          {regions.map((region) => (
            <div key={region.region}>
              <BarRow
                label={region.region}
                value={region.openArUsd}
                max={regions[0]?.openArUsd ?? 0}
                display={usd(region.openArUsd)}
                strong={region.region === highestCShareRegion?.region}
              />
              <p className="num ml-[calc(7rem+0.75rem)] text-sm text-muted sm:ml-[calc(10rem+0.75rem)]">
                C등급 {usd(region.cGradeOpenArUsd)} · {pct(region.cGradeShare)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="buyers-title" className="space-y-3">
        <h2 id="buyers-title" className="text-lg font-semibold">전체 목록</h2>
        <DataTable
          columns={buyerColumns}
          rows={buyerRows}
          caption="바이어 목록"
          empty="검색 조건에 맞는 바이어가 없습니다."
        />
      </section>
    </div>
  );
}
