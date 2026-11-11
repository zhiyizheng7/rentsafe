// 把 pdfjs-dist 的 worker、cMaps、標準字型複製到 public/pdfjs/，由本機提供，不使用 CDN（要能斷網運作）。
// postinstall、predev、prebuild 都會執行，確保 public/pdfjs/ 與 node_modules 的 pdfjs-dist 永遠同版本。
// public/pdfjs/ 會 commit 進 git，讓沒有網路安裝套件的電腦也能直接使用。
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(projectRoot, "node_modules", "pdfjs-dist");
const target = join(projectRoot, "public", "pdfjs");

if (!existsSync(source)) {
  console.warn("[pdfjs] 找不到 node_modules/pdfjs-dist，略過複製（沿用 public/pdfjs/ 既有檔案）");
  process.exit(0);
}

const { version } = JSON.parse(readFileSync(join(source, "package.json"), "utf8"));
const versionFile = join(target, "VERSION");

if (existsSync(versionFile) && readFileSync(versionFile, "utf8").trim() === version) {
  console.log(`[pdfjs] public/pdfjs 已是 ${version}`);
  process.exit(0);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(join(source, "build", "pdf.worker.min.mjs"), join(target, "pdf.worker.min.mjs"));
cpSync(join(source, "cmaps"), join(target, "cmaps"), { recursive: true });
cpSync(join(source, "standard_fonts"), join(target, "standard_fonts"), { recursive: true });
cpSync(join(source, "LICENSE"), join(target, "LICENSE"));
writeFileSync(versionFile, `${version}\n`);

console.log(`[pdfjs] 已複製 pdfjs-dist ${version} 的 worker、cmaps、standard_fonts 到 public/pdfjs/`);
