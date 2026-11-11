// 合約文字正規化：把 PDF 取出或貼上的文字整理成「一句（或一款）一行」，再送進 lib/contract-rules.ts 的規則。
// 只做字元與排版整理，不改規則本身；只用相對路徑匯入，讓 scripts/test-contract-rules.mjs 能直接用 Node 執行。
import type { ContractRisk, DataSource } from "../data/mock-data";
import { checkContractText, type RuleHit } from "./contract-rules";

export type NormalizedLine = {
  // 所屬條號（例如「第三條」）；附件、前言等沒有條號的段落為 null
  article: string | null;
  text: string;
};

export type NormalizedContract = {
  // 送進規則比對的行
  lines: NormalizedLine[];
  // 「簽約注意事項」標題之後的行：不送規則，只供畫面檢視
  excludedLines: NormalizedLine[];
  excludedNotes: boolean;
};

export type DocumentRuleHit = RuleHit & { article: string | null };

export type ContractDocumentResult = {
  riskLevel: ContractRisk | null;
  clauses: DocumentRuleHit[];
  source: DataSource;
  normalized: NormalizedContract;
};

const cjk = "\\u2E80-\\u2FDF\\u3001-\\u303F\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFAFF\\uFF01-\\uFF0F\\uFF1A-\\uFF20\\uFF3B-\\uFF40\\uFF5B-\\uFF65□■☐☑【】";
const spaceBeforeCjk = new RegExp(`([${cjk}0-9])[ \\t\\u00A0\\u3000]+(?=[${cjk}])`, "g");
const spaceAfterCjk = new RegExp(`([${cjk}])[ \\t\\u00A0\\u3000]+(?=[0-9])`, "g");

const articlePattern = /^第[0-9一二三四五六七八九十百零〇]+條/;
// 新段落的開頭：條號、(一)／（一）、一、、1、／1.
const blockStartPattern =
  /^(第[0-9一二三四五六七八九十百零〇]+條|[(（][0-9一二三四五六七八九十]+[)）]|[一二三四五六七八九十]+、|[0-9]{1,2}[、.．](?![0-9])|附件[一二三四五六七八九十]|□|■)/;
const appendixPattern = /^附件[一二三四五六七八九十]/;
const sentenceEndPattern = /[。；;：:！？!?]$/;
// 只有整行就是這個標題時才截斷；句子中提到「簽約注意事項」不算
const notesHeadingPattern = /^(住宅租賃契約書範本)?簽約注意事項$/;

const chineseNumeralValues: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  壹: 1,
  二: 2,
  兩: 2,
  貳: 2,
  貮: 2,
  三: 3,
  參: 3,
  叁: 3,
  四: 4,
  肆: 4,
  五: 5,
  伍: 5,
  六: 6,
  陸: 6,
  七: 7,
  柒: 7,
  八: 8,
  捌: 8,
  九: 9,
  玖: 9,
};

function parseChineseNumeral(value: string) {
  const tensIndex = [...value].findIndex((char) => char === "十" || char === "拾");
  const digits = (part: string) => [...part].map((char) => chineseNumeralValues[char]);

  if (tensIndex === -1) {
    // 一、三、一二（逐位）
    const values = digits(value);
    return values.some((digit) => digit === undefined) ? Number.NaN : Number(values.join(""));
  }

  const tens = digits(value.slice(0, tensIndex));
  const ones = digits(value.slice(tensIndex + 1));
  if (tens.length > 1 || ones.length > 1 || [...tens, ...ones].some((digit) => digit === undefined)) {
    return Number.NaN;
  }

  return (tens[0] ?? 1) * 10 + (ones[0] ?? 0);
}

// 字元層級：全形數字轉半形、康熙部首與相容字轉回一般漢字（PDF 取字常見「⼀」「⼈」）
function normalizeCharacters(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[⺀-⿟豈-﫿]/g, (char) => char.normalize("NFKC"))
    .replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));
}

// 「個月」前的中文數字轉成阿拉伯數字，條號（第十三條）不受影響
function normalizeMonthNumerals(text: string) {
  return text.replace(/([零〇一二兩三四五六七八九十壹貳貮參叁肆伍陸柒捌玖拾]+)(?=個月)/g, (match) => {
    const value = parseChineseNumeral(match);
    return Number.isNaN(value) ? match : String(value);
  });
}

function removeCjkSpaces(line: string) {
  return line.replace(spaceBeforeCjk, "$1").replace(spaceAfterCjk, "$1").trim();
}

// 條號標題（例如「第四條 押金約定及返還」）獨立成一行，不併入內文。
// 判斷方式：條號後不超過 12 字且沒有標點（範本最長的標題 11 字）。
// 限制：若條號那一行在 12 字內就斷行（例如「第三條 承租人應繳」），會被當成標題而不合併。
function isArticleHeading(line: string) {
  const match = line.match(articlePattern);
  if (!match) {
    return false;
  }

  const rest = line.slice(match[0].length);
  return rest.length <= 12 && !/[，,。；;：:]/.test(rest);
}

// 條號後補一個空白，方便閱讀：「第三條承租人…」→「第三條 承租人…」
function formatArticle(line: string) {
  return line.replace(/^(第[0-9一二三四五六七八九十百零〇]+條)(?=\S)/, "$1 ");
}

function mergeLines(rawLines: string[]): NormalizedLine[] {
  const merged: NormalizedLine[] = [];
  let buffer = "";
  let bufferArticle: string | null = null;
  let currentArticle: string | null = null;

  const flush = () => {
    if (buffer) {
      merged.push({ article: bufferArticle, text: formatArticle(normalizeMonthNumerals(buffer)) });
    }
    buffer = "";
  };

  for (const line of rawLines) {
    const startsBlock = blockStartPattern.test(line);
    const shouldBreak = !buffer || sentenceEndPattern.test(buffer) || startsBlock || isArticleHeading(buffer);

    if (shouldBreak) {
      flush();
      const article = line.match(articlePattern);
      if (article) {
        currentArticle = article[0];
      } else if (appendixPattern.test(line)) {
        currentArticle = null;
      }
      bufferArticle = currentArticle;
      buffer = line;
    } else {
      buffer += line;
    }
  }

  flush();
  return merged;
}

export function normalizeContractText(raw: string): NormalizedContract {
  const rawLines = normalizeCharacters(raw)
    .split("\n")
    .map(removeCjkSpaces)
    .filter(Boolean);

  const headingIndex = rawLines.findIndex((line) => notesHeadingPattern.test(line));
  const included = headingIndex === -1 ? rawLines : rawLines.slice(0, headingIndex);
  const excluded = headingIndex === -1 ? [] : rawLines.slice(headingIndex);

  return {
    lines: mergeLines(included),
    excludedLines: mergeLines(excluded).map((line) => ({ ...line, article: null })),
    excludedNotes: headingIndex !== -1,
  };
}

const riskOrder: Record<ContractRisk, number> = { low: 0, medium: 1, high: 2 };

export function checkContractDocument(raw: string): ContractDocumentResult {
  const normalized = normalizeContractText(raw);
  const clauses: DocumentRuleHit[] = [];

  // 同一條（連續且條號相同的行）的全文，供 R15 等規則以整條判斷；沒有條號的行只看自己
  const articleTexts = new Map<number, string>();
  let start = 0;
  normalized.lines.forEach((line, index) => {
    const next = normalized.lines[index + 1];
    if (!next || next.article !== line.article) {
      const group = normalized.lines.slice(start, index + 1);
      const joined = line.article === null ? null : group.map((item) => item.text).join("\n");
      group.forEach((member, offset) => {
        articleTexts.set(start + offset, joined ?? member.text);
      });
      start = index + 1;
    }
  });

  normalized.lines.forEach((line, index) => {
    for (const hit of checkContractText(line.text, { articleText: articleTexts.get(index) }).clauses) {
      clauses.push({ ...hit, article: line.article });
    }
  });

  const riskLevel = clauses.reduce<ContractRisk | null>(
    (highest, clause) => (highest === null || riskOrder[clause.risk] > riskOrder[highest] ? clause.risk : highest),
    null,
  );

  return { riskLevel, clauses, source: "rules", normalized };
}
