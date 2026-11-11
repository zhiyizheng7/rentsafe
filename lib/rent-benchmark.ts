import benchmarkData from "@/data/rent-benchmark.json";
import type { Status } from "@/data/mock-data";

export const RENTAL_TYPES = ["獨立套房", "分租套房", "分租雅房", "整棟(戶)出租", "分層出租"] as const;
export type RentalType = (typeof RENTAL_TYPES)[number];
export type District = keyof typeof benchmarkData.districts;

type RentStats = { median: number; p25: number; p75: number };
type BenchmarkEntry = {
  insufficient?: boolean;
  sampleSize: number;
  outliersRemoved?: number;
  rent?: RentStats;
  // 建物多樣性（舊版 JSON 沒有這些欄位）
  buildingCount?: number;
  topBuildingShare?: number;
  lowDiversity?: boolean;
};

export type RentBenchmarkResult = {
  district: District;
  rentalType: RentalType;
  listedRent: number;
  sampleSize: number;
  buildingCount?: number;
  topBuildingShare?: number;
  lowDiversity?: boolean;
  period: string;
  dataSource: string;
  method: string;
} & (
  | { kind: "unavailable" }
  | { kind: "insufficient" }
  | { kind: "ready"; rent: RentStats; deviation: number; status: Status; label: string; detail: string }
);

export const DISTRICTS = Object.keys(benchmarkData.districts) as District[];
export const RENT_BENCHMARK_PERIOD = `${benchmarkData.period.from}～${benchmarkData.period.to}`;

export function getRentBenchmark(district: District, rentalType: RentalType, listedRent: number): RentBenchmarkResult {
  const districtData = benchmarkData.districts[district] as Partial<Record<RentalType, BenchmarkEntry>>;
  const entry = districtData[rentalType];
  const common = {
    district,
    rentalType,
    listedRent,
    sampleSize: entry?.sampleSize ?? 0,
    buildingCount: entry?.buildingCount,
    topBuildingShare: entry?.topBuildingShare,
    lowDiversity: entry?.lowDiversity,
    period: RENT_BENCHMARK_PERIOD,
    dataSource: benchmarkData.dataSource,
    method: benchmarkData.method,
  };

  if (!entry) return { ...common, kind: "unavailable" };
  if (entry.insufficient || !entry.rent) return { ...common, kind: "insufficient" };

  const deviation = Number((((listedRent - entry.rent.median) / entry.rent.median) * 100).toFixed(1));
  if (listedRent > entry.rent.p75) {
    return { ...common, kind: "ready", rent: entry.rent, deviation, status: "warning", label: "高於主要行情區間", detail: "租金高於第 75 百分位，建議確認是否包含管理費、設備或其他服務。" };
  }
  if (listedRent < entry.rent.p25) {
    return { ...common, kind: "ready", rent: entry.rent, deviation, status: "warning", label: "低於主要行情區間", detail: "價格相對偏低不代表一定安全，建議確認物件條件、出租人身分與刊登內容。" };
  }
  return { ...common, kind: "ready", rent: entry.rent, deviation, status: "safe", label: "位於主要行情區間", detail: "租金落在目前樣本的第 25 至第 75 百分位之間；這只代表行情位置，不代表物件整體安全。" };
}
