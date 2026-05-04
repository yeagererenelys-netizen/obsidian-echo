import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Layout";
import { Monitor, Smartphone, Cpu, Wifi, HelpCircle } from "lucide-react";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { VIDEOS } from "@/config/videoConfig";
import { useDeviceProfiles } from "@/hooks/useDeviceProfiles";

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
  const { profiles } = useDeviceProfiles();

  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src={VIDEOS.BG_01} opacity={0.05} />
      </div>
      
      <div className="relative z-10">
        <PageHeader title="DEVICE PROFILES" subtitle={`Behavioral baselines · ${profiles.length} devices monitored`} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(d => {
            const Icon = deviceIcon(d.threatLevel === "CRITICAL" ? "threat" : d.isInternal ? "internal" : "external");
            const anomalyColor = d.anomalyScore >= 85 ? "#ef4444" : d.anomalyScore >= 65 ? "#eab308" : "#a3ff12";
            
            return (
              <Link 
                to="/app/devices/$ip" 
                params={{ ip: d.ip }} 
                key={d.ip}
                className="ps-card group hover:border-lime-border transition-all duration-300 relative overflow-hidden"
                style={{ borderLeft: `3px solid ${d.anomalyScore >= 65 ? anomalyColor : '#222'}` }}
              >
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-obsidian-deep rounded border border-graphite group-hover:border-lime/30 transition-colors">
                      <Icon size={20} className="text-ghost group-hover:text-lime transition-colors" />
                    </div>
                    <div>
                      <div className="mono text-base text-white font-bold">{d.ip}</div>
                      <div className="text-[11px] text-ghost truncate max-w-[140px]">{d.hostname}</div>
                    </div>
                  </div>
                  
                  {/* Anomaly ring */}
                  <div className="relative">
                    <svg viewBox="0 0 40 40" width={48} height={48}>
                      <circle cx={20} cy={20} r={17} fill="none" stroke="#111" strokeWidth={4} />
                      <circle cx={20} cy={20} r={17} fill="none"
                        stroke={anomalyColor}
                        strokeWidth={4}
                        strokeDasharray={`${(d.anomalyScore / 100) * 107} 107`}
                        transform="rotate(-90 20 20)"
                        style={{ filter: `drop-shadow(0 0 4px ${anomalyColor}44)` }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center mono text-[10px] text-white font-bold">{d.anomalyScore}</div>
                  </div>
                </div>

                <div className="mono text-[10px] text-ghost mb-3 relative z-10">
                  {d.totalPackets.toLocaleString()} pkts · {d.isInternal ? "Internal" : "External"}
                </div>

                {/* Protocol distribution bar */}
                <div className="flex h-1.5 rounded-full overflow-hidden mb-4 bg-carbon relative z-10">
                  {d.protocols.map((p, i) => {
                    const colors = ["#a3ff12", "#3b82f6", "#eab308", "#ef4444", "#a0aec0"];
                    return (
                      <div 
                        key={p.protocol} 
                        className="h-full" 
                        style={{ width: `${p.percent}%`, background: colors[i % colors.length] }} 
                      />
                    );
                  })}
                </div>

                <div className="flex justify-between mono text-[10px] text-ghost border-t border-graphite/30 pt-3 relative z-10">
                  <div className="flex flex-col">
                    <span className="micro opacity-50 uppercase mb-0.5">Throughput</span>
                    <span className="text-white">▲ {d.totalBytesOut > 1_000_000 ? `${(d.totalBytesOut / 1_000_000).toFixed(1)} MB` : `${(d.totalBytesOut / 1_000).toFixed(0)} KB`}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="micro opacity-50 uppercase mb-0.5">Last Seen</span>
                    <span className="text-lime">{new Date(d.lastSeen).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 relative z-10">
                  <span className={`badge ${d.threatLevel === "CRITICAL" ? "badge-threat" : d.threatLevel === "HIGH" || d.threatLevel === "MEDIUM" ? "badge-warn" : "badge-safe"} text-[9px] px-2`}>
                    {d.threatLevel === "NONE" ? "HEALTHY" : d.threatLevel}
                  </span>
                  <div className="ml-auto flex items-center text-[10px] text-lime opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    ANALYZE <HelpCircle size={12} className="ml-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
