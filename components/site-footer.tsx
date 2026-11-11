export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-[color:var(--text-secondary)] sm:px-6 lg:px-8">
        <p>© 2026 RentSafe 賃居守護. All rights reserved.</p>
        <p>本工具提供資訊揭露，不構成法律建議。</p>
        <p>資料來源：內政部實價登錄、全國地政電子謄本系統、內政部住宅租賃契約書範本</p>
      </div>
    </footer>
  );
}
