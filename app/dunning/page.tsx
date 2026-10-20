import Link from "next/link";
import DecideForm from "@/components/DecideForm";
import GradeBadge from "@/components/GradeBadge";
import { db } from "@/lib/db";
import { kst, usd } from "@/lib/format";
import type { CheckResult } from "@/lib/guardrails";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "pending",  label: "대기"  },
  { key: "approved", label: "승인"  },
  { key: "rejected", label: "반려"  },
  { key: "blocked",  label: "막힘"  },
] as const;

export default async function DunningPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const currentTab = TABS.find((t) => t.key === tab)?.key ?? "pending";

  // 탭별 개수
  const countRows = await db().dunningDraft.groupBy({
    by: ["status"],
    _count: { status: true },
  });
  const countMap = Object.fromEntries(
    countRows.map((r) => [r.status, r._count.status]),
  );

  // 현재 탭 초안
  const drafts = await db().dunningDraft.findMany({
    where: { status: currentTab },
    include: { buyer: { select: { name: true, grade: true } } },
    orderBy: { overdueUsd: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* 머리글 */}
      <div>
        <p className="text-xs text-muted">
          AI는 초안까지만 — 승인해도 메일은 나가지 않습니다(실제 발송 없음)
        </p>
        <h1 className="mt-1 text-2xl font-bold text-ink">독촉 승인 대기열</h1>
      </div>

      {/* 탭 */}
      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/dunning?tab=${t.key}`}
            role="tab"
            aria-selected={currentTab === t.key}
            className={`inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-semibold ${
              currentTab === t.key
                ? "border-accent bg-accent text-white"
                : "border-line text-muted hover:bg-surface"
            }`}
          >
            {t.label}
            <span className="num">{countMap[t.key] ?? 0}</span>
          </Link>
        ))}
      </div>

      {/* 카드 목록 */}
      {drafts.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-6 text-center text-sm text-muted">
          {currentTab === "pending" ? "대기 중인 초안이 없습니다" : "초안이 없습니다"}
        </p>
      ) : (
        <ul className="space-y-6">
          {drafts.map((d) => {
            const checks = d.checks as unknown as CheckResult[];
            return (
              <li key={d.id} className="rounded-lg border border-line bg-surface p-5">
                {/* 헤더 */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-ink">{d.buyerId}</span>
                  <span className="text-muted" aria-hidden>·</span>
                  <span className="text-ink">{d.buyer.name}</span>
                  <GradeBadge grade={d.buyer.grade} />
                  <span className="num rounded border border-line px-1.5 text-sm text-muted">
                    {d.stage}
                  </span>
                  <span className="num rounded border border-line px-1.5 text-sm text-muted">
                    {d.tone}
                  </span>
                  <span className="num ml-auto font-semibold text-ink">{usd(d.overdueUsd)}</span>
                </div>

                {/* 제목 · 본문 · 요약 */}
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="mb-0.5 text-xs font-semibold text-muted">제목</p>
                    <p className="text-sm text-ink">{d.subject}</p>
                  </div>
                  <div>
                    <p className="mb-0.5 text-xs font-semibold text-muted">본문</p>
                    <pre className="whitespace-pre-wrap rounded-md bg-bg px-3 py-2 text-sm leading-relaxed text-ink">
                      {d.body}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-0.5 text-xs font-semibold text-muted">한국어 요약</p>
                    <p className="text-sm text-ink">{d.summaryKo}</p>
                  </div>
                </div>

                {/* G1–G7 검사 */}
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-semibold text-muted">가드레일 검사</p>
                  <div className="flex flex-wrap gap-2">
                    {checks.map((c) => (
                      <span
                        key={c.id}
                        title={c.note || undefined}
                        className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                          c.ok
                            ? "border-grade-s text-grade-s"
                            : "border-warn text-warn"
                        }`}
                      >
                        {c.id} {c.ok ? "통과" : "걸림"}
                        {!c.ok && c.note ? ` — ${c.note}` : ""}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 만든 시각 */}
                <p className="mt-3 text-xs text-muted">{kst(d.createdAt)}</p>

                {/* 승인 카드 */}
                {d.status === "approved" && (
                  <p className="mt-3 rounded-md border border-accent px-3 py-2 text-sm font-semibold text-accent">
                    발송 대기 — 실제 발송 없음 · {d.decidedBy} ·{" "}
                    {d.decidedAt ? kst(d.decidedAt) : ""}
                  </p>
                )}

                {/* 반려 카드 */}
                {d.status === "rejected" && (
                  <p className="mt-3 rounded-md border border-warn px-3 py-2 text-sm text-warn">
                    반려 사유: {d.reason} · {d.decidedBy} ·{" "}
                    {d.decidedAt ? kst(d.decidedAt) : ""}
                  </p>
                )}

                {/* 대기 카드 폼 */}
                {d.status === "pending" && <DecideForm draftId={d.id} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
