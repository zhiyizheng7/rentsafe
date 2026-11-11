export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <section className="panel p-8 sm:p-10">
        <p className="eyebrow">關於我們</p>
        <h1 className="mt-3 font-serif text-5xl leading-tight text-[color:var(--text-primary)]">讓學生租屋不再只能靠運氣</h1>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">團隊介紹</h2>
          <p className="mt-3 text-base leading-8 text-[color:var(--text-secondary)]">
            我們是一個關注學生居住安全與資訊不對稱問題的開發團隊，希望用更直觀的互動介面，把原本分散且難查的租屋資訊整理成可立即理解的風險提示。
          </p>
        </div>
        <div className="mt-8 space-y-5 text-base leading-8 text-[color:var(--text-secondary)]">
          <p>RentSafe 賃居守護把建物登記、實價登錄與租約條文審查整合成單一流程，讓使用者在看房與簽約前，更快辨識高風險訊號。</p>
          <p>
            這個專案的理念很直接：真正需要幫助的租客，通常沒有足夠時間與專業知識逐一查證資料。RentSafe 的價值，是把原本分散且難懂的資訊，轉成能立即理解與採取行動的判斷依據。
          </p>
          <p>所有結果僅供風險判讀參考，不提供法律意見，也不取代正式專業審閱。</p>
        </div>
      </section>
    </div>
  );
}
