import { createFileRoute } from "@tanstack/react-router";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { VIDEOS } from "@/config/videoConfig";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useGraphData, GraphNode as Node, GraphEdge as Link } from "@/hooks/useGraphData";

export const Route = createFileRoute("/app/graph")({ component: CommunicationGraph });

type GraphLink = Link & {
  dashOffset: number;
  pulsePhase: number;
};

const PROTOCOL_FILTERS = ["ALL", "TCP", "UDP", "DNS", "HTTP"] as const;
type ProtocolFilter = (typeof PROTOCOL_FILTERS)[number];

const THREAT_FILTERS = ["ALL", "CLEAN", "SUSPICIOUS", "THREAT"] as const;
type ThreatFilter = (typeof THREAT_FILTERS)[number];


const EDGE_COLORS: Record<number, string> = {
  0: "#a3ff12",
  1: "#eab308",
  2: "#ef4444",
};

const NODE_COLORS: Record<string, string> = {
  router:   "#ffffff",
  internal: "#22c55e",   // green  — local network
  external: "#ef4444",   // red    — external network
  threat:   "#ff6600",   // orange — confirmed threat
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const edgeWidth = (packetCount: number) => Math.max(1, Math.min(6, Math.log2(packetCount + 1)));
const nodeRadius = (node: Node) => (node.isThreat ? 14 : node.isInternal ? 12 : 10);
const nodeColor  = (node: Node) =>
  node.isThreat ? NODE_COLORS.threat :
  node.isInternal ? NODE_COLORS.internal :
  NODE_COLORS.external;

const getNodeId = (value: string | Node) => (typeof value === "string" ? value : value.id);
const getLinkUid = (link: Link) => link.id;

const matchesProtocol = (protocol: any, filter: ProtocolFilter) => {
  return true;
};

const matchesThreat = (isThreat: boolean, filter: ThreatFilter) => {
  if (filter === "ALL") return true;
  if (filter === "CLEAN") return !isThreat;
  if (filter === "THREAT") return isThreat;
  return true;
};

const threatLabel = (isThreat: boolean) => {
  return isThreat ? "THREAT" : "CLEAN";
};

function CommunicationGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, GraphLink> | null>(null);
  const linkSelectionRef = useRef<d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown> | null>(null);
  const trailSelectionRef = useRef<d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown> | null>(null);
  const pulseSelectionRef = useRef<d3.Selection<SVGCircleElement, GraphLink, SVGGElement, unknown> | null>(null);
  const nodeSelectionRef = useRef<d3.Selection<SVGCircleElement, Node, SVGGElement, unknown> | null>(null);
  const labelSelectionRef = useRef<d3.Selection<SVGTextElement, Node, SVGGElement, unknown> | null>(null);
  const linkMetaRef = useRef(new Map<string, { dashOffset: number; pulsePhase: number }>());
  const linksRef = useRef<Link[]>([]);
  const nodesRef = useRef<Node[]>([]);
  const timerRef = useRef<d3.Timer | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const { graphData } = useGraphData();
  const nodes = graphData.nodes;
  const links = graphData.edges;
  const backendOffline = false;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>("ALL");
  const [threatFilter, setThreatFilter] = useState<ThreatFilter>("ALL");
  const [hovered, setHovered] = useState<{
    node: Node;
    x: number;
    y: number;
    protocols: string;
  } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [topConnections, setTopConnections] = useState<Link[]>([]);

  const normalizedLinks = useMemo(() => {
    const nodeSet = new Set(nodes.map(n => n.id));
    return links.filter(link => nodeSet.has(getNodeId(link.source)) && nodeSet.has(getNodeId(link.target)));
  }, [links, nodes]);

  useEffect(() => {
    linksRef.current = normalizedLinks;
  }, [normalizedLinks]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);

  const protocolSummaryByNode = useMemo(() => {
    const summary = new Map<string, Record<string, number>>();
    normalizedLinks.forEach(link => {
      const src = getNodeId(link.source);
      const dst = getNodeId(link.target);
      const add = (id: string) => {
        if (!summary.has(id)) summary.set(id, {});
        const bucket = summary.get(id);
        if (!bucket) return;
        bucket["TCP"] = (bucket["TCP"] || 0) + link.bytes;
      };
      add(src);
      add(dst);
    });

    const result = new Map<string, string>();
    summary.forEach((bucket, id) => {
      const entries = Object.entries(bucket).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const total = entries.reduce((acc, [, value]) => acc + value, 0) || 1;
      const text = entries.map(([protocol, value]) => `${protocol} ${Math.round((value / total) * 100)}%`).join(", ");
      result.set(id, text);
    });
    return result;
  }, [normalizedLinks]);

  const filteredLinks = useMemo(
    () => normalizedLinks.filter(link => matchesProtocol(null, protocolFilter) && matchesThreat(link.isThreat, threatFilter)),
    [normalizedLinks, protocolFilter, threatFilter]
  );

  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    filteredLinks.forEach(link => {
      ids.add(getNodeId(link.source));
      ids.add(getNodeId(link.target));
    });
    return ids;
  }, [filteredLinks]);



  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width && height) setDimensions({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const rootGroup = svg.append("g");

    // ── Glow filter definition ─────────────────────────────────────────
    const defs = svg.append("defs");
    const glowFilter = defs.append("filter").attr("id", "node-glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    glowFilter.append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", "6").attr("result", "blur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    // ───────────────────────────────────────────────────────────────────

    const linkGroup = rootGroup.append("g");
    const trailGroup = rootGroup.append("g");
    const pulseGroup = rootGroup.append("g");
    const nodeGroup = rootGroup.append("g");
    const labelGroup = rootGroup.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        rootGroup.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    const simulation = d3
      .forceSimulation<Node, GraphLink>([])
      .alphaDecay(0.02)
      .force(
        "link",
        d3.forceLink<Node, GraphLink>([]).id(d => d.id).distance(120).strength(0.1)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(450, 300))
      .force("collision", d3.forceCollide(40));

    simulationRef.current = simulation;

    simulation.on("tick", () => {
      linkSelectionRef.current
        ?.attr("x1", d => (d.source as Node).x ?? 0)
        .attr("y1", d => (d.source as Node).y ?? 0)
        .attr("x2", d => (d.target as Node).x ?? 0)
        .attr("y2", d => (d.target as Node).y ?? 0);

      trailSelectionRef.current
        ?.attr("x1", d => (d.source as Node).x ?? 0)
        .attr("y1", d => (d.source as Node).y ?? 0)
        .attr("x2", d => (d.target as Node).x ?? 0)
        .attr("y2", d => (d.target as Node).y ?? 0);

      nodeSelectionRef.current
        ?.attr("cx", d => d.x ?? 0)
        .attr("cy", d => d.y ?? 0);

      labelSelectionRef.current
        ?.attr("x", d => d.x ?? 0)
        .attr("y", d => (d.y ?? 0) + nodeRadius(d) + 13);

    });

    timerRef.current = d3.timer(elapsed => {
      const trail = trailSelectionRef.current;
      if (trail) {
        trail.attr("stroke-dashoffset", d => -((elapsed / 40 + d.dashOffset) % 12));
      }

      const pulses = pulseSelectionRef.current;
      if (pulses) {
        pulses
          .attr("cx", d => {
            const source = d.source as Node;
            const target = d.target as Node;
            const speed = 0.0006;
            const t = (elapsed * speed + d.pulsePhase) % 1;
            return (source.x ?? 0) + ((target.x ?? 0) - (source.x ?? 0)) * t;
          })
          .attr("cy", d => {
            const source = d.source as Node;
            const target = d.target as Node;
            const speed = 0.0006;
            const t = (elapsed * speed + d.pulsePhase) % 1;
            return (source.y ?? 0) + ((target.y ?? 0) - (source.y ?? 0)) * t;
          })
          .attr("r", d => {
            const phase = elapsed * 0.01 + d.pulsePhase * Math.PI * 2;
            return 3.5 + 1.5 * Math.sin(phase);
          })
          .attr("opacity", d => {
            const phase = elapsed * 0.01 + d.pulsePhase * Math.PI * 2;
            return 0.6 + 0.35 * Math.sin(phase);
          });
      }
    });

    linkSelectionRef.current = linkGroup.selectAll("line");
    trailSelectionRef.current = trailGroup.selectAll("line");
    pulseSelectionRef.current = pulseGroup.selectAll("circle");
    nodeSelectionRef.current = nodeGroup.selectAll("circle");
    labelSelectionRef.current = labelGroup.selectAll("text");

    return () => {
      simulation.stop();
      timerRef.current?.stop();
      timerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !simulationRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);
    simulationRef.current.force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2));

    const linkData: GraphLink[] = filteredLinks.map(link => {
      const uid = getLinkUid(link);
      let meta = linkMetaRef.current.get(uid);
      if (!meta) {
        meta = { dashOffset: Math.random() * 40, pulsePhase: Math.random() };
        linkMetaRef.current.set(uid, meta);
      }
      return {
        ...link,
        source: getNodeId(link.source),
        target: getNodeId(link.target),
        dashOffset: meta.dashOffset,
        pulsePhase: meta.pulsePhase,
      };
    });

    const linkForce = simulationRef.current.force("link") as d3.ForceLink<Node, GraphLink>;
    simulationRef.current.nodes(nodes);
    linkForce.links(linkData);
    simulationRef.current.alpha(0.3).restart();

    const linkSelection = svg
      .select<SVGGElement>("g > g:nth-of-type(1)")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(linkData, d => d.id);

    const linkEnter = linkSelection
      .enter()
      .append("line")
      .attr("stroke", d => d.isThreat ? "#ef4444" : "#a3ff12")
      .attr("stroke-width", d => edgeWidth(d.packetCount))
      .attr("opacity", d => 0.85);

    linkSelection
      .merge(linkEnter)
      .attr("stroke", d => d.isThreat ? "#ef4444" : "#a3ff12")
      .attr("stroke-width", d => edgeWidth(d.packetCount))
      .attr("opacity", d => 0.85);

    linkSelection.exit().remove();

    linkSelectionRef.current = linkSelection.merge(linkEnter);

    const trailSelection = svg
      .select<SVGGElement>("g > g:nth-of-type(2)")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(linkData, d => d.id);

    const trailEnter = trailSelection
      .enter()
      .append("line")
      .attr("stroke", d => d.isThreat ? "#ef4444" : "#a3ff12")
      .attr("stroke-width", 1.4)
      .attr("stroke-dasharray", "2 10")
      .attr("stroke-linecap", "round")
      .attr("opacity", d => 0.65);

    trailSelection
      .merge(trailEnter)
      .attr("stroke", d => d.isThreat ? "#ef4444" : "#a3ff12")
      .attr("stroke-width", 1.4)
      .attr("stroke-dasharray", "2 10")
      .attr("opacity", d => 0.65);

    trailSelection.exit().remove();
    trailSelectionRef.current = trailSelection.merge(trailEnter);

    const pulseSelection = svg
      .select<SVGGElement>("g > g:nth-of-type(3)")
      .selectAll<SVGCircleElement, GraphLink>("circle")
      .data(linkData, d => d.id);

    const pulseEnter = pulseSelection
      .enter()
      .append("circle")
      .attr("fill", d => d.isThreat ? "#ef4444" : "#a3ff12")
      .attr("opacity", d => 0.9);

    pulseSelection
      .merge(pulseEnter)
      .attr("fill", d => d.isThreat ? "#ef4444" : "#a3ff12");

    pulseSelection.exit().remove();
    pulseSelectionRef.current = pulseSelection.merge(pulseEnter);

    const nodeSelection = svg
      .select<SVGGElement>("g > g:nth-of-type(4)")
      .selectAll<SVGCircleElement, Node>("circle")
      .data(nodes, d => d.id);


    const drag = d3.drag<SVGCircleElement, Node>()
      .on("start", (event, d) => {
        if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const nodeEnter = nodeSelection
      .enter()
      .append("circle")

      .attr("stroke", "rgba(163, 255, 18, 0.5)")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("mouseenter", (event, d) => {
        const [x, y] = d3.pointer(event, svgRef.current);
        const protocols = protocolSummaryByNode.get(d.id) || "";
        setHovered({ node: d, x, y, protocols });
        d3.select(event.currentTarget).attr("r", nodeRadius(d) * 1.3);
      })
      .on("mousemove", (event, d) => {
        const [x, y] = d3.pointer(event, svgRef.current);
        const protocols = protocolSummaryByNode.get(d.id) || "";
        setHovered({ node: d, x, y, protocols });
      })
      .on("mouseleave", (event, d) => {
        setHovered(null);
        d3.select(event.currentTarget).attr("r", nodeRadius(d));
      })
      .on("click", (_, d) => setSelectedNodeId(d.id))
      .call(drag as any);

    const NEW_NODE_GLOW_MS = 5000; // glow duration in ms
    const now = Date.now();

    nodeSelection
      .merge(nodeEnter)
      .attr("r", d => nodeRadius(d))
      .attr("fill", d => nodeColor(d))
      .attr("stroke", d => nodeColor(d))
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.4)
      .attr("class", d => d.isThreat ? "threat-pulse" : "")
      .attr("filter", d => (now - (d.firstSeen ?? now)) < NEW_NODE_GLOW_MS ? "url(#node-glow)" : null)
      .attr("opacity", d => (activeNodeIds.size > 0 && !activeNodeIds.has(d.id) ? 0.2 : 1));

    nodeSelection.exit().remove();
    nodeSelectionRef.current = nodeSelection.merge(nodeEnter);

    // ── Labels ──────────────────────────────────────────────────
    const labelSelection = svg
      .select<SVGGElement>("g > g:nth-of-type(5)")
      .selectAll<SVGTextElement, Node>("text")
      .data(nodes, d => d.id);

    const labelEnter = labelSelection
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("font-family", "'JetBrains Mono', monospace")
      .attr("fill", "rgba(255,255,255,0.75)")
      .attr("pointer-events", "none");

    labelSelection
      .merge(labelEnter)
      .text("")   // No permanent labels — all info shown only on hover
      .attr("fill", d =>
        d.isThreat ? NODE_COLORS.threat :
        d.isInternal ? NODE_COLORS.internal :
        NODE_COLORS.external
      );

    labelSelection.exit().remove();
    labelSelectionRef.current = labelSelection.merge(labelEnter);

  }, [nodes, filteredLinks, protocolSummaryByNode, activeNodeIds, dimensions]);

  useEffect(() => {
    const update = () => {
      const sorted = [...linksRef.current].sort((a, b) => b.bytes - a.bytes).slice(0, 5);
      setTopConnections(sorted);
    };
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  const tooltipStyle = useMemo(() => {
    if (!hovered) return { left: 0, top: 0 };
    const maxLeft = Math.max(0, dimensions.width - 240);
    const maxTop = Math.max(0, dimensions.height - 140);
    return {
      left: Math.min(maxLeft, hovered.x + 16),
      top: Math.min(maxTop, hovered.y + 16),
    };
  }, [hovered, dimensions]);

  const handleResetLayout = () => {
    simulationRef.current?.alpha(1).restart();
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div className="relative w-full h-full">
      <style>{`
        @keyframes threat-pulse {
          0%, 100% { opacity: 1; r: 16; }
          50%       { opacity: 0.5; r: 20; }
        }
        .threat-pulse {
          animation: threat-pulse 1.5s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src={VIDEOS.FEAT_03} opacity={0.06} />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col">
        <div className="px-6 py-4 border-b border-graphite/40">
          <h1 className="display text-3xl text-white">COMMUNICATION GRAPH</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-silver">
            <span className="flex items-center gap-2">
              <span className="dot dot-lime" />
              Force-directed visualization of network traffic patterns
            </span>
            {backendOffline && <span className="badge badge-warn text-[10px]">SIMULATED</span>}
          </div>
        </div>

        <div className="px-6 py-3 border-b border-graphite/40 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="micro text-ghost">PROTOCOL</span>
            <div className="flex items-center gap-1.5">
              {PROTOCOL_FILTERS.map(filter => (
                <button
                  key={filter}
                  onClick={() => setProtocolFilter(filter)}
                  className={`badge ${protocolFilter === filter ? "badge-lime" : "badge-neutral"}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="micro text-ghost">THREAT</span>
            <div className="flex items-center gap-1.5">
              {THREAT_FILTERS.map(filter => (
                <button
                  key={filter}
                  onClick={() => setThreatFilter(filter)}
                  className={`badge ${threatFilter === filter ? "badge-lime" : "badge-neutral"}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleResetLayout} className="btn btn-secondary !text-xs">
            RESET LAYOUT
          </button>
        </div>

        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          <div className="flex-1 ps-card !p-0 overflow-hidden relative" ref={containerRef}>
            <svg ref={svgRef} className="w-full h-full" style={{ background: "rgba(8, 8, 8, 0.8)" }} />
            {hovered && (
              <div
                className="absolute bg-obsidian border border-graphite rounded-md px-3 py-2 text-xs text-silver pointer-events-none"
                style={tooltipStyle}
              >
                <div className="mono text-white text-[11px] font-bold mb-1">{hovered.node.hostname}</div>
                <div className="mono text-[10px] text-ghost">IP: {hovered.node.id}</div>
                <div className="mono text-[10px] text-ghost">Type: {hovered.node.isThreat ? "⚠ Threat" : hovered.node.isInternal ? "🟢 Local" : "🔴 External"}</div>
                <div className="mono text-[10px] text-ghost">Packets: {hovered.node.packetCount.toLocaleString()}</div>
                <div className="mono text-[10px] text-ghost">
                  Bytes: {hovered.node.totalBytes > 1_000_000
                    ? (hovered.node.totalBytes/1_000_000).toFixed(1)+" MB"
                    : (hovered.node.totalBytes/1_000).toFixed(0)+" KB"}
                </div>
                {hovered.protocols && (
                  <div className="mono text-[10px] text-ghost">Top: {hovered.protocols}</div>
                )}
              </div>
            )}
          </div>

          <div className="w-72 flex flex-col gap-4">
            {selectedNode && (
              <div className="ps-card">
                <div className="mb-4">
                  <div className="micro text-ghost mb-1">SELECTED NODE</div>
                  <h3 className="display text-xl text-white">{selectedNode.hostname}</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="mono text-[10px] text-ghost">IP Address</div>
                    <div className="mono text-[11px] text-white">{selectedNode.id}</div>
                  </div>
                  <div>
                    <div className="mono text-[10px] text-ghost">Type</div>
                    <div className="mono text-[11px] text-white capitalize">
                      {selectedNode.isThreat ? "Threat" : selectedNode.isInternal ? "Internal" : "External"}
                    </div>
                  </div>
                  <div>
                    <div className="mono text-[10px] text-ghost">Threat Status</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-carbon rounded overflow-hidden">
                        <div
                          className={`h-full ${selectedNode.isThreat ? "bg-threat" : "bg-lime"}`}
                          style={{ width: `${selectedNode.isThreat ? 100 : 10}%` }}
                        />
                      </div>
                      <span className="mono text-[11px] text-white">{threatLabel(selectedNode.isThreat)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="mono text-[10px] text-ghost">Packet Count</div>
                    <div className="mono text-[11px] text-white">{selectedNode.packetCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="mono text-[10px] text-ghost">Total Bytes</div>
                    <div className="mono text-[11px] text-white">
                      {selectedNode.totalBytes > 1_000_000 
                        ? (selectedNode.totalBytes/1_000_000).toFixed(1)+" MB" 
                        : (selectedNode.totalBytes/1_000).toFixed(0)+" KB"}
                    </div>
                  </div>
                </div>

                <button onClick={() => setSelectedNodeId(null)} className="w-full btn btn-secondary !text-xs mt-4">
                  DESELECT
                </button>
              </div>
            )}

            <div className="ps-card">
              <div className="micro text-ghost mb-3">TOP CONNECTIONS</div>
              <div className="space-y-3">
                {topConnections.map(link => (
                  <div key={getLinkUid(link)} className="border-b border-graphite/40 pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="mono text-[11px] text-white">
                        {getNodeId(link.source)}
                      </div>
                      <span
                        className={`badge ${link.isThreat ? "badge-threat" : "badge-neutral"}`}
                      >
                        TCP
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-ghost mt-1">
                      <span className="mono">-&gt; {getNodeId(link.target)}</span>
                      <span className="mono">{link.bytes > 1_000_000 ? (link.bytes/1_000_000).toFixed(1)+" MB" : (link.bytes/1_000).toFixed(0)+" KB"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
