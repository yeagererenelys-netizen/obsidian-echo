import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ps/Shell";
import { useState } from "react";

export const Route = createFileRoute("/app/alerts")({ component: Alerts });

const alerts = [
  { id:1, sev:"critical", title:"C2 Beacon Suspected", src:"192.168.1.45", dst:"167.88.162.34", t:"12:42:18", desc:"Inter-arrival regularity 0.97 — extremely periodic.", evidence:"30.0s ± 0.2s for 247 packets" },
  { id:2, sev:"critical", title:"Tor Exit Node Connection", src:"192.168.1.234", dst:"185.220.101.45", t:"12:39:55", desc:"Connection to known Tor exit node.", evidence:"ASN 60729 — Zwiebelfreunde e.V." },
  { id:3, sev:"warn", title:"VPN Traffic (OpenVPN)", src:"192.168.1.89", dst:"UDP 1194", t:"12:41:02", desc:"OpenVPN handshake detected.", evidence:"TLS-style handshake on UDP 1194" },
  { id:4, sev:"warn", title:"Suspicious Domain Lookup", src:"192.168.1.42", dst:"update.verysuspicious-domain.cc", t:"12:38:11", desc:"Lookup of low-reputation .cc domain.", evidence:"DGA-style hostname pattern" },
  { id:5, sev:"critical", title:"Port Scan Detected", src:"192.168.1.200", dst:"192.168.1.105", t:"12:36:40", desc:"847 distinct ports probed in 2 minutes.", evidence:"SYN-scan signature" },
];

function Alerts() {
  const [sel, setSel] = useState(0);
  const a = alerts[sel];
  return (
    <div>
      <PageHeader title="ALERTS & TRIAGE" subtitle={<><span className="dot dot-threat" /> 3 critical · 2 warn — last 1h</>} />
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Critical" value="3" color="threat" />
        <StatCard label="Warn" value="8" />
        <StatCard label="Resolved 24h" value="42" color="lime" />
        <StatCard label="MTTR" value="4m" />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-2">
          {alerts.map((al, i) => (
            <div key={al.id} onClick={() => setSel(i)} className={`ps-card cursor-pointer ${i===sel?"!border-lime":""}`}
              style={{ borderLeft: `3px solid ${al.sev==="critical"?"#ef4444":"#eab308"}`, background: al.sev==="critical"?"rgba(239,68,68,0.04)":"" }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-white font-medium">{al.title}</div>
                  <div className="mono text-[11px] text-ghost mt-1">{al.src} → {al.dst}</div>
                </div>
                <span className="mono text-[10px] text-ghost">{al.t}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-7 ps-card">
          <div className="flex items-center justify-between mb-3">
            <span className={`badge ${a.sev==="critical"?"badge-threat":"badge-warn"}`}>{a.sev}</span>
            <span className="mono text-xs text-ghost">{a.t}</span>
          </div>
          <h2 className="display text-3xl text-white">{a.title}</h2>
          <p className="text-sm text-silver mt-2">{a.desc}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div><div className="micro">Source</div><div className="mono text-sm text-white">{a.src}</div></div>
            <div><div className="micro">Destination</div><div className="mono text-sm text-white">{a.dst}</div></div>
          </div>
          <div className="mt-6">
            <div className="micro mb-2">Evidence</div>
            <div className="ps-card !p-3" style={{ background: "#000" }}>
              <div className="mono text-xs text-lime mb-3">{a.evidence}</div>
              <svg viewBox="0 0 400 80" className="w-full h-20">
                {Array.from({ length: 30 }).map((_, i) => (
                  <line key={i} x1={i*13+5} y1={70} x2={i*13+5} y2={20 + (i*7)%20} stroke="#a3ff12" strokeWidth={2} />
                ))}
              </svg>
              <div className="display text-3xl text-lime mt-2">0.97 / 1.00</div>
              <div className="mono text-[10px] text-threat mt-1">EXTREMELY REGULAR — C2 BEACON SUSPECTED</div>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button className="btn btn-primary">Export Evidence Package</button>
            <button className="btn btn-secondary">Mark Resolved</button>
            <button className="btn btn-secondary">Block Device</button>
          </div>
        </div>
      </div>
    </div>
  );
}
