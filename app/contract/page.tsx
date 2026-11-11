import { ContractDemo } from "@/components/contract-demo";

export default async function ContractPage({ searchParams }: PageProps<"/contract">) {
  const { case: caseParam } = await searchParams;
  const initialCaseId = typeof caseParam === "string" ? caseParam : undefined;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <section className="space-y-4">
        <p className="eyebrow">合約審查</p>
        <h1 className="font-serif text-5xl leading-tight text-[color:var(--text-primary)]">把看不懂的條文，變成可決策的風險清單</h1>
        <p className="max-w-3xl text-base leading-8 text-[color:var(--text-secondary)]">
          上傳 PDF，快速找出高風險條款與簽約前注意事項。
        </p>
      </section>

      <ContractDemo key={initialCaseId ?? "default"} initialCaseId={initialCaseId} />

      <section className="panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">遇到租屋糾紛？</h2>
          <p className="mt-1 text-sm leading-7 text-[color:var(--text-secondary)]">
            崔媽媽基金會提供免費租屋法律諮詢與契約審閱服務。
          </p>
        </div>
        <a
          href="https://www.tmm.org.tw"
          target="_blank"
          rel="noreferrer"
          className="button-secondary justify-center"
        >
          前往崔媽媽基金會
        </a>
      </section>
    </div>
  );
}
