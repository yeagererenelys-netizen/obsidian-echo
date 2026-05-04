import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="display text-[32px] leading-none text-white">{title}</h1>
        {subtitle && <div className="text-xs text-ghost mt-2 flex items-center gap-2">{subtitle}</div>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, color = "white", trend, hero }: { label: string; value: string; color?: "white" | "lime" | "threat"; trend?: string; hero?: boolean }) {
  const colorClass = color === "lime" ? "text-lime" : color === "threat" ? "text-threat" : "text-white";
  return (
    <div className={`ps-card ${hero ? "ps-card-lime" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="micro">{label}</span>
        <span className={`dot ${color === "threat" ? "dot-threat" : color === "lime" ? "dot-lime" : "dot-safe"}`} />
      </div>
      <div className={`display text-[56px] leading-none ${colorClass}`} style={color === "threat" ? { textShadow: "0 0 20px rgba(239,68,68,0.4)" } : undefined}>
        {value}
      </div>
      {trend && <div className="text-xs text-safe mt-2 mono">{trend}</div>}
    </div>
  );
}
