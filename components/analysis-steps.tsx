"use client";

import { useEffect, useState } from "react";

type AnalysisStepsProps = {
  steps: readonly string[];
};

export function AnalysisSteps({ steps }: AnalysisStepsProps) {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const timers = steps.slice(1).map((_, index) =>
      window.setTimeout(() => {
        setVisibleCount(index + 2);
      }, (index + 1) * 500),
    );

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [steps]);

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div
          key={step}
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition duration-500 ${
            index < visibleCount
              ? "border-[color:var(--primary)]/20 bg-[color:var(--primary)]/8 text-[color:var(--text-primary)] opacity-100"
              : "border-white/8 bg-white/[0.02] text-[color:var(--text-muted)]"
          }`}
        >
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[color:var(--primary)]" />
          <span>{step}</span>
        </div>
      ))}
    </div>
  );
}
