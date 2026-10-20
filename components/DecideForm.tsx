'use client';

import { startTransition, useActionState } from "react";
import { decide, type DecideState } from "@/app/dunning/actions";
import Notice from "@/components/Notice";

const INIT: DecideState = { ok: false, message: "" };

export default function DecideForm({ draftId }: { draftId: number }) {
  const [state, formAction, pending] = useActionState(decide, INIT);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        // 클릭한 submit 버튼의 name/value를 FormData에 추가
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.name) fd.set(submitter.name, submitter.value ?? "");
        startTransition(() => formAction(fd));
      }}
      className="mt-4 space-y-3 rounded-lg border border-line bg-bg p-4"
    >
      <input type="hidden" name="draftId" value={draftId} />

      <div>
        <label
          htmlFor={`alias-${draftId}`}
          className="mb-1 block text-sm font-semibold text-ink"
        >
          승인자 별명
        </label>
        <input
          id={`alias-${draftId}`}
          name="alias"
          type="text"
          placeholder="실명 대신 별명"
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-base text-ink placeholder:text-muted"
        />
      </div>

      <div>
        <label
          htmlFor={`pin-${draftId}`}
          className="mb-1 block text-sm font-semibold text-ink"
        >
          승인 코드
        </label>
        <input
          id={`pin-${draftId}`}
          name="pin"
          type="password"
          autoComplete="off"
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-base text-ink"
        />
      </div>

      <div>
        <label
          htmlFor={`reason-${draftId}`}
          className="mb-1 block text-sm font-semibold text-ink"
        >
          반려 사유{" "}
          <span className="font-normal text-muted">(반려할 때만 · 5~200자)</span>
        </label>
        <textarea
          id={`reason-${draftId}`}
          name="reason"
          rows={2}
          placeholder="반려할 이유를 입력하세요"
          className="w-full rounded-md border border-line bg-bg px-3 py-2 text-base text-ink placeholder:text-muted"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
          className="min-h-11 rounded-md border border-accent bg-accent px-6 font-semibold text-white disabled:opacity-50"
        >
          {pending ? "처리 중…" : "승인"}
        </button>
        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={pending}
          className="min-h-11 rounded-md border border-warn px-6 font-semibold text-warn disabled:opacity-50 hover:bg-surface"
        >
          {pending ? "처리 중…" : "반려"}
        </button>
      </div>

      {state.message && (
        <Notice tone={state.ok ? "ok" : "warn"}>{state.message}</Notice>
      )}
    </form>
  );
}
