import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Shell";
import { MOCK_DEVICES } from "@/lib/mockData";
import { Monitor, Smartphone, Cpu, Wifi, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/app/devices")({ component: Devices });

const deviceIcon = (type: string) => {
  switch (type) {
    case "router": return Wifi;
    case "internal": return Monitor;
    case "threat": return HelpCircle;
    default: return Cpu;
  }
};

function Devices() {
  return (
    <div>
      <PageHeader title="DEVICE PROFILES" subtitle={`Behavioral baselines · ${MOCK_DEVICES.length} devices monitored`} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_DEVICES.map(d => {
          const Icon = deviceIcon(d.type);
          const borderColor = d.anomaly > 80 ? "#ef4444" : d.anomaly > 60 ? "#a3ff12" : "#222";
          return (
            <Link to="/app/devices/$ip" params={{ ip: d.ip }} key={d.ip}
              className="ps-card group hover:border-lime-border transition-all"
              style={{ borderLeft: `3px solid ${borderColor}` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-ghost" />
                  <div>
                    <div className="mono text-base text-white">{d.ip}</div>
                    <div className="text-xs text-ghost">{d.name}</div>
                  </div>
                </div>
                {/* Anomaly ring */}
                <div className="relative">
                  <svg viewBox="0 0 40 40" width={44} height={44}>
                    <circle cx={20} cy={20} r={16} fill="none" stroke="#222" strokeWidth={3} />
                    <circle cx={20} cy={20} r={16} fill="none"
                      stroke={d.anomaly > 80 ? "#ef4444" : d.anomaly > 60 ? "#eab308" : "#a3ff12"}
                      strokeWidth={3}
                      strokeDasharray={`${(d.anomaly / 100) * 100} 100`}
                      transform="rotate(-90 20 20)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center mono text-[10px] text-white">{d.anomaly}</div>
                </div>
              </div>

              <div className="text-xs text-ghost mb-2">{d.mac} · {d.model}</div>

              {/* Protocol bar */}
              <div className="flex h-1 rounded overflow-hidden mb-3">
                {Object.entries(d.topProtos).map(([k, v]) => (
                  <div key={k} className={k === "Suspicious" || k === "Tor" || k === "VPN" ? "bg-threat" : k === "DNS" ? "bg-warn" : k === "HTTP" ? "bg-info" : "bg-lime"} style={{ width: `${v}%` }} />
                ))}
              </div>

              <div className="flex justify-between mono text-[11px] text-ghost">
                <span>▲ {(d.totalBytes / 1e9).toFixed(1)}GB</span>
                <span>{d.totalPackets.toLocaleString()} pkts</span>
                <span>⦿ {d.lastSeen}</span>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <span className={`badge ${d.anomaly > 80 ? "badge-threat" : d.anomaly > 60 ? "badge-warn" : "badge-safe"}`}>
                  {d.anomaly > 80 ? "CRITICAL" : d.anomaly > 60 ? "SUSPICIOUS" : "CLEAN"}
                </span>
                <span className="text-xs text-lime opacity-0 group-hover:opacity-100 transition ml-auto">View profile →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
