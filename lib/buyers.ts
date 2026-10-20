import { db } from "@/lib/db";

export type Grade = "S" | "A" | "B" | "C";

export type Buyer = {
  id: string;
  name: string;
  countryCode: string;
  countryKo: string;
  region: string;
  industry: string;
  paymentMethod: string;
  termsDays: number;
  openArUsd: number;
  overdueUsd: number;
  pctAr31p: number | null;
  oldestOpenDays: number;
  avgDaysLate12m: number | null;
  pd30d: number;
  grade: Grade;
  signals: string[];
};

export async function getBuyers(): Promise<Buyer[]> {
  const rows = await db().buyer.findMany({ orderBy: { id: "asc" } });
  return rows.map((r) => ({ ...r, grade: r.grade as Grade }));
}

export async function getBuyer(id: string): Promise<Buyer | null> {
  const row = await db().buyer.findUnique({ where: { id: id.toUpperCase() } });
  return row ? { ...row, grade: row.grade as Grade } : null;
}
