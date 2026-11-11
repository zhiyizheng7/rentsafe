
"use client";

import { useState } from "react";
import { DemoCasePicker } from "@/components/demo-case-picker";
import {
  ListingImageUpload,
  type ListingInfo,
} from "@/components/listing-image-upload";
import { SourceTag } from "@/components/source-tag";
import { StatusBadge } from "@/components/status-badge";
import { TrafficLight } from "@/components/traffic-light";
import { checkDemoCases, findCheckDemoCase } from "@/data/demo-cases";
import { mockCheckResult, mockHauntedDangerResult } from "@/data/mock-data";
import {
  DISTRICTS,
  RENTAL_TYPES,
  getRentBenchmark,
  type District,
  type RentalType,
  type RentBenchmarkResult,
} from "@/lib/rent-benchmark";

type CheckMode = "manual" | "upload" | "demo";
type InputMethod = "manual" | "upload";

const confirmationItems = [
  {
    title: "建物登記與違建",
    detail:
      "目前尚未自動查證。請要求出租人說明有無未登記增建、加建或違建，並填寫現況確認書第 1 項。",
  },
  {
    title: "隔間與出租型態",
    detail:
      "請現場核對格局與出租型態，並要求出租人填寫現況確認書第 2 項。",
  },
  {
    title: "凶宅風險提醒",
    detail:
      "沒有官方資料庫可證明是否曾發生非自然死亡；請要求出租人填寫現況確認書第 8 項，並自行查詢新聞或詢問管理員。",
  },
  {
    title: "租金補貼",
    detail:
      "資格請依主管機關公告確認；簽約時要留意，範本明載「承租人不得申請租金補貼」這類條款無效。",
  },
] as const;

function formatCurrency(value: number) {
  return `$${value.toLocaleString("zh-TW")}`;
}

// ================================
// 統一的綜合租屋查核報告
// ================================

function OverallReport({
  result,
  mode,
}: {
  result: RentBenchmarkResult;
  mode: CheckMode;
}) {
  const hasBenchmark =
    result.kind !== "unavailable" &&
    result.kind !== "insufficient";

  const deviation = hasBenchmark ? result.deviation : null;

  let summary = "目前無法判定租金行情，建議補充資料後再評估。";
  let recommendation =
    "請確認實際月租金、額外費用、建物現況及租賃契約內容。";

  if (hasBenchmark) {
    if (result.deviation > 20) {
      summary = "租金高於同區同房型中位數，建議謹慎比較。";
      recommendation =
        "建議比較其他同類型物件，並向房東確認租金較高的原因，例如坪數、屋齡、設備、地段或管理服務。";
    } else if (result.deviation < -20) {
      summary = "租金低於同區同房型中位數，建議確認廣告資訊。";
      recommendation =
        "租金較低不一定代表有問題，但建議確認是否另有管理費、設備費、特殊租約條件或其他限制。";
    } else {
      summary = "租金與同區同房型中位數差距相對較小。";
      recommendation =
        "可以進一步了解物件，但仍應確認屋況、額外費用、出租權限與租賃契約內容。";
    }
  }

  return (
    <section className="space-y-5 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">RentSafe 綜合評估</p>
          <h3 className="mt-2 text-2xl font-semibold text-[color:var(--text-primary)]">
            物件初步查核報告
          </h3>
        </div>

        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
          待進一步確認
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Metric
          label="廣告月租金"
          value={formatCurrency(result.listedRent)}
        />
        <Metric
          label="行情判定"
          value={hasBenchmark ? result.label : "資料不足"}
          small
        />
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-[color:var(--text-primary)]">
          一、租金合理性
        </h4>

        {hasBenchmark ? (
          <div className="space-y-2 text-sm leading-7 text-[color:var(--text-secondary)]">
            <p>
              臺北市{result.district}的{result.rentalType}，
              同類型物件月租金中位數約為
              <strong className="text-[color:var(--text-primary)]">
                {formatCurrency(result.rent.median)}
              </strong>
              。
            </p>

            <p>
              這間物件的廣告月租金為
              {formatCurrency(result.listedRent)}，
              {deviation !== null && deviation > 0
                ? `高於中位數 ${deviation}%`
                : deviation !== null && deviation < 0
                  ? `低於中位數 ${Math.abs(deviation)}%`
                  : "與中位數相同"}
              。
            </p>

            <p>{summary}</p>

            <SampleDiversity result={result} />
          </div>
        ) : (
          <p className="text-sm leading-7 text-amber-200">
            目前缺少足夠的同區同房型租賃樣本，
            因此不提供租金合理性判定。
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-[color:var(--text-primary)]">
          二、其他風險與資訊完整性
        </h4>

        <p className="text-sm leading-7 text-[color:var(--text-secondary)]">
          目前尚未自動驗證建物登記、違建、
          室內隔間、屋況、非自然死亡紀錄及租約條款。
          這些項目需要另外查證，不能因租金合理就認定房屋安全。
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold text-[color:var(--text-primary)]">
          三、綜合建議
        </h4>

        <p className="text-sm leading-7 text-[color:var(--text-secondary)]">
          {recommendation}
        </p>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-xs leading-6 text-[color:var(--text-muted)]">
          資料來源：
          {mode === "demo"
            ? "展示案例（租金行情為實際資料；其他風險為模擬情境）"
            : mode === "upload"
              ? "使用者上傳截圖並確認的租屋資訊"
              : "使用者手動輸入的租屋資訊"}
          。
          租金行情依系統現有資料計算。
          本報告僅提供初步輔助評估，不代表建物合法性或居住安全認證。
          ±20% 為暫定的產品提醒門檻，並非法定標準。
        </p>
      </div>
    </section>
  );
}

// ================================
// 原本的租金行情分析
// ================================

function RentResult({
  result,
}: {
  result: RentBenchmarkResult;
}) {
  if (result.kind === "unavailable") {
    return (
      <div className="border-l-2 border-amber-500/60 pl-4 text-sm leading-7 text-amber-100">
        目前沒有「{result.district}・{result.rentalType}」的可用樣本，
        因此不判定行情高低。你可以改選其他出租型態。
      </div>
    );
  }

  if (result.kind === "insufficient") {
    return (
      <div className="space-y-3 border-l-2 border-amber-500/60 pl-4 text-sm leading-7 text-amber-100">
        <p>
          目前只有 {result.sampleSize} 筆有效樣本，
          少於最低門檻 10 筆，因此不提供中位數或行情判定。
        </p>
        <SourceTag
          source="real"
          period={result.period}
          sampleSize={result.sampleSize}
        />
      </div>
    );
  }

  const deviationText =
    result.deviation > 0
      ? `高於中位數 ${result.deviation}%`
      : result.deviation < 0
        ? `低於中位數 ${Math.abs(result.deviation)}%`
        : "與中位數相同";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TrafficLight status={result.status} />

          <div>
            <h4 className="text-lg font-semibold text-[color:var(--text-primary)]">
              {result.label}
            </h4>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
              {result.district}・{result.rentalType}
            </p>
          </div>
        </div>

        <StatusBadge
          kind="status"
          value={result.status}
          overrideLabel={result.label}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="你的月租"
          value={formatCurrency(result.listedRent)}
        />
        <Metric
          label="區域中位數"
          value={formatCurrency(result.rent.median)}
        />
        <Metric
          label="主要行情區間"
          value={`${formatCurrency(result.rent.p25)}–${formatCurrency(result.rent.p75)}`}
          small
        />
        <Metric
          label="與中位數比較"
          value={deviationText}
          small
        />
      </div>

      <SampleDiversity result={result} />

      <p className="text-sm leading-7 text-[color:var(--text-secondary)]">
        {result.detail}
      </p>

      <SourceTag
        source="real"
        period={result.period}
        sampleSize={result.sampleSize}
      />

      <details className="text-xs leading-6 text-[color:var(--text-muted)]">
        <summary className="cursor-pointer">查看統計方法</summary>
        <p className="mt-2">{result.method}</p>
      </details>
    </div>
  );
}

function SampleDiversity({
  result,
}: {
  result: RentBenchmarkResult;
}) {
  if (result.buildingCount === undefined) return null;

  const countText = `樣本 ${result.sampleSize} 筆，來自 ${result.buildingCount} 棟建物`;

  if (result.lowDiversity) {
    return (
      <div className="border-l-2 border-amber-500/60 pl-3 text-sm leading-6 text-amber-200">
        <p className="font-medium">樣本集中於少數建物，僅供參考</p>
        <p>{countText}</p>
      </div>
    );
  }

  return (
    <p className="text-xs leading-6 text-[color:var(--text-muted)]">
      {countText}
    </p>
  );
}

function Metric({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="border-l-2 border-white/10 pl-3">
      <p className="text-xs text-[color:var(--text-muted)]">
        {label}
      </p>
      <p
        className={`mt-2 font-semibold text-[color:var(--text-primary)] ${
          small ? "text-lg" : "text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ================================
// 主要物件查核元件
// ================================

export function CheckDemo({
  initialCaseId,
}: {
  initialCaseId?: string;
}) {
  const initialCase = findCheckDemoCase(initialCaseId);

  const [mode, setMode] = useState<CheckMode>(
    initialCase ? "demo" : "manual"
  );

  const [inputMethod, setInputMethod] = useState<InputMethod>("manual");

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    initialCase?.id ?? null
  );

  const [district, setDistrict] = useState<District>(
    initialCase?.district ?? "文山區"
  );

  const [rentalType, setRentalType] = useState<RentalType>(
    initialCase?.rentalType ?? "獨立套房"
  );

  const [listedRent, setListedRent] = useState(
    initialCase ? String(initialCase.listedRent) : ""
  );

  const [result, setResult] = useState<RentBenchmarkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocrMessage, setOcrMessage] = useState("");

  const [showHauntedRecord, setShowHauntedRecord] = useState(
    initialCase?.showHauntedRecord ?? false
  );

  // 接收 OCR 辨識結果
  const handleRecognized = (info: ListingInfo) => {
    if (
      info.district &&
      DISTRICTS.includes(info.district as District)
    ) {
      setDistrict(info.district as District);
    }

    if (
      info.rentalType &&
      RENTAL_TYPES.includes(info.rentalType as RentalType)
    ) {
      setRentalType(info.rentalType as RentalType);
    }

    if (info.rent !== undefined) {
      setListedRent(String(info.rent));
    }

    setMode("upload");
    setSelectedCaseId(null);
    setShowHauntedRecord(false);
    setResult(null);
    setError(null);

    const recognizedCount = [
      info.district,
      info.rentalType,
      info.rent,
    ].filter((value) => value !== undefined).length;

    setOcrMessage(
      `已辨識 ${recognizedCount}/3 項關鍵資訊。請確認下方欄位，未辨識的欄位需要手動補充。`
    );
  };

  // 統一執行租金查核
  const runCheck = (
    nextDistrict = district,
    nextType = rentalType,
    nextRent = listedRent
  ) => {
    const rent = Number(nextRent);

    if (
      !Number.isInteger(rent) ||
      rent <= 0 ||
      rent > 1_000_000
    ) {
      setError("請輸入 1 至 1,000,000 元之間的整數月租");
      setResult(null);
      return;
    }

    setError(null);

    setResult(
      getRentBenchmark(nextDistrict, nextType, rent)
    );
  };

  const submitCheck = () => {
    setMode(inputMethod);
    setSelectedCaseId(null);
    setShowHauntedRecord(false);
    runCheck();
  };

  // 載入展示案例
  const loadCase = (id: string) => {
    const demoCase = findCheckDemoCase(id);

    if (!demoCase) return;

    const rent = String(demoCase.listedRent);

    setMode("demo");
    setSelectedCaseId(id);
    setDistrict(demoCase.district);
    setRentalType(demoCase.rentalType);
    setListedRent(rent);
    setShowHauntedRecord(demoCase.showHauntedRecord);
    setError(null);
    setOcrMessage("");

    setResult(
      getRentBenchmark(
        demoCase.district,
        demoCase.rentalType,
        demoCase.listedRent
      )
    );
  };

  // 重設表單
  const reset = () => {
    setMode("manual");
    setInputMethod("manual");
    setSelectedCaseId(null);
    setDistrict("文山區");
    setRentalType("獨立套房");
    setListedRent("");
    setResult(null);
    setError(null);
    setOcrMessage("");
    setShowHauntedRecord(false);
  };

  const haunted = showHauntedRecord
    ? mockHauntedDangerResult.haunted
    : mockCheckResult.modules.haunted;

  return (
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      {/* 左側：輸入區域 */}
      <div className="space-y-6">
        <section className="panel p-6 sm:p-8">
          <div className="mb-6 space-y-3">
            <p className="eyebrow">智慧物件查核</p>

            <h2 className="font-serif text-3xl text-[color:var(--text-primary)]">
              輸入物件租屋條件
            </h2>

            <p className="text-sm leading-7 text-[color:var(--text-secondary)]">
              選擇上傳租屋廣告截圖，或手動輸入租屋資訊。
              兩種方式都會使用相同的租金行情分析，
              並產生綜合查核報告。
            </p>
          </div>

          <div className="space-y-5">
            {/* 輸入方式切換 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setInputMethod("upload");
                  setResult(null);
                  setError(null);
                }}
                className={`rounded-2xl border p-3 text-sm ${
                  inputMethod === "upload"
                    ? "border-orange-500 bg-orange-500/10 text-orange-300"
                    : "border-white/10 text-gray-300"
                }`}
              >
                上傳租屋截圖
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputMethod("manual");
                  setResult(null);
                  setError(null);
                  setOcrMessage("");
                }}
                className={`rounded-2xl border p-3 text-sm ${
                  inputMethod === "manual"
                    ? "border-orange-500 bg-orange-500/10 text-orange-300"
                    : "border-white/10 text-gray-300"
                }`}
              >
                手動輸入
              </button>
            </div>

            {/* OCR 圖片上傳 */}
            {inputMethod === "upload" && (
              <div className="space-y-3">
                <ListingImageUpload
                  onRecognized={handleRecognized}
                />

                {ocrMessage && (
                  <p
                    role="status"
                    className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm leading-6 text-amber-200"
                  >
                    {ocrMessage}
                  </p>
                )}
              </div>
            )}

            {/* 共用確認表單 */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/10 p-4">
              <div>
                <h3 className="font-semibold text-[color:var(--text-primary)]">
                  {inputMethod === "upload"
                    ? "確認 OCR 辨識資訊"
                    : "填寫租屋資訊"}
                </h3>

                <p className="mt-2 text-xs leading-6 text-[color:var(--text-secondary)]">
                  {inputMethod === "upload"
                    ? "請確認自動填入的資料是否正確。辨識失敗的欄位可以自行修改。"
                    : "請輸入物件所在行政區、出租型態與每月租金。"}
                </p>
              </div>

              <SelectField
                label="行政區"
                value={district}
                options={DISTRICTS}
                onChange={(value) => {
                  setDistrict(value as District);
                  setResult(null);
                }}
              />

              <SelectField
                label="出租型態"
                value={rentalType}
                options={RENTAL_TYPES}
                onChange={(value) => {
                  setRentalType(value as RentalType);
                  setResult(null);
                }}
              />

              <label className="block space-y-2">
                <span className="text-sm text-[color:var(--text-secondary)]">
                  每月租金（元）
                </span>

                <input
                  inputMode="numeric"
                  type="number"
                  min="1"
                  max="1000000"
                  step="1"
                  value={listedRent}
                  onChange={(event) => {
                    setListedRent(event.target.value);
                    setResult(null);
                  }}
                  placeholder="例如 12000"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--primary)]/40"
                />
              </label>

              {error && (
                <p role="alert" className="text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                type="button"
                className="button-primary w-full justify-center"
                onClick={submitCheck}
              >
                產生綜合查核報告
              </button>
            </div>
          </div>
        </section>

        {/* 保留原本展示案例 */}
        <DemoCasePicker
          cases={checkDemoCases}
          selectedId={selectedCaseId}
          onLoad={loadCase}
          onReset={reset}
          compact
        />
      </div>

      {/* 右側：統一分析結果 */}
      <section className="panel p-6 sm:p-8">
        {!result ? (
          <EmptyResult />
        ) : (
          <div className="space-y-7">
            <div>
              <p className="eyebrow">
                {mode === "demo"
                  ? "完整展示案例"
                  : "綜合物件查核"}
              </p>

              <h3 className="mt-3 font-serif text-2xl text-[color:var(--text-primary)]">
                臺北市{result.district}・{result.rentalType}
              </h3>

              {mode === "demo" && (
                <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                  租金行情使用真實資料；
                  下方建物與屋況內容為情境示範。
                </p>
              )}
            </div>

            {/* 新增統一綜合報告 */}
            <OverallReport result={result} mode={mode} />

            {/* 原本租金行情結果 */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h4 className="mb-4 text-lg font-semibold text-[color:var(--text-primary)]">
                詳細租金行情
              </h4>

              <RentResult result={result} />
            </div>

            {/* 其他風險 */}
            {mode === "demo" ? (
              <DemoModules
                haunted={haunted}
                showHauntedRecord={showHauntedRecord}
              />
            ) : (
              <ConfirmationList />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ================================
// 共用表單元件
// ================================

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-[color:var(--text-secondary)]">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-[color:var(--text-primary)] outline-none focus:border-[color:var(--primary)]/40"
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyResult() {
  return (
    <div className="flex min-h-96 flex-col justify-between gap-8">
      <div className="space-y-3">
        <p className="eyebrow">結果預覽</p>

        <h3 className="font-serif text-3xl text-[color:var(--text-primary)]">
          上傳截圖或手動輸入，取得綜合評估
        </h3>

        <p className="text-sm leading-7 text-[color:var(--text-secondary)]">
          系統會依據行政區、出租型態與租金，
          比較真實租賃行情，並產生初步查核建議。
          建物合法性與居住安全仍需另外確認。
        </p>
      </div>

      <div className="rounded-3xl border border-[color:var(--primary)]/20 bg-[color:var(--primary)]/8 p-5 text-sm leading-7 text-[color:var(--text-secondary)]">
        你也可以載入左側展示案例，
        快速了解租金行情分析與其他風險提醒的呈現方式。
      </div>
    </div>
  );
}

function ConfirmationList() {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-lg font-semibold text-[color:var(--text-primary)]">
          其他風險仍需確認
        </h4>

        <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
          以下不是自動查詢結果，也不納入租金行情判定。
        </p>
      </div>

      {confirmationItems.map((item) => (
        <article
          key={item.title}
          className="rounded-2xl border border-amber-500/15 bg-amber-500/8 p-4"
        >
          <p className="font-medium text-amber-100">
            {item.title}・尚未自動查證
          </p>

          <p className="mt-2 text-sm leading-7 text-[color:var(--text-secondary)]">
            {item.detail}
          </p>
        </article>
      ))}
    </div>
  );
}

function DemoModules({
  haunted,
  showHauntedRecord,
}: {
  haunted:
    | typeof mockCheckResult.modules.haunted
    | typeof mockHauntedDangerResult.haunted;
  showHauntedRecord: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-red-500/15 bg-red-500/8 p-5 text-sm leading-7 text-red-100">
        {showHauntedRecord
          ? mockHauntedDangerResult.summary
          : mockCheckResult.summary}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-lg font-semibold text-[color:var(--text-primary)]">
            建物與隔間情境
          </h4>
          <SourceTag source="mock" />
        </div>

        <div className="space-y-3">
          {mockCheckResult.modules.legality.items.map((item) => (
            <article
              key={item.label}
              className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0"
            >
              <p className="font-medium text-[color:var(--text-primary)]">
                {item.label}
              </p>

              <p className="mt-2 text-sm leading-7 text-[color:var(--text-secondary)]">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-lg font-semibold text-[color:var(--text-primary)]">
            {haunted.label}
          </h4>
          <SourceTag source="mock" />
        </div>

        <p className="text-sm leading-7 text-[color:var(--text-secondary)]">
          {haunted.detail}
        </p>
      </div>
    </div>
  );
}
