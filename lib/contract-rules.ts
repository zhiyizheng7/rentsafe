// F3 合約文字規則檢查。規則依據 docs/LEGAL_CHECKLIST.md 區塊 C，措辭照「效力」欄，不下法律定論。
// 只用型別匯入與相對路徑，讓 scripts/test-contract-rules.mjs 能直接用 Node 執行。
import type { ContractRisk, DataSource } from "../data/mock-data";

export type ContractRule = {
  id: string;
  label: string;
  pattern: RegExp;
  // 命中後再檢查（例如月數是否超過上限），回傳 false 視為沒命中
  test?: (match: RegExpMatchArray) => boolean;
  // 同一段落出現這些字就不算命中（例如雙方都可終止）
  exclude?: RegExp;
  // 以「同一條」全文判斷是否不算命中；沒有條號時以該段落判斷（見 checkContractText 的 options.articleText）
  articleExclude?: (articleText: string) => boolean;
  level: ContractRisk;
  basis: string;
  message: string;
  suggestion: string;
};

export type RuleHit = {
  ruleId: string;
  risk: ContractRisk;
  label: string;
  original: string;
  issue: string;
  suggestion: string;
  basis: string;
};

export type ContractRulesResult = {
  riskLevel: ContractRisk | null;
  clauses: RuleHit[];
  source: DataSource;
};

export const MAX_CONTRACT_TEXT_LENGTH = 60000;

const numeral = "[0-9一二兩三四五六七八九十]+";

const chineseDigits: Record<string, number> = {
  一: 1,
  二: 2,
  兩: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

function parseNumeral(value: string) {
  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  const [tens, ones] = value.split("十");
  if (ones === undefined) {
    return chineseDigits[value] ?? Number.NaN;
  }

  return (tens ? (chineseDigits[tens] ?? Number.NaN) : 1) * 10 + (ones ? (chineseDigits[ones] ?? Number.NaN) : 0);
}

function monthsAbove(limit: number) {
  return (match: RegExpMatchArray) => {
    const value = match.slice(1).find((group) => group !== undefined);
    return value !== undefined && parseNumeral(value) > limit;
  };
}

// R15：同一條內有列舉事由（「有下列情形之一」或「經…催告／定相當期限」），且沒有放寬字眼時，視為範本第十六條式的列舉終止事由，不觸發。
// 已知限制：只看關鍵字。若列舉事由被惡意改寫（例如事由本身寫得很寬，但沒有用到放寬字眼），可能被放過。
const enumeratedTerminationReasons = /有下列情形之一|經[^。；\n]{0,30}催告|定相當期限/;
const looseningTerminationTerms = /隨時|任意|無須|無故|不須說明/;

const invalidClauseMessage = "範本簽約注意事項二十二載明，此類條款如有簽訂者，該條款無效（範本明載無效）";

export const contractRules: readonly ContractRule[] = [
  {
    id: "R1",
    label: "押金過高",
    pattern: new RegExp(`押金[^。；\\n]{0,20}?(${numeral})\\s*個月|(${numeral})\\s*個月[^。；\\n]{0,4}押金`),
    test: monthsAbove(2),
    level: "high",
    basis: "範本第四條 p2；簽約注意事項七（一）p18",
    message: "範本載明押金最高不得超過二個月租金之總額，本條款超過範本載明的上限",
    suggestion: "要求將押金改為不超過二個月租金",
  },
  {
    id: "R2",
    label: "押金不返還",
    pattern: /押金[^。；\n]{0,20}(不予?(退還|返還|退回)|概不(退還|返還|退回)|不退|沒收)/,
    level: "medium",
    basis: "範本第四條第二項 p2",
    message: "範本約定租期屆滿或終止、返還住宅時，應返還押金或抵充債務後之賸餘押金。本條款與範本約定不同",
    suggestion: "要求改為依範本第四條第二項返還押金或抵充債務後之賸餘押金",
  },
  {
    id: "R3",
    label: "拋棄審閱期",
    pattern: /(拋棄|放棄)[^。；\n]{0,10}審閱|審閱[^。；\n]{0,10}(拋棄|放棄)/,
    level: "high",
    basis: "範本簽約注意事項二十二（一）p22；簽約注意事項二 p17",
    message: `約定承租人拋棄審閱期間。範本載明審閱期至少三日；${invalidClauseMessage}`,
    suggestion: "簽約前要求刪除此條款，並保留至少三日審閱合約",
  },
  {
    id: "R4",
    label: "廣告僅供參考",
    pattern: /廣告[^。；\n]{0,10}僅供參考/,
    level: "high",
    basis: "範本簽約注意事項二十二（二）p22；第二十二條 p7",
    message: `範本第二十二條載明廣告及相關附件視為契約一部分；${invalidClauseMessage}`,
    suggestion: "簽約前要求刪除此條款，並保留廣告內容",
  },
  {
    id: "R5",
    label: "不得申報租賃費用",
    pattern: /(不得|禁止)[^。；\n]{0,12}(申報|報稅|扣除)/,
    level: "high",
    basis: "範本簽約注意事項二十二（三）p22",
    message: `限制承租人申報租賃費用支出。${invalidClauseMessage}`,
    suggestion: "簽約前要求刪除此條款",
  },
  {
    id: "R6",
    label: "不得遷入戶籍",
    pattern: /(不得|禁止)[^。；\n]{0,12}戶籍|戶籍[^。；\n]{0,8}(不得|禁止)/,
    level: "high",
    basis: "範本簽約注意事項二十二（四）p22",
    message: `限制承租人遷入戶籍。${invalidClauseMessage}`,
    suggestion: "簽約前要求刪除此條款",
  },
  {
    id: "R7",
    label: "稅賦轉嫁",
    pattern:
      /(房屋稅|地價稅)[^。；，\n]{0,15}由?承租人(負擔|支付|繳納)|(房屋稅|地價稅|稅賦|稅捐)[^。；\n]{0,20}增加[^。；\n]{0,20}承租人/,
    level: "high",
    basis: "範本簽約注意事項二十二（五）p22；第六條（一）p3",
    message: `範本第六條載明房屋稅、地價稅由出租人負擔；應由出租人負擔的稅賦增加時轉由承租人負擔，${invalidClauseMessage}`,
    suggestion: "簽約前要求刪除此條款",
  },
  {
    id: "R9",
    label: "須繳回契約書",
    pattern: /(繳回|交回|收回)[^。；\n]{0,6}(契約書|合約書|租約|合約)|(契約書|合約書|租約|合約)[^。；\n]{0,6}(繳回|交回|收回)/,
    level: "high",
    basis: "範本簽約注意事項二十二（七）p23",
    message: `要求承租人繳回契約書。${invalidClauseMessage}`,
    suggestion: "簽約前要求刪除此條款，自己保留一份契約書",
  },
  {
    id: "R10",
    label: "僅以電話通知",
    pattern: /(僅|只|限)[以用]?電話/,
    level: "high",
    basis: "範本簽約注意事項二十二（八）p23",
    message: `契約通知僅以電話方式為之。${invalidClauseMessage}`,
    suggestion: "簽約前要求刪除此條款，改為書面通知",
  },
  {
    id: "R11",
    label: "不得申請租金補貼",
    pattern: /(不得|禁止)[^。；\n]{0,12}補貼/,
    level: "high",
    basis: "範本簽約注意事項二十二（十）p23",
    message: `限制承租人申請租金補貼。${invalidClauseMessage}`,
    suggestion: "簽約前要求刪除此條款",
  },
  {
    id: "R13",
    label: "修繕責任",
    pattern:
      /(所有|全部|一切)[^。；\n]{0,20}(修繕|維修|修理)[^。；\n]{0,10}承租人|(所有|全部|一切)[^。；\n]{0,20}承租人[^。；\n]{0,10}(修繕|維修|修理)/,
    level: "medium",
    basis: "範本第八條 p3–4；附件三 p15–16；簽約注意事項十（一）p19",
    message: "範本預設由出租人負責修繕，承租人負責的項目應逐項列明於附件三；本條款與範本預設不同且未列明範圍",
    suggestion: "建議改為「人為損壞由承租人負責，其餘由出租人負責」，並附承租人負責修繕項目確認書",
  },
  {
    id: "R14",
    label: "違約金",
    pattern: new RegExp(`違約金[^。；\\n]{0,20}?(${numeral})\\s*個月|(${numeral})\\s*個月[^。；\\n]{0,6}違約金`),
    test: monthsAbove(1),
    level: "medium",
    basis: "範本第十三條 p5；簽約注意事項十二（二）p20",
    message: "範本載明未先期通知逕行終止租約時，最高賠償一個月租金額之違約金。若本條款是這種情形，違約金超過範本載明的上限",
    suggestion: "確認違約金的適用情形；若為提前終止，要求改為不超過一個月租金額",
  },
  {
    id: "R15",
    label: "提前終止條款",
    pattern: /(出租人|房東|甲方)[^。；\n]{0,6}得[^。；\n]{0,20}終止/,
    exclude: /雙方|任一方|承租人亦得|乙方亦得/,
    articleExclude: (articleText) =>
      enumeratedTerminationReasons.test(articleText) && !looseningTerminationTerms.test(articleText),
    level: "medium",
    basis: "範本第十三條 p5；第十六條 p5–6",
    message:
      "範本第十三條由租賃雙方共同約定是否得任意終止，第十六條限制出租人提前終止的事由並須附事證。若只有房東能任意終止，與範本設計不同",
    suggestion: "要求改為雙方對等，或限縮為範本第十六條列舉的事由",
  },
  {
    id: "R16",
    label: "轉租條款",
    pattern: /(不得|禁止)[^。；\n]{0,6}轉租/,
    level: "low",
    basis: "範本第七條第三項 p3；簽約注意事項九（二）p19",
    message: "符合範本第七條第三項，屬正常條款",
    suggestion: "若房東同意轉租，建議附出租人同意轉租範圍、租賃期間及終止租約事由確認書",
  },
];

const riskOrder: Record<ContractRisk, number> = { low: 0, medium: 1, high: 2 };

function normalize(text: string) {
  // 全形數字轉半形，方便比對月數
  return text.replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));
}

function splitSegments(text: string) {
  return normalize(text)
    .split(/[。；;\n]/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export type CheckContractTextOptions = {
  // 該段文字所屬「同一條」的全文，供 articleExclude 判斷；未提供時以各段落本身判斷
  articleText?: string;
};

export function checkContractText(text: string, options: CheckContractTextOptions = {}): ContractRulesResult {
  const clauses: RuleHit[] = [];
  const articleText = options.articleText === undefined ? undefined : normalize(options.articleText);

  for (const segment of splitSegments(text)) {
    for (const rule of contractRules) {
      if (rule.exclude?.test(segment)) {
        continue;
      }

      if (rule.articleExclude?.(articleText ?? segment)) {
        continue;
      }

      const matches = segment.matchAll(new RegExp(rule.pattern.source, "g"));
      const hit = [...matches].some((match) => (rule.test ? rule.test(match) : true));
      if (!hit) {
        continue;
      }

      clauses.push({
        ruleId: rule.id,
        risk: rule.level,
        label: rule.label,
        original: segment,
        issue: rule.message,
        suggestion: rule.suggestion,
        basis: rule.basis,
      });
    }
  }

  const riskLevel = clauses.reduce<ContractRisk | null>(
    (highest, clause) => (highest === null || riskOrder[clause.risk] > riskOrder[highest] ? clause.risk : highest),
    null,
  );

  return { riskLevel, clauses, source: "rules" };
}
