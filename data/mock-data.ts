export type Status = "safe" | "warning" | "danger";
export type ContractRisk = "low" | "medium" | "high";
export type DataSource = "real" | "rules" | "mock";

export const navigationItems = [
  { href: "/", label: "首頁" },
  { href: "/tour", label: "情境看房" },
  { href: "/check", label: "物件查核" },
  { href: "/contract", label: "合約審查" },
  { href: "/about", label: "關於我們" },
] as const;

export const propertyLoadingSteps = [
  "載入示範案例資料...",
  "整理查核項目...",
  "產生查核報告...",
] as const;

// 「載入示範合約」：只載入預設結果（示範資料）
export const contractDemoLoadingSteps = [
  "載入示範合約...",
  "整理條款風險...",
  "產生審查報告...",
] as const;

// 上傳 PDF（F3）：瀏覽器端取字後依範本規則比對；步驟依實際進度推進，不用計時器
export const contractPdfSteps = [
  "讀取 PDF 文字層",
  "整理文字（合併斷行、移除空白）",
  "比對住宅租賃契約書範本",
  "產生條款審查報告",
] as const;

// 貼上合約文字（F3）：實際依範本規則比對
export const contractLoadingSteps = [
  "正在解析合約內容...",
  "比對住宅租賃契約書範本...",
  "標記高風險條款...",
  "產生條款審查報告...",
] as const;

export const mockCheckResult = {
  address: "台北市文山區木柵路一段 XX 號",
  analysisTime: "58秒",
  modules: {
    legality: {
      status: "warning" as Status,
      source: "mock" as DataSource,
      items: [
        {
          label: "坪數真實性",
          status: "danger" as Status,
          detail: "廣告坪數 12 坪，登記建坪 8.2 坪，差異達 46%",
        },
        {
          label: "違建查核",
          status: "danger" as Status,
          detail:
            "建物使用執照登記為 4 樓，廣告物件位於 5 樓，疑似頂樓加蓋。依範本附件一第 1 項，出租人應說明有無未登記之增建、加建或違建；若有，租客要留意被拆除的風險",
        },
        {
          label: "隔間與出租型態",
          status: "warning" as Status,
          detail: "建物登記用途為一般住宅，廣告標示為套房，請向房東確認出租型態與有無隔間（範本附件一第 2 項）",
        },
        {
          label: "租金補貼",
          status: "warning" as Status,
          detail: "補貼資格請依主管機關公告確認。簽約時要留意：範本規定「承租人不得申請租金補貼」的條款無效",
        },
      ],
    },
    pricing: {
      status: "warning" as Status,
      source: "mock" as DataSource,
      marketMedian: 7200,
      listedPrice: 8000,
      deviation: 11.1,
      level: "偏高",
      detail: "報價高於文山區同類型物件中位數 11.1%",
    },
    haunted: {
      status: "warning" as Status,
      source: "mock" as DataSource,
      label: "凶宅風險提醒",
      detail:
        "無法以官方資料查證。依住宅租賃契約書範本附件一第 8 項，出租人須說明是否曾發生兇殺、自殺、一氧化碳中毒或其他非自然死亡情事，簽約前請要求房東填寫",
      checklist: [
        "要求房東填寫現況確認書第 8 項（產權持有期間／持有前）",
        "搜尋該地址或社區的相關新聞",
        "向管理員或鄰居詢問",
      ],
      note: "房東可在產權持有前勾選「不知道」，填寫結果不等於保證沒有",
    },
  },
  summary: "此物件存在 2 項高風險警示，建議謹慎評估。",
};

// 第二筆測試資料：情境示範
export const mockHauntedDangerResult = {
  haunted: {
    status: "danger" as Status,
    source: "mock" as DataSource,
    label: "凶宅風險提醒",
    detail: "若房東在現況確認書第 8 項勾選「有」，或該地址有新聞報導，建議謹慎評估",
  },
  summary: "情境示範：若房東在現況確認書第 8 項勾選「有」，或該地址有新聞報導，建議謹慎評估。",
};

export const mockContractResult = {
  fileName: "租賃契約書.pdf",
  analysisTime: "2分14秒",
  riskLevel: "high" as ContractRisk,
  source: "mock" as DataSource,
  clauses: [
    {
      risk: "high" as ContractRisk,
      label: "戶籍與租金補貼",
      original: "承租人不得將戶籍遷入本租賃住宅，亦不得申請租金補貼",
      issue: "住宅租賃契約書範本的簽約注意事項二十二將這類條款列為「不得簽訂」，簽訂者該條款無效",
      suggestion: "簽約前要求刪除。這類條款可能影響你遷入戶籍或申請租金補貼",
      basis: "範本簽約注意事項二十二（四）、（十），p22–23",
    },
    {
      risk: "high" as ContractRisk,
      label: "押金條款",
      original: "承租人應繳納三個月押金",
      issue: "範本載明押金最高不得超過二個月租金之總額，本條款超過範本上限",
      suggestion: "要求將押金改為不超過二個月租金",
      basis: "範本第四條 p2；簽約注意事項七（一）p18",
    },
    {
      risk: "medium" as ContractRisk,
      label: "修繕責任",
      original: "室內所有設備損壞由承租人自行負責修繕",
      issue: "範本預設由出租人負責修繕，承租人負責的項目應逐項列明於附件三；本條款與範本預設不同且未列明範圍",
      suggestion: "建議改為「人為損壞由承租人負責，其餘由出租人負責」，並附承租人負責修繕項目確認書",
      basis: "範本第八條 p3–4；附件三 p15–16",
    },
    {
      risk: "medium" as ContractRisk,
      label: "提前終止條款",
      original: "房東得於一個月前通知承租人終止租約",
      issue: "範本第十三條由租賃雙方共同約定是否得任意終止，第十六條限制出租人提前終止的事由並須附事證。只有房東能任意終止，與範本設計不同",
      suggestion: "要求改為雙方對等，或限縮為範本第十六條列舉的事由",
      basis: "範本第十三條 p5；第十六條 p5–6",
    },
    {
      risk: "low" as ContractRisk,
      label: "轉租條款",
      original: "未經房東同意不得轉租",
      issue: "符合範本第七條第三項，屬正常條款",
      suggestion: "若房東同意轉租，建議附出租人同意轉租範圍、租賃期間及終止租約事由確認書",
      basis: "範本第七條 p3；附件二 p14",
    },
  ],
  resources: [
    { name: "行政院消費者保護會申訴及調解系統", url: "https://appeal.cpc.ey.gov.tw/WWW/Default.aspx/" },
    { name: "司法院訴訟外紛爭解決機構查詢平台", url: "http://adrmap.judicial.gov.tw/" },
  ],
};

export const featureCards = [
  {
    title: "建案合法性",
    description: "比對建物登記謄本，揪出坪數灌水、頂樓加蓋與非法隔間。",
    href: "/check",
  },
  {
    title: "租金合理性",
    description: "對照實價登錄同區同類型行情，判斷報價是否偏高。",
    href: "/check",
  },
  {
    title: "合約條款",
    description: "逐條比對住宅租賃契約書範本，標示需要留意的條款。",
    href: "/contract",
  },
  {
    title: "凶宅風險提醒",
    description: "提醒簽約前請房東填寫現況確認書第 8 項。",
    href: "/check",
  },
] as const;
