import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold text-ink">바이어를 찾을 수 없습니다</h1>
      <p className="text-muted">주소의 바이어 번호(예: B048)를 확인해 주세요.</p>
      <Link href="/buyers" className="inline-flex min-h-11 items-center rounded-md px-3 text-accent hover:bg-surface">
        바이어 목록으로
      </Link>
    </div>
  );
}
