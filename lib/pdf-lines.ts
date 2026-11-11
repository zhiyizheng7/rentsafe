// 把 pdfjs 的 text item 排成逐行文字。純函式，不匯入 pdfjs，讓 Node 測試可直接執行。

export type PdfTextItem = {
  str: string;
  hasEOL?: boolean;
  // pdfjs 的轉換矩陣；transform[5] 是基線 y 座標
  transform?: number[];
};

// 字元數門檻：去掉空白與標點後，平均每頁少於此數視為沒有文字層（掃描檔）
export const MIN_TEXT_CHARS_PER_PAGE = 20;

export function countMeaningfulChars(text: string) {
  return (text.match(/[㐀-䶿一-鿿豈-﫿⺀-⿟A-Za-z0-9]/g) ?? []).length;
}

export function itemsToLines(items: readonly PdfTextItem[]) {
  const lines: string[] = [];
  let current = "";
  let lastY: number | null = null;

  for (const item of items) {
    const y = item.transform?.[5];
    // 沒有 hasEOL 但基線換了，也視為換行
    if (current && lastY !== null && y !== undefined && Math.abs(y - lastY) > 2) {
      lines.push(current);
      current = "";
    }

    current += item.str;
    if (y !== undefined) {
      lastY = y;
    }

    if (item.hasEOL) {
      lines.push(current);
      current = "";
    }
  }

  if (current) {
    lines.push(current);
  }

  const trimmed = lines.map((line) => line.trim()).filter(Boolean);

  // 頁首、頁尾只有數字的那一行視為頁碼，移除
  if (trimmed.length > 0 && /^\d{1,3}$/.test(trimmed[0])) {
    trimmed.shift();
  }
  if (trimmed.length > 0 && /^\d{1,3}$/.test(trimmed[trimmed.length - 1])) {
    trimmed.pop();
  }

  return trimmed;
}

export function pagesToText(pages: readonly (readonly PdfTextItem[])[]) {
  return pages.map((items) => itemsToLines(items).join("\n")).join("\n");
}
