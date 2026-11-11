// 瀏覽器端 PDF 取字：檔案只在使用者的瀏覽器裡讀取，不上傳到任何伺服器。
// worker、cMaps、標準字型由本機 public/pdfjs/ 提供（scripts/copy-pdfjs-assets.mjs），不使用 CDN。
import { MIN_TEXT_CHARS_PER_PAGE, countMeaningfulChars, itemsToLines, type PdfTextItem } from "@/lib/pdf-lines";

export const MAX_PDF_BYTES = 15 * 1024 * 1024;
export const MAX_PDF_PAGES = 40;

export type PdfTextResult =
  | {
      ok: true;
      text: string;
      numPages: number;
      // 沒有取到文字的頁碼（例如夾帶掃描頁）
      emptyPages: number[];
    }
  | {
      ok: false;
      reason: "not-pdf" | "too-large" | "too-many-pages" | "password" | "invalid" | "no-text";
      message: string;
    };

const NO_TEXT_MESSAGE = "此檔案沒有可辨識的文字，請改貼上文字";

export async function extractPdfText(
  file: File,
  onPage?: (page: number, total: number) => void,
): Promise<PdfTextResult> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, reason: "not-pdf", message: "請選擇 PDF 檔" };
  }

  if (file.size > MAX_PDF_BYTES) {
    return { ok: false, reason: "too-large", message: "檔案超過 15 MB，請改貼上文字" };
  }

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  });

  try {
    const pdf = await loadingTask.promise;

    if (pdf.numPages > MAX_PDF_PAGES) {
      return { ok: false, reason: "too-many-pages", message: `檔案超過 ${MAX_PDF_PAGES} 頁，請改貼上需要檢查的條文` };
    }

    const pages: string[] = [];
    const emptyPages: number[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onPage?.(pageNumber, pdf.numPages);
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const items = content.items.filter((item) => "str" in item) as PdfTextItem[];
      const pageText = itemsToLines(items).join("\n");

      if (countMeaningfulChars(pageText) === 0) {
        emptyPages.push(pageNumber);
      }

      pages.push(pageText);
      page.cleanup();
    }

    const text = pages.join("\n");
    if (countMeaningfulChars(text) < pdf.numPages * MIN_TEXT_CHARS_PER_PAGE) {
      return { ok: false, reason: "no-text", message: NO_TEXT_MESSAGE };
    }

    return { ok: true, text, numPages: pdf.numPages, emptyPages };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") {
      return { ok: false, reason: "password", message: "此 PDF 有密碼保護，請先解除密碼或改貼上文字" };
    }
    return { ok: false, reason: "invalid", message: "無法讀取此 PDF，檔案可能已損毀，請改貼上文字" };
  } finally {
    await loadingTask.destroy();
  }
}
