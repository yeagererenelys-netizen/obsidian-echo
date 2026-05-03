import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Shell";
import { useMemo } from "react";

export const Route = createFileRoute("/app/graph")({ component: Graph });

function Graph() {
  const nodes = useMemo(() => Array.from({ length: 36 }, (_, i) => {
    const angle = (i / 36) * Math.PI * 2;
    const radius = 180 + (i % 3) * 50;
    return {
      id: i,
      x: 400 + Math.cos(angle) * radius,
      y: 300 + Math.sin(angle) * radius,
      flag: i === 5 ? "threat" : i === 12 ? "warn" : i === 22 ? "threat" : null,
    };
  }), []);
  return (
    <div>
      <PageHeader title="COMMUNICATION GRAPH" subtitle="Force-directed live · 36 nodes · 218 edges" />
      <div className="ps-card !p-0 overflow-hidden relative" style={{ height: 620, background: "#000" }}>
        <div className="absolute top-3 left-3 right-3 z-10 px-3 py-2 rounded border border-threat/40 bg-threat-dim flex items-center gap-2">
          <span className="dot dot-threat" />
          <span className="text-sm text-white">3 critical anomalies detected</span>
          <span className="ml-auto mono text-xs text-ghost">12:42:18</span>
        </div>
        <svg viewBox="0 0 800 600" className="w-full h-full">
          {nodes.map(n => (
            <line key={`l${n.id}`} x1={400} y1={300} x2={n.x} y2={n.y}
              stroke={n.flag === "threat" ? "rgba(239,68,68,0.6)" : n.flag === "warn" ? "rgba(234,179,8,0.4)" : "rgba(255,255,255,0.15)"}
              strokeWidth={n.flag ? 1.5 : 0.5} />
          ))}
          {nodes.map(n => (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={n.flag ? 7 : 5}
                fill={n.flag === "threat" ? "#ef4444" : n.flag === "warn" ? "#eab308" : "#181818"}
                stroke={n.flag === "threat" ? "#ef4444" : "#444"} strokeWidth={1.5}
                style={n.flag === "threat" ? { filter: "drop-shadow(0 0 8px #ef4444)" } : undefined} />
            </g>
          ))}
          <circle cx={400} cy={300} r={14} fill="#fff" />
          <circle cx={400} cy={300} r={20} fill="none" stroke="#a3ff12" strokeWidth={1.5} opacity={0.7} />
        </svg>
        <div className="absolute top-16 right-3 ps-card !p-3 z-10 w-56" style={{ background: "rgba(8,8,8,0.92)" }}>
          <div className="micro mb-2">Filters</div>
          <label className="text-xs text-silver flex items-center gap-2 mb-1"><input type="checkbox" defaultChecked /> Show external</label>
          <label className="text-xs text-silver flex items-center gap-2 mb-1"><input type="checkbox" defaultChecked /> Animate flow</label>
          <label className="text-xs text-silver flex items-center gap-2"><input type="checkbox" /> Hide CDN</label>
        </div>
      </div>
    </div>
  );
}
