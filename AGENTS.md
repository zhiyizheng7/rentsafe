<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 專案更新紀錄

### 2026-11-06

- `/contract` 的 PDF 上傳改為真實規則比對：瀏覽器端以 `pdfjs-dist@6.4.299` 取出文字層，經 `lib/contract-normalize.ts` 正規化（移除中文字間空白、合併斷行、全形數字與「個月」前中文數字轉換、康熙部首轉回一般字、保留條號）後送進現有規則，結果標示 `source: "rules"`。檔案不上傳到伺服器。
- pdfjs 的 worker、cMaps、標準字型由 `public/pdfjs/` 提供並 commit 進 git；`scripts/copy-pdfjs-assets.mjs` 在 postinstall、predev、prebuild 從 node_modules 同步，確保與套件同版本。不使用 CDN。
- 沒有文字層的 PDF 顯示「此檔案沒有可辨識的文字，請改貼上文字」；整行為「簽約注意事項」標題時，其後段落不送規則比對並於畫面註明。
- 原「模擬上傳」改為「載入示範合約」按鈕（示範資料）；結果頁可展開檢視取出的文字。
- PDF 與貼上文字的字數上限改為 60,000 字。
- `npm run test:contracts` 新增逐條規則（R1–R16 中已實作的 14 條，各至少 1 個應命中與 1 個不應命中）、正規化、簽約注意事項截斷、PDF 排行與 60,000 字效能測試。
- 環境需求改為 Node.js 22.13 以上（pdfjs-dist 6.x），`package.json` 加上 `engines`。

### 2026-11-05

- 完成 F2 真實租金行情串接：`/check` 可依臺北市行政區、出租型態與月租，比對實價登錄租賃資料的中位數、P25／P75、樣本數與資料期別。
- 移除 `next/font/google` 的建置期網路依賴，改用跨平台系統中文字型，讓專案在離線環境也能執行 `npm run build`。
- 調整 F3 合約規則測試流程，使 Node.js 20 可執行；新增 `npm run test:contracts`，三組示範合約案例均通過。
- 將 `/tour` 情境看房改造成像素風互動教學：保留三個場景與 12 個法規熱點，加入角色巡房、警報器、漏水、對話、寫字與蓋章等循環動畫。
- 像素動畫支援 `prefers-reduced-motion`，使用者啟用「減少動態效果」時會停止動畫。
- 本日驗證：`npm run lint`、`npx tsc --noEmit`、`npm run test:contracts`、`npm run build` 與 `git diff --check` 均通過。
