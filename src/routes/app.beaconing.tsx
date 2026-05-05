import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ps/Layout";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { VIDEOS } from "@/config/videoConfig";
import { useState } from "react";
import { useBeaconDetector } from "@/hooks/useBeaconDetector";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { X, Play, Flag, Download, Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/beaconing")({ component: Beaconing });

function generateTimingData(reg: number, count = 50) {
  const base = 30;
  return Array.from({ length: count }, (_, i) => ({
    seq: i,
    interval: base + (1 - reg) * (Math.random() - 0.5) * 20 + Math.random() * 0.5,
  }));
}

function Beaconing() {
  const { beaconDevices, isSimulating, startSimulation, stopSimulation } = useBeaconDetector();
  const [inspecting, setInspecting] = useState<number | null>(null);
  const inspected = inspecting !== null ? beaconDevices[inspecting] : null;

  const handleExportEvidence = () => {
    if (!inspected) return;
    const evidence = {
      type: "beacon_evidence",
      timestamp: new Date().toISOString(),
      device: inspected,
    };
    const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beacon-evidence-${inspected.ip.replace(/\./g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      {/* Hero */}
      <div className="ps-card !p-8 mb-6 relative overflow-hidden">
        <VideoBackground src={VIDEOS.FEAT_04} opacity={0.15} />
        <div className="relative z-10">
          <h1 className="display text-[64px] text-lime leading-none text-glow-lime">BEACONING DETECTOR</h1>
          <p className="text-silver mt-2">Inter-packet timing analysis · Detects C2 callbacks via regularity scoring</p>
          <svg viewBox="0 0 800 100" className="w-full h-24 mt-4">
            {Array.from({ length: 50 }).map((_, i) => (
              <line key={i} x1={i * 16 + 5} y1={90} x2={i * 16 + 5} y2={20 + ((i * 9) % 30)} stroke="#a3ff12" strokeWidth={2} opacity={0.7} />
            ))}
          </svg>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Suspicious Devices" value={String(beaconDevices.length)} color="lime" />
        <StatCard label="Highest Regularity" value={beaconDevices.length > 0 ? beaconDevices[0].regularityScore.toFixed(2) : "0.00"} color="threat" />
        <StatCard label="Avg Beacon Interval" value={beaconDevices.length > 0 ? `${(beaconDevices[0].avgIntervalMs / 1000).toFixed(1)}s` : "0.0s"} />
        <StatCard label="Detection Confidence" value={beaconDevices.length > 0 ? `${(beaconDevices[0].regularityScore * 100).toFixed(0)}%` : "0%"} color="lime" hero />
      </div>

      {/* BG video */}
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden rounded-lg" style={{ zIndex: 0 }}>
          <VideoBackground src={VIDEOS.BG_03} opacity={0.04} />
        </div>

        <div className="space-y-3 relative z-10">
          {beaconDevices.map((b, i) => (
            <div key={`${b.ip}-${b.targetIp}:${b.targetPort}`} className="ps-card flex items-center gap-6" style={{ borderLeft: `3px solid ${b.regularityScore > 0.85 ? "#ef4444" : "#eab308"}` }}>
              <div className="min-w-[180px]">
                <div className="mono text-base text-white">{b.ip}</div>
                <div className="mono text-xs text-ghost">→ {b.targetIp}</div>
              </div>
              <div className="min-w-[80px]">
                <div className="micro">Interval</div>
                <div className="mono text-sm text-lime">{(b.avgIntervalMs / 1000).toFixed(1)}s</div>
              </div>
              <div className="flex-1">
                <div className="micro mb-1">Regularity ({b.regularityScore.toFixed(2)})</div>
                <div className="h-2 bg-carbon rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${b.regularityScore * 100}%`,
                      background: b.regularityScore > 0.85 ? "#ef4444" : b.regularityScore > 0.7 ? "#eab308" : "#a3ff12",
                    }}
                  />
                </div>
              </div>
              <div className="min-w-[60px] text-center">
                <div className="micro">Conf.</div>
                <div className="mono text-sm text-white">{(b.regularityScore * 100).toFixed(0)}%</div>
              </div>
              <span className={`badge ${b.regularityScore > 0.85 ? "badge-threat" : "badge-warn"} min-w-[140px] justify-center`}>
                {b.regularityScore > 0.85 ? "CONFIRMED BEACON" : "MONITORING"}
              </span>
              <div className="display text-[40px] text-lime leading-none min-w-[80px] text-right">{b.regularityScore.toFixed(2)}</div>
              <button onClick={() => setInspecting(i)} className="btn btn-primary !text-xs">Inspect →</button>
              <button className="btn btn-ghost !text-xs">Dismiss</button>
            </div>
          ))}
        </div>

        {/* Beacon Simulator */}
        <div className="ps-card mt-6 relative z-10">
          <h3 className="display text-xl mb-3">BEACON SIMULATOR</h3>
          <p className="text-sm text-ghost mb-4">Simulate a C2 beacon to demo the detection engine. Generates mock beacon traffic over 3 minutes, watching the regularity score climb from 0.3 to 0.97.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={isSimulating ? stopSimulation : startSimulation}
              className={`btn ${isSimulating ? "btn-secondary" : "btn-primary"}`}
            >
              <Play size={14} />
              {isSimulating ? "■ STOP SIMULATION" : "▶ RUN BEACON SIMULATION"}
            </button>
            {isSimulating && (
              <div className="flex-1 h-2 bg-carbon rounded overflow-hidden">
                <div className="h-full bg-lime rounded transition-all duration-500" style={{ width: `${(beaconDevices[0]?.regularityScore ?? 0) * 100}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex transition-transform duration-250"
        style={{
          width: "40vw",
          minWidth: 480,
          transform: inspected ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="flex-1 bg-obsidian border-l border-graphite overflow-y-auto p-6">
          {inspected && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="display text-2xl text-white">INSPECT: {inspected.ip}</h2>
                <button onClick={() => setInspecting(null)} className="btn btn-ghost"><X size={20} /></button>
              </div>

              {/* Device header */}
              <div className="flex items-center gap-4 mb-6 ps-card">
                <div className="flex-1">
                  <div className="mono text-lg text-white">{inspected.ip}</div>
                  <div className="text-xs text-ghost">→ {inspected.targetIp}</div>
                  <div className="text-xs text-ghost mt-1">TCP port {inspected.targetPort} · {inspected.packetCount} packets seen</div>
                </div>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 80 80" width={80} height={80}>
                    <circle cx={40} cy={40} r={32} fill="none" stroke="#222" strokeWidth={6} />
                    <circle cx={40} cy={40} r={32} fill="none" stroke={inspected.regularityScore > 0.85 ? "#ef4444" : "#eab308"} strokeWidth={6}
                      strokeDasharray={`${inspected.regularityScore * 200} 200`} transform="rotate(-90 40 40)" />
                  </svg>
                  <div className="display text-lg -mt-14" style={{ color: inspected.regularityScore > 0.85 ? "#ef4444" : "#eab308" }}>{inspected.regularityScore.toFixed(2)}</div>
                  <div className="micro mt-10">THREAT</div>
                </div>
              </div>

              {/* Inter-arrival timing chart */}
              <div className="ps-card mb-4">
                <h3 className="display text-lg mb-3">INTER-ARRIVAL TIMING CHART</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={
                    (inspected.interArrivalTimes ?? []).map((ms, i) => ({
                      index: i,
                      intervalMs: ms,
                      intervalSec: parseFloat((ms / 1000).toFixed(1)),
                    }))
                  }>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="index" stroke="#4a5568" fontSize={10} fontFamily="JetBrains Mono" />
                    <YAxis stroke="#4a5568" fontSize={10} fontFamily="JetBrains Mono" domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ background: "#080808", border: "1px solid #222", fontFamily: "JetBrains Mono", fontSize: 11 }} />
                    <Line type="monotone" dataKey="intervalSec" stroke="#a3ff12" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mono text-[10px] text-ghost mt-2">
                  {inspected.regularityScore > 0.85 ? "⚠ FLAT LINE — extremely regular timing. Classic C2 beacon pattern." : "Moderate regularity — continued monitoring recommended."}
                </div>
              </div>

              {/* Regularity Analysis */}
              <div className="ps-card mb-4">
                <h3 className="display text-lg mb-3">REGULARITY ANALYSIS</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="micro">Mean Interval</div><div className="mono text-sm text-white">{(inspected.avgIntervalMs / 1000).toFixed(1)}s</div></div>
                  <div><div className="micro">Std Deviation</div><div className="mono text-sm text-white">{(inspected.stdDevMs / 1000).toFixed(1)}s</div></div>
                  <div><div className="micro">Coefficient of Variation</div><div className="mono text-sm text-white">{(1 - inspected.regularityScore).toFixed(3)}</div></div>
                  <div><div className="micro">Events</div><div className="mono text-sm text-lime">{inspected.packetCount}</div></div>
                </div>
                <div className={`mt-4 p-3 rounded border-l-2 ${inspected.regularityScore > 0.85 ? "border-threat bg-threat-dim/30" : "border-warn bg-warn-dim/20"}`}>
                  <div className={`mono text-xs ${inspected.regularityScore > 0.85 ? "text-threat" : "text-warn"}`}>
                    {inspected.regularityScore > 0.85 ? "HIGH REGULARITY — POSSIBLE C2 BEACON" : "MODERATE REGULARITY — MONITORING"}
                  </div>
                </div>
              </div>

              {/* Raw packet log */}
              <div className="ps-card mb-4">
                <h3 className="display text-lg mb-3">RAW PACKET LOG (LAST 20)</h3>
                <div className="max-h-[200px] overflow-y-auto">
                  {Array.from({ length: Math.min(inspected.packetCount, 20) }, (_, i) => {
                    const t = new Date(inspected.lastSeen - i * inspected.avgIntervalMs);
                    return (
                      <div key={i} className="flex justify-between mono text-[11px] py-1 border-b border-graphite/50">
                        <span className="text-ghost">#{inspected.packetCount - i}</span>
                        <span className="text-white">{t.toLocaleTimeString()}.{String(t.getMilliseconds()).padStart(3, "0")}</span>
                        <span className="text-silver">{inspected.ip}:{1024 + i} → {inspected.targetIp}:{inspected.targetPort}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="btn btn-danger"><Flag size={14} /> Flag as Beacon</button>
                <button className="btn btn-ghost"><Trash2 size={14} /> Dismiss</button>
                <button onClick={handleExportEvidence} className="btn btn-primary"><Download size={14} /> Export Evidence</button>
              </div>
            </>
          )}
        </div>
      </div>
      {inspecting !== null && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setInspecting(null)} />
      )}
    </div>
  );
}
