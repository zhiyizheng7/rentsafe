# RentSafe 賃居守護

AI 驅動的台灣學生租屋詐騙查核平台｜NCCU Prometheus 2026 AI 跨域 × 永續創新競賽 決賽作品

**決賽：2026/11/16（一）政大四維堂**

## 目前狀態

| 功能 | 現況 | 決賽前目標 |
|---|---|---|
| 物件查核（`/check`） | 臺北市租金行情使用真實實價登錄資料；建物與屋況為確認提醒／展示案例 | 完成瀏覽器與手機驗收（F2、F5） |
| 合約審查（`/contract`） | 互動展示，結果來自 Mock Data | 貼上合約文字，用規則**真實**比對條款（F3） |
| 展示模式 | 已有預設案例與一鍵重置 | 完成瀏覽器與離線驗收（F1） |
| 示範資料標示 | 已區分真實資料、規則比對與示範資料 | 完成人工驗收（F6） |

詳細清單與負責人見 [FEATURES.md](./FEATURES.md)。

> 決賽是「實作評比」，評審會親手操作並追問。**哪些是真實、哪些是示範，要能說清楚。**

## 快速開始

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint       # 送 PR 前執行
npm run build      # 送 PR 前執行，確認能建置
```

需要 Node.js 22.13 以上（pdfjs-dist 6.x 的需求；啟動失敗先用 `node -v` 確認版本）。

## 技術棧

- Next.js **16.2.6**（App Router、Turbopack）
- React 19.2、TypeScript 5、Tailwind CSS 4

⚠️ Next.js 16 與舊版有差異。寫程式前，先讀 `node_modules/next/dist/docs/` 對應章節（見 `AGENTS.md`），不要憑舊版記憶。

## 專案結構

```
rentsafe/
├── app/
│   ├── page.tsx              # 首頁
│   ├── layout.tsx            # 共用版型
│   ├── globals.css           # 全域樣式
│   ├── check/page.tsx        # 物件查核頁
│   ├── contract/page.tsx     # 合約審查頁
│   └── about/page.tsx        # 關於我們
├── components/
│   ├── check-demo.tsx        # 物件查核互動與結果
│   ├── contract-demo.tsx     # 合約審查互動與結果
│   ├── analysis-steps.tsx    # 分析中逐步文字
│   ├── status-badge.tsx      # 風險徽章
│   ├── traffic-light.tsx     # 紅黃綠燈
│   ├── site-header.tsx / site-nav.tsx / site-footer.tsx
├── data/
│   └── mock-data.ts          # 示範資料與型別（Status、ContractRisk）
├── docs/                     # API 約定、攤位流程、法規核對、Q&A
├── scripts/                  # create-issues.sh
├── .github/                  # Issue / PR 範本
├── FEATURES.md               # 功能清單（單一事實來源）
├── CONTRIBUTING.md           # 協作規則
├── AGENTS.md / CLAUDE.md     # AI 開發指引；CLAUDE.md 是網站設計依據（頁面、Mock 規格、內容規則）
```

## 文件

| 文件 | 內容 |
|---|---|
| [FEATURES.md](./FEATURES.md) | 功能清單、優先級、里程碑 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 怎麼領任務、分支與 PR 規則 |
| [docs/API.md](./docs/API.md) | 規劃中的 API 介面約定 |
| [docs/DEMO_FLOW.md](./docs/DEMO_FLOW.md) | 攤位 6 分鐘流程 |
| [docs/LEGAL_CHECKLIST.md](./docs/LEGAL_CHECKLIST.md) | 示範內容裡的法規與資料來源說法，待核對 |
| [docs/QA_PREP.md](./docs/QA_PREP.md) | 評審 Q&A 備忘 |

## 資料來源（規劃）

| 資料 | 來源 |
|---|---|
| 租金行情 | 內政部實價登錄（租賃） |
| 建物登記 | 全國地政電子謄本系統 |
| 合約標準 | 內政部公告《住宅租賃契約書範本》（113/7/8 修正版），含租賃標的現況確認書與簽約注意事項 |

## 重要日期

| 日期 | 事項 |
|---|---|
| **11/11（三）** | 功能凍結，之後只修 bug |
| **11/12（四）** | 簡報 PDF 寄 aiforall@nccu.edu.tw（有動畫另附 PPTX） |
| **11/13（五）** | A1 直式海報電子檔寄 uniskaitin@gmail.com |
| 11/15（日）15:00–16:30 | 提前進場佈置、測試設備與網路 |
| **11/16（一）08:50 前** | 海報與設備就定位；09:00 開始 |

## 團隊

| 成員 | 負責 | GitHub |
|---|---|---|
| （填入） | | |

---

本工具提供資訊揭露，不構成法律建議。
