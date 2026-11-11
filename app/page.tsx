import Link from "next/link";
import { SourceTag } from "@/components/source-tag";
import { findCheckDemoCase } from "@/data/demo-cases";
import { featureCards, mockCheckResult, type DataSource, type Status } from "@/data/mock-data";
import { getRentBenchmark } from "@/lib/rent-benchmark";

// 首頁預覽：用 F1 展示案例組出卡片，查核摘要的數字一律由下方卡片計算，不另寫死
type PreviewLevel = "high" | "attention" | "self";

type PreviewCard = {
  title: string;
  detail: string;
  level: PreviewLevel | null; // null：位於行情區間等，不計入摘要
  source: DataSource;
  period?: string;
  sampleSize?: number;
};

const levelLabel = {
  high: "高風險",
  attention: "需注意",
  self: "需自行確認",
} satisfies Record<PreviewLevel, string>;

const levelStyle = {
  high: { card: "border-red-500/25 bg-red-500/8", label: "text-red-300" },
  attention: { card: "border-amber-500/25 bg-amber-500/8", label: "text-amber-300" },
  self: { card: "border-amber-500/25 bg-amber-500/8", label: "text-amber-300" },
} satisfies Record<PreviewLevel, { card: string; label: string }>;

function statusToLevel(status: Status): PreviewLevel | null {
  if (status === "danger") return "high";
  if (status === "warning") return "attention";
  return null;
}

const formatRent = (value: number) => `${value.toLocaleString("zh-TW")} 元`;

function buildPreview() {
  const demoCase = findCheckDemoCase("wenshan-studio");
  if (!demoCase) throw new Error("首頁預覽：找不到 F1 預設案例");

  const legality = mockCheckResult.modules.legality.items;
  const illegalBuild = legality.find((item) => item.label === "違建查核");
  if (!illegalBuild) throw new Error("首頁預覽：示範資料缺少違建查核");

  const rent = getRentBenchmark(demoCase.district, demoCase.rentalType, demoCase.listedRent);
  const rentPlace = `${rent.district}${rent.rentalType}`;
  const sampleText =
    rent.buildingCount !== undefined
      ? `樣本 ${rent.sampleSize} 筆，來自 ${rent.buildingCount} 棟建物`
      : `樣本 ${rent.sampleSize} 筆`;

  const rentCard: PreviewCard =
    rent.kind === "ready"
      ? {
          title: `月租 ${formatRent(rent.listedRent)}，${rent.label}`,
          detail: `${rentPlace}中位數 ${formatRent(rent.rent.median)}（${
            rent.deviation >= 0 ? "高於" : "低於"
          } ${Math.abs(rent.deviation)}%），第 25–75 百分位 ${formatRent(rent.rent.p25)}–${formatRent(
            rent.rent.p75,
          )}；${sampleText}${rent.lowDiversity ? "，樣本集中於少數建物，僅供參考" : ""}`,
          level: statusToLevel(rent.status),
          source: "real",
          period: rent.period,
          sampleSize: rent.sampleSize,
        }
      : {
          title: `月租 ${formatRent(rent.listedRent)}，樣本不足`,
          detail: `${rentPlace}有效樣本不足，不判定行情高低`,
          level: "self",
          source: "real",
          period: rent.period,
          sampleSize: rent.sampleSize,
        };

  const cards: PreviewCard[] = [
    {
      title: "違建與樓層資訊不一致",
      detail: "建物使用執照登記為 4 樓，廣告物件位於 5 樓，疑似頂樓加蓋",
      level: statusToLevel(illegalBuild.status),
      source: "mock",
    },
    rentCard,
    {
      title: "租金補貼資格",
      detail: "補貼資格請依主管機關公告確認，本工具無法查證",
      level: "self",
      source: "mock",
    },
  ];

  const count = (level: PreviewLevel) => cards.filter((card) => card.level === level).length;

  return {
    title: demoCase.title,
    period: rent.period,
    cards,
    counts: { high: count("high"), attention: count("attention"), self: count("self") },
  };
}

export default function Home() {
  const preview = buildPreview();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <section className="hero-panel">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8 animate-enter">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--primary)]/30 px-4 py-2 text-sm font-semibold text-[color:var(--primary-soft)]">
                <span className="inline-flex h-2 w-2 rounded-full bg-[color:var(--primary)]" />
                AI 租屋風險查核
              </div>
              <h1 className="max-w-3xl font-serif text-5xl leading-tight text-[color:var(--text-primary)] sm:text-6xl">
                60 秒，
                <span className="title-accent">看清你要租的房子</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[color:var(--text-secondary)]">
                整合內政部實價登錄與住宅租賃契約書範本，讓每個學生都能像專業人士一樣看房
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/check" className="button-primary justify-center">
                上傳截圖查核
              </Link>
              <Link href="/contract" className="button-secondary justify-center">
                上傳合約審查
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="metric-card">
                <p className="text-sm text-[color:var(--text-secondary)]">完成時間</p>
                <p className="mt-2 text-3xl font-semibold text-[color:var(--text-primary)]">60 秒內</p>
              </div>
              <div className="metric-card">
                <p className="text-sm text-[color:var(--text-secondary)]">查核模組</p>
                <p className="mt-2 text-3xl font-semibold text-[color:var(--text-primary)]">3 大面向</p>
              </div>
              <div className="metric-card">
                <p className="text-sm text-[color:var(--text-secondary)]">使用費用</p>
                <p className="mt-2 text-3xl font-semibold text-[color:var(--text-primary)]">免費</p>
              </div>
            </div>
          </div>

          {/* 預覽：外層容器（panel）＋內容區（卡片），最多兩層 */}
          <div className="panel animate-enter-delayed p-6 lg:p-7">
            <div className="mb-5 space-y-2">
              <p className="text-sm text-[color:var(--text-secondary)]">查核摘要・{preview.title}（展示案例）</p>
              <p className="text-2xl font-semibold text-[color:var(--text-primary)]">
                <span className="text-red-300">高風險 {preview.counts.high} 項</span>
                <span className="text-[color:var(--text-muted)]">・</span>
                <span className="text-amber-300">需注意 {preview.counts.attention} 項</span>
              </p>
              {preview.counts.self > 0 && (
                <p className="text-sm text-[color:var(--text-secondary)]">另有 {preview.counts.self} 項需自行確認</p>
              )}
              <p className="text-sm text-[color:var(--text-secondary)]">
                來源：租金為內政部實價登錄（{preview.period}）；其餘為示範資料
              </p>
            </div>

            <div className="space-y-4">
              {preview.cards.map((card) => (
                <div
                  key={card.title}
                  className={`rounded-2xl border p-4 ${
                    card.level ? levelStyle[card.level].card : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-[color:var(--text-primary)]">{card.title}</p>
                    {card.level && (
                      <span className={`text-sm font-semibold ${levelStyle[card.level].label}`}>
                        {levelLabel[card.level]}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-7 text-[color:var(--text-secondary)]">{card.detail}</p>
                  <div className="mt-3">
                    <SourceTag source={card.source} period={card.period} sampleSize={card.sampleSize} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">核心功能</p>
            <h2 className="font-serif text-4xl text-[color:var(--text-primary)]">把租屋風險拆成可判斷的訊號</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[color:var(--text-secondary)]">
            看房到簽約，一頁說清
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featureCards.map((card, index) => (
            <Link key={card.title} href={card.href} className="feature-card group block p-6">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--primary)]/12 text-lg font-semibold text-[color:var(--primary)]">
                0{index + 1}
              </div>
              <h3 className="font-serif text-2xl text-[color:var(--text-primary)]">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
