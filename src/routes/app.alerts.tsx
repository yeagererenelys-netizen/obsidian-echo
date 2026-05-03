import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ps/Shell";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { MOCK_ALERTS } from "@/lib/mockData";
import { useState } from "react";
import { Download, Shield, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/app/alerts")({ component: Alerts });

function Alerts() {
  const [sel, setSel] = useState(0);
  const [resolved, setResolved] = useState<number[]>([]);
  const a = MOCK_ALERTS[sel];

  const exportEvidence = () => {
    const blob = new Blob([JSON.stringify(a, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = `evidence-${a.id}.json`;
    el.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src="/videos/hero/HERO_04_anim_web.mp4" opacity={0.1} />
      </div>
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src="/videos/backgrounds/BG_03_anim_web.mp4" opacity={0.04} />
      </div>
      <div className="relative z-10">
        <PageHeader title="ALERTS & TRIAGE" subtitle={<><span className="dot dot-threat" /> 3 critical · 2 warn — last 1h</>} />
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Critical" value="3" color="threat" />
          <StatCard label="Warn" value="8" />
          <StatCard label="Resolved 24h" value={String(42 + resolved.length)} color="lime" />
          <StatCard label="MTTR" value="4m" />
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5 space-y-2">
            {MOCK_ALERTS.map((al, i) => (
              <div key={al.id} onClick={() => setSel(i)}
                className={`ps-card cursor-pointer transition-all ${i === sel ? "!border-lime" : ""} ${resolved.includes(al.id) ? "opacity-50" : ""}`}
                style={{ borderLeft: `3px solid ${al.sev === "critical" ? "#ef4444" : "#eab308"}`, background: al.sev === "critical" ? "rgba(239,68,68,0.04)" : "" }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-medium">{al.title}</div>
                    <div className="mono text-[11px] text-ghost mt-1">{al.src} → {al.dst}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {resolved.includes(al.id) && <CheckCircle size={14} className="text-safe" />}
                    <span className="mono text-[10px] text-ghost">{al.t}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="col-span-7 ps-card">
            <div className="flex items-center justify-between mb-3">
              <span className={`badge ${a.sev === "critical" ? "badge-threat" : "badge-warn"}`}>{a.sev}</span>
              <span className="mono text-xs text-ghost">{a.t}</span>
            </div>
            <h2 className="display text-3xl text-white">{a.title}</h2>
            <p className="text-sm text-silver mt-2">{a.desc}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div><div className="micro">Source</div><div className="mono text-sm text-white">{a.src}</div></div>
              <div><div className="micro">Destination</div><div className="mono text-sm text-white">{a.dst}</div></div>
            </div>
            <div className="mt-6">
              <div className="micro mb-2">Evidence</div>
              <div className="ps-card !p-3" style={{ background: "#000" }}>
                <div className="mono text-xs text-lime mb-3">{a.evidence}</div>
                <svg viewBox="0 0 400 80" className="w-full h-20">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <line key={i} x1={i * 13 + 5} y1={70} x2={i * 13 + 5} y2={20 + (i * 7) % 20} stroke="#a3ff12" strokeWidth={2} />
                  ))}
                </svg>
                <div className="display text-3xl text-lime mt-2">0.97 / 1.00</div>
                <div className="mono text-[10px] text-threat mt-1">EXTREMELY REGULAR — C2 BEACON SUSPECTED</div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={exportEvidence} className="btn btn-primary"><Download size={14} /> Export Evidence Package</button>
              <button onClick={() => setResolved(r => [...r, a.id])} className="btn btn-secondary"><CheckCircle size={14} /> Mark Resolved</button>
              <button className="btn btn-secondary"><Shield size={14} /> Block Device</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
