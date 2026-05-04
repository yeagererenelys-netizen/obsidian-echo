import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ps/Layout";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { VIDEOS } from "@/config/videoConfig";
import { MOCK_ALERTS } from "@/lib/mockData";
import { useState } from "react";
import { useAlertStore } from "@/hooks/useAlertStore";
import { Download, Shield, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/app/alerts")({ component: Alerts });

function Alerts() {
  const { alerts, unreadCount, acknowledge, acknowledgeAll } = useAlertStore();
  const [sel, setSel] = useState<string | null>(null);

  const a = sel ? alerts.find((x) => x.id === sel) || alerts[0] : alerts[0];

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
        <VideoBackground src={VIDEOS.HERO_04} opacity={0.1} />
      </div>
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src={VIDEOS.BG_03} opacity={0.04} />
      </div>
      <div className="relative z-10">
        <PageHeader title="ALERTS & TRIAGE" subtitle={<><span className="dot dot-threat" /> {unreadCount} critical · 2 warn — last 1h</>} actions={<button onClick={() => acknowledgeAll()} className="btn btn-secondary"><CheckCircle size={14} /> Acknowledge All</button>} />
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Critical" value={String(unreadCount)} color="threat" />
          <StatCard label="Warn" value="8" />
          <StatCard label="Resolved 24h" value={String(alerts.filter(x => x.acknowledged).length)} color="lime" />
          <StatCard label="MTTR" value="4m" />
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5 space-y-2 max-h-[600px] overflow-y-auto">
            {alerts.map((al) => (
              <div key={al.id} onClick={() => setSel(al.id)}
                className={`ps-card cursor-pointer transition-all ${al.id === a?.id ? "!border-lime" : ""} ${al.acknowledged ? "opacity-50" : ""} ${al.severity === "CRITICAL" && !al.acknowledged ? "animate-pulse" : ""}`}
                style={{ borderLeft: `3px solid ${al.severity === "CRITICAL" ? "#ef4444" : al.severity === "HIGH" ? "#f97316" : al.severity === "MEDIUM" ? "#eab308" : "#3b82f6"}`, background: al.severity === "CRITICAL" && !al.acknowledged ? "rgba(239,68,68,0.04)" : "" }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white font-medium">{al.type}</div>
                    <div className="mono text-[11px] text-ghost mt-1">{al.src_ip} → {al.dst_ip}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {al.acknowledged && <CheckCircle size={14} className="text-safe" />}
                    {!al.acknowledged && <button onClick={(e) => { e.stopPropagation(); acknowledge(al.id); }} className="text-ghost hover:text-white"><CheckCircle size={14} /></button>}
                    <span className="mono text-[10px] text-ghost">{new Date(al.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="col-span-7 ps-card">
            {a && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge ${a.severity === "CRITICAL" ? "badge-threat" : a.severity === "HIGH" ? "badge-warn" : "badge-neutral"}`}>{a.severity}</span>
                  <span className="mono text-xs text-ghost">{new Date(a.timestamp).toLocaleString()}</span>
                </div>
                <h2 className="display text-3xl text-white">{a.type}</h2>
                <p className="text-sm text-silver mt-2">{a.message}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div><div className="micro">Source</div><div className="mono text-sm text-white">{a.src_ip}</div></div>
                  <div><div className="micro">Destination</div><div className="mono text-sm text-white">{a.dst_ip}:{a.dst_port}</div></div>
                </div>
                <div className="mt-6">
                  <div className="micro mb-2">Evidence</div>
                  <div className="ps-card !p-3" style={{ background: "#000" }}>
                    <div className="mono text-xs text-lime mb-3">Protocol: {a.protocol}</div>
                    <svg viewBox="0 0 400 80" className="w-full h-20">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <line key={i} x1={i * 13 + 5} y1={70} x2={i * 13 + 5} y2={20 + (i * 7) % 20} stroke="#a3ff12" strokeWidth={2} />
                      ))}
                    </svg>
                    <div className="display text-3xl text-lime mt-2">0.97 / 1.00</div>
                    <div className="mono text-[10px] text-threat mt-1">EXTREMELY REGULAR — {a.type} SUSPECTED</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button onClick={exportEvidence} className="btn btn-primary"><Download size={14} /> Export Evidence Package</button>
                  <button onClick={() => acknowledge(a.id)} className="btn btn-secondary" disabled={a.acknowledged}><CheckCircle size={14} /> {a.acknowledged ? "Resolved" : "Mark Resolved"}</button>
                  <button className="btn btn-secondary"><Shield size={14} /> Block Device</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
