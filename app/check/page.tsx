
import { CheckDemo } from "@/components/check-demo";

export default async function CheckPage({
  searchParams,
}: PageProps<"/check">) {
  // 讀取網址中的展示案例參數
  const { case: caseParam } = await searchParams;

  const initialCaseId =
    typeof caseParam === "string" ? caseParam : undefined;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      {/* 頁面標題 */}
      <section className="space-y-4">
        <p className="eyebrow">智慧物件查核</p>

        <h1 className="font-serif text-5xl leading-tight text-[color:var(--text-primary)]">
          上傳租屋截圖或手動輸入，取得綜合租屋評估
        </h1>

        <p className="max-w-3xl text-base leading-8 text-[color:var(--text-secondary)]">
          RentSafe 提供兩種物件查核方式：
          上傳租屋廣告截圖，由 OCR 自動擷取租屋資訊；
          或手動輸入行政區、出租型態與月租金。
          系統將對照臺北市租賃行情資料，
          提供租金合理性分析、風險提醒與綜合建議。
        </p>
      </section>

      {/* 物件查核主功能：包含截圖上傳與手動輸入 */}
      <CheckDemo
        key={initialCaseId ?? "default"}
        initialCaseId={initialCaseId}
      />
    </div>
  );
}

