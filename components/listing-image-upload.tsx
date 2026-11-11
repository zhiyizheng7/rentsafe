
"use client";

import { useEffect, useState } from "react";
import { createWorker } from "tesseract.js";

export type ListingInfo = {
  district?: string;
  rentalType?: string;
  rent?: number;
  extraFee?: number;
};

const DISTRICTS = [
  "中正區", "大同區", "中山區", "松山區",
  "大安區", "萬華區", "信義區", "士林區",
  "北投區", "內湖區", "南港區", "文山區",
];

const RENTAL_TYPES = [
  "獨立套房", "分租套房", "雅房", "整層住家",
];

function normalizeText(text: string) {
  return text
    .replace(/[０-９]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 65248)
    )
    .replace(/，/g, ",")
    .replace(/[\u00a0\u3000]/g, " ")
    .replace(/([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g, "$1");
}

function parseAmount(value: string): number | undefined {
  const amount = Number(value.replace(/[,，\s]/g, ""));

  return Number.isInteger(amount) &&
    amount > 0 &&
    amount <= 1_000_000
    ? amount
    : undefined;
}

function findAmount(
  text: string,
  patterns: RegExp[]
): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      const amount = parseAmount(match[1]);

      if (amount !== undefined) return amount;
    }
  }

  return undefined;
}

function parseListingText(text: string): ListingInfo {
  const normalized = normalizeText(text);
  const compact = normalized.replace(/\s+/g, "");

  // 行政區
  const district = DISTRICTS.find((item) =>
    compact.includes(item)
  );

  // 出租型態
  let rentalType = RENTAL_TYPES.find((item) =>
    compact.includes(item)
  );

  // 如果廣告明確標示多房多廳，可推測為整層住家
  // 但仍需使用者確認
  if (!rentalType && /[1-9]\d*房[0-9]廳/.test(compact)) {
    rentalType = "整層住家";
  }

  // 優先尋找「月租金」等標籤附近的金額
  const rentPatterns = [
    /(?:月租金|每月租金|月租|租金|租屋價格|出租價格)\s*[:：]?\s*(?:NT\$|NTD|＄|\$)?\s*([\d,]{4,9})/i,
    /(?:NT\$|NTD|＄|\$)\s*([\d,]{4,9})\s*(?:元)?\s*\/\s*月/i,
    /([\d,]{4,9})\s*元\s*\/\s*月/,
    /([\d,]{4,9})\s*元\s*每月/,
  ];

  const extraFeePatterns = [
    /(?:額外費用|其他費用|管理費|每月額外費用)\s*[:：]?\s*(?:NT\$|NTD|＄|\$)?\s*([\d,]{1,9})/i,
  ];

  let rent = findAmount(normalized, rentPatterns);
  const extraFee = findAmount(normalized, extraFeePatterns);

  // 若租金沒有標籤，嘗試從金額候選值判斷
  // 排除額外費用與過小的數字
  if (rent === undefined) {
    const candidates: number[] = [];

    const amountRegex =
      /(?:NT\$|NTD|＄|\$)?\s*(\d{1,3}(?:,\d{3})+|\d{4,7})\s*(?:元)?/gi;

    for (const match of normalized.matchAll(amountRegex)) {
      const amount = parseAmount(match[1]);

      if (
        amount !== undefined &&
        amount >= 5_000 &&
        amount !== extraFee
      ) {
        candidates.push(amount);
      }
    }

    // 只有唯一候選金額時才自動填入
    const uniqueCandidates = [...new Set(candidates)];

    if (uniqueCandidates.length === 1) {
      rent = uniqueCandidates[0];
    }
  }

  // 避免把已識別的額外費用當成月租金
  if (
    rent !== undefined &&
    extraFee !== undefined &&
    rent === extraFee
  ) {
    rent = undefined;
  }

  return {
    district,
    rentalType,
    rent,
    extraFee,
  };
}

export function ListingImageUpload({
  onRecognized,
}: {
  onRecognized?: (info: ListingInfo) => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recognizedInfo, setRecognizedInfo] =
    useState<ListingInfo | null>(null);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selected = event.target.files?.[0];

    if (!selected) return;

    setError("");

    if (
      !["image/png", "image/jpeg", "image/webp"].includes(
        selected.type
      )
    ) {
      setError("請上傳 PNG、JPG 或 WebP 圖片");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError("圖片不可超過 10MB");
      return;
    }

    setFile(selected);
    setImageUrl(URL.createObjectURL(selected));
    setText("");
    setRecognizedInfo(null);
  }

  async function recognizeImage() {
    if (!file || loading) return;

    setLoading(true);
    setError("");
    setText("");
    setRecognizedInfo(null);

    let worker:
      | Awaited<ReturnType<typeof createWorker>>
      | undefined;

    try {
      worker = await createWorker("chi_tra+eng");

      const result = await worker.recognize(file);
      const recognizedText = result.data.text;

      setText(recognizedText);

      const listingInfo = parseListingText(recognizedText);

      setRecognizedInfo(listingInfo);
      onRecognized?.(listingInfo);
    } catch (err) {
      console.error("OCR 辨識失敗：", err);
      setError("辨識失敗，請確認網路連線並重新嘗試。");
    } finally {
      if (worker) {
        await worker.terminate();
      }

      setLoading(false);
    }
  }

  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-[#202020] p-6">
      <div>
        <p className="text-sm font-semibold text-orange-500">
          AI 租屋截圖辨識
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-white">
          上傳租屋廣告截圖
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-400">
          系統會嘗試辨識行政區、出租型態、
          月租金與額外費用。
        </p>
      </div>

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        disabled={loading}
        className="block w-full text-sm text-gray-300"
      />

      {imageUrl && (
        <div>
          <img
            src={imageUrl}
            alt="租屋廣告截圖預覽"
            className="max-h-80 w-full object-contain"
          />
        </div>
      )}

      <button
        type="button"
        onClick={recognizeImage}
        disabled={!file || loading}
        className="w-full rounded-full bg-orange-700 px-5 py-3 font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-300"
      >
        {loading ? "正在辨識圖片..." : "開始辨識截圖"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {recognizedInfo && (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <h3 className="font-semibold text-white">
            自動擷取結果
          </h3>

          <div className="space-y-2 text-sm text-gray-300">
            <p>
              行政區：
              <strong className="text-white">
                {recognizedInfo.district ?? "未辨識"}
              </strong>
            </p>

            <p>
              出租型態：
              <strong className="text-white">
                {recognizedInfo.rentalType ?? "未辨識"}
              </strong>
            </p>

            <p>
              月租金：
              <strong className="text-white">
                {recognizedInfo.rent !== undefined
                  ? `NT$ ${recognizedInfo.rent.toLocaleString("zh-TW")}`
                  : "未辨識"}
              </strong>
            </p>

            <p>
              額外費用：
              <strong className="text-white">
                {recognizedInfo.extraFee !== undefined
                  ? `NT$ ${recognizedInfo.extraFee.toLocaleString("zh-TW")}`
                  : "未辨識"}
              </strong>
            </p>
          </div>

          <p className="text-xs leading-6 text-amber-200">
            辨識結果可能有誤，請確認下方表單，
            再進行租金行情分析。
          </p>
        </div>
      )}

      {text && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-gray-300">
            查看完整 OCR 辨識文字
          </summary>

          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap border-l-2 border-white/15 pl-4 text-sm text-gray-200">
            {text}
          </pre>
        </details>
      )}
    </section>
  );
}
