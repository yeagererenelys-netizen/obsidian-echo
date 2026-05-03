import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Shell";

export const Route = createFileRoute("/app/beaconing")({ component: Beaconing });

const beacons = [
  { ip:"192.168.1.45", dst:"167.88.162.34", interval:"30.0s", reg:0.97, sev:"critical" },
  { ip:"192.168.1.42", dst:"update.verysuspicious-domain.cc", interval:"60.2s", reg:0.84, sev:"warn" },
  { ip:"192.168.1.89", dst:"104.21.55.10", interval:"120.5s", reg:0.71, sev:"warn" },
];

function Beaconing() {
  return (
    <div>
      <div className="ps-card !p-8 mb-6 relative overflow-hidden text-glow-lime">
        <h1 className="display text-[64px] text-white leading-none">BEACONING DETECTOR</h1>
        <p className="text-silver mt-2">Inter-packet timing analysis · Detects C2 callbacks via regularity scoring</p>
        <svg viewBox="0 0 800 100" className="w-full h-24 mt-4">
          {Array.from({ length: 50 }).map((_, i) => (
            <line key={i} x1={i*16+5} y1={90} x2={i*16+5} y2={20 + ((i*9)%30)} stroke="#a3ff12" strokeWidth={2} opacity={0.7} />
          ))}
        </svg>
      </div>
      <div className="space-y-3">
        {beacons.map(b => (
          <div key={b.ip} className="ps-card flex items-center gap-6" style={{ borderLeft: `3px solid ${b.sev==="critical"?"#ef4444":"#eab308"}` }}>
            <div>
              <div className="mono text-base text-white">{b.ip}</div>
              <div className="mono text-xs text-ghost">→ {b.dst}</div>
            </div>
            <div>
              <div className="micro">Interval</div>
              <div className="mono text-sm text-lime">{b.interval}</div>
            </div>
            <div className="flex-1">
              <div className="micro mb-1">Regularity</div>
              <div className="h-2 bg-carbon rounded overflow-hidden">
                <div className="h-full bg-lime" style={{ width: `${b.reg*100}%` }} />
              </div>
            </div>
            <div className="display text-[40px] text-lime leading-none">{b.reg.toFixed(2)}</div>
            <button className="btn btn-secondary !text-xs">Inspect →</button>
          </div>
        ))}
      </div>
    </div>
  );
}
