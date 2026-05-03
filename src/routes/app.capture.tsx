import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Shell";
import { Play, Square } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/capture")({ component: Capture });

const PROTOS = ["TCP","UDP","DNS","HTTP","TLS","ICMP"];
const proto = (i: number) => PROTOS[i % PROTOS.length];
const protoBadge = (p: string) => {
  const map: Record<string,string> = { TCP:"badge-lime", UDP:"badge-neutral", DNS:"badge-warn", HTTP:"badge-info", TLS:"badge-info", ICMP:"badge-neutral" };
  return map[p] || "badge-neutral";
};

const packets = Array.from({ length: 50 }, (_, i) => ({
  no: 8472 - i,
  t: `12:42:${String(58 - (i % 60)).padStart(2,"0")}.${String(Math.floor(Math.random()*999)).padStart(3,"0")}`,
  src: `192.168.1.${(45 + i) % 255}`,
  dst: i % 7 === 0 ? "167.88.162.34" : `142.250.80.${i % 200}`,
  proto: proto(i),
  len: 60 + (i * 13) % 1400,
  info: i % 7 === 0 ? "TCP keepalive — beacon candidate" : "GET /api/v1/data HTTP/1.1",
  flag: i % 7 === 0 ? "threat" : i % 11 === 0 ? "warn" : null,
}));

function Capture() {
  const [running, setRunning] = useState(true);
  return (
    <div>
      <PageHeader title="LIVE CAPTURE" subtitle={<><span className="dot dot-lime" /> Capturing on eth0</>} />
      <div className="ps-card !p-3 mb-4 flex items-center gap-3 flex-wrap">
        <button onClick={() => setRunning(!running)} className={running ? "btn btn-danger lime-glow" : "btn btn-primary"} style={running ? { animation: "pulse-red-glow 2s infinite" } : undefined}>
          {running ? <><Square size={14} /> STOP</> : <><Play size={14} /> START CAPTURE</>}
        </button>
        <select className="input mono !w-auto !text-xs"><option>eth0</option><option>wlan0</option><option>any</option></select>
        <input className="input mono !text-xs" placeholder="tcp and port 80" defaultValue="tcp and port 80" style={{ maxWidth: 320 }} />
        <button className="btn btn-secondary !text-xs">Apply</button>
        <div className="ml-auto flex items-center gap-4">
          <div className="mono text-xs text-lime">2,847 pkt/s</div>
          <div className="display text-[22px] text-white">00:14:32</div>
          <div className="w-32 h-1 bg-carbon rounded"><div className="h-full bg-lime rounded" style={{ width: "62%" }} /></div>
        </div>
      </div>

      <div className="ps-card !p-0 overflow-hidden">
        <table className="ps-table">
          <thead>
            <tr><th>#</th><th>Time</th><th>Source</th><th>Dest</th><th>Proto</th><th>Len</th><th>Info</th></tr>
          </thead>
          <tbody>
            {packets.map(p => (
              <tr key={p.no} className={p.flag ? "" : ""} style={p.flag ? { boxShadow: `inset 2px 0 0 ${p.flag === "threat" ? "#ef4444" : "#eab308"}` } : undefined}>
                <td className="text-ghost">{p.no}</td>
                <td>{p.t}</td>
                <td className="text-white">{p.src}</td>
                <td className="text-white">{p.dst}</td>
                <td><span className={`badge ${protoBadge(p.proto)}`}>{p.proto}</span></td>
                <td>{p.len}</td>
                <td className="text-silver">{p.info}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
