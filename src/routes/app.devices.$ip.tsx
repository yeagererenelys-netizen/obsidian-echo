import { createFileRoute, Link } from "@tanstack/react-router";
import { StatCard } from "@/components/ps/Layout";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { VIDEOS } from "@/config/videoConfig";
import { formatBytes } from "@/lib/mockData";
import { useDeviceProfiles } from "@/hooks/useDeviceProfiles";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Download, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/app/devices/$ip")({ component: DeviceDetail });

function DeviceDetail() {
  const { ip } = Route.useParams();
  const { profiles } = useDeviceProfiles();
  const selectedDevice = profiles.find(d => d.ip === ip) ?? null;

  const COLORS = ["#3b82f6", "#a3ff12", "#eab308", "#ef4444", "#a0aec0"];

  // External destinations
  const destinations = [
    { ip: "142.250.80.100", asn: "AS15169 Google", country: "🇺🇸", bytes: 42000000, firstSeen: "08:12", lastSeen: "now", threat: false },
    { ip: "167.88.162.34", asn: "AS??? Unknown", country: "🇺🇸", bytes: 8920000, firstSeen: "11:55", lastSeen: "now", threat: true },
    { ip: "185.220.101.45", asn: "AS60729 Tor", country: "🇩🇪", bytes: 847000000, firstSeen: "10:30", lastSeen: "now", threat: true },
    { ip: "104.16.123.96", asn: "AS13335 Cloudflare", country: "🇺🇸", bytes: 18000000, firstSeen: "08:15", lastSeen: "now", threat: false },
    { ip: "151.101.1.140", asn: "AS54113 Fastly", country: "🇺🇸", bytes: 12000000, firstSeen: "09:00", lastSeen: "14:20", threat: false },
  ];

  // Anomalies
  const anomalies = device.anomaly > 60 ? [
    { sev: "critical", time: "12:42:18", desc: "Beaconing pattern detected — 30s intervals to 167.88.162.34" },
    { sev: "warn", time: "12:38:11", desc: "Suspicious DNS query to update.verysuspicious-domain.cc" },
    { sev: "warn", time: "11:55:02", desc: "Unusual outbound volume spike — 3x baseline" },
  ] : [
    { sev: "info", time: "14:00:00", desc: "Normal traffic patterns — within baseline" },
  ];

  const exportReport = () => {
    const report = JSON.stringify({ selectedDevice, destinations, anomalies }, null, 2);
    const blob = new Blob([report], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `device-report-${ip}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src={VIDEOS.BG_02} opacity={0.05} />
      </div>
      <div className="relative z-10">
        <Link to="/app/devices" className="text-xs text-ghost hover:text-lime flex items-center gap-1 mb-4">
          <ArrowLeft size={12} /> All devices
        </Link>

        {/* Hero */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="micro">DEVICE PROFILE</div>
            <h1 className="display text-[60px] text-white leading-none">{ip}</h1>
            <div className="text-sm text-silver mt-1">{selectedDevice?.hostname}</div>
            <div className="mono text-xs text-ghost mt-1">Last seen: {selectedDevice ? new Date(selectedDevice.lastSeen).toLocaleTimeString() : "-"}</div>
          </div>
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 100 100" width={120} height={120}>
              <circle cx={50} cy={50} r={42} fill="none" stroke="#222" strokeWidth={6} />
              <circle cx={50} cy={50} r={42} fill="none"
                stroke={!selectedDevice ? "#222" : selectedDevice.anomalyScore >= 85 ? "#ef4444" : selectedDevice.anomalyScore >= 65 ? "#eab308" : "#a3ff12"}
                strokeWidth={6}
                strokeDasharray={`${((selectedDevice?.anomalyScore ?? 0) / 100) * 264} 264`}
                transform="rotate(-90 50 50)"
                style={{ transition: "stroke-dasharray 1s" }}
              />
            </svg>
            <div className="display text-[32px] -mt-20" style={{ color: !selectedDevice ? "#222" : selectedDevice.anomalyScore >= 85 ? "#ef4444" : selectedDevice.anomalyScore >= 65 ? "#eab308" : "#a3ff12" }}>
              {selectedDevice?.anomalyScore ?? 0}
            </div>
            <div className="micro mt-12">ANOMALY SCORE</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Packets" value={selectedDevice?.totalPackets.toLocaleString() ?? "0"} />
          <StatCard label="Total Bytes Out" value={formatBytes(selectedDevice?.totalBytesOut ?? 0)} color="lime" hero />
          <StatCard label="Total Bytes In" value={formatBytes(selectedDevice?.totalBytesIn ?? 0)} />
          <StatCard label="Current Rate" value={`${formatBytes(selectedDevice?.bytesPerSecond ?? 0)}/s`} />
        </div>

        {/* Traffic timeline */}
        <div className="ps-card mb-6">
          <h3 className="display text-xl mb-4">TRAFFIC TIMELINE — LAST HOUR</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={selectedDevice?.timeline ?? []}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="time" stroke="#4a5568" fontSize={10} fontFamily="JetBrains Mono" />
              <YAxis stroke="#4a5568" fontSize={10} fontFamily="JetBrains Mono" />
              <Tooltip contentStyle={{ background: "#080808", border: "1px solid #222", fontFamily: "JetBrains Mono", fontSize: 11 }} />
              <Area isAnimationActive={false} type="monotone" dataKey="baseline" stroke="#444" strokeDasharray="4 4" fill="none" />
              <Area isAnimationActive={false} type="monotone" dataKey="bytesOut" stroke="#a3ff12" fill="rgba(163,255,18,0.1)" strokeWidth={1.5} />
              <Area isAnimationActive={false} type="monotone" dataKey="bytesIn" stroke="#3b82f6" fill="rgba(59,130,246,0.1)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          {/* Protocol donut */}
          <div className="col-span-4 ps-card">
            <h3 className="display text-xl mb-4">PROTOCOL DISTRIBUTION</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={selectedDevice?.protocols ?? []} dataKey="percent" nameKey="protocol" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {(selectedDevice?.protocols ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#080808", border: "1px solid #222", fontFamily: "JetBrains Mono", fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center">
              {(selectedDevice?.protocols ?? []).map((p, i) => (
                <span key={p.protocol} className="mono text-[10px]" style={{ color: COLORS[i % COLORS.length] }}>● {p.protocol} {p.percent}%</span>
              ))}
            </div>
          </div>

          {/* External destinations */}
          <div className="col-span-8 ps-card !p-0">
            <div className="p-4 border-b border-graphite">
              <h3 className="display text-xl">TOP EXTERNAL DESTINATIONS</h3>
            </div>
            <table className="ps-table">
              <thead><tr><th>IP</th><th>ASN</th><th>Country</th><th>Bytes</th><th>First</th><th>Last</th><th>Threat</th></tr></thead>
              <tbody>
                {destinations.map(d => (
                  <tr key={d.ip} style={d.threat ? { boxShadow: "inset 2px 0 0 #ef4444" } : undefined}>
                    <td className="text-white">{d.ip}</td>
                    <td>{d.asn}</td>
                    <td>{d.country}</td>
                    <td>{formatBytes(d.bytes)}</td>
                    <td>{d.firstSeen}</td>
                    <td>{d.lastSeen}</td>
                    <td>{d.threat ? <span className="badge badge-threat">THREAT</span> : <span className="badge badge-safe">CLEAN</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Anomalies */}
        <div className="ps-card mb-6">
          <h3 className="display text-xl mb-4">BEHAVIORAL ANOMALIES</h3>
          <div className="space-y-2">
            {anomalies.map((a, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded border-l-2 ${a.sev === "critical" ? "border-threat bg-threat-dim/30" : a.sev === "warn" ? "border-warn bg-warn-dim/20" : "border-safe bg-safe-dim/20"}`}>
                <span className={`dot ${a.sev === "critical" ? "dot-threat" : a.sev === "warn" ? "dot-warn" : "dot-safe"}`} />
                <div className="flex-1">
                  <div className="text-sm text-white">{a.desc}</div>
                  <div className="mono text-[10px] text-ghost mt-1">{a.time}</div>
                </div>
                <button className="btn btn-secondary !text-xs">Inspect</button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={exportReport} className="btn btn-primary">
          <Download size={14} /> Export Device Report
        </button>
      </div>
    </div>
  );
}
