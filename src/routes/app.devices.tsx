import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Layout";
import { Monitor, Smartphone, Cpu, Wifi, HelpCircle } from "lucide-react";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { VIDEOS } from "@/config/videoConfig";
import { MOCK_DEVICES } from "@/lib/mockData";

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
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src={VIDEOS.BG_01} opacity={0.05} />
      </div>
      
      <div className="relative z-10">
        <PageHeader title="DEVICE PROFILES" subtitle={`Behavioral baselines · ${MOCK_DEVICES.length} devices monitored`} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_DEVICES.map(d => {
            const Icon = deviceIcon(d.type);
            const anomalyColor = d.anomaly > 80 ? "#ef4444" : d.anomaly > 60 ? "#eab308" : "#a3ff12";
            
            return (
              <Link 
                to="/app/devices/$ip" 
                params={{ ip: d.ip }} 
                key={d.ip}
                className="ps-card group hover:border-lime-border transition-all duration-300 relative overflow-hidden"
                style={{ borderLeft: `3px solid ${d.anomaly > 60 ? anomalyColor : '#222'}` }}
              >
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-obsidian-deep rounded border border-graphite group-hover:border-lime/30 transition-colors">
                      <Icon size={20} className="text-ghost group-hover:text-lime transition-colors" />
                    </div>
                    <div>
                      <div className="mono text-base text-white font-bold">{d.ip}</div>
                      <div className="text-[11px] text-ghost truncate max-w-[140px]">{d.name}</div>
                    </div>
                  </div>
                  
                  {/* Anomaly ring */}
                  <div className="relative">
                    <svg viewBox="0 0 40 40" width={48} height={48}>
                      <circle cx={20} cy={20} r={17} fill="none" stroke="#111" strokeWidth={4} />
                      <circle cx={20} cy={20} r={17} fill="none"
                        stroke={anomalyColor}
                        strokeWidth={4}
                        strokeDasharray={`${(d.anomaly / 100) * 107} 107`}
                        transform="rotate(-90 20 20)"
                        style={{ filter: `drop-shadow(0 0 4px ${anomalyColor}44)` }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center mono text-[10px] text-white font-bold">{d.anomaly}</div>
                  </div>
                </div>

                <div className="mono text-[10px] text-ghost mb-3 relative z-10">
                  {d.mac} · {d.model}
                </div>

                {/* Protocol distribution bar */}
                <div className="flex h-1.5 rounded-full overflow-hidden mb-4 bg-carbon relative z-10">
                  {Object.entries(d.topProtos).map(([k, v], i) => {
                    const colors = ["#a3ff12", "#3b82f6", "#eab308", "#ef4444", "#a0aec0"];
                    return (
                      <div 
                        key={k} 
                        className="h-full" 
                        style={{ width: `${v}%`, background: colors[i % colors.length] }} 
                      />
                    );
                  })}
                </div>

                <div className="flex justify-between mono text-[10px] text-ghost border-t border-graphite/30 pt-3 relative z-10">
                  <div className="flex flex-col">
                    <span className="micro opacity-50 uppercase mb-0.5">Throughput</span>
                    <span className="text-white">▲ {(d.totalBytes / 1e6).toFixed(1)}MB</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="micro opacity-50 uppercase mb-0.5">Last Seen</span>
                    <span className="text-lime">{d.lastSeen}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 relative z-10">
                  <span className={`badge ${d.anomaly > 80 ? "badge-threat" : d.anomaly > 60 ? "badge-warn" : "badge-safe"} text-[9px] px-2`}>
                    {d.anomaly > 80 ? "CRITICAL" : d.anomaly > 60 ? "SUSPICIOUS" : "HEALTHY"}
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
