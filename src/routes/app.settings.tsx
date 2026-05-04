import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Layout";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { VIDEOS } from "@/config/videoConfig";
import { useState } from "react";

export const Route = createFileRoute("/app/settings")({ component: Settings });

const CATS = ["Capture", "Detection", "Notifications", "Storage", "Attribution"];

const ATTRS = [
  { tag: "Scapy", desc: "Network packet capture and manipulation" },
  { tag: "MaxMind GeoLite2", desc: "IP geolocation and ASN data" },
  { tag: "D3.js", desc: "Force-directed graph visualization" },
  { tag: "Leaflet.js", desc: "Interactive map rendering" },
  { tag: "React", desc: "UI framework" },
  { tag: "FastAPI", desc: "Python backend WebSocket server" },
  { tag: "RFC 793", desc: "TCP specification reference" },
  { tag: "RFC 1035", desc: "DNS specification reference" },
];

function Toggle({ on = true }: { on?: boolean }) {
  const [v, set] = useState(on);
  return (
    <button onClick={() => set(!v)} className={`w-9 h-5 rounded-full relative transition ${v ? "bg-lime" : "bg-carbon"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition ${v ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

function Settings() {
  const [cat, setCat] = useState("Capture");
  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src={VIDEOS.BRAND_02} opacity={0.08} />
      </div>
      <div className="relative z-10">
        <PageHeader title="SETTINGS" />
        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-3 ps-card !p-2">
            {CATS.map(c => (
              <div key={c} onClick={() => setCat(c)} className={`nav-item ${cat === c ? "active" : ""}`}>{c}</div>
            ))}
          </aside>
          <div className="col-span-9 ps-card">
            {cat === "Attribution" ? (
              <>
                <div className="micro mb-4">Open-source acknowledgments</div>
                <div className="space-y-3">
                  {ATTRS.map(a => (
                    <div key={a.tag} className="flex items-center gap-3 py-2 border-b border-graphite">
                      <span className="badge badge-lime min-w-[140px]">{a.tag}</span>
                      <span className="text-sm text-silver">{a.desc}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <div className="micro">{cat} options</div>
                {["Enable live capture on startup", "Auto-detect beaconing", "Send desktop notifications", "Persist sessions to disk"].map(l => (
                  <div key={l} className="flex items-center justify-between py-2 border-b border-graphite">
                    <div>
                      <div className="text-sm text-white">{l}</div>
                      <div className="text-xs text-ghost mt-1">Configurable per-interface.</div>
                    </div>
                    <Toggle />
                  </div>
                ))}
                <div>
                  <div className="micro mb-2">Buffer size</div>
                  <input type="range" className="w-full accent-lime" defaultValue={70} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
