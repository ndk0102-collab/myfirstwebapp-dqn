import { db } from "@/lib/db";

export async function getReviews(buyerId: string, take = 20) {
  return db().review.findMany({
    where: { buyerId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
  });
}

export async function getRecentReviews(take = 5) {
  return db().review.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    include: { buyer: { select: { name: true } } },
  });
}
