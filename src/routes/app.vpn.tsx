import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ps/Shell";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { MOCK_VPN } from "@/lib/mockData";
import { useState } from "react";
import { X, Eye, ShieldAlert, Wifi, Globe } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export const Route = createFileRoute("/app/vpn")({ component: VPN });

function VPN() {
  const [inspecting, setInspecting] = useState<number | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const inspected = inspecting !== null ? MOCK_VPN[inspecting] : null;

  // Mock entropy data
  const entropyData = Array.from({ length: 30 }, (_, i) => ({
    t: i, entropy: 7.2 + Math.random() * 0.6, normal: 4.5 + Math.random() * 1.0,
  }));

  return (
    <div className="relative">
      {/* Hero */}
      <div className="ps-card !p-8 mb-6 relative overflow-hidden">
        <VideoBackground src="https://drive.google.com/uc?export=download&id=151PvK2UrU5GJ8L3M6spLu4ImhUd_HrzM" opacity={0.12} />
        <div className="relative z-10">
          <h1 className="display text-[64px] text-white leading-none">VPN DETECTION ENGINE</h1>
          <p className="text-silver mt-2">Port fingerprinting · Protocol heuristics · Traffic pattern analysis</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="VPN Detections" value="8" color="lime" />
        <StatCard label="Tor Exits" value="2" color="threat" />
        <StatCard label="Proxies" value="4" />
      </div>

      {/* Detection methods */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: Wifi, title: "Port Fingerprinting", desc: "OpenVPN UDP 1194, WireGuard UDP 51820, PPTP TCP 1723", tag: "Layer 4" },
          { icon: ShieldAlert, title: "Protocol Heuristics", desc: "WireGuard handshake patterns, OpenVPN TLS wrapping, SOCKS5 negotiation", tag: "Layer 7" },
          { icon: Globe, title: "Traffic Pattern Analysis", desc: "High entropy payloads, constant bitrate, ASN reputation, DNS-IP mismatches", tag: "Behavioral" },
        ].map(m => (
          <div key={m.title} className="ps-card">
            <m.icon size={24} className="text-lime mb-3" />
            <h3 className="text-white font-semibold mb-2">{m.title}</h3>
            <p className="text-sm text-silver">{m.desc}</p>
            <div className="mt-3 mono text-[10px] text-ghost">[ {m.tag} ]</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="ps-card !p-0 mb-6">
        <table className="ps-table">
          <thead>
            <tr><th>Device</th><th>Type</th><th>Method</th><th>Confidence</th><th>Protocol</th><th>First Detected</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {MOCK_VPN.map((v, i) => (
              <tr key={v.ip} className="cursor-pointer hover:bg-charcoal" onClick={() => setInspecting(i)}
                style={{ boxShadow: `inset 3px 0 0 ${v.type === "Tor" ? "#ef4444" : "#eab308"}` }}>
                <td className="text-white">{v.ip}</td>
                <td><span className={`badge ${v.type === "Tor" ? "badge-threat" : "badge-warn"}`}>{v.type}</span></td>
                <td className="text-silver">{v.method}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-carbon rounded">
                      <div className="h-full rounded" style={{ width: `${v.confidence}%`, background: v.confidence > 90 ? "#a3ff12" : "#eab308" }} />
                    </div>
                    <span className="mono text-xs">{v.confidence}%</span>
                  </div>
                </td>
                <td className="mono">{v.protocol}</td>
                <td>{v.firstDetected}</td>
                <td><span className={`badge ${v.status === "CONFIRMED" ? "badge-threat" : "badge-warn"}`}>{v.status}</span></td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn-secondary !text-xs !py-1 !px-2" onClick={(e) => { e.stopPropagation(); setInspecting(i); }}><Eye size={12} /></button>
                    <button
                      className={`btn !text-xs !py-1 !px-2 ${watchlist.includes(v.ip) ? "btn-primary" : "btn-secondary"}`}
                      onClick={(e) => { e.stopPropagation(); setWatchlist(w => w.includes(v.ip) ? w.filter(x => x !== v.ip) : [...w, v.ip]); }}
                    >
                      {watchlist.includes(v.ip) ? "✓ Watched" : "+ Watch"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-over */}
      <div className="fixed top-0 right-0 bottom-0 z-50 flex transition-transform duration-250"
        style={{ width: "40vw", minWidth: 480, transform: inspected ? "translateX(0)" : "translateX(100%)" }}>
        <div className="flex-1 bg-obsidian border-l border-graphite overflow-y-auto p-6">
          {inspected && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="display text-2xl text-white">{inspected.type} — {inspected.ip}</h2>
                <button onClick={() => setInspecting(null)} className="btn btn-ghost"><X size={20} /></button>
              </div>

              <div className="ps-card mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="micro">IP Address</div><div className="mono text-sm text-white">{inspected.ip}</div></div>
                  <div><div className="micro">Protocol</div><div className="mono text-sm text-white">{inspected.protocol}</div></div>
                  <div><div className="micro">ASN</div><div className="mono text-sm text-white">{inspected.asn}</div></div>
                  <div><div className="micro">Country</div><div className="mono text-sm text-white">{inspected.country}</div></div>
                  <div><div className="micro">Confidence</div><div className="mono text-sm text-lime">{inspected.confidence}%</div></div>
                  <div><div className="micro">Evidence</div><div className="mono text-sm text-silver">{inspected.evidence}</div></div>
                </div>
              </div>

              <div className="ps-card mb-4">
                <h3 className="display text-lg mb-3">TRAFFIC ENTROPY</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={entropyData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="t" stroke="#4a5568" fontSize={10} fontFamily="JetBrains Mono" />
                    <YAxis stroke="#4a5568" fontSize={10} fontFamily="JetBrains Mono" domain={[0, 8]} />
                    <Tooltip contentStyle={{ background: "#080808", border: "1px solid #222", fontFamily: "JetBrains Mono", fontSize: 11 }} />
                    <Bar dataKey="entropy" fill="#ef4444" opacity={0.7} />
                    <Bar dataKey="normal" fill="#a3ff12" opacity={0.3} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mono text-[10px] text-ghost mt-2">High entropy (red) indicates encrypted/VPN traffic. Normal traffic (green) for comparison.</div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setWatchlist(w => [...w, inspected.ip]); }} className="btn btn-primary">ADD TO WATCHLIST</button>
                <button className="btn btn-secondary">Export Evidence</button>
              </div>
            </>
          )}
        </div>
      </div>
      {inspecting !== null && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setInspecting(null)} />}
    </div>
  );
}
