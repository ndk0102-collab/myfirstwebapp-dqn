import buyerData from "@/data/buyers.json";

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

const buyers = buyerData as Buyer[];

export async function getBuyers(): Promise<Buyer[]> {
  return buyers;
}

export async function getBuyer(id: string): Promise<Buyer | null> {
  const normalizedId = id.toUpperCase();
  return buyers.find((buyer) => buyer.id === normalizedId) ?? null;
}
