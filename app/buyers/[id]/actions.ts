'use server';

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

const VALID_STATUSES = ["확인 필요", "확인 완료", "보류"] as const;

export async function addReview(
  _prev: { ok: boolean; message: string },
  formData: FormData,
) {
  const buyerId  = String(formData.get("buyerId")  ?? "").trim();
  const status   = String(formData.get("status")   ?? "").trim();
  const memo     = String(formData.get("memo")     ?? "").trim();
  const reviewer = String(formData.get("reviewer") ?? "").trim();

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number]))
    return { ok: false, message: "상태를 골라 주세요" };
  if (memo.length === 0)   return { ok: false, message: "메모를 적어 주세요" };
  if (memo.length > 200)   return { ok: false, message: "메모는 200자 이내로 적어 주세요" };
  if (reviewer.length === 0)  return { ok: false, message: "확인한 사람(별명)을 적어 주세요" };
  if (reviewer.length > 20)   return { ok: false, message: "별명은 20자 이내로 적어 주세요" };

  const exists = await db().buyer.findUnique({ where: { id: buyerId }, select: { id: true } });
  if (!exists) return { ok: false, message: "바이어를 찾을 수 없습니다" };

  try {
    await db().review.create({ data: { buyerId, status, memo, reviewer } });
    revalidatePath(`/buyers/${buyerId}`);
    revalidatePath("/");
    return { ok: true, message: "저장했습니다 — 새로 고쳐도 남아 있습니다" };
  } catch {
    return { ok: false, message: "저장하지 못했습니다 — 잠시 뒤 다시 눌러 주세요" };
  }
}
