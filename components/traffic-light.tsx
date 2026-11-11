import { type Status } from "@/data/mock-data";

const lights = [
  { status: "danger", on: "bg-[color:var(--danger)]" },
  { status: "warning", on: "bg-[color:var(--warning)]" },
  { status: "safe", on: "bg-[color:var(--success)]" },
] as const satisfies readonly { status: Status; on: string }[];

const labels = {
  safe: "綠燈：安全",
  warning: "黃燈：需注意",
  danger: "紅燈：高風險",
} satisfies Record<Status, string>;

export function TrafficLight({ status }: { status: Status }) {
  return (
    <span
      role="img"
      aria-label={labels[status]}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2 py-1.5"
    >
      {lights.map((light) => (
        <span
          key={light.status}
          className={`h-3 w-3 rounded-full transition ${
            light.status === status ? light.on : "bg-white/10"
          }`}
        />
      ))}
    </span>
  );
}
