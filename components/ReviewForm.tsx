'use client';

import { useActionState, useState, startTransition, useEffect, useRef } from "react";
import Notice from "@/components/Notice";
import { addReview } from "@/app/buyers/[id]/actions";

const STATUSES = ["확인 필요", "확인 완료", "보류"] as const;

export default function ReviewForm({ buyerId }: { buyerId: string }) {
  const [state, formAction, pending] = useActionState(addReview, { ok: false, message: "" });
  const [memo, setMemo] = useState("");
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<{ stop: () => void; start: () => void } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = typeof window !== "undefined" && (w.SpeechRecognition ?? w.webkitSpeechRecognition);
    setSpeechSupported(!!SR);
  }, []);

  useEffect(() => {
    if (state.ok) setMemo("");
  }, [state.ok]);

  function toggleListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const rec = new SR() as {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onstart: () => void;
      onend: () => void;
      onerror: () => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onresult: (e: any) => void;
      start: () => void;
      stop: () => void;
    };

    rec.lang = "ko-KR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend   = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const text: string = e.results[0][0].transcript;
      setMemo((prev) => (prev ? `${prev} ${text}` : text));
    };

    recognitionRef.current = rec;
    rec.start();
  }

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
        <div className="flex items-center justify-between">
          <p className={`text-xs ${memo.length > 200 ? "text-warn" : "text-muted"}`}>
            {memo.length}/200
          </p>
          {speechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm ${
                listening
                  ? "border-warn text-warn"
                  : "border-line text-muted hover:bg-surface"
              }`}
            >
              {listening && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-warn" aria-hidden="true" />
              )}
              {listening ? "듣는 중…" : "말로 입력"}
            </button>
          )}
        </div>
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
