import type { Buyer, Grade } from "@/lib/buyers";

const GRADES: Grade[] = ["S", "A", "B", "C"];

function isGrade(grade: string): grade is Grade {
  return GRADES.some((validGrade) => validGrade === grade);
}

function riskOrder(a: Buyer, b: Buyer): number {
  return b.pd30d - a.pd30d || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export function kpis(buyers: Buyer[]) {
  const cGradeBuyers = buyers.filter((buyer) => buyer.grade === "C");
  const cGradeOpenArUsd = cGradeBuyers.reduce((sum, buyer) => sum + buyer.openArUsd, 0);
  const totalOpenArUsd = buyers.reduce((sum, buyer) => sum + buyer.openArUsd, 0);
  const overdueUsd = buyers.reduce((sum, buyer) => sum + buyer.overdueUsd, 0);

  return {
    cGradeBuyerCount: cGradeBuyers.length,
    cGradeOpenArUsd,
    cGradeOpenArShare: totalOpenArUsd > 0 ? cGradeOpenArUsd / totalOpenArUsd : null,
    totalOpenArUsd,
    buyerCount: buyers.length,
    overdueUsd,
    overdueBuyerCount: buyers.filter((buyer) => buyer.overdueUsd > 0).length,
  };
}

export function gradeCounts(buyers: Buyer[]): Record<Grade, number> {
  return buyers.reduce<Record<Grade, number>>(
    (counts, buyer) => {
      counts[buyer.grade] += 1;
      return counts;
    },
    { S: 0, A: 0, B: 0, C: 0 },
  );
}

export function topRisk(buyers: Buyer[], n = 10): Buyer[] {
  return [...buyers].sort(riskOrder).slice(0, n);
}

export type RegionMetrics = {
  region: string;
  buyerCount: number;
  openArUsd: number;
  cGradeOpenArUsd: number;
  cGradeShare: number | null;
};

export function byRegion(buyers: Buyer[]): RegionMetrics[] {
  const totals = new Map<string, Omit<RegionMetrics, "cGradeShare">>();

  for (const buyer of buyers) {
    const total = totals.get(buyer.region) ?? {
      region: buyer.region,
      buyerCount: 0,
      openArUsd: 0,
      cGradeOpenArUsd: 0,
    };
    total.buyerCount += 1;
    total.openArUsd += buyer.openArUsd;
    if (buyer.grade === "C") total.cGradeOpenArUsd += buyer.openArUsd;
    totals.set(buyer.region, total);
  }

  return [...totals.values()]
    .map((total) => ({
      ...total,
      cGradeShare: total.openArUsd > 0 ? total.cGradeOpenArUsd / total.openArUsd : null,
    }))
    .sort((a, b) => b.openArUsd - a.openArUsd || a.region.localeCompare(b.region));
}

export function filterByGrade(buyers: Buyer[], grade?: string): Buyer[] {
  const filtered = grade && isGrade(grade) ? buyers.filter((buyer) => buyer.grade === grade) : buyers;
  return topRisk(filtered, filtered.length);
}
