'use client';

import { useActionState, useState, startTransition, useEffect } from "react";
import Notice from "@/components/Notice";
import { addReview } from "@/app/buyers/[id]/actions";

const STATUSES = ["확인 필요", "확인 완료", "보류"] as const;

export default function ReviewForm({ buyerId }: { buyerId: string }) {
  const [state, formAction, pending] = useActionState(addReview, { ok: false, message: "" });
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (state.ok) setMemo("");
  }, [state.ok]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => formAction(new FormData(e.currentTarget)));
      }}
      className="space-y-4"
    >
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">상태</p>
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((s) => (
            <label key={s} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="status" value={s} defaultChecked={s === "확인 필요"} />
              <span className="text-sm text-ink">{s}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="review-memo" className="mb-1 block text-sm font-semibold text-ink">
          메모
        </label>
        <textarea
          id="review-memo"
          name="memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 다음 주 입금 약속 — 전화로 확인"
          rows={3}
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-base text-ink placeholder:text-muted"
        />
        <p className={`text-right text-xs ${memo.length > 200 ? "text-warn" : "text-muted"}`}>
          {memo.length}/200
        </p>
      </div>

      <div>
        <label htmlFor="review-reviewer" className="mb-1 block text-sm font-semibold text-ink">
          확인한 사람(별명)
        </label>
        <input
          id="review-reviewer"
          name="reviewer"
          type="text"
          placeholder="실명 대신 별명"
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-base text-ink placeholder:text-muted"
        />
      </div>

      <input type="hidden" name="buyerId" value={buyerId} />

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-md border border-accent bg-accent px-6 font-semibold text-white disabled:opacity-50"
      >
        {pending ? "저장 중…" : "기록 남기기"}
      </button>

      {state.message ? (
        <Notice tone={state.ok ? "ok" : "warn"}>{state.message}</Notice>
      ) : null}
    </form>
  );
}
