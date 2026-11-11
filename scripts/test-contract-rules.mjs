// F3 規則引擎驗證：npm run test:contracts
// 先用專案既有的 TypeScript 編譯器輸出到系統暫存目錄，Node.js 即可執行。
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const compileDirectory = mkdtempSync(join(tmpdir(), "rentsafe-contract-test-"));
const require = createRequire(import.meta.url);

let checkContractText;
let MAX_CONTRACT_TEXT_LENGTH;
let checkContractDocument;
let itemsToLines;
let pagesToText;
let contractSamples;

try {
  execFileSync(
    join(projectRoot, "node_modules", ".bin", "tsc"),
    [
      "lib/contract-rules.ts",
      "lib/contract-normalize.ts",
      "lib/pdf-lines.ts",
      "data/contract-samples.ts",
      "--outDir",
      compileDirectory,
      "--module",
      "commonjs",
      "--moduleResolution",
      "node",
      "--target",
      "ES2020",
      "--esModuleInterop",
      "--skipLibCheck",
    ],
    { cwd: projectRoot, stdio: "inherit" },
  );

  ({ checkContractText, MAX_CONTRACT_TEXT_LENGTH } = require(join(compileDirectory, "lib", "contract-rules.js")));
  ({ checkContractDocument } = require(join(compileDirectory, "lib", "contract-normalize.js")));
  ({ itemsToLines, pagesToText } = require(join(compileDirectory, "lib", "pdf-lines.js")));
  ({ contractSamples } = require(join(compileDirectory, "data", "contract-samples.js")));
} catch (error) {
  rmSync(compileDirectory, { recursive: true, force: true });
  throw error;
}

let failed = 0;
let passed = 0;

function check(name, pass, detail = "") {
  if (pass) {
    passed += 1;
    return;
  }
  failed += 1;
  console.log(`  FAIL ${name}${detail ? `：${detail}` : ""}`);
}

const ids = (result) => result.clauses.map((clause) => clause.ruleId);
const sameList = (a, b) => a.length === b.length && a.every((item, index) => item === b[index]);

// ── 1. 示範合約（原文直接比對，也經過正規化比對，兩者結果要一致） ──
const expectedSamples = {
  "text-common-risks": ["R1", "R13", "R6", "R11", "R15", "R16"],
  "text-invalid-clauses": ["R4", "R3", "R7", "R9", "R10", "R5", "R2", "R14"],
  "text-template-like": [],
};

console.log("## 示範合約");
for (const sample of contractSamples) {
  const want = expectedSamples[sample.id] ?? [];
  const raw = checkContractText(sample.text);
  const doc = checkContractDocument(sample.text);
  check(`${sample.title}（原文）`, sameList(ids(raw), want), `預期 ${want.join(",") || "無"}，實際 ${ids(raw).join(",") || "無"}`);
  check(`${sample.title}（正規化）`, sameList(ids(doc), want), `預期 ${want.join(",") || "無"}，實際 ${ids(doc).join(",") || "無"}`);
  check(`${sample.title} source`, doc.source === "rules");
  console.log(`- ${sample.title}：命中 ${ids(doc).join(", ") || "（無）"}`);
}

// ── 2. 逐條規則：每條至少 1 個應命中、1 個不應命中 ──
const ruleCases = [
  { id: "R1", hit: ["承租人應繳納三個月押金", "押金為3個月租金"], miss: ["押金為二個月租金", "押金最高不得超過二個月租金之總額"] },
  { id: "R2", hit: ["押金於租期屆滿後概不退還", "提前搬離者押金沒收"], miss: ["租期屆滿返還住宅時，出租人應返還押金"] },
  { id: "R3", hit: ["承租人同意拋棄契約審閱期間"], miss: ["本契約經承租人攜回審閱三日"] },
  { id: "R4", hit: ["廣告內容僅供參考"], miss: ["廣告及相關附件視為本契約之一部分"] },
  { id: "R5", hit: ["承租人不得申報租賃費用支出"], miss: ["承租人得依法申報租賃費用支出"] },
  { id: "R6", hit: ["承租人不得遷入戶籍", "戶籍一律不得遷入"], miss: ["承租人得申請遷入戶籍"] },
  { id: "R7", hit: ["房屋稅由承租人負擔", "地價稅如有增加，增加部分由承租人支付"], miss: ["房屋稅、地價稅由出租人負擔"] },
  { id: "R9", hit: ["租期屆滿應將契約書繳回出租人"], miss: ["本契約一式二份，由雙方各執一份"] },
  { id: "R10", hit: ["本契約之通知僅以電話為之"], miss: ["本契約之通知應以書面或電子郵件為之"] },
  { id: "R11", hit: ["承租人不得申請租金補貼"], miss: ["承租人得申請租金補貼，出租人應配合提供資料"] },
  { id: "R13", hit: ["室內所有設備損壞由承租人負責修繕"], miss: ["人為損壞由承租人負責修繕，其餘由出租人負責"] },
  { id: "R14", hit: ["承租人提前終止租約應賠償兩個月租金之違約金"], miss: ["應賠償一個月租金額之違約金"] },
  { id: "R15", hit: ["房東得於一個月前通知承租人終止租約"], miss: ["房東得於一個月前通知終止租約，承租人亦得比照辦理", "租賃雙方得於一個月前通知他方終止租約"] },
  { id: "R16", hit: ["未經房東同意不得轉租"], miss: ["經出租人書面同意後，承租人得轉租"] },
];

console.log("\n## 逐條規則");
for (const { id, hit, miss } of ruleCases) {
  for (const text of hit) {
    check(`${id} 應命中「${text}」`, ids(checkContractText(text)).includes(id), `實際 ${ids(checkContractText(text)).join(",") || "無"}`);
  }
  for (const text of miss) {
    check(`${id} 不應命中「${text}」`, !ids(checkContractText(text)).includes(id), `實際 ${ids(checkContractText(text)).join(",")}`);
  }
  console.log(`- ${id}：${hit.length} 應命中／${miss.length} 不應命中`);
}

// ── 3. 正規化：斷行、空白、全形、中文數字、康熙部首、條號 ──
console.log("\n## 正規化");
const normalizeCases = [
  { name: "中文字之間有空白", text: "承租人應繳納 三 個 月 押 金。", want: ["R1"] },
  { name: "句子中間斷行", text: "第三條 承租人於簽訂本契約之同時應繳\n納三個月押金，作為履約擔保。", want: ["R1"] },
  { name: "斷行加空白", text: "第五條  承租人於租賃期間內不得將戶\n籍 遷 入本租賃住宅，亦不得申請\n租 金 補 貼。", want: ["R6", "R11"] },
  { name: "大寫中文數字", text: "押金為參個月租金。", want: ["R1"] },
  { name: "十二個月", text: "違約金為十二個月租金。", want: ["R14"] },
  { name: "全形數字", text: "押金為３個月租金。", want: ["R1"] },
  { name: "康熙部首", text: "承租⼈不得遷⼊⼾籍。", want: ["R6"] },
  { name: "全形空白", text: "房東　得於　一個月前通知承租人終止租約。", want: ["R15"] },
  { name: "條號不被數字轉換影響", text: "第十三條 押金為二個月租金。", want: [] },
];

for (const { name, text, want } of normalizeCases) {
  const doc = checkContractDocument(text);
  check(`正規化：${name}`, sameList(ids(doc), want), `預期 ${want.join(",") || "無"}，實際 ${ids(doc).join(",") || "無"}｜${doc.normalized.lines.map((line) => line.text).join(" / ")}`);
  console.log(`- ${name}：${ids(doc).join(", ") || "（無）"}`);
}

{
  const doc = checkContractDocument("第三條 承租人於簽訂本契約之同時應繳\n納三個月押金，作為履約擔保。");
  check("斷行合併成一行", doc.normalized.lines.length === 1, `實際 ${doc.normalized.lines.length} 行`);
  check("合併後原文完整", doc.clauses[0]?.original === "第三條 承租人於簽訂本契約之同時應繳納3個月押金，作為履約擔保", doc.clauses[0]?.original);
}

{
  // 已知限制：條號後 12 字內就斷行，會被當成條號標題而不合併
  const doc = checkContractDocument("第三條 押金約定及返還\n押金為三個月租金。");
  check("短標題獨立成行", doc.normalized.lines.length === 2 && doc.normalized.lines[0].text === "第三條 押金約定及返還", JSON.stringify(doc.normalized.lines));
}

{
  const doc = checkContractDocument("第三條 租金\n每月新臺幣一萬元整。\n承租人應繳納三個月押金。\n第四條 押金約定\n押金概不退還。");
  const r1 = doc.clauses.find((clause) => clause.ruleId === "R1");
  const r2 = doc.clauses.find((clause) => clause.ruleId === "R2");
  check("第二句保留條號", r1?.article === "第三條", r1?.article);
  check("條號標題獨立一行後仍保留條號", r2?.article === "第四條", r2?.article);
  check("條號標題不併入內文", doc.normalized.lines.some((line) => line.text === "第四條 押金約定"));
  console.log(`- 條號：R1→${r1?.article}，R2→${r2?.article}`);
}

{
  const doc = checkContractDocument("第二十三條 未盡事宜依法令辦理。\n附件一\n租賃標的現況確認書\n承租人不得遷入戶籍。");
  check("附件不沿用前一條條號", doc.clauses[0]?.article === null, doc.clauses[0]?.article);
}

// ── 3b. R15 列舉事由排除 ──
// 同一條內有「有下列情形之一」或「經…催告／定相當期限」，且沒有「隨時、任意、無須、無故、不須說明」時，不觸發 R15。
// 已知限制：只看關鍵字；列舉事由若被惡意改寫（事由寫得很寬但避開放寬字眼），可能被放過。
console.log("\n## R15 列舉事由排除");
{
  // 範本第十六條全文（取自內政部 113/7/8 修正版，PDF 斷行原樣保留，由正規化合併）
  const article16 = [
    "第十六條 出租人提前終止租約",
    "租賃期間有下列情形之一者，出租人得提前終止租約，且承租人不得要求",
    "任何賠償：",
    "(一)出租人為重新建築而必要收回。",
    "(二)承租人遲付租金之總額達二個月之租金額，經出租人定相當期限催",
    "告，仍不為支付。",
    "(三)承租人積欠管理費或其他應負擔之費用達二個月之租金額，經出租",
    "人定相當期限催告，仍不為支付。",
    "(四)承租人違反第七條第一項規定，擅自變更用途，經出租人阻止仍繼",
    "續為之。",
    "(五)承租人違反第七條第二項規定，違法使用、存放有爆炸性或易燃性",
    "物品，經出租人阻止仍繼續為之。",
    "(六)承租人違反第七條第三項規定，擅自將租賃住宅轉租或轉讓租賃權",
    "予他人。",
    "(七)承租人毀損租賃住宅或附屬設備，經出租人定相當期限催告修繕仍",
    "不為修繕或相當之賠償。",
    "(八)承租人違反第九條第一項規定，未經出租人同意，擅自進行室內裝",
    "修，經出租人阻止仍繼續為之。",
    "(九)承租人違反第九條第一項規定，未依相關法令規定進行室內裝修，",
    "經出租人阻止仍繼續為之。",
    "(十)承租人違反第九條第一項規定，進行室內裝修，損害原有建築結構",
    "之安全。",
    "出租人依前項規定提前終止租約者，應依下列規定期限，檢附相關事證，",
    "以書面通知承租人。但依前項第五款及第十款規定終止者，得不先期通",
    "知：",
    "(一)依前項第一款規定終止者，於終止前三個月。",
    "(二)依前項第二款至第四款、第六款至第九款規定終止者，於終止前三十",
    "日。",
  ].join("\n");
  const doc16 = checkContractDocument(article16);
  check("範本第十六條全文不觸發 R15", !ids(doc16).includes("R15"), ids(doc16).join(","));
  check("單句含「有下列情形之一」也不觸發（無條號時以段落判斷）", ids(checkContractText("租賃期間有下列情形之一者，出租人得提前終止租約")).includes("R15") === false);
  check("觸發句單獨（無條號、無列舉）仍命中", ids(checkContractText("出租人得提前終止租約")).includes("R15"));
  console.log(`- 範本第十六條：${ids(doc16).join(", ") || "（無）"}`);

  const cases = [
    { text: "房東得於一個月前通知承租人終止租約", want: true },
    { text: "房東得隨時終止租約，承租人遲付租金亦同", want: true },
    { text: "第十條 有下列情形之一者，房東得隨時終止租約：\n(一)承租人遲付租金。", want: true },
    { text: "第十條 有下列情形之一者，出租人得終止租約：\n(一)承租人遲付租金達二個月，經出租人催告仍不支付。", want: false },
    { text: "第十條 承租人遲付租金，經出租人定相當期限催告仍不支付者，出租人得終止租約。", want: false },
  ];
  for (const { text, want } of cases) {
    const got = ids(checkContractDocument(text)).includes("R15");
    check(`R15 ${want ? "應命中" : "不應命中"}「${text.replace(/\n/g, "⏎")}」`, got === want, `實際 ${got ? "命中" : "未命中"}`);
    console.log(`- ${want ? "應命中" : "不應命中"}：${text.replace(/\n/g, "⏎")} → ${got ? "命中" : "未命中"}`);
  }
}

// ── 4. 簽約注意事項：整行標題才截斷 ──
console.log("\n## 簽約注意事項");
{
  const text = [
    "第七條 未經房東同意不得轉租。",
    "簽約注意事項",
    "二十二、租賃雙方不得簽訂下列契約條款。如有簽訂者，該條款無效：",
    "(四)承租人不得遷入戶籍。",
    "(十)承租人不得申請租金補貼。",
  ].join("\n");
  const doc = checkContractDocument(text);
  check("截斷後只命中 R16", sameList(ids(doc), ["R16"]), ids(doc).join(","));
  check("excludedNotes = true", doc.normalized.excludedNotes === true);
  check("被排除段落可檢視", doc.normalized.excludedLines.some((line) => line.text.includes("不得遷入戶籍")));
  check("被排除段落不沿用條號", doc.normalized.excludedLines.every((line) => line.article === null));
  console.log(`- 整行標題：命中 ${ids(doc).join(", ")}；排除 ${doc.normalized.excludedLines.length} 行`);
}
{
  const doc = checkContractDocument("第七條 本契約依簽約注意事項辦理。承租人不得遷入戶籍。");
  check("句中提到不截斷", doc.normalized.excludedNotes === false && ids(doc).includes("R6"), ids(doc).join(","));
}
{
  const doc = checkContractDocument("第七條 未經房東同意不得轉租。\n簽 約 注 意 事 項\n(四)承租人不得遷入戶籍。");
  check("標題字間有空白仍截斷", doc.normalized.excludedNotes === true && sameList(ids(doc), ["R16"]), ids(doc).join(","));
}
{
  const doc = checkContractDocument("第七條 未經房東同意不得轉租。\n住宅租賃契約書範本簽約注意事項\n(四)承租人不得遷入戶籍。");
  check("含範本名稱的標題也截斷", doc.normalized.excludedNotes === true && sameList(ids(doc), ["R16"]), ids(doc).join(","));
}
{
  const doc = checkContractDocument("第七條 未經房東同意不得轉租。\n簽約注意事項如下：\n(四)承租人不得遷入戶籍。");
  check("標題後接其他字不截斷", doc.normalized.excludedNotes === false && ids(doc).includes("R6"), ids(doc).join(","));
}

// ── 5. PDF 排行（假造的 text item） ──
console.log("\n## PDF 排行");
{
  const lines = itemsToLines([
    { str: "3", hasEOL: true, transform: [1, 0, 0, 1, 0, 800] },
    { str: "第三條 承租人應繳", hasEOL: false, transform: [1, 0, 0, 1, 0, 700] },
    { str: "納", hasEOL: true, transform: [1, 0, 0, 1, 90, 700] },
    { str: "三個月押金。", hasEOL: false, transform: [1, 0, 0, 1, 0, 680] },
    { str: "第四條 租期", hasEOL: true, transform: [1, 0, 0, 1, 0, 660] },
    { str: "", hasEOL: true },
    { str: "4", hasEOL: false, transform: [1, 0, 0, 1, 0, 40] },
  ]);
  check("頁碼移除、y 座標換行", sameList(lines, ["第三條 承租人應繳納", "三個月押金。", "第四條 租期"]), JSON.stringify(lines));
  const text = pagesToText([
    [{ str: "第三條 承租人應繳納", hasEOL: true }],
    [{ str: "2", hasEOL: true }, { str: "三個月押金。", hasEOL: true }],
  ]);
  const doc = checkContractDocument(text);
  check("跨頁句子合併後命中", sameList(ids(doc), ["R1"]), `${JSON.stringify(text)} → ${ids(doc).join(",")}`);
  console.log(`- 排行結果：${JSON.stringify(lines)}`);
}

// ── 6. 空字串與效能 ──
console.log("\n## 其他");
{
  const empty = checkContractDocument("");
  check("空字串", empty.clauses.length === 0 && empty.riskLevel === null);
  check("字數上限 60,000", MAX_CONTRACT_TEXT_LENGTH === 60000, String(MAX_CONTRACT_TEXT_LENGTH));

  const block = contractSamples.map((sample) => sample.text).join("\n") + "\n";
  const filler = "第九條 承租人應依約定方法使用租賃住宅，並以善良管理人之注意保管租賃住宅。\n";
  let big = "";
  while (big.length < MAX_CONTRACT_TEXT_LENGTH) {
    big += block + filler.repeat(20);
  }
  big = big.slice(0, MAX_CONTRACT_TEXT_LENGTH);

  checkContractDocument(big); // 暖機
  const runs = [];
  let hits = 0;
  for (let index = 0; index < 5; index += 1) {
    const start = performance.now();
    hits = checkContractDocument(big).clauses.length;
    runs.push(performance.now() - start);
  }
  runs.sort((a, b) => a - b);
  console.log(`- ${big.length.toLocaleString()} 字：正規化＋比對 中位數 ${runs[2].toFixed(1)} ms（最快 ${runs[0].toFixed(1)}、最慢 ${runs[4].toFixed(1)}），命中 ${hits} 條`);
  check("60,000 字在 2 秒內完成", runs[2] < 2000, `${runs[2].toFixed(1)} ms`);
}

console.log(failed === 0 ? `\n全部通過（${passed} 項）` : `\n${failed} 項未通過（通過 ${passed} 項）`);
rmSync(compileDirectory, { recursive: true, force: true });
process.exit(failed === 0 ? 0 : 1);
