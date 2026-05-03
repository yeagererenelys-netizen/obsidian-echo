import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Shell";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { MOCK_MAP_CONNECTIONS } from "@/lib/mockData";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/app/map")({ component: WorldMap });

// Simple world map using SVG arcs
function WorldMap() {
  const [activeConns, setActiveConns] = useState(MOCK_MAP_CONNECTIONS);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  // Add mock connections periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveConns(prev => {
        const conn = prev[Math.floor(Math.random() * prev.length)];
        return [...prev.map(c => ({ ...c, bytes: c.bytes + Math.floor(Math.random() * 100000) }))];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const countries = [
    { c: "🇺🇸 United States", n: activeConns.filter(c => c.country === "US").length * 24, sev: "safe" },
    { c: "🇩🇪 Germany", n: activeConns.filter(c => c.country === "DE").length * 12, sev: activeConns.some(c => c.country === "DE" && c.threat) ? "warn" : "safe" },
    { c: "🇷🇺 Russia", n: activeConns.filter(c => c.country === "RU").length * 3, sev: "threat" },
    { c: "🇦🇺 Australia", n: activeConns.filter(c => c.country === "AU").length * 5, sev: "safe" },
    { c: "🧅 Tor exits", n: activeConns.filter(c => c.type === "tor").length, sev: "threat" },
  ];

  // Map projection (simple Mercator-like)
  const project = (lat: number, lng: number) => ({
    x: ((lng + 180) / 360) * 800,
    y: (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) * 250 + 50,
  });

  return (
    <div className="relative">
      <PageHeader
        title="GEOGRAPHIC MAP"
        subtitle={<><span className="dot dot-lime" /> {activeConns.length} active connections · Updated live</>}
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Map */}
        <div className="col-span-9 ps-card !p-0 relative overflow-hidden" style={{ height: 560, background: "radial-gradient(ellipse at center, #050505, #000)" }}>
          <VideoBackground src="/videos/features/FEAT_06_anim_web.mp4" opacity={0.08} />

          <svg viewBox="0 0 800 500" className="w-full h-full relative z-10">
            {/* Grid lines */}
            {Array.from({ length: 13 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={i * 40 + 20} x2={800} y2={i * 40 + 20} stroke="#111" strokeWidth={0.5} />
            ))}
            {Array.from({ length: 17 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={500} stroke="#111" strokeWidth={0.5} />
            ))}

            {/* Connection arcs */}
            {activeConns.map((conn, i) => {
              const src = project(conn.srcLat, conn.srcLng);
              const dst = project(conn.dstLat, conn.dstLng);
              const mid = { x: (src.x + dst.x) / 2, y: Math.min(src.y, dst.y) - 60 - Math.random() * 40 };
              const color = conn.threat ? "#ef4444" : "#a3ff12";
              const dashOffset = -(tick * 3) % 30;

              return (
                <g key={i}>
                  <path d={`M ${src.x} ${src.y} Q ${mid.x} ${mid.y} ${dst.x} ${dst.y}`}
                    fill="none" stroke={color} strokeWidth={1} opacity={0.3} />
                  <path d={`M ${src.x} ${src.y} Q ${mid.x} ${mid.y} ${dst.x} ${dst.y}`}
                    fill="none" stroke={color} strokeWidth={1.5}
                    strokeDasharray="4 8" strokeDashoffset={dashOffset}
                    opacity={0.7} />
                </g>
              );
            })}

            {/* Source point (India) */}
            {(() => {
              const p = project(28.6139, 77.2090);
              return (
                <g>
                  <circle cx={p.x} cy={p.y} r={8} fill="#a3ff12" opacity={0.9} />
                  <circle cx={p.x} cy={p.y} r={14} fill="none" stroke="#a3ff12" strokeWidth={1} opacity={0.5 + Math.sin(tick * 0.15) * 0.3} />
                  <circle cx={p.x} cy={p.y} r={22} fill="none" stroke="#a3ff12" strokeWidth={0.5} opacity={0.2 + Math.sin(tick * 0.1) * 0.15} />
                </g>
              );
            })()}

            {/* Destination points */}
            {activeConns.map((conn, i) => {
              const p = project(conn.dstLat, conn.dstLng);
              const r = Math.max(3, Math.min(12, Math.log(conn.bytes / 1000) * 1.5));
              const color = conn.threat ? "#ef4444" : conn.type === "tor" ? "#ef4444" : conn.type === "vpn" ? "#eab308" : "#a3ff12";
              return (
                <g key={`dst${i}`}>
                  <circle cx={p.x} cy={p.y} r={r} fill={color} opacity={0.8} />
                  {conn.threat && (
                    <circle cx={p.x} cy={p.y} r={r + 4} fill="none" stroke={color} strokeWidth={1}
                      opacity={0.3 + Math.sin(tick * 0.2 + i) * 0.2} />
                  )}
                  {conn.type === "tor" && (
                    <text x={p.x} y={p.y - r - 4} textAnchor="middle" fill="#ef4444" fontSize={8} fontFamily="JetBrains Mono">TOR</text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* LIVE indicator */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 border border-lime-border">
            <span className="dot dot-lime !w-2 !h-2" />
            <span className="mono text-[10px] text-lime">LIVE</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-3 space-y-4 relative">
          <div className="absolute inset-0 overflow-hidden rounded-lg" style={{ zIndex: 0 }}>
            <VideoBackground src="/videos/backgrounds/BG_04_anim_web.mp4" opacity={0.08} />
          </div>

          <div className="ps-card relative z-10">
            <div className="micro mb-1">Active Connections</div>
            <div className="display text-[48px] text-lime leading-none">{activeConns.length}</div>
          </div>

          <div className="ps-card relative z-10">
            <h3 className="display text-lg mb-3">COUNTRIES</h3>
            <div className="space-y-3">
              {countries.map(c => (
                <div key={c.c}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-silver">{c.c}</span>
                    <span className={`mono ${c.sev === "threat" ? "text-threat" : c.sev === "warn" ? "text-warn" : "text-lime"}`}>{c.n}</span>
                  </div>
                  <div className="h-1 bg-carbon rounded">
                    <div className={`h-full rounded ${c.sev === "threat" ? "bg-threat" : c.sev === "warn" ? "bg-warn" : "bg-lime"}`}
                      style={{ width: `${Math.min((c.n / 50) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ps-card relative z-10">
            <h3 className="display text-lg mb-3 text-threat">THREAT DESTINATIONS</h3>
            <div className="space-y-2">
              {activeConns.filter(c => c.threat).map((c, i) => (
                <div key={i} className="mono text-[11px] p-2 rounded bg-threat-dim/20 border-l-2 border-threat">
                  <div className="text-white">{c.dst}</div>
                  <div className="text-ghost">{c.type === "tor" ? "🧅 Tor Exit" : c.type === "beacon" ? "📡 C2 Beacon" : "⚠ Suspicious"} · {c.city}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
