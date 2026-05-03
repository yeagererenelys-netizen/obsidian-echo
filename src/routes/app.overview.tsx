import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ps/Shell";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { MOCK_ALERTS, MOCK_DEVICES } from "@/lib/mockData";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Plus, Download } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/overview")({ component: Overview });

const traffic = Array.from({ length: 30 }, (_, i) => ({
  t: i, in: 120 + Math.sin(i / 2) * 40 + Math.random() * 30, out: 80 + Math.cos(i / 3) * 30 + Math.random() * 20
}));

const talkers = MOCK_DEVICES.slice(0, 5).map(d => ({
  ip: d.ip, name: d.name, val: Math.floor((d.totalBytes / 2_140_000_000) * 100),
}));

function Overview() {
  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src="/videos/hero/HERO_02_anim_web.mp4" opacity={0.06} />
      </div>
      <div className="relative z-10">
        <PageHeader
          title="OVERVIEW"
          subtitle={<><span className="dot dot-lime" /> Network status · Updated live</>}
          actions={<>
            <Link to="/app/capture" className="btn btn-primary"><Plus size={14} /> Start Capture</Link>
            <button className="btn btn-secondary"><Download size={14} /> Export Report</button>
          </>}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Active Sessions" value="1,847" trend="↑ 12% vs 1h" />
          <StatCard label="Throughput" value="284" trend="MB/s · ↑ 8%" color="lime" hero />
          <StatCard label="Active Threats" value="12" color="threat" trend="↑ 3 new in 1h" />
          <StatCard label="Devices Online" value={String(MOCK_DEVICES.length)} trend="↑ 1 new" />
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
              <LineChart data={traffic}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="t" stroke="#4a5568" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="#4a5568" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={{ background: "#080808", border: "1px solid #222", fontFamily: "JetBrains Mono", fontSize: 11 }} />
                <Line type="monotone" dataKey="in" stroke="#a3ff12" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="out" stroke="#fff" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex h-2 mt-4 rounded-sm overflow-hidden">
              <div className="bg-lime" style={{ width: "42%" }} />
              <div className="bg-white" style={{ width: "30%" }} />
              <div className="bg-warn" style={{ width: "20%" }} />
              <div className="bg-threat" style={{ width: "8%" }} />
            </div>
            <div className="flex justify-between mt-2 mono text-[10px] text-ghost">
              <span>HTTP 42%</span><span>HTTPS 30%</span><span>DNS 20%</span><span>SUSPICIOUS 8%</span>
            </div>
          </div>

          <div className="ps-card">
            <h3 className="display text-xl mb-4">TOP TALKERS</h3>
            <div className="space-y-3">
              {talkers.map(t => (
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
              ))}
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
