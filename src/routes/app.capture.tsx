import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Layout";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { Play, Square, Activity } from "lucide-react";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { List } from "react-window";

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

const generateMockPacket = (): Packet => {
  const devices = ["192.168.1.1", "192.168.1.45", "192.168.1.89", "192.168.1.105", "192.168.1.200"];
  const dests = ["142.250.80.100", "167.88.162.34", "185.220.101.45", "104.21.55.10", "8.8.8.8"];
  const protocols = ["TCP", "UDP", "DNS", "HTTPS", "TLS"];
  
  return {
    id: Math.floor(Math.random() * 1000000),
    timestamp: new Date().toLocaleTimeString(),
    src: devices[Math.floor(Math.random() * devices.length)],
    dst: dests[Math.floor(Math.random() * dests.length)],
    srcPort: Math.floor(Math.random() * 65536),
    dstPort: Math.floor(Math.random() * 65536),
    protocol: protocols[Math.floor(Math.random() * protocols.length)],
    length: Math.floor(Math.random() * 1500) + 60,
    info: "Network packet",
    flags: "ACK",
    ttl: Math.floor(Math.random() * 64) + 1,
  };
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
  const [running, setRunning] = useState(false);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [iface, setIface] = useState("eth0");
  const [interfaces, setInterfaces] = useState<{name: string, label: string}[]>([]);
  const [bpf, setBpf] = useState("tcp and port 80");
  const [elapsed, setElapsed] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [backendOffline, setBackendOffline] = useState(false);

  // Load interfaces
  useEffect(() => {
    // In a real app, this would be a WebSocket call or API
    setInterfaces([
      { name: "eth0", label: "eth0 (Ethernet)" },
      { name: "wlan0", label: "wlan0 (Wi-Fi)" },
      { name: "lo", label: "lo (Loopback)" },
      { name: "docker0", label: "docker0 (Docker)" },
    ]);
  }, []);

  const startSimulatedCapture = () => {
    const interval = setInterval(() => {
      const batch = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => generateMockPacket());
      setPackets(prev => [...batch, ...prev].slice(0, 10000));
    }, 150);
    // Store interval to clear later
    (socketRef as any).currentSim = interval;
  };

  const startCapture = useCallback(() => {
    setRunning(true);
    setPackets([]);
    setElapsed(0);
    setBackendOffline(false);

    // Try WebSocket connection
    try {
      const ws = new WebSocket("ws://localhost:8000/ws/capture");
      socketRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ action: "start", interface: iface, filter: bpf }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Handle both single packet and array of packets
          const packets_arr = Array.isArray(data) ? data : [data];
          setPackets(prev => [...packets_arr, ...prev].slice(0, 10000));
        } catch (e) {
          console.error("Failed to parse packet:", e);
        }
      };

      ws.onerror = () => {
        setBackendOffline(true);
        startSimulatedCapture();
      };
    } catch (e) {
      setBackendOffline(true);
      startSimulatedCapture();
    }

    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, [iface, bpf]);

  const stopCapture = useCallback(() => {
    setRunning(false);
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ action: "stop" }));
      }
      socketRef.current.close();
    }
    if ((socketRef as any).currentSim) clearInterval((socketRef as any).currentSim);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => () => { stopCapture(); }, [stopCapture]);

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src="/videos/features/FEAT_01_anim.mp4" opacity={0.12} />
      </div>
      <div className="relative z-10">
        <PageHeader
          title="LIVE CAPTURE"
          subtitle={
            <div className="flex items-center gap-2">
              <span className={`dot ${running ? 'dot-lime animate-pulse' : 'dot-ghost'}`} />
              {running ? `Capturing on ${iface} · ${packets.length.toLocaleString()} packets` : "Engine Idle"}
              {backendOffline && running && <span className="badge badge-warn text-[10px]">SIMULATED</span>}
            </div>
          }
        />

        <div className="ps-card !p-3 mb-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => running ? stopCapture() : startCapture()}
            className={`btn ${running ? "btn-danger" : "btn-primary"} min-w-[160px]`}
          >
            {running ? <><Square size={14} /> STOP CAPTURE</> : <><Play size={14} /> START CAPTURE</>}
          </button>

          <div className="flex items-center bg-carbon rounded px-2 border border-graphite">
            <Activity size={14} className="text-ghost ml-1" />
            <select className="bg-transparent border-none mono text-[11px] text-white py-1 focus:ring-0 cursor-pointer" value={iface} onChange={e => setIface(e.target.value)}>
              {interfaces.map(i => (
                <option key={i.name} value={i.name} className="bg-obsidian">{i.label} {backendOffline ? '(simulated)' : ''}</option>
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
              <div className={`h-full bg-lime rounded ${running ? 'animate-pulse' : ''}`} style={{ width: running ? "100%" : "0%" }} />
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

          {packets.length === 0 && !running && (
            <div className="flex flex-col items-center justify-center py-24 text-ghost space-y-4">
              <div className="display text-[80px] opacity-10">⬡</div>
              <div className="text-sm">READY FOR CAPTURE</div>
              <button onClick={startCapture} className="btn btn-ghost !text-xs">INITIATE SESSION</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
