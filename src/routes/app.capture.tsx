import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Shell";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { Play, Square, Wifi, Monitor, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { generateMockPacket } from "@/lib/mockData";

export const Route = createFileRoute("/app/capture")({ component: Capture });

type Packet = ReturnType<typeof generateMockPacket>;

const protoBadge = (p: string) => {
  const map: Record<string, string> = { TCP: "badge-lime", UDP: "badge-neutral", DNS: "badge-warn", HTTP: "badge-info", TLS: "badge-info", ICMP: "badge-neutral" };
  return map[p] || "badge-neutral";
};

const MOCK_INTERFACES = [
  { name: "eth0", label: "eth0 (Ethernet)", icon: Monitor },
  { name: "wlan0", label: "wlan0 (Wi-Fi)", icon: Wifi },
  { name: "lo", label: "lo (Loopback)", icon: RotateCcw },
  { name: "docker0", label: "docker0 (Docker)", icon: Monitor },
];

function Capture() {
  const [running, setRunning] = useState(false);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [iface, setIface] = useState("eth0");
  const [bpf, setBpf] = useState("tcp and port 80");
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const tableRef = useRef<HTMLDivElement>(null);

  const startCapture = useCallback(() => {
    setRunning(true);
    setPackets([]);
    setElapsed(0);

    // Mock packet generation (simulated backend)
    intervalRef.current = setInterval(() => {
      const batch = Array.from({ length: 2 + Math.floor(Math.random() * 4) }, () => generateMockPacket());
      setPackets(prev => {
        const next = [...batch, ...prev];
        return next.slice(0, 10000); // buffer cap
      });
    }, 120);

    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, []);

  const stopCapture = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => () => { stopCapture(); }, [stopCapture]);

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const pktRate = running ? Math.floor(packets.length / Math.max(elapsed, 1) * 60) : 0;

  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src="/videos/features/FEAT_01_anim_web.mp4" opacity={0.08} />
      </div>
      <div className="relative z-10">
        <PageHeader
          title="LIVE CAPTURE"
          subtitle={running ? <><span className="dot dot-lime" /> Capturing on {iface} · {packets.length.toLocaleString()} packets captured</> : <span className="text-ghost">Idle — ready to capture</span>}
        />

        <div className="ps-card !p-3 mb-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => running ? stopCapture() : startCapture()}
            className={running ? "btn btn-danger" : "btn btn-primary"}
            style={running ? { animation: "pulse-red-glow 2s infinite" } : undefined}
          >
            {running ? <><Square size={14} /> STOP CAPTURE</> : <><Play size={14} /> START CAPTURE</>}
          </button>

          <select className="input mono !w-auto !text-xs" value={iface} onChange={e => setIface(e.target.value)}>
            {MOCK_INTERFACES.map(i => (
              <option key={i.name} value={i.name}>{i.label} (simulated)</option>
            ))}
          </select>

          <input
            className="input mono !text-xs"
            placeholder="tcp port 80 or udp"
            value={bpf}
            onChange={e => setBpf(e.target.value)}
            style={{ maxWidth: 320 }}
          />

          <div className="ml-auto flex items-center gap-4">
            {running && <div className="mono text-xs text-lime">{pktRate.toLocaleString()} pkt/s</div>}
            <div className="display text-[22px] text-white">{hh}:{mm}:{ss}</div>
            {running && (
              <div className="w-32 h-1 bg-carbon rounded overflow-hidden">
                <div className="h-full bg-lime rounded animate-pulse" style={{ width: "100%" }} />
              </div>
            )}
          </div>
        </div>

        <div className="ps-card !p-0 overflow-hidden">
          <div ref={tableRef} className="max-h-[600px] overflow-y-auto">
            <table className="ps-table">
              <thead className="sticky top-0 bg-obsidian z-10">
                <tr><th>#</th><th>Time</th><th>Source</th><th>Dest</th><th>Proto</th><th>Len</th><th>Flags</th><th>Info</th></tr>
              </thead>
              <tbody>
                {packets.slice(0, 50).map((p, idx) => (
                  <tr
                    key={p.id}
                    style={{
                      ...(p.flag ? { boxShadow: `inset 2px 0 0 ${p.flag === "threat" ? "#ef4444" : "#eab308"}` } : {}),
                      ...(idx === 0 && running ? { animation: "flash-row 1s ease-out" } : {}),
                    }}
                  >
                    <td className="text-ghost">{p.id}</td>
                    <td>{p.timestamp}</td>
                    <td className="text-white">{p.src}:{p.srcPort}</td>
                    <td className="text-white">{p.dst}:{p.dstPort}</td>
                    <td><span className={`badge ${protoBadge(p.protocol)}`}>{p.protocol}</span></td>
                    <td>{p.length}</td>
                    <td className="text-ghost">{p.flags}</td>
                    <td className="text-silver">{p.info}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {packets.length === 0 && !running && (
            <div className="text-center py-16 text-ghost">
              Press <span className="text-lime">START CAPTURE</span> to begin packet capture
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
