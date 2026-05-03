import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Shell";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { useState } from "react";

export const Route = createFileRoute("/app/sessions")({ component: Sessions });

const sessions = Array.from({ length: 14 }, (_, i) => ({
  id: `s-${1000 + i}`,
  proto: ["HTTP", "HTTPS", "DNS", "SMTP"][i % 4],
  src: `192.168.1.${45 + i}`,
  dst: `142.250.80.${100 + i}`,
  duration: `${(i + 1) * 0.4}s`,
  bytes: `${(i + 1) * 128}KB`,
  status: i % 5 === 0 ? "threat" : "ok",
}));

function Sessions() {
  const [sel, setSel] = useState(0);
  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src="/videos/features/FEAT_07_anim_web.mp4" opacity={0.07} />
      </div>
      <div className="relative z-10">
        <PageHeader title="SESSION TIMELINE" subtitle="Reassembled flows · 5-tuple grouped" />
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 ps-card !p-2 max-h-[700px] overflow-y-auto">
            {sessions.map((s, i) => (
              <div key={s.id} onClick={() => setSel(i)} className={`p-3 cursor-pointer rounded border-l-2 mb-1 transition-all ${i === sel ? "bg-lime-dim/30 border-lime" : `border-${s.status === "threat" ? "threat" : "graphite"} hover:bg-charcoal`}`}>
                <div className="flex justify-between items-center">
                  <span className={`badge ${s.proto === "HTTP" ? "badge-info" : s.proto === "DNS" ? "badge-warn" : "badge-lime"}`}>{s.proto}</span>
                  <span className="mono text-[10px] text-ghost">{s.duration}</span>
                </div>
                <div className="mono text-xs text-white mt-2">{s.src}</div>
                <div className="mono text-[11px] text-ghost">→ {s.dst}</div>
                <div className="mono text-[10px] text-lime mt-1">{s.bytes}</div>
              </div>
            ))}
          </div>

          <div className="col-span-8 ps-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="mono text-xs text-ghost">SESSION {sessions[sel].id}</div>
                <h3 className="display text-2xl">{sessions[sel].src} → {sessions[sel].dst}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  const blob = new Blob([JSON.stringify(sessions[sel], null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `session-${sessions[sel].id}.json`; a.click();
                }} className="btn btn-secondary !text-xs">Export .pcap</button>
                <button className="btn btn-primary !text-xs">Flag</button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded" style={{ background: "rgba(163,255,18,0.04)" }}>
                <div className="flex gap-2 items-center mb-2">
                  <span className="badge badge-lime">GET</span>
                  <span className="mono text-xs text-white">/api/v1/data?session=abc123</span>
                </div>
                <pre className="mono text-[11px] text-silver overflow-x-auto">{`Host: api.example.com\nUser-Agent: Mozilla/5.0\nAccept: application/json`}</pre>
              </div>
              <div className="p-3 rounded" style={{ background: "rgba(34,197,94,0.04)" }}>
                <div className="flex gap-2 items-center mb-2">
                  <span className="badge badge-safe">200 OK</span>
                  <span className="mono text-xs text-ghost">application/json · 4.2KB · 142ms</span>
                </div>
                <pre className="mono text-[11px] text-silver">{`{"status":"ok","data":{"items":42}}`}</pre>
              </div>
              <div className="p-3 rounded" style={{ background: "rgba(239,68,68,0.04)" }}>
                <div className="flex gap-2 items-center mb-2">
                  <span className="badge badge-threat">404</span>
                  <span className="mono text-xs text-ghost">/admin/console</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="micro mb-2">DNS Chain</div>
              <div className="mono text-xs flex items-center gap-2 flex-wrap text-silver">
                <span className="text-white">192.168.1.45</span>
                <span className="text-lime">→</span>
                <span>192.168.1.1</span>
                <span className="text-lime">→</span>
                <span>198.41.0.4</span>
                <span className="text-lime">→</span>
                <span>ns1.google.com</span>
                <span className="text-lime">→</span>
                <span className="text-lime">142.250.80.100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
