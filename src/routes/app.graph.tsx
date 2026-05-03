import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Shell";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { MOCK_GRAPH_NODES, MOCK_GRAPH_EDGES } from "@/lib/mockData";
import { useState, useEffect, useRef, useMemo } from "react";

export const Route = createFileRoute("/app/graph")({ component: Graph });

const nodeColor = (type: string) => {
  switch (type) {
    case "router": return "#ffffff";
    case "internal": return "#a3ff12";
    case "external": return "#3b82f6";
    case "threat": return "#ef4444";
    default: return "#a0aec0";
  }
};

const edgeColor = (t: number) => t === 0 ? "#a3ff12" : t === 1 ? "#eab308" : "#ef4444";

function Graph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [protoFilter, setProtoFilter] = useState("ALL");
  const [threatFilter, setThreatFilter] = useState("ALL");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Simple force layout positions (computed once, deterministic)
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const internalNodes = MOCK_GRAPH_NODES.filter(n => n.type === "router" || n.type === "internal");
    const externalNodes = MOCK_GRAPH_NODES.filter(n => n.type !== "router" && n.type !== "internal");

    // Router in center
    const router = MOCK_GRAPH_NODES.find(n => n.type === "router");
    if (router) positions[router.id] = { x: 400, y: 300 };

    // Internal nodes in inner ring
    internalNodes.filter(n => n.type !== "router").forEach((n, i) => {
      const angle = ((i + 1) / (internalNodes.length)) * Math.PI * 2 - Math.PI / 2;
      positions[n.id] = { x: 400 + Math.cos(angle) * 120, y: 300 + Math.sin(angle) * 100 };
    });

    // External nodes in outer ring
    externalNodes.forEach((n, i) => {
      const angle = (i / externalNodes.length) * Math.PI * 2 - Math.PI / 4;
      const radius = 220 + (i % 3) * 40;
      positions[n.id] = { x: 400 + Math.cos(angle) * radius, y: 300 + Math.sin(angle) * radius };
    });
    return positions;
  }, []);

  // Animate edge pulses
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(interval);
  }, []);

  // Filter edges
  const filteredEdges = MOCK_GRAPH_EDGES.filter(e => {
    if (protoFilter !== "ALL" && e.protocol !== protoFilter) return false;
    if (threatFilter === "CLEAN" && e.threatLevel > 0) return false;
    if (threatFilter === "SUSPICIOUS" && e.threatLevel !== 1) return false;
    if (threatFilter === "THREAT" && e.threatLevel !== 2) return false;
    return true;
  });

  // Top connections sorted by volume
  const topConnections = [...MOCK_GRAPH_EDGES].sort((a, b) => b.volume - a.volume).slice(0, 5);

  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src="https://drive.google.com/uc?export=download&id=1A3hkNGgUSkRG1o92B7FGUJTwvASSIOES" opacity={0.06} />
      </div>
      <div className="relative z-10">
        <PageHeader title="COMMUNICATION GRAPH" subtitle={`Force-directed live · ${MOCK_GRAPH_NODES.length} nodes · ${filteredEdges.length} edges`} />

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="flex gap-1">
            {["ALL", "TCP", "UDP", "DNS", "HTTPS"].map(p => (
              <button key={p} onClick={() => setProtoFilter(p)} className={`btn !text-xs !py-1 !px-3 ${protoFilter === p ? "btn-primary" : "btn-secondary"}`}>{p}</button>
            ))}
          </div>
          <div className="flex gap-1 ml-4">
            {["ALL", "CLEAN", "SUSPICIOUS", "THREAT"].map(t => (
              <button key={t} onClick={() => setThreatFilter(t)} className={`btn !text-xs !py-1 !px-3 ${threatFilter === t ? "btn-primary" : "btn-secondary"}`}>{t}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-9 ps-card !p-0 overflow-hidden relative" style={{ height: 620, background: "#000" }}>
            <VideoBackground src="https://drive.google.com/uc?export=download&id=1KewMdVzeXhXCGVfzVhSiTjjZmhV4-dQq" opacity={0.05} />
            <div className="absolute top-3 left-3 right-3 z-20 px-3 py-2 rounded border border-threat/40 bg-threat-dim flex items-center gap-2">
              <span className="dot dot-threat" />
              <span className="text-sm text-white">{MOCK_GRAPH_EDGES.filter(e => e.threatLevel === 2).length} critical anomalies detected</span>
              <span className="ml-auto mono text-xs text-ghost">12:42:18</span>
            </div>

            <svg ref={svgRef} viewBox="0 0 800 600" className="w-full h-full relative z-10">
              {/* Edges */}
              {filteredEdges.map((e, i) => {
                const src = nodePositions[e.source];
                const tgt = nodePositions[e.target];
                if (!src || !tgt) return null;
                const thickness = Math.min(Math.log(e.volume + 1) * 0.8, 8);
                const dashOffset = e.active ? -(tick * 2) % 40 : 0;
                return (
                  <g key={`e${i}`}>
                    <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                      stroke={edgeColor(e.threatLevel)} strokeWidth={thickness} opacity={0.4} />
                    {e.active && (
                      <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                        stroke={edgeColor(e.threatLevel)} strokeWidth={thickness * 0.6}
                        strokeDasharray="6 14" strokeDashoffset={dashOffset}
                        opacity={0.8} />
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {MOCK_GRAPH_NODES.map(n => {
                const pos = nodePositions[n.id];
                if (!pos) return null;
                const r = Math.max(8, Math.min(40, Math.sqrt(n.packetCount) * 0.08));
                const isHovered = hoveredNode === n.id;
                const scale = isHovered ? 1.3 : 1;
                return (
                  <g key={n.id}
                    onMouseEnter={() => setHoveredNode(n.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {n.threatLevel === 2 && (
                      <circle cx={pos.x} cy={pos.y} r={r * scale + 6} fill="none" stroke="#ef4444" strokeWidth={1} opacity={0.3 + Math.sin(tick * 0.1) * 0.2} />
                    )}
                    <circle cx={pos.x} cy={pos.y} r={r * scale} fill={nodeColor(n.type)}
                      opacity={0.9}
                      style={{ filter: n.threatLevel === 2 ? "drop-shadow(0 0 8px #ef4444)" : n.type === "router" ? "drop-shadow(0 0 8px #fff)" : undefined, transition: "r 0.15s" }}
                    />
                    {isHovered && (
                      <foreignObject x={pos.x + r + 8} y={pos.y - 40} width={200} height={90}>
                        <div className="ps-card !p-2 !text-xs" style={{ background: "rgba(8,8,8,0.95)" }}>
                          <div className="mono text-white font-bold">{n.id}</div>
                          <div className="text-ghost">{n.label}</div>
                          <div className="mono text-lime">{n.packetCount.toLocaleString()} pkts</div>
                          <div className={n.threatLevel === 2 ? "text-threat" : n.threatLevel === 1 ? "text-warn" : "text-safe"}>
                            Threat: {["CLEAN", "SUSPICIOUS", "CRITICAL"][n.threatLevel]}
                          </div>
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Sidebar */}
          <div className="col-span-3 space-y-4">
            <div className="ps-card">
              <h3 className="display text-lg mb-3">TOP CONNECTIONS</h3>
              <div className="space-y-3">
                {topConnections.map((c, i) => (
                  <div key={i} className="border-b border-graphite/50 pb-2">
                    <div className="mono text-[11px] text-white">{c.source}</div>
                    <div className="mono text-[10px] text-ghost">→ {c.target}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-carbon rounded">
                        <div className="h-full rounded" style={{ width: `${Math.min((c.volume / topConnections[0].volume) * 100, 100)}%`, background: edgeColor(c.threatLevel) }} />
                      </div>
                      <span className="mono text-[10px] text-ghost">{(c.volume / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ps-card">
              <div className="micro mb-2">Legend</div>
              {[
                { color: "#ffffff", label: "Router" },
                { color: "#a3ff12", label: "Internal" },
                { color: "#3b82f6", label: "External" },
                { color: "#ef4444", label: "Threat" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2 text-xs text-silver mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
