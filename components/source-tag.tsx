import { type DataSource } from "@/data/mock-data";

type SourceTagProps = {
  source: DataSource;
  // real 才需要：實價登錄資料期別與樣本數（F2 完成後由資料帶入）
  period?: string;
  sampleSize?: number;
};

function sourceLabel({ source, period, sampleSize }: SourceTagProps) {
  if (source === "mock") {
    return "示範資料";
  }

  if (source === "rules") {
    return "規則比對・依據：住宅租賃契約書範本";
  }

  return `資料來源：內政部實價登錄・${period ?? "期別未提供"}・樣本數 ${sampleSize ?? "未提供"}`;
}

export function SourceTag(props: SourceTagProps) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-black/30 px-2 py-1 text-xs text-[color:var(--text-muted)]">
      {sourceLabel(props)}
    </span>
  );
}
