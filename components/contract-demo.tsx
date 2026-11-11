"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { AnalysisSteps } from "@/components/analysis-steps";
import { SourceTag } from "@/components/source-tag";
import { StatusBadge } from "@/components/status-badge";
import { DemoCasePicker } from "@/components/demo-case-picker";
import { contractDemoCases, findContractDemoCase } from "@/data/demo-cases";
import {
  contractDemoLoadingSteps,
  contractLoadingSteps,
  contractPdfSteps,
  mockContractResult,
  type ContractRisk,
} from "@/data/mock-data";
import { checkContractDocument, type ContractDocumentResult, type NormalizedLine } from "@/lib/contract-normalize";
import { MAX_CONTRACT_TEXT_LENGTH } from "@/lib/contract-rules";

type Phase = "idle" | "loading" | "done";

type RulesView = {
  kind: "rules";
  input: "pdf" | "text";
  title: string;
  result: ContractDocumentResult;
  rawText: string;
  numPages?: number;
  emptyPages?: number[];
};

type View = { kind: "mock" } | RulesView;

type Loading = { kind: "mock" } | { kind: "text" } | { kind: "pdf"; step: number; page?: number; total?: number };

type DisplayClause = {
  risk: ContractRisk;
  label: string;
  article?: string | null;
  original: string;
  issue: string;
  suggestion: string;
  basis: string;
};

const RULES_DISCLAIMER = "關鍵字比對可能誤判或漏判；沒有命中不代表合約沒有問題";
const BASIS_PAGE_NOTE = "頁碼依內政部 113 年 7 月 8 日修正版 23 頁 PDF；各單位轉載版頁碼可能不同，以條號為準";

const highRiskCount = mockContractResult.clauses.filter((clause) => clause.risk === "high").length;
const mediumRiskCount = mockContractResult.clauses.filter((clause) => clause.risk === "medium").length;

function TextLines({ lines }: { lines: NormalizedLine[] }) {
  return (
    <ol className="mt-3 max-h-96 space-y-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-[color:var(--text-secondary)]">
      {lines.map((line, index) => (
        <li key={index} className="break-words">
          {line.text}
        </li>
      ))}
    </ol>
  );
}

function PdfSteps({ loading }: { loading: Extract<Loading, { kind: "pdf" }> }) {
  return (
    <div className="space-y-3">
      {contractPdfSteps.map((step, index) => {
        const active = index === loading.step;
        const done = index < loading.step;
        const pageInfo = index === 0 && loading.total ? `（第 ${loading.page} / ${loading.total} 頁）` : "";
        return (
          <div
            key={step}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
              active || done
                ? "border-[color:var(--primary)]/20 bg-[color:var(--primary)]/8 text-[color:var(--text-primary)]"
                : "border-white/8 bg-white/[0.02] text-[color:var(--text-muted)]"
            }`}
          >
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${done ? "bg-[color:var(--primary)]" : active ? "animate-pulse bg-[color:var(--primary)]" : "bg-white/20"}`}
            />
            <span>
              {step}
              {pageInfo}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ContractDemo({ initialCaseId }: { initialCaseId?: string }) {
  const initialCase = findContractDemoCase(initialCaseId);
  const [phase, setPhase] = useState<Phase>("idle");
  const [loading, setLoading] = useState<Loading | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(initialCase?.id ?? null);
  const [contractText, setContractText] = useState(initialCase?.kind === "text" ? initialCase.text : "");
  const [textError, setTextError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const timerRef = useRef<number | null>(null);
  // 每次送出遞增；舊的 PDF 取字結果回來時若編號不符就丟棄
  const runIdRef = useRef(0);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const isLoading = phase === "loading";

  const showWithSteps = (nextLoading: Loading, nextView: View) => {
    clearTimer();
    runIdRef.current += 1;
    setPdfError(null);
    setLoading(nextLoading);
    setPhase("loading");

    timerRef.current = window.setTimeout(() => {
      startTransition(() => {
        setView(nextView);
        setPhase("done");
      });
    }, 2000);
  };

  const loadMockContract = () => {
    if (isLoading) {
      return;
    }
    setSelectedCaseId("sample-pdf");
    showWithSteps({ kind: "mock" }, { kind: "mock" });
  };

  const runTextCheck = (text: string) => {
    if (!text.trim()) {
      setTextError("請先貼上合約文字");
      return;
    }

    if (text.length > MAX_CONTRACT_TEXT_LENGTH) {
      setTextError(`合約文字請在 ${MAX_CONTRACT_TEXT_LENGTH.toLocaleString()} 字以內`);
      return;
    }

    setTextError(null);
    showWithSteps(
      { kind: "text" },
      { kind: "rules", input: "text", title: "貼上的合約文字", result: checkContractDocument(text), rawText: text },
    );
  };

  const runPdfCheck = async (file: File) => {
    if (isLoading) {
      return;
    }

    clearTimer();
    const runId = (runIdRef.current += 1);
    const stillCurrent = () => runIdRef.current === runId;

    setSelectedCaseId(null);
    setPdfName(file.name);
    setPdfError(null);
    setTextError(null);
    setLoading({ kind: "pdf", step: 0 });
    setPhase("loading");

    try {
      // 動態載入：pdfjs 只在使用者選了檔案之後才下載，也不會進到伺服器端
      const { extractPdfText } = await import("@/lib/pdf-text");
      const extracted = await extractPdfText(file, (page, total) => {
        if (stillCurrent()) {
          setLoading({ kind: "pdf", step: 0, page, total });
        }
      });

      if (!stillCurrent()) {
        return;
      }

      if (!extracted.ok) {
        setPdfError(extracted.message);
        setLoading(null);
        setPhase(view ? "done" : "idle");
        return;
      }

      if (extracted.text.length > MAX_CONTRACT_TEXT_LENGTH) {
        setPdfError(`取出的文字超過 ${MAX_CONTRACT_TEXT_LENGTH.toLocaleString()} 字，請改貼上需要檢查的條文`);
        setLoading(null);
        setPhase(view ? "done" : "idle");
        return;
      }

      setLoading({ kind: "pdf", step: 1 });
      const result = checkContractDocument(extracted.text);
      setLoading({ kind: "pdf", step: 3 });

      startTransition(() => {
        setView({
          kind: "rules",
          input: "pdf",
          title: file.name,
          result,
          rawText: extracted.text,
          numPages: extracted.numPages,
          emptyPages: extracted.emptyPages,
        });
        setPhase("done");
      });
    } catch {
      if (stillCurrent()) {
        setPdfError("讀取 PDF 時發生錯誤，請改貼上文字");
        setLoading(null);
        setPhase(view ? "done" : "idle");
      }
    }
  };

  const loadCase = (id: string) => {
    const demoCase = findContractDemoCase(id);
    if (!demoCase || isLoading) {
      return;
    }

    if (demoCase.kind === "text") {
      setSelectedCaseId(demoCase.id);
      setContractText(demoCase.text);
      runTextCheck(demoCase.text);
      return;
    }

    loadMockContract();
  };

  const resetDemo = () => {
    clearTimer();
    runIdRef.current += 1;
    setPhase("idle");
    setLoading(null);
    setView(null);
    setSelectedCaseId(null);
    setContractText("");
    setTextError(null);
    setPdfError(null);
    setPdfName(null);
  };

  const onFile = (file: File | undefined) => {
    if (file) {
      void runPdfCheck(file);
    }
  };

  const rulesView = view?.kind === "rules" ? view : null;
  const clauses: DisplayClause[] = rulesView ? rulesView.result.clauses : mockContractResult.clauses;

  return (
    <>
      <DemoCasePicker cases={contractDemoCases} selectedId={selectedCaseId} onLoad={loadCase} onReset={resetDemo} />
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="panel p-6 sm:p-8">
          <div className="mb-6 space-y-3">
            <p className="eyebrow">合約輸入</p>
            <h2 className="font-serif text-3xl text-[color:var(--text-primary)]">上傳租賃契約 PDF</h2>
          </div>

          <label
            className={`flex min-h-64 flex-col items-center justify-center rounded-[28px] border border-dashed px-6 text-center transition ${
              isLoading ? "cursor-wait opacity-60" : "cursor-pointer"
            } ${
              isDragging
                ? "border-[color:var(--primary)]/70 bg-[color:var(--primary)]/12"
                : "border-[color:var(--primary)]/35 bg-[color:var(--primary)]/6 hover:border-[color:var(--primary)]/60"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              onFile(event.dataTransfer.files?.[0]);
            }}
          >
            <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--primary)]/12 text-3xl text-[color:var(--primary)]">
              PDF
            </span>
            <span className="text-lg font-semibold text-[color:var(--text-primary)]">拖曳或點擊選擇合約 PDF</span>
            <span className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
              在你的瀏覽器裡讀取文字並依範本規則比對，檔案不會上傳到任何伺服器。
              <br />
              需為有文字層的 PDF；掃描檔請改貼上文字。
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={isLoading}
              onChange={(event) => {
                onFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>

          {pdfName && (
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-[color:var(--text-secondary)]">
              已選擇檔案：<span className="break-all text-[color:var(--text-primary)]">{pdfName}</span>
            </div>
          )}
          {pdfError && (
            <p role="alert" className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-200">
              {pdfError}
            </p>
          )}

          <p className="mt-4 text-xs leading-6 text-[color:var(--text-muted)]">{RULES_DISCLAIMER}</p>

          <div className="mt-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-[color:var(--text-muted)]">或</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <label className="mt-6 block space-y-2">
            <span className="text-sm text-[color:var(--text-secondary)]">貼上合約文字（依住宅租賃契約書範本規則比對）</span>
            <textarea
              value={contractText}
              onChange={(event) => setContractText(event.target.value)}
              rows={8}
              placeholder="例如：承租人應繳納三個月押金…"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm leading-7 text-[color:var(--text-primary)] outline-none transition placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--primary)]/40"
            />
          </label>
          {textError && <p className="mt-2 text-sm text-amber-300">{textError}</p>}

          <button
            type="button"
            className="button-secondary mt-4 w-full justify-center disabled:cursor-wait disabled:opacity-60"
            onClick={() => runTextCheck(contractText)}
            disabled={isLoading}
          >
            比對合約文字
          </button>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[color:var(--text-secondary)]">沒有合約可以試？</p>
              <SourceTag source="mock" />
            </div>
            <button
              type="button"
              className="button-secondary mt-3 w-full justify-center disabled:cursor-wait disabled:opacity-60"
              onClick={loadMockContract}
              disabled={isLoading}
            >
              載入示範合約
            </button>
          </div>
        </section>

        <section className="panel p-6 sm:p-8">
          {phase === "idle" && (
            <div className="flex h-full min-h-96 flex-col justify-between">
              <div className="space-y-3">
                <p className="eyebrow">結果預覽</p>
                <h3 className="font-serif text-3xl text-[color:var(--text-primary)]">條款風險一眼看懂</h3>
                <p className="text-sm leading-7 text-[color:var(--text-secondary)]">
                  報告會標示高風險、需注意與低風險條款，並補上原文、問題說明與簽約前建議。
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-[color:var(--text-secondary)]">示範合約的條款數</p>
                  <SourceTag source="mock" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-red-500/15 bg-red-500/8 p-5">
                    <p className="text-sm text-red-200">高風險</p>
                    <p className="mt-2 text-3xl font-semibold text-[color:var(--text-primary)]">{highRiskCount} 條</p>
                  </div>
                  <div className="rounded-3xl border border-amber-500/15 bg-amber-500/8 p-5">
                    <p className="text-sm text-amber-200">需注意</p>
                    <p className="mt-2 text-3xl font-semibold text-[color:var(--text-primary)]">{mediumRiskCount} 條</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {phase === "loading" && loading && (
            <div className="space-y-6">
              <div>
                <p className="eyebrow">審查中</p>
                <h3 className="mt-3 font-serif text-3xl text-[color:var(--text-primary)]">
                  {loading.kind === "mock" ? "正在載入示範合約的審查結果" : "正在依住宅租賃契約書範本規則比對條款"}
                </h3>
              </div>
              {loading.kind === "pdf" ? (
                <PdfSteps loading={loading} />
              ) : (
                <AnalysisSteps steps={loading.kind === "text" ? contractLoadingSteps : contractDemoLoadingSteps} />
              )}
            </div>
          )}

          {phase === "done" && view && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow">條款風險報告</p>
                  <h3 className="mt-3 break-all font-serif text-2xl text-[color:var(--text-primary)]">
                    {rulesView ? rulesView.title : mockContractResult.fileName}
                  </h3>
                  {rulesView ? (
                    <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                      {rulesView.numPages !== undefined && `${rulesView.numPages} 頁・`}
                      取出 {rulesView.rawText.length.toLocaleString()} 字・命中 {rulesView.result.clauses.length} 條規則
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-[color:var(--text-secondary)]">示範結果：顯示預設的審查內容，未解析任何檔案</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <SourceTag source={rulesView ? rulesView.result.source : mockContractResult.source} />
                  {rulesView ? (
                    rulesView.result.riskLevel && <StatusBadge kind="risk" value={rulesView.result.riskLevel} />
                  ) : (
                    <StatusBadge kind="risk" value={mockContractResult.riskLevel} />
                  )}
                </div>
              </div>

              {rulesView && (
                <div className="space-y-3">
                  <p className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-[color:var(--text-secondary)]">
                    {RULES_DISCLAIMER}。請對照下方「{rulesView.input === "pdf" ? "取出的文字" : "整理後的文字"}」確認有沒有讀錯。
                  </p>
                  {rulesView.result.normalized.excludedNotes && (
                    <p className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-[color:var(--text-secondary)]">
                      已排除簽約注意事項段落：「簽約注意事項」標題之後的文字不送規則比對，可在下方展開查看。
                    </p>
                  )}
                  {rulesView.emptyPages && rulesView.emptyPages.length > 0 && (
                    <p className="rounded-3xl border border-amber-500/15 bg-amber-500/8 p-4 text-sm leading-7 text-amber-100">
                      第 {rulesView.emptyPages.join("、")} 頁沒有取到文字（可能是掃描頁），這些頁面未納入比對，請改貼上該頁文字。
                    </p>
                  )}
                </div>
              )}

              {rulesView && rulesView.result.clauses.length === 0 && (
                <div className="rounded-3xl border border-amber-500/15 bg-amber-500/8 p-5 text-sm leading-7 text-amber-100">
                  沒有命中任何規則。這不代表合約沒有問題：目前規則只涵蓋部分範本條款，其他條款請自行對照住宅租賃契約書範本。
                </div>
              )}

              <div className="space-y-4">
                {clauses.map((clause, index) => (
                  <article key={`${clause.label}-${index}`} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <h4 className="text-lg font-semibold text-[color:var(--text-primary)]">
                        {clause.label}
                        {clause.article && (
                          <span className="ml-2 text-sm font-normal text-[color:var(--text-muted)]">{clause.article}</span>
                        )}
                      </h4>
                      <StatusBadge kind="risk" value={clause.risk} />
                    </div>
                    <dl className="space-y-3 text-sm leading-7 text-[color:var(--text-secondary)]">
                      <div>
                        <dt className="text-[color:var(--text-muted)]">原始條文</dt>
                        <dd className="break-words text-[color:var(--text-primary)]">{clause.original}</dd>
                      </div>
                      <div>
                        <dt className="text-[color:var(--text-muted)]">風險說明</dt>
                        <dd>{clause.issue}</dd>
                      </div>
                      <div>
                        <dt className="text-[color:var(--text-muted)]">建議作法</dt>
                        <dd>{clause.suggestion}</dd>
                      </div>
                      <div>
                        <dt className="text-[color:var(--text-muted)]">範本依據</dt>
                        <dd>{clause.basis}</dd>
                        <dd className="text-xs leading-6 text-[color:var(--text-muted)]">{BASIS_PAGE_NOTE}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>

              {rulesView && (
                <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-[color:var(--text-secondary)]">
                  <h4 className="text-lg font-semibold text-[color:var(--text-primary)]">
                    {rulesView.input === "pdf" ? "取出的文字" : "整理後的文字"}
                  </h4>
                  <details>
                    <summary className="cursor-pointer text-[color:var(--text-primary)]">
                      已比對的文字（{rulesView.result.normalized.lines.length} 行，已合併斷行並移除中文字間空白）
                    </summary>
                    <TextLines lines={rulesView.result.normalized.lines} />
                  </details>
                  {rulesView.result.normalized.excludedNotes && (
                    <details>
                      <summary className="cursor-pointer text-[color:var(--text-primary)]">
                        已排除：簽約注意事項段落（{rulesView.result.normalized.excludedLines.length} 行，未送規則比對）
                      </summary>
                      <TextLines lines={rulesView.result.normalized.excludedLines} />
                    </details>
                  )}
                  {rulesView.input === "pdf" && (
                    <details>
                      <summary className="cursor-pointer text-[color:var(--text-primary)]">原始取出的文字（未整理）</summary>
                      <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6">
                        {rulesView.rawText}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <h4 className="text-lg font-semibold text-[color:var(--text-primary)]">延伸資源</h4>
                <div className="mt-4 flex flex-wrap gap-3">
                  {mockContractResult.resources.map((resource) => (
                    <a
                      key={resource.url}
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-[color:var(--text-secondary)] transition hover:border-[color:var(--primary)]/30 hover:text-[color:var(--text-primary)]"
                    >
                      {resource.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
