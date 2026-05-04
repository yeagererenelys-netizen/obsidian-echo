import { createFileRoute } from "@tanstack/react-router";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { VIDEOS } from "@/config/videoConfig";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { MOCK_GRAPH_NODES, MOCK_GRAPH_EDGES } from "@/lib/mockData";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WS } from "@/config/apiConfig";

export const Route = createFileRoute("/app/graph")({ component: CommunicationGraph });

type Node = {
  id: string;
  label: string;
  type: string;
  threatLevel: number;
  packetCount: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
};

type Link = {
  source: string | Node;
  target: string | Node;
  volume: number;
  protocol: string;
  threatLevel: number;
  active: boolean;
};

type GraphLink = Link & {
  uid: string;
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
  router: "#ffffff",
  internal: "#a3ff12",
  external: "#3b82f6",
  threat: "#ef4444",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const edgeWidth = (volume: number) => clamp(Math.log(volume + 1) * 2, 1, 8);
const nodeRadius = (packetCount: number) => clamp(Math.sqrt(packetCount) * 0.8, 8, 40);

const getNodeId = (value: string | Node) => (typeof value === "string" ? value : value.id);
const getLinkUid = (link: Link) => `${getNodeId(link.source)}->${getNodeId(link.target)}:${link.protocol}`;

const matchesProtocol = (protocol: string, filter: ProtocolFilter) => {
  if (filter === "ALL") return true;
  if (filter === "HTTP") return protocol === "HTTP" || protocol === "HTTPS";
  return protocol === filter;
};

const matchesThreat = (level: number, filter: ThreatFilter) => {
  if (filter === "ALL") return true;
  if (filter === "CLEAN") return level === 0;
  if (filter === "SUSPICIOUS") return level === 1;
  return level >= 2;
};

const threatLabel = (level: number) => {
  if (level >= 2) return "THREAT";
  if (level === 1) return "SUSPICIOUS";
  return "CLEAN";
};

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const buildMockGraph = () => {
  const nodes = MOCK_GRAPH_NODES.slice(0, 20);
  const nodeIds = nodes.map(n => n.id);
  const nodeSet = new Set(nodeIds);
  const edges = MOCK_GRAPH_EDGES.filter(edge => nodeSet.has(getNodeId(edge.source)) && nodeSet.has(getNodeId(edge.target)));
  const edgeKeys = new Set(edges.map(getLinkUid));
  const protocols = ["TCP", "UDP", "DNS", "HTTP", "HTTPS", "TLS"];

  while (edges.length < 35) {
    const source = pick(nodeIds);
    const target = pick(nodeIds);
    if (source === target) continue;
    const protocol = pick(protocols);
    const threatLevel = Math.random() > 0.88 ? 2 : Math.random() > 0.7 ? 1 : 0;
    const candidate: Link = {
      source,
      target,
      volume: 800 + Math.floor(Math.random() * 50000),
      protocol,
      threatLevel,
      active: Math.random() > 0.45,
    };
    const key = getLinkUid(candidate);
    if (edgeKeys.has(key)) continue;
    edgeKeys.add(key);
    edges.push(candidate);
  }

  return { nodes, edges };
};

const evolveMockLinks = (prev: Link[], nodeIds: string[]) => {
  const protocols = ["TCP", "UDP", "DNS", "HTTP", "HTTPS", "TLS"];
  const updated = prev.map(link => ({
    ...link,
    volume: Math.max(300, Math.round(link.volume * (0.65 + Math.random() * 0.9))),
    active: Math.random() > 0.35,
  }));

  const edgeKeys = new Set(updated.map(getLinkUid));
  const addCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < addCount; i += 1) {
    const source = pick(nodeIds);
    const target = pick(nodeIds);
    if (source === target) continue;
    const protocol = pick(protocols);
    const threatLevel = Math.random() > 0.88 ? 2 : Math.random() > 0.7 ? 1 : 0;
    const candidate: Link = {
      source,
      target,
      volume: 900 + Math.floor(Math.random() * 60000),
      protocol,
      threatLevel,
      active: Math.random() > 0.35,
    };
    const key = getLinkUid(candidate);
    if (edgeKeys.has(key)) continue;
    edgeKeys.add(key);
    updated.push(candidate);
  }

  return updated.slice(-35);
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
  const linksRef = useRef<Link[]>(MOCK_GRAPH_EDGES);
  const nodesRef = useRef<Node[]>(MOCK_GRAPH_NODES);
  const timerRef = useRef<d3.Timer | null>(null);
  const mockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [nodes, setNodes] = useState<Node[]>(MOCK_GRAPH_NODES);
  const [links, setLinks] = useState<Link[]>(MOCK_GRAPH_EDGES);
  const [backendOffline, setBackendOffline] = useState(false);
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
        bucket[link.protocol] = (bucket[link.protocol] || 0) + link.volume;
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
    () => normalizedLinks.filter(link => matchesProtocol(link.protocol, protocolFilter) && matchesThreat(link.threatLevel, threatFilter)),
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

  const startMockStream = useCallback(() => {
    setBackendOffline(true);
    const { nodes: mockNodes, edges: mockEdges } = buildMockGraph();
    setNodes(mockNodes);
    setLinks(mockEdges);

    if (mockIntervalRef.current) return;
    mockIntervalRef.current = setInterval(() => {
      setLinks(prev => evolveMockLinks(prev, mockNodes.map(n => n.id)));
    }, 3000);
  }, []);

  const stopMockStream = useCallback(() => {
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }
  }, []);

  const { connected } = useWebSocket(WS.GRAPH, (data: any) => {
    if (data.nodes) {
      setNodes(prev => {
        const existing = new Map(prev.map(n => [n.id, n]));
        return data.nodes.map((n: Node) => {
          const old = existing.get(n.id);
          if (old) {
            return { ...old, ...n, x: old.x, y: old.y, vx: old.vx, vy: old.vy };
          }
          return n;
        });
      });
      if (data.edges) setLinks(data.edges);
      setBackendOffline(false);
      stopMockStream();
    }
  });

  useEffect(() => {
    if (!connected) {
      startMockStream();
    }
    // We intentionally do not call stopMockStream here,
    // so the initial mock graph continues animating until real data arrives.
  }, [connected, startMockStream]);

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

    const linkGroup = svg.append("g");
    const trailGroup = svg.append("g");
    const pulseGroup = svg.append("g");
    const nodeGroup = svg.append("g");
    const labelGroup = svg.append("g");

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
        .attr("y", d => (d.y ?? 0) - 18);
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
            const speed = d.active ? 0.0006 : 0.00035;
            const t = (elapsed * speed + d.pulsePhase) % 1;
            return (source.x ?? 0) + ((target.x ?? 0) - (source.x ?? 0)) * t;
          })
          .attr("cy", d => {
            const source = d.source as Node;
            const target = d.target as Node;
            const speed = d.active ? 0.0006 : 0.00035;
            const t = (elapsed * speed + d.pulsePhase) % 1;
            return (source.y ?? 0) + ((target.y ?? 0) - (source.y ?? 0)) * t;
          })
          .attr("r", d => {
            if (!d.active) return 2.2;
            const phase = elapsed * 0.01 + d.pulsePhase * Math.PI * 2;
            return 3.5 + 1.5 * Math.sin(phase);
          })
          .attr("opacity", d => {
            if (!d.active) return 0.55;
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
        uid,
        dashOffset: meta.dashOffset,
        pulsePhase: meta.pulsePhase,
      };
    });

    const linkForce = simulationRef.current.force("link") as d3.ForceLink<Node, GraphLink>;
    simulationRef.current.nodes(nodes);
    linkForce.links(linkData);
    simulationRef.current.alpha(0.3).restart();

    const linkSelection = svg
      .select<SVGGElement>("g")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(linkData, d => d.uid);

    const linkEnter = linkSelection
      .enter()
      .append("line")
      .attr("stroke", d => EDGE_COLORS[Math.min(2, Math.max(0, d.threatLevel))])
      .attr("stroke-width", d => edgeWidth(d.volume))
      .attr("opacity", d => (d.active ? 0.85 : 0.4));

    linkSelection
      .merge(linkEnter)
      .attr("stroke", d => EDGE_COLORS[Math.min(2, Math.max(0, d.threatLevel))])
      .attr("stroke-width", d => edgeWidth(d.volume))
      .attr("opacity", d => (d.active ? 0.85 : 0.4));

    linkSelection.exit().remove();

    linkSelectionRef.current = linkSelection.merge(linkEnter);

    const trailSelection = svg
      .select<SVGGElement>("g:nth-of-type(2)")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(linkData, d => d.uid);

    const trailEnter = trailSelection
      .enter()
      .append("line")
      .attr("stroke", d => EDGE_COLORS[Math.min(2, Math.max(0, d.threatLevel))])
      .attr("stroke-width", 1.4)
      .attr("stroke-dasharray", "2 10")
      .attr("stroke-linecap", "round")
      .attr("opacity", d => (d.active ? 0.65 : 0.35));

    trailSelection
      .merge(trailEnter)
      .attr("stroke", d => EDGE_COLORS[Math.min(2, Math.max(0, d.threatLevel))])
      .attr("stroke-width", 1.4)
      .attr("stroke-dasharray", "2 10")
      .attr("opacity", d => (d.active ? 0.65 : 0.35));

    trailSelection.exit().remove();
    trailSelectionRef.current = trailSelection.merge(trailEnter);

    const pulseSelection = svg
      .select<SVGGElement>("g:nth-of-type(3)")
      .selectAll<SVGCircleElement, GraphLink>("circle")
      .data(linkData, d => d.uid);

    const pulseEnter = pulseSelection
      .enter()
      .append("circle")
      .attr("fill", d => EDGE_COLORS[Math.min(2, Math.max(0, d.threatLevel))])
      .attr("opacity", d => (d.active ? 0.9 : 0.55));

    pulseSelection
      .merge(pulseEnter)
      .attr("fill", d => EDGE_COLORS[Math.min(2, Math.max(0, d.threatLevel))]);

    pulseSelection.exit().remove();
    pulseSelectionRef.current = pulseSelection.merge(pulseEnter);

    const nodeSelection = svg
      .select<SVGGElement>("g:nth-of-type(4)")
      .selectAll<SVGCircleElement, Node>("circle")
      .data(nodes, d => d.id);

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
        d3.select(event.currentTarget).attr("r", nodeRadius(d.packetCount) * 1.3);
      })
      .on("mousemove", (event, d) => {
        const [x, y] = d3.pointer(event, svgRef.current);
        const protocols = protocolSummaryByNode.get(d.id) || "";
        setHovered({ node: d, x, y, protocols });
      })
      .on("mouseleave", (event, d) => {
        setHovered(null);
        d3.select(event.currentTarget).attr("r", nodeRadius(d.packetCount));
      })
      .on("click", (_, d) => setSelectedNodeId(d.id));

    nodeSelection
      .merge(nodeEnter)
      .attr("r", d => nodeRadius(d.packetCount))
      .attr("fill", d => NODE_COLORS[d.type] || "#a3ff12")
      .attr("opacity", d => (activeNodeIds.size > 0 && !activeNodeIds.has(d.id) ? 0.2 : 1));

    nodeSelection.exit().remove();
    nodeSelectionRef.current = nodeSelection.merge(nodeEnter);

    const labelSelection = svg
      .select<SVGGElement>("g:nth-of-type(5)")
      .selectAll<SVGTextElement, Node>("text")
      .data(nodes, d => d.id);

    const labelEnter = labelSelection
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("class", "mono text-[9px] text-white pointer-events-none");

    labelSelection
      .merge(labelEnter)
      .text(d => d.label)
      .attr("opacity", d => (activeNodeIds.size > 0 && !activeNodeIds.has(d.id) ? 0.2 : 1));

    labelSelection.exit().remove();
    labelSelectionRef.current = labelSelection.merge(labelEnter);
  }, [nodes, filteredLinks, protocolSummaryByNode, activeNodeIds, dimensions]);

  useEffect(() => {
    const update = () => {
      const sorted = [...linksRef.current].sort((a, b) => b.volume - a.volume).slice(0, 5);
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
  };

  return (
    <div className="relative w-full h-full">
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
                <div className="mono text-white text-[11px]">{hovered.node.id}</div>
                <div className="mono text-[10px] text-ghost">Packets: {hovered.node.packetCount.toLocaleString()}</div>
                <div className="mono text-[10px] text-ghost">Threat: {threatLabel(hovered.node.threatLevel)}</div>
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
                  <h3 className="display text-xl text-white">{selectedNode.label}</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="mono text-[10px] text-ghost">IP Address</div>
                    <div className="mono text-[11px] text-white">{selectedNode.id}</div>
                  </div>
                  <div>
                    <div className="mono text-[10px] text-ghost">Type</div>
                    <div className="mono text-[11px] text-white capitalize">{selectedNode.type}</div>
                  </div>
                  <div>
                    <div className="mono text-[10px] text-ghost">Threat Level</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-carbon rounded overflow-hidden">
                        <div
                          className={`h-full ${selectedNode.threatLevel >= 2 ? "bg-threat" : selectedNode.threatLevel === 1 ? "bg-warn" : "bg-lime"}`}
                          style={{ width: `${Math.min(100, Math.max(10, selectedNode.threatLevel * 50))}%` }}
                        />
                      </div>
                      <span className="mono text-[11px] text-white">{threatLabel(selectedNode.threatLevel)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="mono text-[10px] text-ghost">Packet Count</div>
                    <div className="mono text-[11px] text-white">{selectedNode.packetCount.toLocaleString()}</div>
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
                        className={`badge ${link.threatLevel >= 2 ? "badge-threat" : link.threatLevel === 1 ? "badge-warn" : "badge-neutral"}`}
                      >
                        {link.protocol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-ghost mt-1">
                      <span className="mono">-&gt; {getNodeId(link.target)}</span>
                      <span className="mono">{link.volume.toLocaleString()}</span>
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
