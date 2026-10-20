import "dotenv/config";
import buyers from "../data/buyers.json";
import { db } from "../lib/db";

async function main() {
  const data = buyers.map((b) => ({
    id: b.id,
    name: b.name,
    countryCode: b.countryCode,
    countryKo: b.countryKo,
    region: b.region,
    industry: b.industry,
    paymentMethod: b.paymentMethod,
    termsDays: b.termsDays,
    openArUsd: b.openArUsd,
    overdueUsd: b.overdueUsd,
    pctAr31p: b.pctAr31p,
    oldestOpenDays: b.oldestOpenDays,
    avgDaysLate12m: b.avgDaysLate12m,
    pd30d: b.pd30d,
    grade: b.grade,
    signals: b.signals,
  }));

  const result = await db().buyer.createMany({ data, skipDuplicates: true });
  const newCount = result.count;
  const oldCount = buyers.length - newCount;

  const total = await db().buyer.count();
  const gradeRows = await db().buyer.groupBy({ by: ["grade"], _count: { _all: true } });
  const grades: Record<string, number> = { S: 0, A: 0, B: 0, C: 0 };
  for (const row of gradeRows) grades[row.grade] = row._count._all;

  const reviewCount = await db().review.count();

  console.log(`새로 넣음 ${newCount}행 · 이미 있던 행 ${oldCount}행`);
  console.log(`Buyer ${total}행 (S ${grades.S} · A ${grades.A} · B ${grades.B} · C ${grades.C})`);
  console.log(`Review ${reviewCount}행`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db().$disconnect());
