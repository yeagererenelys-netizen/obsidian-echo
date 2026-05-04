import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ps/Layout";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { VIDEOS } from "@/config/videoConfig";
import { MOCK_DEVICES, MOCK_ALERTS } from "@/lib/mockData";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Plus, Download } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { usePacketStream } from "@/hooks/usePacketStream";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/app/overview")({ component: Overview });

const traffic = Array.from({ length: 30 }, (_, i) => ({
  t: i, in: 120 + Math.sin(i / 2) * 40 + Math.random() * 30, out: 80 + Math.cos(i / 3) * 30 + Math.random() * 20
}));

const talkers = MOCK_DEVICES.slice(0, 5).map(d => ({
  ip: d.ip, name: d.name, val: Math.floor((d.totalBytes / 2_140_000_000) * 100),
}));

function formatBytes(b: number): string {
  if (b >= 1_000_000) return `${(b / 1_000_000).toFixed(1)} MB`;
  if (b >= 1_000) return `${(b / 1_000).toFixed(1)} KB`;
  return `${b} B`;
}

const PROTOCOL_COLORS: Record<string, string> = {
  TCP:   "#a3ff12",  // lime
  HTTPS: "#ffffff",  // white
  HTTP:  "#eab308",  // yellow
  DNS:   "#3b82f6",  // blue
  UDP:   "#a0aec0",  // silver
  ICMP:  "#ef4444",  // red
  OTHER: "#444444",  // ash
};

function Overview() {
  const { packetRate, totalPackets, isMockMode, isConnected, throughput, sessionCount, threatCount, deviceCount, lastPacket, subscribe } = usePacketStream();
  console.log("STREAM FROM OVERVIEW:", { packetRate, totalPackets, throughput, sessionCount, threatCount, deviceCount, lastPacket });

  interface TalkerEntry {
    ip: string;
    bytes: number;
    percent: number;
  }

  const [topTalkers, setTopTalkers] = useState<TalkerEntry[]>([]);
  const ipBytesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const unsub = subscribe((pkt) => {
      const srcCurrent = ipBytesRef.current.get(pkt.src_ip) ?? 0;
      ipBytesRef.current.set(pkt.src_ip, srcCurrent + pkt.bytes);

      const dstCurrent = ipBytesRef.current.get(pkt.dst_ip) ?? 0;
      ipBytesRef.current.set(pkt.dst_ip, dstCurrent + Math.floor(pkt.bytes * 0.3));
    });
    return unsub;
  }, [subscribe]);

  useEffect(() => {
    const interval = setInterval(() => {
      const map = ipBytesRef.current;
      if (map.size === 0) return;

      const sorted = Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const maxBytes = sorted[0]?.[1] ?? 1;

      const entries: TalkerEntry[] = sorted.map(([ip, bytes]) => ({
        ip,
        bytes,
        percent: Math.round((bytes / maxBytes) * 100),
      }));

      setTopTalkers(entries);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  interface ProtocolStat {
    protocol: string;
    count: number;
    percent: number;
  }

  const [protocolStats, setProtocolStats] = useState<ProtocolStat[]>([]);
  const protocolCounterRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const unsub = subscribe((pkt) => {
      const current = protocolCounterRef.current.get(pkt.protocol) ?? 0;
      protocolCounterRef.current.set(pkt.protocol, current + 1);
    });
    return unsub;
  }, [subscribe]);

  useEffect(() => {
    const interval = setInterval(() => {
      const map = protocolCounterRef.current;
      const total = Array.from(map.values()).reduce((sum, n) => sum + n, 0);

      if (total === 0) return;

      const stats: ProtocolStat[] = Array.from(map.entries())
        .map(([protocol, count]) => ({
          protocol,
          count,
          percent: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      setProtocolStats(stats);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  interface ChartPoint {
    time: string;
    bytes: number;
    packets: number;
  }

  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const chartBufferRef = useRef<ChartPoint[]>([]);
  const secondBytesRef = useRef(0);
  const secondPacketsRef = useRef(0);

  useEffect(() => {
    const unsub = subscribe((pkt) => {
      secondBytesRef.current += pkt.bytes;
      secondPacketsRef.current += 1;
    });
    return unsub;
  }, [subscribe]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const label = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const point: ChartPoint = {
        time: label,
        bytes: secondBytesRef.current,
        packets: secondPacketsRef.current,
      };

      secondBytesRef.current = 0;
      secondPacketsRef.current = 0;

      chartBufferRef.current = [...chartBufferRef.current, point].slice(-60);
      setChartData([...chartBufferRef.current]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src={VIDEOS.HERO_02} opacity={0.06} />
      </div>
      <div className="relative z-10">
        <PageHeader
          title="OVERVIEW"
          subtitle={<><span className="dot dot-lime" /> Network status · {isMockMode ? "SIMULATED" : isConnected ? "LIVE" : "DISCONNECTED"}</>}
          actions={<>
            <Link to="/app/capture" className="btn btn-primary"><Plus size={14} /> Start Capture</Link>
            <button className="btn btn-secondary"><Download size={14} /> Export Report</button>
          </>}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Active Sessions" value={String(sessionCount)} trend="↑ 12% vs 1h" />
          <StatCard label="Throughput" value={throughput > 1_000_000
            ? `${(throughput / 1_000_000).toFixed(1)} MB/s`
            : throughput > 1_000
            ? `${(throughput / 1_000).toFixed(1)} KB/s`
            : `${throughput} B/s`} trend="MB/s · ↑ 8%" color="lime" hero />
          <StatCard label="Active Threats" value={String(threatCount)} color="threat" trend="↑ 3 new in 1h" />
          <StatCard label="Devices Online" value={String(deviceCount)} trend="↑ 1 new" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 ps-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="display text-xl">TRAFFIC VOLUME</h3>
              <div className="flex gap-1 text-xs">
                {["5m", "15m", "1h", "6h", "24h"].map((t, i) => (
                  <button key={t} className={`px-2 py-1 mono ${i === 2 ? "text-lime border-b border-lime" : "text-ghost"}`}>{t}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="time" stroke="#4a5568" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="#4a5568" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={{ background: "#080808", border: "1px solid #222", fontFamily: "JetBrains Mono", fontSize: 11 }} />
                <Line type="monotone" dataKey="bytes" stroke="#a3ff12" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="packets" stroke="#fff" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex h-2 mt-4 rounded-sm overflow-hidden">
              {protocolStats.length === 0 ? (
                <>
                  <div className="bg-lime" style={{ width: "42%" }} />
                  <div className="bg-white" style={{ width: "30%" }} />
                  <div className="bg-warn" style={{ width: "20%" }} />
                  <div className="bg-threat" style={{ width: "8%" }} />
                </>
              ) : (
                protocolStats.map((item) => (
                  <div key={item.protocol} style={{ width: `${item.percent}%`, backgroundColor: PROTOCOL_COLORS[item.protocol] || "#444444" }} />
                ))
              )}
            </div>
            <div className="flex justify-between mt-2 mono text-[10px] text-ghost">
              {protocolStats.length === 0 ? (
                <><span>HTTP 42%</span><span>HTTPS 30%</span><span>DNS 20%</span><span>SUSPICIOUS 8%</span></>
              ) : (
                protocolStats.map((item) => (
                  <span key={item.protocol}>{item.protocol} {item.percent}%</span>
                ))
              )}
            </div>
          </div>

          <div className="ps-card">
            <h3 className="display text-xl mb-4">TOP TALKERS</h3>
            <div className="space-y-3">
              {topTalkers.length === 0 ? (
                talkers.map(t => (
                  <div key={t.ip}>
                    <div className="flex justify-between mono text-xs mb-1">
                      <span className="text-white">{t.ip}</span>
                      <span className="text-ghost">{t.val}%</span>
                    </div>
                    <div className="text-[10px] text-ghost mb-1">{t.name}</div>
                    <div className="h-[3px] bg-carbon rounded-sm overflow-hidden">
                      <div className="h-full bg-lime" style={{ width: `${t.val}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                topTalkers.map(t => (
                  <div key={t.ip}>
                    <div className="flex justify-between mono text-xs mb-1">
                      <span className="text-white">{t.ip}</span>
                      <span className="text-ghost">{formatBytes(t.bytes)}</span>
                    </div>
                    <div className="text-[10px] text-ghost mb-1">LIVE NODE</div>
                    <div className="h-[3px] bg-carbon rounded-sm overflow-hidden">
                      <div className="h-full bg-lime" style={{ width: `${t.percent}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="ps-card relative overflow-hidden">
            <h3 className="display text-xl mb-4">LIVE ALERT FEED</h3>
            <div className="space-y-2">
              {MOCK_ALERTS.map((a, i) => (
                <Link to="/app/alerts" key={i} className={`flex items-start gap-3 p-2 rounded border-l-2 hover:bg-charcoal transition ${
                  a.sev === "critical" ? "border-threat bg-threat-dim/30" : "border-warn bg-warn-dim/20"
                }`}>
                  <span className={`dot ${a.sev === "critical" ? "dot-threat" : "dot-warn"} mt-1.5`} />
                  <div className="flex-1">
                    <div className="text-sm text-white">{a.title}</div>
                    <div className="mono text-[11px] text-ghost mt-0.5">{a.src} → {a.dst}</div>
                  </div>
                  <span className="mono text-[10px] text-ghost">{a.t}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="ps-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="display text-xl">COMM GRAPH</h3>
              <Link to="/app/graph" className="text-xs text-lime hover:underline">View Full Graph →</Link>
            </div>
            <svg viewBox="0 0 400 240" className="w-full h-[240px]">
              {Array.from({ length: 18 }).map((_, i) => {
                const x = 80 + (i % 6) * 50;
                const y = 50 + Math.floor(i / 6) * 60;
                return <line key={i} x1={200} y1={120} x2={x} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />;
              })}
              {Array.from({ length: 18 }).map((_, i) => {
                const x = 80 + (i % 6) * 50;
                const y = 50 + Math.floor(i / 6) * 60;
                const threat = i === 4 || i === 11;
                return <circle key={i} cx={x} cy={y} r={threat ? 5 : 3} fill={threat ? "#ef4444" : "#a0aec0"} />;
              })}
              <circle cx={200} cy={120} r={10} fill="#fff" />
              <circle cx={200} cy={120} r={14} fill="none" stroke="#a3ff12" strokeWidth={1} opacity={0.6} />
            </svg>
            <div className="mono text-xs text-ghost mt-2">{MOCK_DEVICES.length} nodes · 287 edges · 2 flagged</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="ps-card">
            <h3 className="display text-xl mb-4">GEOGRAPHIC</h3>
            <div className="mono text-xs space-y-2 text-silver">
              <div className="flex justify-between"><span>🇺🇸 United States</span><span className="text-lime">142</span></div>
              <div className="flex justify-between"><span>🇩🇪 Germany</span><span className="text-lime">38</span></div>
              <div className="flex justify-between"><span>🇨🇳 China</span><span className="text-warn">22</span></div>
              <div className="flex justify-between"><span>🇷🇺 Russia</span><span className="text-threat">7</span></div>
              <div className="flex justify-between"><span>🧅 Tor exits</span><span className="text-threat">3</span></div>
            </div>
          </div>
          <div className="ps-card ps-card-lime">
            <h3 className="display text-xl mb-2">BEACONING</h3>
            <div className="display text-[48px] text-lime leading-none">0.97</div>
            <div className="mono text-[10px] text-threat mt-2">192.168.1.45 → 167.88.162.34</div>
            <div className="mono text-[10px] text-ghost mt-1">Interval: 30.0s ± 0.2s</div>
            <Link to="/app/beaconing" className="btn btn-secondary !text-[11px] !py-1 mt-3">Investigate →</Link>
          </div>
          <div className="ps-card">
            <h3 className="display text-xl mb-4">VPN DETECTION</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between mono"><span className="text-white">192.168.1.89</span><span className="badge badge-warn">OpenVPN</span></div>
              <div className="flex justify-between mono"><span className="text-white">192.168.1.234</span><span className="badge badge-threat">Tor</span></div>
              <div className="flex justify-between mono"><span className="text-white">192.168.1.42</span><span className="badge badge-warn">SOCKS5</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
