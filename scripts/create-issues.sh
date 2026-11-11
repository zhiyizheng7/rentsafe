#!/usr/bin/env bash
# 一次建立標籤與所有 Issue。
# 使用前：1) 已安裝 GitHub CLI（gh）並 `gh auth login`  2) 在 repo 資料夾內執行
# 用法：bash scripts/create-issues.sh
# 注意：重複執行會重複建立 Issue，只要跑一次。
set -euo pipefail

command -v gh >/dev/null || { echo "請先安裝 GitHub CLI：https://cli.github.com/"; exit 1; }

echo "目標 repo：$(gh repo view --json nameWithOwner -q .nameWithOwner)"
read -r -p "確定要在這個 repo 建立 Issue 嗎？(y/N) " ok
[ "$ok" = "y" ] || { echo "已取消"; exit 0; }

# 標籤（已存在就略過）
for l in P0 P1 P2 feature content deliverable chore; do
  gh label create "$l" --force >/dev/null 2>&1 || true
done

# 格式：ID|標題|優先級|類型|完成標準
issues=(
"F1|展示模式|P0|feature|預設案例一鍵載入、一鍵重置；拔網路也能跑完整輪"
"F2|租金行情真實比對|P0|feature|實價登錄租賃資料處理成 JSON，/check 顯示真實的區域中位數與樣本數"
"F3|合約文字規則檢查|P0|feature|貼上合約文字，依已核對的規則標出條款風險；不依賴外部 API"
"F6|示範資料標示|P0|feature|Mock 區塊顯示「示範資料」，真實區塊顯示來源與期別"
"F4|API 串接（route handlers）|P1|feature|UI 改讀 app/api/*，失敗時退回預先備好的結果"
"F5|RWD 與手機檢查|P1|feature|手機可操作、版面不跑版；準備 QR Code"
"F7|LLM 補充說明|P2|feature|規則結果之外補一段白話說明；失敗就不顯示（不排進時程）"
"C1|Repo 整理|P0|chore|.claude/settings.local.json 加入 .gitignore；CLAUDE.md 的 Next.js 版本改為 16（11/4）"
"K1|法規與資料來源核對|P0|content|docs/LEGAL_CHECKLIST.md 每條核對並附出處；示範內容有誤的先改（11/8）"
"K2|Q&A 備忘|P1|content|docs/QA_PREP.md 每題有回答稿與主答人，全員讀過（11/10）"
"D1|8 分鐘台上簡報|P0|deliverable|PDF 於 11/12 前寄出，偏實作成果與操作"
"D2|A1 直式海報|P0|deliverable|電子檔於 11/13 前寄出"
"D3|備用操作影片|P1|deliverable|完整錄一輪攤位體驗，可在無網路時播放（11/10）"
"D4|攤位排練|P0|deliverable|完整跑 6 分鐘、計時，至少 2 次（11/14）"
)

for row in "${issues[@]}"; do
  IFS='|' read -r id title prio kind done <<< "$row"
  gh issue create \
    --title "[$id] $title" \
    --label "$prio,$kind" \
    --body "## 目標
$title

## 完成標準
- [ ] $done

## 對應文件
FEATURES.md 的 $id、docs/API.md

## 負責人 / 截止日
（領取後填寫）"
  echo "created: [$id] $title"
done

echo "完成。接著到 GitHub → Projects 建立看板（Todo / Doing / Review / Done），並把 Issues 加進去。"
