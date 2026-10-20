export type CheckResult = {
  id: string;
  label: string;
  ok: boolean;
  note: string;
};

const G5_PHRASE = "If you have already paid, please disregard this message.";
const ALLOWED_EMAIL = "credit@hanbitprecision.example";

function normalizeAmount(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * G1–G7 가드레일 검사. 순수 함수 — 스크립트와 화면이 함께 쓴다.
 * @param subject  AI가 만든 제목
 * @param body     AI가 만든 본문
 * @param buyerName 바이어 이름 (데이터 그대로)
 * @param amountStr fmtOverdueUsd()가 만든 금액 글자 (예: "USD 12,345.00")
 */
export function runGuardrails(
  subject: string,
  body: string,
  buyerName: string,
  amountStr: string,
): CheckResult[] {
  const combined = subject + " " + body;

  // ── G1: 금액 정확 ──────────────────────────────────────────────────────────
  const amountNorm = normalizeAmount(amountStr);
  const g1Present = body.normalize("NFC").toLowerCase().includes(amountNorm);
  const moneyRe = /(?:USD\s*|US\$|\$)[\d,]+(?:\.\d+)?/gi;
  const allMoney = [...body.normalize("NFC").matchAll(moneyRe)].map((m) => normalizeAmount(m[0]));
  const otherMoney = allMoney.filter((m) => m !== amountNorm);
  const g1 = g1Present && otherMoney.length === 0;
  const g1Note = !g1Present
    ? `본문에 '${amountStr}'이 없음`
    : otherMoney.length > 0
      ? `다른 금액 표기 발견: ${otherMoney.slice(0, 3).join(", ")}`
      : "";

  // ── G2: 바이어 이름 ────────────────────────────────────────────────────────
  const g2 = body
    .normalize("NFC")
    .toLowerCase()
    .includes(buyerName.normalize("NFC").toLowerCase());

  // ── G3: 계좌 없음 ──────────────────────────────────────────────────────────
  const g3Patterns = [
    /\baccount\s+number\b/i,
    /\baccount\s+no\./i,
    /\bbank\s+account\b/i,
    /\bbank\s+details\b/i,
    /\bnew\s+account\b/i,
    /\brouting\s+number\b/i,
    /\bswift\s+code\b/i,
    /계좌/,
    /\bIBAN\b/,
    /\bSWIFT\b(?!\s+payment)/,
    /\bBIC\b/,
  ];
  const g3Hit = g3Patterns.find((re) => re.test(combined));
  const g3 = !g3Hit;

  // ── G4: 법적 표현 없음 ─────────────────────────────────────────────────────
  const g4Re = /\b(lawsuit|legal\s+action|court|police|attorney|criminal)\b/i;
  const g4Match = combined.match(g4Re);
  const g4 = !g4Match;

  // ── G5: 이미 냈다면 무시 문장 ─────────────────────────────────────────────
  const g5 = body.includes(G5_PHRASE);

  // ── G6: 180단어 이하 ───────────────────────────────────────────────────────
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const g6 = wordCount <= 180;

  // ── G7: 링크 · 다른 메일 없음 ─────────────────────────────────────────────
  const noLinks = !/(?:https?:\/\/|www\.)/i.test(combined);
  const emailRe = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi;
  const allEmails = [...combined.matchAll(emailRe)].map((m) => m[0]);
  const badEmails = allEmails.filter((e) => e !== ALLOWED_EMAIL);
  const g7 = noLinks && badEmails.length === 0;

  return [
    { id: "G1", label: "금액 정확",        ok: g1, note: g1Note },
    { id: "G2", label: "바이어 이름",       ok: g2, note: g2 ? "" : `'${buyerName}'이 본문에 없음` },
    { id: "G3", label: "계좌 없음",         ok: g3, note: g3 ? "" : "계좌·IBAN·SWIFT 표현 발견" },
    { id: "G4", label: "법적 표현 없음",    ok: g4, note: g4 ? "" : `법적 표현 발견: ${g4Match?.[0]}` },
    { id: "G5", label: "이미 냈다면 무시",  ok: g5, note: g5 ? "" : "필수 문장 없음" },
    { id: "G6", label: "180단어 이하",      ok: g6, note: g6 ? "" : `${wordCount}단어` },
    { id: "G7", label: "링크·다른 메일 없음", ok: g7, note: g7 ? "" : `링크 또는 허용 외 메일: ${badEmails.join(", ")}` },
  ];
}
