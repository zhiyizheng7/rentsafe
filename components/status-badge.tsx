import { type ContractRisk, type Status } from "@/data/mock-data";

const statusMap = {
  safe: {
    className: "bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-500/20",
    label: "合法",
  },
  warning: {
    className: "bg-amber-500/12 text-amber-300 ring-1 ring-amber-500/20",
    label: "需注意",
  },
  danger: {
    className: "bg-red-500/12 text-red-300 ring-1 ring-red-500/20",
    label: "高風險",
  },
} satisfies Record<Status, { className: string; label: string }>;

const contractRiskMap = {
  low: {
    className: "bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-500/20",
    label: "低風險",
  },
  medium: {
    className: "bg-amber-500/12 text-amber-300 ring-1 ring-amber-500/20",
    label: "需注意",
  },
  high: {
    className: "bg-red-500/12 text-red-300 ring-1 ring-red-500/20",
    label: "高風險",
  },
} satisfies Record<ContractRisk, { className: string; label: string }>;

type StatusBadgeProps =
  | { kind: "status"; value: Status; overrideLabel?: string }
  | { kind: "risk"; value: ContractRisk; overrideLabel?: string };

export function StatusBadge(props: StatusBadgeProps) {
  const config =
    props.kind === "status" ? statusMap[props.value] : contractRiskMap[props.value];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {props.overrideLabel ?? config.label}
    </span>
  );
}
