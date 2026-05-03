import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ps/Shell";

export const Route = createFileRoute("/app/devices/$ip")({ component: DeviceDetail });

function DeviceDetail() {
  const { ip } = Route.useParams();
  return (
    <div>
      <Link to="/app/devices" className="text-xs text-ghost hover:text-lime">← All devices</Link>
      <div className="mt-2 mb-6 flex items-center justify-between">
        <div>
          <div className="micro">DEVICE</div>
          <h1 className="display text-[48px] text-white leading-none">{ip}</h1>
          <div className="text-xs text-ghost mt-1">workstation-04 · MAC 4c:cc:6a:bb:11:22 · seen 14h</div>
        </div>
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 80 80" width="100" height="100">
            <circle cx={40} cy={40} r={32} fill="none" stroke="#222" strokeWidth={6} />
            <circle cx={40} cy={40} r={32} fill="none" stroke="#a3ff12" strokeWidth={6} strokeDasharray={`${0.78 * 200} 200`} transform="rotate(-90 40 40)" />
          </svg>
          <div className="display text-2xl text-lime -mt-16">78</div>
          <div className="micro mt-12">RISK SCORE</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Sessions" value="412" />
        <StatCard label="Data Out" value="2.4" color="lime" trend="GB" hero />
        <StatCard label="Anomalies" value="3" color="threat" />
        <StatCard label="Uptime" value="14h" />
      </div>
      <div className="ps-card">
        <h3 className="display text-xl mb-3">ACTIVITY HEATMAP — 7 DAYS</h3>
        <div className="grid grid-cols-24 gap-px" style={{ gridTemplateColumns: "repeat(24,1fr)" }}>
          {Array.from({ length: 168 }).map((_, i) => {
            const v = Math.random();
            return <div key={i} className="aspect-square rounded-sm" style={{ background: `rgba(163,255,18,${v * 0.9})` }} />;
          })}
        </div>
      </div>
    </div>
  );
}
