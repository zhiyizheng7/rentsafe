# 協作規則

目標：8 天內讓全隊同時開發、不互相卡住。規則少，但請務必遵守。

## 基本原則

1. `main` 要永遠能跑，**不要直接 push 到 main**
2. 一個任務對應一個 Issue、一個分支、一個 PR
3. 開 PR 後**至少一人看過**再合併
4. **11/11 功能凍結**，之後只修 bug

## 領任務

1. 到 GitHub **Projects 看板**或 `FEATURES.md` 找沒人認領的任務
2. 在 Issue 指派給自己，拖到 `Doing`
3. 開分支開發，完成後開 PR（描述寫 `Closes #編號`），拖到 `Review`
4. 合併後 Issue 自動關閉

## 分支與 Commit

分支命名：`feature/F2-rent-benchmark`、`fix/F3-rule-crash`、`docs/K1-legal`

```bash
git checkout main && git pull origin main
git checkout -b feature/F2-rent-benchmark
# ...開發...
git add <你改的檔案>        # 避免用 git add .
git commit -m "F2: add district median calculation (#3)"
git push -u origin feature/F2-rent-benchmark
```

Commit 格式：`<ID>: <做了什麼> (#Issue編號)`。

## 送 PR 前

```bash
npm run lint
npm run build
```

兩個都要過。PR 範本裡有完整檢查清單。

## 共用檔案：改之前先在群組講

| 檔案 | 為什麼 |
|---|---|
| `data/mock-data.ts` | 多人都會碰，最容易衝突。一次只讓一個人改，或先約定分檔 |
| `app/layout.tsx`、`app/globals.css` | 影響全站 |
| `docs/API.md` | 前後端的約定，改格式前先講 |
| `FEATURES.md` | 單一事實來源 |

## 不要進 Git 的東西

- `.env*`（金鑰、密碼）
- `.claude/settings.local.json`（本機設定）
- `node_modules/`、`.next/`
- 大型資料集與影片（放雲端硬碟，在 README 附連結）
- 實價登錄原始大檔：只提交處理後的小型 JSON

## 寫 Next.js 程式碼的注意事項

這個專案用 Next.js **16**，和舊版有差異。寫之前先讀 `node_modules/next/dist/docs/` 對應章節，不要憑舊版記憶（`AGENTS.md` 也有說明）。

## 現場備案原則

- 任何依賴網路或外部 API 的功能，都要有「失敗時退回預先備好的結果」的路徑
- 預設情境的結果要能在**完全沒網路**的情況下跑完
