import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  LayoutGrid, Radio, Layers, Share2, Cpu, Shield, Activity, Lock,
  Search, Globe, FileArchive, FileText, Sliders, Bell, Hexagon
} from "lucide-react";
import type { ReactNode } from "react";
import { VideoBackground } from "./VideoBackground";

const NAV = [
  { cat: "MAIN", items: [
    { to: "/app/overview", label: "Overview", icon: LayoutGrid },
    { to: "/app/capture", label: "Live Capture", icon: Radio },
    { to: "/app/sessions", label: "Session Timeline", icon: Layers },
    { to: "/app/graph", label: "Communication Graph", icon: Share2 },
  ]},
  { cat: "INTELLIGENCE", items: [
    { to: "/app/devices", label: "Device Profiles", icon: Cpu },
    { to: "/app/alerts", label: "Alerts & Triage", icon: Shield, badge: 12 },
    { to: "/app/beaconing", label: "Beaconing", icon: Activity },
    { to: "/app/vpn", label: "VPN Detection", icon: Lock },
  ]},
  { cat: "INSPECTION", items: [
    { to: "/app/protocols", label: "Protocol Inspector", icon: Search },
    { to: "/app/map", label: "World Map", icon: Globe },
    { to: "/app/pcap", label: "PCAP Manager", icon: FileArchive },
  ]},
  { cat: "SYSTEM", items: [
    { to: "/app/reports", label: "Reports", icon: FileText },
    { to: "/app/settings", label: "Settings", icon: Sliders },
  ]},
];

export function Sidebar() {
  const loc = useLocation();
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-void border-r border-graphite flex flex-col z-40">
      <div className="h-[52px]" />
      <nav className="flex-1 overflow-y-auto pb-4">
        {NAV.map(group => (
          <div key={group.cat}>
            <div className="nav-cat">{group.cat}</div>
            {group.items.map(it => {
              const Icon = it.icon;
              const active = loc.pathname === it.to || (it.to === "/app/overview" && loc.pathname === "/app");
              return (
                <Link key={it.to} to={it.to} className={`nav-item mx-2 ${active ? "active" : ""}`}>
                  <Icon size={16} className={active ? "text-lime" : "text-ghost"} />
                  <span className="flex-1">{it.label}</span>
                  {it.badge && <span className="badge badge-threat">{it.badge}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="m-3 ps-card !p-3 relative overflow-hidden">
        <VideoBackground src="https://drive.google.com/uc?export=download&id=11D299SnmTt0Ntw40uNzJaKvwJv_5dF_Q" opacity={0.15} />
        <div className="relative z-10">
          <div className="micro mb-2">Engine Status</div>
          <div className="flex items-center gap-2 mb-1"><span className="dot dot-lime" /><span className="text-xs text-white">RUNNING</span></div>
          <div className="mono text-[11px] text-ghost">eth0</div>
          <div className="mono text-[11px] text-lime">1,247,832 pkts</div>
          <button className="btn btn-secondary !text-[11px] !py-1 !px-2 mt-2 w-full">Stop Capture</button>
        </div>
      </div>
    </aside>
  );
}

export function Topbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 h-[52px] border-b border-graphite z-50 flex items-center px-5 gap-4"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}
    >
      <div className="flex items-center gap-2 w-[200px]">
        <Hexagon size={20} className="text-lime" />
        <span className="text-silver text-sm">Packet</span>
        <span className="text-white text-sm font-bold -ml-1">Scope</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1 border border-lime-border rounded-sm bg-lime-dim/30 relative overflow-hidden">
        <VideoBackground src="https://drive.google.com/uc?export=download&id=1f5s3YNZH4BoAVcL4jKfG-LAWymIlg6Mb" opacity={0.3} />
        <div className="relative z-10 flex items-center gap-1.5">
          <span className="dot dot-lime !w-2 !h-2" />
          <span className="mono text-[10px] text-lime tracking-wider">LIVE</span>
        </div>
      </div>
      <div className="flex-1 max-w-[420px] mx-auto relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ghost" />
        <input className="input mono !text-xs !pl-9 !h-8" placeholder="⌘K  Search everything..." />
      </div>
      <div className="flex items-center gap-4 ml-auto">
        <div className="text-right leading-tight">
          <div className="micro">Rate</div>
          <div className="mono text-xs text-lime">2,341 pkt/s</div>
        </div>
        <button className="relative text-silver hover:text-white">
          <Bell size={16} />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-threat rounded-full text-[9px] text-white grid place-items-center">3</span>
        </button>
        <span className="badge badge-neutral">eth0</span>
        <div className="w-7 h-7 rounded-full bg-lime grid place-items-center text-void text-xs font-bold">K</div>
      </div>
    </header>
  );
}

export function Shell() {
  return (
    <div className="min-h-screen bg-void text-white relative">
      <video autoPlay muted loop playsInline className="fixed inset-0 w-full h-full object-cover z-0 opacity-[0.03] pointer-events-none" src="https://drive.google.com/uc?export=download&id=19zgOh6fQUCHJ-J5wbQqVAvuph-ISm3FQ" />
      <div className="relative z-10">
        <Topbar />
        <Sidebar />
        <main className="ml-[220px] pt-[52px] min-h-screen hex-bg">
          <div className="max-w-[1400px] mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="display text-[32px] leading-none text-white">{title}</h1>
        {subtitle && <div className="text-xs text-ghost mt-2 flex items-center gap-2">{subtitle}</div>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, color = "white", trend, hero }: { label: string; value: string; color?: "white" | "lime" | "threat"; trend?: string; hero?: boolean }) {
  const colorClass = color === "lime" ? "text-lime" : color === "threat" ? "text-threat" : "text-white";
  return (
    <div className={`ps-card ${hero ? "ps-card-lime" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="micro">{label}</span>
        <span className={`dot ${color === "threat" ? "dot-threat" : color === "lime" ? "dot-lime" : "dot-safe"}`} />
      </div>
      <div className={`display text-[56px] leading-none ${colorClass}`} style={color === "threat" ? { textShadow: "0 0 20px rgba(239,68,68,0.4)" } : undefined}>
        {value}
      </div>
      {trend && <div className="text-xs text-safe mt-2 mono">{trend}</div>}
    </div>
  );
}
