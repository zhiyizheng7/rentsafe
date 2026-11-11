// F8 情境看房。熱點內容只取自 docs/LEGAL_CHECKLIST.md 區塊 D（現況確認書）與區塊 C（合約規則）。
// 示範房與 F1 預設案例共用；合約相關熱點直接引用 lib/contract-rules.ts 的說明與依據，不另寫一份。
import { findCheckDemoCase, findContractDemoCase } from "@/data/demo-cases";
import { contractRules } from "@/lib/contract-rules";

export type TourHotspot = {
  id: string;
  label: string;
  // 熱點在插圖上的位置（百分比）
  x: number;
  y: number;
  attention: string;
  basis: string;
};

export type TourScene = {
  id: "viewing" | "landlord" | "signing";
  title: string;
  description: string;
  hotspots: TourHotspot[];
};

const checkCase = findCheckDemoCase("wenshan-studio");
const contractCase = findContractDemoCase("text-common-risks");

if (!checkCase || !contractCase) {
  throw new Error("tour-data：找不到 F1 預設案例");
}

export const tourHouse = {
  title: checkCase.title,
  description: checkCase.description,
  checkHref: `/check?case=${checkCase.id}`,
  contractHref: `/contract?case=${contractCase.id}`,
};

function fromRule(id: string, label: string, x: number, y: number): TourHotspot {
  const rule = contractRules.find((item) => item.id === id);
  if (!rule) {
    throw new Error(`tour-data：找不到規則 ${id}`);
  }

  return { id: `rule-${id}`, label, x, y, attention: rule.message, basis: rule.basis };
}

const confirmationBasis = (item: number) => `範本附件一 租賃標的現況確認書第 ${item} 項（p10–13）`;

export const tourScenes: TourScene[] = [
  {
    id: "viewing",
    title: "看房現場",
    description: "客廳、廁所、陽台走一圈，這些都是現況確認書要請房東填的項目",
    hotspots: [
      {
        id: "rooftop",
        label: "頂樓陽台",
        x: 82,
        y: 30,
        attention:
          "這間在頂樓。請房東說明有無未登記的改建、增建、加建或違建（含頂樓、面積）；範本備註違建有隨時被拆除的風險",
        basis: confirmationBasis(1),
      },
      {
        id: "partition",
        label: "客廳隔間",
        x: 38,
        y: 55,
        attention: "請房東確認建物型態、格局、有無隔間，以及出租型態（整棟、分層、獨立套房、分租套房、分租雅房）",
        basis: confirmationBasis(2),
      },
      {
        id: "fire-alarm",
        label: "天花板",
        x: 22,
        y: 14,
        attention: "看看有沒有住宅用火災警報器，並請房東說明其他消防設施、是否定期消防安全檢查",
        basis: confirmationBasis(4),
      },
      {
        id: "bathroom",
        label: "廁所",
        x: 62,
        y: 62,
        attention: "留意有無滲漏水與處理方式，並確認供水及排水是否正常",
        basis: `範本附件一 租賃標的現況確認書第 5、9 項（p10–13）`,
      },
    ],
  },
  {
    id: "landlord",
    title: "與房東談",
    description: "有些事看不出來，要請房東寫在現況確認書上",
    hotspots: [
      {
        id: "haunted",
        label: "凶宅風險",
        x: 30,
        y: 28,
        attention:
          "無法以官方資料查證。出租人須說明是否曾發生兇殺、自殺、一氧化碳中毒或其他非自然死亡情事，簽約前請要求房東填寫。房東可在產權持有前勾選「不知道」，填寫結果不等於保證沒有",
        basis: "範本附件一 租賃標的現況確認書第 8 項（p12）",
      },
      fromRule("R3", "今天就要簽？", 70, 24),
      {
        id: "management-fee",
        label: "管理費",
        x: 22,
        y: 70,
        attention: "請房東說明管理費、停車位管理費，以及有無積欠",
        basis: confirmationBasis(11),
      },
      {
        id: "equipment",
        label: "附屬設備",
        x: 76,
        y: 72,
        attention: "請房東列出附屬設備清單，簽約前逐項對照",
        basis: confirmationBasis(12),
      },
    ],
  },
  {
    id: "signing",
    title: "簽約桌",
    description: "合約上這幾條，簽名前要看清楚",
    hotspots: [
      fromRule("R1", "押金", 24, 34),
      fromRule("R6", "戶籍", 70, 34),
      fromRule("R13", "修繕", 26, 72),
      fromRule("R15", "提前終止", 72, 72),
    ],
  },
];

export const tourHotspotCount = tourScenes.reduce((total, scene) => total + scene.hotspots.length, 0);
