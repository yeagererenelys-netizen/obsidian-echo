import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Layout";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { VIDEOS } from "@/config/videoConfig";
import { useState } from "react";

export const Route = createFileRoute("/app/protocols")({ component: Protocols });

const TABS = ["HTTP", "DNS", "TLS", "SMTP", "FTP", "ICMP", "ARP", "DHCP"];

function Protocols() {
  const [tab, setTab] = useState("HTTP");
  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src={VIDEOS.HERO_03} opacity={0.08} />
      </div>
      <div className="relative z-10">
        <PageHeader title="PROTOCOL INSPECTOR" subtitle="Deep parsed forensic records" />
        <div className="flex gap-1 border-b border-graphite mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 display text-base transition-all ${tab === t ? "text-lime border-b-2 border-lime" : "text-ghost hover:text-silver"}`}>{t}</button>
          ))}
        </div>
        {tab === "HTTP" && (
          <div className="ps-card !p-0">
            <table className="ps-table">
              <thead><tr><th>Method</th><th>Host</th><th>Path</th><th>Status</th><th>Size</th><th>Time</th></tr></thead>
              <tbody>
                {[
                  { m: "GET", h: "api.example.com", p: "/v1/data", s: 200, sz: "4.2KB", t: "142ms" },
                  { m: "POST", h: "login.svc", p: "/auth", s: 200, sz: "1.1KB", t: "89ms" },
                  { m: "GET", h: "cdn.cloud.com", p: "/img/logo.png", s: 304, sz: "0KB", t: "22ms" },
                  { m: "DELETE", h: "api.example.com", p: "/admin/key", s: 404, sz: "180B", t: "31ms" },
                  { m: "POST", h: "167.88.162.34", p: "/beacon", s: 500, sz: "0KB", t: "5012ms" },
                ].map((r, i) => (
                  <tr key={i}>
                    <td><span className={`badge ${r.m === "GET" ? "badge-lime" : r.m === "POST" ? "badge-warn" : "badge-threat"}`}>{r.m}</span></td>
                    <td className="text-white">{r.h}</td>
                    <td>{r.p}</td>
                    <td className={`display text-xl text-right ${r.s < 300 ? "text-lime" : r.s < 400 ? "text-info" : r.s < 500 ? "text-warn" : "text-threat"}`}>{r.s}</td>
                    <td>{r.sz}</td>
                    <td>{r.t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === "DNS" && (
          <div className="ps-card">
            <div className="micro mb-3">DNS Query Chain</div>
            <pre className="mono text-xs text-silver overflow-x-auto bg-charcoal p-4 rounded border border-graphite">{`  Client          Local DNS       Root NS         Auth NS
  192.168.1.45  → 192.168.1.1   → 198.41.0.4    → ns1.google.com
        query A google.com                  →→→→→ 142.250.80.100
                                                  TTL: 300s`}</pre>
          </div>
        )}
        {tab === "TLS" && (
          <div className="ps-card">
            <div className="micro mb-3">TLS Version Distribution</div>
            {[
              { v: "TLS 1.3", pct: 62, c: "bg-lime" },
              { v: "TLS 1.2", pct: 30, c: "bg-white" },
              { v: "TLS 1.1", pct: 6, c: "bg-warn" },
              { v: "SSL 3.0", pct: 2, c: "bg-threat" },
            ].map(r => (
              <div key={r.v} className="mb-3">
                <div className="flex justify-between mono text-xs mb-1"><span className="text-white">{r.v}</span><span className="text-ghost">{r.pct}%</span></div>
                <div className="h-2 bg-carbon rounded"><div className={`h-full ${r.c} rounded`} style={{ width: `${r.pct}%` }} /></div>
              </div>
            ))}
          </div>
        )}
        {!["HTTP", "DNS", "TLS"].includes(tab) && (
          <div className="ps-card text-center py-16 text-ghost">{tab} inspector — live data stream</div>
        )}
      </div>
    </div>
  );
}
