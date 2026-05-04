import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Layout";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { VIDEOS } from "@/config/videoConfig";
import { Play, Square, Activity } from "lucide-react";
import { useState, useEffect, useRef, memo } from "react";
import { List } from "react-window";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WS } from "@/config/apiConfig";

export const Route = createFileRoute("/app/capture")({ component: Capture });

type Packet = {
  id: number;
  timestamp: string;
  src: string;
  dst: string;
  srcPort: number;
  dstPort: number;
  protocol: string;
  length: number;
  info: string;
  flags: string;
  ttl: number;
};

const protoBadge = (p: string) => {
  const map: Record<string, string> = { TCP: "badge-lime", UDP: "badge-neutral", DNS: "badge-warn", HTTP: "badge-info", TLS: "badge-info", ICMP: "badge-neutral" };
  return map[p] || "badge-neutral";
};

const Row = memo(({
  index,
  style,
  ariaAttributes,
  packets,
}: {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  packets: Packet[];
}) => {
  const p = packets[index];
  if (!p) return null;
  return (
    <div
      className="flex items-center gap-4 px-4 border-b border-graphite/30 hover:bg-white/5 transition-colors mono text-[11px] leading-[40px]"
      style={style}
      {...ariaAttributes}
    >
      <div className="w-12 text-ghost">{p.id}</div>
      <div className="w-24 text-silver">{p.timestamp}</div>
      <div className="w-40 text-white truncate">{p.src}:{p.srcPort}</div>
      <div className="w-40 text-white truncate">{p.dst}:{p.dstPort}</div>
      <div className="w-20"><span className={`badge ${protoBadge(p.protocol)}`}>{p.protocol}</span></div>
      <div className="w-16 text-silver">{p.length}</div>
      <div className="w-24 text-ghost truncate">{p.flags}</div>
      <div className="flex-1 text-silver truncate">{p.info}</div>
    </div>
  );
});

function Capture() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [selectedIface, setSelectedIface] = useState("eth0");
  const [bpf, setBpf] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [simulated, setSimulated] = useState(false);

  const { connected, send } = useWebSocket(WS.CAPTURE, (data: any) => {
    if (data.type === "packets") {
      setPackets(prev => [...data.data, ...prev].slice(0, 10000));
    }
    if (data.type === "interfaces") {
      setInterfaces(["Simulated Traffic", ...data.interfaces]);
      setSelectedIface("Simulated Traffic");
    }
    if (data.type === "status") {
      if (data.status === "capturing") {
        setSimulated(data.simulated || false);
      }
      if (data.status === "stopped") {
        setCapturing(false);
      }
    }
  });

  // On mount — fetch interfaces
  useEffect(() => {
    if (connected) send({ action: "list_interfaces" });
  }, [connected, send]);

  const startCapture = () => {
    send({ action: "start", interface: selectedIface, filter: bpf });
    setCapturing(true);
    setPackets([]);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const stopCapture = () => {
    send({ action: "stop" });
    setCapturing(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => () => { stopCapture(); }, []);

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src={VIDEOS.FEAT_01} opacity={0.12} />
      </div>
      <div className="relative z-10">
        <PageHeader
          title="LIVE CAPTURE"
          subtitle={
            <div className="flex items-center gap-2">
              <span className={`dot ${capturing ? 'dot-lime animate-pulse' : 'dot-ghost'}`} />
              {capturing ? `Capturing on ${selectedIface} · ${packets.length.toLocaleString()} packets` : "Engine Idle"}
              {!connected && <span className="badge badge-danger text-[10px]">OFFLINE</span>}
              {simulated && capturing && <span className="badge badge-warn text-[10px]">SIMULATED</span>}
            </div>
          }
        />

        <div className="ps-card !p-3 mb-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => capturing ? stopCapture() : startCapture()}
            disabled={!connected}
            className={`btn ${capturing ? "btn-danger" : "btn-primary"} min-w-[160px]`}
          >
            {capturing ? <><Square size={14} /> STOP CAPTURE</> : <><Play size={14} /> START CAPTURE</>}
          </button>

          <div className="flex items-center bg-carbon rounded px-2 border border-graphite">
            <Activity size={14} className="text-ghost ml-1" />
            <select className="bg-transparent border-none mono text-[11px] text-white py-1 focus:ring-0 cursor-pointer" value={selectedIface} onChange={e => setSelectedIface(e.target.value)}>
              {interfaces.map(i => (
                <option key={i} value={i} className="bg-obsidian">{i}</option>
              ))}
            </select>
          </div>

          <input
            className="input mono !text-xs !py-1.5 flex-1 min-w-[200px]"
            placeholder="tcp port 80 or udp"
            value={bpf}
            onChange={e => setBpf(e.target.value)}
          />

          <div className="flex items-center gap-4">
            <div className="display text-[22px] text-white mono">{hh}:{mm}:{ss}</div>
            <div className="w-24 h-1 bg-carbon rounded overflow-hidden">
              <div className={`h-full bg-lime rounded ${capturing ? 'animate-pulse' : ''}`} style={{ width: capturing ? "100%" : "0%" }} />
            </div>
          </div>
        </div>

        <div className="ps-card !p-0 overflow-hidden border border-graphite/40">
          <div className="flex items-center gap-4 px-4 py-2 border-b border-graphite bg-obsidian-deep micro uppercase tracking-wider text-ghost">
            <div className="w-12">#</div>
            <div className="w-24">Time</div>
            <div className="w-40">Source</div>
            <div className="w-40">Destination</div>
            <div className="w-20">Proto</div>
            <div className="w-16">Len</div>
            <div className="w-24">Flags</div>
            <div className="flex-1">Info</div>
          </div>
          
          <List
            className="scrollbar-v"
            rowCount={packets.length}
            rowHeight={40}
            rowComponent={Row}
            rowProps={{ packets }}
            style={{ height: 550, width: "100%" }}
          />

          {packets.length === 0 && !capturing && (
            <div className="flex flex-col items-center justify-center py-24 text-ghost space-y-4">
              <div className="display text-[80px] opacity-10">⬡</div>
              <div className="text-sm">READY FOR CAPTURE</div>
              <button onClick={startCapture} disabled={!connected} className="btn btn-ghost !text-xs">INITIATE SESSION</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
