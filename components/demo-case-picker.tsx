type DemoCasePickerProps = {
  cases: readonly { id: string; title: string; description: string }[];
  selectedId: string | null;
  onLoad: (id: string) => void;
  onReset: () => void;
  compact?: boolean;
};

export function DemoCasePicker({ cases, selectedId, onLoad, onReset, compact = false }: DemoCasePickerProps) {
  return (
    <section className={compact ? "rounded-3xl border border-white/10 bg-white/[0.03] p-5" : "panel p-6 sm:p-8"}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">展示模式</p>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">選一個預設案例，一鍵跑完整輪；不需網路</p>
        </div>
        <button type="button" className="button-secondary" onClick={onReset}>
          重置
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cases.map((demoCase) => (
          <button
            key={demoCase.id}
            type="button"
            aria-pressed={selectedId === demoCase.id}
            onClick={() => onLoad(demoCase.id)}
            className={`rounded-3xl border p-4 text-left transition ${
              selectedId === demoCase.id
                ? "border-[color:var(--primary)]/50 bg-[color:var(--primary)]/8"
                : "border-white/10 bg-white/[0.03] hover:border-[color:var(--primary)]/30"
            }`}
          >
            <p className="font-medium text-[color:var(--text-primary)]">{demoCase.title}</p>
            <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">{demoCase.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
