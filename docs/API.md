# API 約定（規劃中）

> 目前專案是純前端，**這些 API 尚未實作**。`/check` 的租金行情會直接讀取預先處理好的
> `data/rent-benchmark.json`，合約文字則在前端執行規則；建物與屋況展示仍使用 `data/mock-data.ts`。
> 先把介面約定寫死，負責 UI 與負責資料、規則的人就能同時開發。改格式前先改這份並通知相關的人。

## 實作方式

Next.js 16 的 Route Handlers：在 `app/api/<路徑>/route.ts` 匯出 `GET`、`POST` 等函式。
同一層不能同時有 `page.tsx` 和 `route.ts`。寫之前先讀
`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`。

## 型別（沿用 `data/mock-data.ts`）

```ts
type Status = "safe" | "warning" | "danger";
type ContractRisk = "low" | "medium" | "high";
type DataSource = "real" | "rules" | "mock";
```

回應一律帶 `source`，前端依它決定要不要顯示「示範資料」標籤（F6）：
`real` 真實資料、`rules` 規則比對、`mock` 示範資料。

## 通用規則

- 成功 200；輸入有誤 400，body `{ "error": "說明" }`；伺服器錯誤 500，body 同上
- 任何 API 失敗，前端都要能退回預先備好的結果（`source: "mock"`）

## GET /api/rent-benchmark（F2）

查區域租金行情，資料來自預先處理好的實價登錄租賃資料。

請求：`/api/rent-benchmark?district=文山區&type=套房`

回應：

```json
{
  "district": "文山區",
  "type": "套房",
  "median": 7200,
  "sampleSize": 128,
  "updatedAt": "2026-10",
  "dataSource": "內政部實價登錄（租賃）",
  "source": "real"
}
```

| 欄位 | 說明 |
|---|---|
| `median` | 月租中位數（元） |
| `sampleSize` | 樣本數；太少時前端要提示「樣本不足」 |
| `updatedAt` | 資料所屬期別，畫面上要顯示 |

找不到該區或類型回 404。

## POST /api/check（F4，P1）

物件查核整份結果。回應結構與 `mockCheckResult` 相同，讓前端可以直接換資料來源。

請求：

```json
{ "address": "台北市文山區木柵路一段 XX 號", "listedPrice": 8000, "type": "套房" }
```

回應：

```json
{
  "address": "…",
  "modules": {
    "legality": { "status": "warning", "items": [ { "label": "…", "status": "danger", "detail": "…" } ] },
    "pricing": { "status": "warning", "marketMedian": 7200, "listedPrice": 8000, "deviation": 11.1, "level": "偏高", "detail": "…", "source": "real" },
    "haunted": { "status": "warning", "label": "凶宅風險提醒", "detail": "…", "source": "mock" }
  },
  "summary": "…"
}
```

`modules.pricing` 用 F2 的真實資料算；`legality`、`haunted` 暫時維持 `source: "mock"`。

## POST /api/contract/check（F3）

貼上合約文字，用規則標出條款風險。**規則內容必須先經 K1 核對才能上線。**

請求：

```json
{ "text": "第三條 承租人應繳納三個月押金…" }
```

回應：

```json
{
  "riskLevel": "high",
  "clauses": [
    {
      "risk": "high",
      "label": "押金條款",
      "original": "承租人應繳納三個月押金",
      "issue": "…",
      "suggestion": "…",
      "basis": "（條文出處，核對後填寫）"
    }
  ],
  "source": "rules"
}
```

| 欄位 | 說明 |
|---|---|
| `original` | 命中的合約原文片段，前端用來標示 |
| `basis` | 依據的條文或範本，**沒核對過就留空，畫面上不要顯示成定論** |

輸入為空回 400；超過 20000 字回 400。
