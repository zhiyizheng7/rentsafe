# 給 AI 的 Prompt 範本（PROMPTS）

用 Claude Code 或其他 AI 寫程式時，照下面的模板貼。重點：**每次都叫它先讀文件，再動手，而且只做一個 Feature。**

## 通用模板（每次都用這個）

```
我在做 RentSafe（Next.js 16 專案）。
先讀這些檔案再動手：AGENTS.md、CLAUDE.md、FEATURES.md 的 <功能ID>、docs/<相關文件>。

任務：<功能ID> <功能名稱>
完成標準：<從 FEATURES.md 複製>

限制：
- 只改和這個任務有關的檔案，不要順手重構
- Next.js 16 有變動，用到 API 前先讀 node_modules/next/dist/docs/ 對應章節
- 不新增登入、資料庫、套件（需要新套件先問我）
- Mock 的內容要標「示範資料」；不要寫「違法」；查不到不要顯示綠燈
- 完成後跑 npm run lint 和 npm run build，把結果貼給我

先給我你的計畫（要改哪些檔案、怎麼做），我確認後再寫。
```

## 各功能的專用 Prompt

### 改示範資料（依 CLAUDE.md）
```
先讀 CLAUDE.md 的「資料型別」「mockCheckResult」「mockContractResult」，以及 docs/LEGAL_CHECKLIST.md。
把 data/mock-data.ts 改成 CLAUDE.md 規定的內容：加上 DataSource 型別、
凶宅改為「凶宅風險提醒」（status: warning）、合約示範改為 5 條並附 basis。
只改 mock-data.ts 和因型別變動而壞掉的元件。完成後跑 lint 和 build。
```

### F2 租金行情
```
先讀 FEATURES.md 的 F2、docs/API.md 的 /api/rent-benchmark。
任務：用內政部實價登錄租賃資料，預先處理成 JSON（放 data/），算出各行政區的中位數與樣本數，
/check 顯示真實數字、期別與資料來源，樣本太少時顯示「樣本不足」而不是亂猜。
處理資料的腳本放 scripts/，用 Python。先告訴我你打算用哪份資料、怎麼下載。
```

### F3 合約規則檢查
```
先讀 FEATURES.md 的 F3、docs/LEGAL_CHECKLIST.md 區塊 C（R1–R17）。
任務：在 /contract 讓使用者貼上合約文字，用規則（關鍵字或正規表示式）比對，
每個命中的條款顯示：原文、風險等級、依據（範本條號與頁碼）、建議。
語氣照規則表的「效力」欄，不要自己升級成「違法」。不呼叫外部 API。
先列出你要實作哪幾條規則，我確認後再寫。
```

### F6 示範資料標示
```
先讀 CLAUDE.md 的「來源標示」規則與 FEATURES.md 的 F6。
任務：每個結果區塊依 DataSource 顯示標籤：真實資料顯示來源與日期、規則比對顯示規則版本、
Mock 顯示「示範資料」。做成可重用元件，不要每個頁面各寫一份。
```

### F1 展示模式
```
先讀 FEATURES.md 的 F1、docs/DEMO_FLOW.md。
任務：加入預設案例一鍵載入與一鍵重置，不需要網路也能跑完整個 6 分鐘流程。
```

## 驗收（PR 前自己檢查）

```
請檢查我這次的修改：
1. 有沒有改到任務以外的檔案？
2. 有沒有出現「違法」、綠燈但資料其實查不到、沒標示的 Mock？
3. 有沒有和 CLAUDE.md、LEGAL_CHECKLIST.md 矛盾的地方？
4. npm run lint 和 npm run build 有沒有過？
列出問題，不要直接改。
```

## 提醒

- AI 寫的法規說法**一定要人核對**，對照 `docs/LEGAL_CHECKLIST.md`，不要信 AI 憑記憶講的條文。
- 一次只做一個功能、一個 PR，太大的任務先請 AI 拆小。
- AI 改壞了就 `git restore <檔案>`，不要在壞掉的基礎上繼續疊。
