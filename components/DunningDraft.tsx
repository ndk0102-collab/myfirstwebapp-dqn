'use client';

import { useState } from "react";

type BuyerSummary = {
  id: string;
  name: string;
  countryKo: string;
  openArUsd: number;
  overdueUsd: number;
  termsDays: number;
  signals: string[];
};

function makeDraft(b: BuyerSummary) {
  const subject = `[한빛정밀] ${b.name} 미결 채권 확인 요청`;
  const overdueLine =
    b.overdueUsd > 0
      ? `\n- 연체 금액: $${b.overdueUsd.toLocaleString("en-US")} (즉시 처리 요망)`
      : "";
  const signalLines =
    b.signals.length > 0
      ? `\n\n참고 사항:\n${b.signals.map((s) => `  · ${s}`).join("\n")}`
      : "";

  const body = `안녕하세요, ${b.name} 담당자님.

한빛정밀(주) 영업팀입니다.

현재 미결 채권 현황을 아래와 같이 안내 드립니다.

- 바이어 번호: ${b.id} (${b.countryKo})
- 미결 채권: $${b.openArUsd.toLocaleString("en-US")}${overdueLine}
- 결제 기간: ${b.termsDays}일${signalLines}

결제 일정 확인 및 조속한 처리를 부탁드립니다.
궁금한 점은 언제든지 회신 주십시오.

감사합니다.
한빛정밀(주) 영업팀`;

  return { subject, body };
}

export default function DunningDraft({ buyer }: { buyer: BuyerSummary }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { subject, body } = makeDraft(buyer);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`제목: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 차단 시 무시
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-9 items-center rounded-md border border-warn px-3 text-sm text-warn hover:bg-surface"
      >
        {open ? "초안 닫기" : "독촉 메일 초안"}
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-md border border-line bg-bg p-4">
          <div>
            <p className="mb-1 text-xs font-semibold text-muted">제목</p>
            <p className="rounded bg-surface px-2 py-1 text-sm text-ink">{subject}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-muted">본문</p>
            <pre className="whitespace-pre-wrap rounded bg-surface px-3 py-2 text-sm text-ink leading-relaxed">
              {body}
            </pre>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex min-h-9 items-center rounded-md border px-4 text-sm font-semibold transition-colors ${
              copied
                ? "border-grade-s bg-grade-s text-white"
                : "border-accent bg-accent text-white hover:opacity-90"
            }`}
          >
            {copied ? "복사 완료" : "클립보드에 복사"}
          </button>
        </div>
      )}
    </div>
  );
}
