'use server';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type DecideState = { ok: boolean; message: string };

export async function decide(
  _prev: DecideState,
  formData: FormData,
): Promise<DecideState> {
  // 1. APPROVER_PIN 확인
  const pin = process.env.APPROVER_PIN;
  if (!pin) return { ok: false, message: "승인 코드가 설정되지 않았습니다" };

  // 2. 입력 검사
  const draftIdStr = (formData.get("draftId") as string | null)?.trim() ?? "";
  const decision   = (formData.get("decision") as string | null)?.trim() ?? "";
  const alias      = (formData.get("alias")    as string | null)?.trim() ?? "";
  const inputPin   = (formData.get("pin")      as string | null)?.trim() ?? "";
  const reason     = (formData.get("reason")   as string | null)?.trim() ?? "";

  const draftId = parseInt(draftIdStr, 10);
  if (!draftIdStr || isNaN(draftId))
    return { ok: false, message: "초안 번호가 올바르지 않습니다" };
  if (!["approve", "reject"].includes(decision))
    return { ok: false, message: "결정값이 올바르지 않습니다" };
  if (alias.length < 1 || alias.length > 20)
    return { ok: false, message: "별명은 1~20자여야 합니다" };
  if (decision === "reject" && (reason.length < 5 || reason.length > 200))
    return { ok: false, message: "반려 사유는 5~200자여야 합니다" };

  // 3. 승인 코드 비교 — 서버에서만, 틀리면 DB 아무것도 안 건드림
  if (inputPin !== pin) return { ok: false, message: "승인 코드가 다릅니다" };

  // 4. 트랜잭션
  const status = decision === "approve" ? "approved" : "rejected";
  const action = decision === "approve" ? "승인" : "반려";
  const detail =
    decision === "approve"
      ? "발송 대기 — 실제 발송 없음"
      : `사유: ${reason}`;

  try {
    const draft = await db().dunningDraft.findUnique({
      where: { id: draftId },
      select: { buyerId: true },
    });
    if (!draft) return { ok: false, message: "초안을 찾을 수 없습니다" };

    const result = await db().$transaction(async (tx) => {
      const update = await tx.dunningDraft.updateMany({
        where: { id: draftId, status: "pending" },
        data: {
          status,
          decidedBy: alias,
          decidedAt: new Date(),
          reason: decision === "reject" ? reason : null,
        },
      });
      if (update.count === 0) return { ok: false, message: "이미 처리된 초안입니다" };

      await tx.auditLog.create({
        data: {
          actor: alias,
          action,
          target: `${draft.buyerId} · 초안 #${draftId}`,
          detail,
        },
      });
      return {
        ok: true,
        message:
          decision === "approve"
            ? "승인했습니다 — 발송 대기(실제 발송 없음)"
            : "반려했습니다",
      };
    });

    revalidatePath("/dunning");
    revalidatePath("/audit");
    return result;
  } catch {
    return { ok: false, message: "처리 중 오류가 발생했습니다" };
  }
}
