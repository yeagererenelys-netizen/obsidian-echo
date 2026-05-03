import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Shell";

export const Route = createFileRoute("/app/map")({ component: WorldMap });

const countries = [
  { c:"🇺🇸 United States", n:142, sev:"safe" },
  { c:"🇩🇪 Germany", n:38, sev:"safe" },
  { c:"🇨🇳 China", n:22, sev:"warn" },
  { c:"🇷🇺 Russia", n:7, sev:"threat" },
  { c:"🇳🇱 Netherlands", n:14, sev:"safe" },
  { c:"🧅 Tor exits", n:3, sev:"threat" },
];

function WorldMap() {
  return (
    <div>
      <PageHeader title="GEOGRAPHIC MAP" subtitle="External connections plotted live" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-9 ps-card !p-0 relative overflow-hidden" style={{ height: 560, background: "radial-gradient(ellipse at center, #050505, #000)" }}>
          <svg viewBox="0 0 800 500" className="w-full h-full">
            {Array.from({ length: 80 }).map((_, i) => (
              <circle key={i} cx={Math.random()*800} cy={Math.random()*500} r={0.5} fill="#fff" opacity={Math.random()*0.6} />
            ))}
            <ellipse cx={400} cy={250} rx={300} ry={180} fill="none" stroke="#222" strokeWidth={1} />
            {[
              { x: 200, y: 200, c: "#a3ff12" }, { x: 450, y: 180, c: "#a3ff12" },
              { x: 600, y: 220, c: "#eab308" }, { x: 580, y: 280, c: "#ef4444" },
              { x: 380, y: 320, c: "#a3ff12" }, { x: 660, y: 200, c: "#ef4444" },
            ].map((p, i) => (
              <g key={i}>
                <path d={`M 400 250 Q ${(400+p.x)/2} ${(250+p.y)/2 - 80} ${p.x} ${p.y}`} fill="none" stroke={p.c} strokeWidth={1} opacity={0.5} />
                <circle cx={p.x} cy={p.y} r={4} fill={p.c} />
              </g>
            ))}
            <circle cx={400} cy={250} r={8} fill="#a3ff12" />
            <circle cx={400} cy={250} r={14} fill="none" stroke="#a3ff12" strokeWidth={1} opacity={0.5} />
          </svg>
        </div>
        <div className="col-span-3 ps-card">
          <h3 className="display text-xl mb-3">COUNTRIES</h3>
          <div className="space-y-3">
            {countries.map(c => (
              <div key={c.c}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-silver">{c.c}</span>
                  <span className={`mono ${c.sev==="threat"?"text-threat":c.sev==="warn"?"text-warn":"text-lime"}`}>{c.n}</span>
                </div>
                <div className="h-1 bg-carbon rounded"><div className={`h-full rounded ${c.sev==="threat"?"bg-threat":c.sev==="warn"?"bg-warn":"bg-lime"}`} style={{ width: `${(c.n/142)*100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
