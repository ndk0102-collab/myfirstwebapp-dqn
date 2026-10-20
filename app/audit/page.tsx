import Link from "next/link";
import DataTable from "@/components/DataTable";
import { db } from "@/lib/db";
import { int, kst } from "@/lib/format";

export const dynamic = "force-dynamic";

const FILTER_ACTIONS = ["초안 작성", "초안 막힘", "승인", "반려"] as const;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const { action } = await searchParams;
  const filterAction =
    action && (FILTER_ACTIONS as readonly string[]).includes(action)
      ? action
      : null;

  const where = filterAction ? { action: filterAction } : undefined;

  const [logs, totalCount] = await Promise.all([
    db().auditLog.findMany({
      where,
      orderBy: [{ at: "desc" }, { id: "desc" }],
      take: 50,
    }),
    db().auditLog.count({ where }),
  ]);

  const rows = logs.map((l) => ({
    at:     kst(l.at, true),
    actor:  l.actor,
    action: l.action,
    target: l.target,
    detail: l.detail,
  }));

  return (
    <div className="space-y-6">
      {/* 머리글 */}
      <div>
        <p className="text-xs text-muted">이 기록은 지우거나 고치지 않습니다</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">감사 기록</h1>
        <p className="num mt-1 text-sm text-muted">
          모두 {int(totalCount)}줄 · 최근 50줄까지
        </p>
      </div>

      {/* 거르기 */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/audit"
          className={`inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold ${
            !filterAction
              ? "border-accent bg-accent text-white"
              : "border-line text-muted hover:bg-surface"
          }`}
        >
          전체
        </Link>
        {FILTER_ACTIONS.map((a) => (
          <Link
            key={a}
            href={`/audit?action=${encodeURIComponent(a)}`}
            className={`inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-semibold ${
              filterAction === a
                ? "border-accent bg-accent text-white"
                : "border-line text-muted hover:bg-surface"
            }`}
          >
            {a}
          </Link>
        ))}
      </div>

      {/* 표 */}
      <DataTable
        columns={[
          { key: "at",     label: "시각"   },
          { key: "actor",  label: "누가"   },
          { key: "action", label: "무엇을" },
          { key: "target", label: "대상"   },
          { key: "detail", label: "내용"   },
        ]}
        rows={rows}
        caption={`감사 기록 ${int(totalCount)}줄`}
        empty="감사 기록이 없습니다"
      />
    </div>
  );
}
