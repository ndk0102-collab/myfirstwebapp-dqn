export type Stage = "D+30" | "D+15" | "D+7" | "대기";
export type ToneMatrix = Record<string, Record<string, string>>;

/** oldestOpenDays → 단계. 0 이하면 null(확인 필요). 1–6이면 "대기". */
export function getStage(oldestOpenDays: number): Stage | null {
  if (oldestOpenDays <= 0) return null;
  if (oldestOpenDays >= 30) return "D+30";
  if (oldestOpenDays >= 15) return "D+15";
  if (oldestOpenDays >= 7) return "D+7";
  return "대기";
}

/** tone_matrix.csv 텍스트 → { "D+7": { S: "T1", ... }, ... } */
export function parseToneMatrix(csv: string): ToneMatrix {
  const [header, ...rows] = csv.trim().split("\n");
  const cols = header.split(",").map((s) => s.trim());
  const matrix: ToneMatrix = {};
  for (const row of rows) {
    const cells = row.split(",").map((s) => s.trim());
    const stage = cells[0];
    matrix[stage] = {};
    for (let i = 1; i < cols.length; i++) {
      matrix[stage][cols[i]] = cells[i] ?? "";
    }
  }
  return matrix;
}

/** 단계 × 등급 → 말투(T1·T2·T3). 표에 없으면 "T1"을 돌려준다. */
export function getTone(matrix: ToneMatrix, stage: Stage, grade: string): string {
  return matrix[stage]?.[grade] ?? "T1";
}

/** USD 정수 → "USD 12,345.00" (G1 검사에 쓰는 글자 그대로) */
export function fmtOverdueUsd(usdInt: number): string {
  return (
    "USD " +
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usdInt)
  );
}
