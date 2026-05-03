import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Shell";

export const Route = createFileRoute("/app/devices")({ component: Devices });

const devs = Array.from({ length: 12 }, (_, i) => ({
  ip: `192.168.1.${10+i*3}`,
  host: ["workstation","laptop","fileserver","printer","unknown"][i%5] + `-${i}`,
  risk: i === 4 ? "CRITICAL" : i === 7 || i === 9 ? "SUSPICIOUS" : "CLEAN",
  up: `${(i+1)*0.4}GB`,
  down: `${(i+1)*1.2}GB`,
  uptime: `${i+2}h`,
  protos: { http:30, https:50, dns:15, sus: i===4?20:0 },
}));

function riskBadge(r: string) {
  if (r === "CRITICAL") return "badge-threat";
  if (r === "SUSPICIOUS") return "badge-warn";
  return "badge-safe";
}

function Devices() {
  return (
    <div>
      <PageHeader title="DEVICE PROFILES" subtitle="Behavioral baselines · 34 devices monitored" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devs.map(d => (
          <Link to="/app/devices/$ip" params={{ ip: d.ip }} key={d.ip} className="ps-card group hover:border-lime-border">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="mono text-base text-white">{d.ip}</div>
                <div className="text-xs text-ghost">{d.host}</div>
              </div>
              <span className={`badge ${riskBadge(d.risk)} ${d.risk==="CRITICAL"?"lime-glow":""}`} style={d.risk==="CRITICAL"?{boxShadow:"0 0 12px rgba(239,68,68,0.4)"}:undefined}>{d.risk}</span>
            </div>
            <div className="flex h-1 rounded overflow-hidden mb-3">
              <div className="bg-lime" style={{ width: `${d.protos.http}%` }} />
              <div className="bg-white" style={{ width: `${d.protos.https}%` }} />
              <div className="bg-warn" style={{ width: `${d.protos.dns}%` }} />
              {d.protos.sus > 0 && <div className="bg-threat" style={{ width: `${d.protos.sus}%` }} />}
            </div>
            <div className="flex justify-between mono text-[11px] text-ghost">
              <span>▲ {d.up}</span><span>▼ {d.down}</span><span>⦿ {d.uptime}</span>
            </div>
            <div className="mt-3 text-xs text-lime opacity-0 group-hover:opacity-100 transition">View profile →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
