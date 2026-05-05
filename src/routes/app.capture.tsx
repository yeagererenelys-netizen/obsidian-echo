import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Layout";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { VIDEOS } from "@/config/videoConfig";
import { Play, Square, Activity } from "lucide-react";
import { useState, useEffect, useRef, memo, useCallback } from "react";
import { List as VirtualList } from "react-window";
import { usePacketStream } from "@/hooks/usePacketStream";
import type { Packet } from "@/context/PacketStreamContext";

export const Route = createFileRoute("/app/capture")({ component: Capture });

const protoBadge = (p: string) => {
  const map: Record<string, string> = { TCP: "badge-lime", UDP: "badge-neutral", DNS: "badge-warn", HTTP: "badge-info", TLS: "badge-info", ICMP: "badge-neutral" };
  return map[p] || "badge-neutral";
};

const Row = memo(({
  index,
  style,
  ariaAttributes,
  filteredPackets,
  setSelectedPacket,
}: {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: any;
  filteredPackets: Packet[];
  setSelectedPacket: (p: Packet) => void;
}) => {
  const pkt = filteredPackets[index];
  if (!pkt) return null;
  return (
    <div
      style={style}
      key={pkt.id}
      className="flex items-center gap-4 px-4 border-b border-graphite/30 hover:bg-white/5 transition-colors mono text-[11px] leading-[40px] cursor-pointer"
      onClick={() => setSelectedPacket(pkt)}
      {...ariaAttributes}
    >
      <div className="w-12 text-ghost">{pkt.id}</div>
      <div className="w-24 text-silver">{new Date(pkt.timestamp).toISOString().slice(11,19)}</div>
      <div className="w-40 text-white truncate">{pkt.src_ip}:{pkt.src_port}</div>
      <div className="w-40 text-white truncate">{pkt.dst_ip}:{pkt.dst_port}</div>
      <div className="w-20"><span className={`badge ${protoBadge(pkt.protocol)}`}>{pkt.protocol}</span></div>
      <div className="w-16 text-silver">{pkt.bytes}</div>
      <div className="w-24 text-ghost truncate">{pkt.flags ?? "—"}</div>
      <div className="flex-1 text-silver truncate">{"Packet length " + pkt.bytes}</div>
    </div>
  );
});

function Capture() {
  const { subscribe, isConnected, isMockMode, packetRate } = usePacketStream();

  const [packets, setPackets] = useState<Packet[]>([]);
  const packetBufferRef = useRef<Packet[]>([]);
  const MAX_PACKETS = 2000;

  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);

  const [filterText, setFilterText] = useState("");
  const [filteredPackets, setFilteredPackets] = useState<Packet[]>([]);

  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);

  const listRef = useRef<VirtualList>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const unsub = subscribe((pkt: Packet) => {
      if (isPausedRef.current) return;

      packetBufferRef.current = [pkt, ...packetBufferRef.current];
      if (packetBufferRef.current.length > MAX_PACKETS) {
        packetBufferRef.current = packetBufferRef.current.slice(0, MAX_PACKETS);
      }
      setPackets([...packetBufferRef.current]);
    });
    return unsub;
  }, [subscribe]);

  const togglePause = useCallback(() => {
    const next = !isPausedRef.current;
    isPausedRef.current = next;
    setIsPaused(next);
  }, []);

  useEffect(() => {
    if (!filterText.trim()) {
      setFilteredPackets(packets);
      return;
    }

    const f = filterText.trim().toLowerCase();

    setFilteredPackets(packets.filter(pkt => {
      if (pkt.protocol.toLowerCase() === f) return true;

      const portMatch = f.match(/^port\s+(\d+)$/);
      if (portMatch) {
        const port = parseInt(portMatch[1]);
        return pkt.src_port === port || pkt.dst_port === port;
      }

      const hostMatch = f.match(/^host\s+([\d.]+)$/);
      if (hostMatch) {
        return pkt.src_ip === hostMatch[1] || pkt.dst_ip === hostMatch[1];
      }

      return (
        pkt.src_ip.includes(f) ||
        pkt.dst_ip.includes(f) ||
        pkt.protocol.toLowerCase().includes(f) ||
        String(pkt.src_port).includes(f) ||
        String(pkt.dst_port).includes(f) ||
        (pkt.flags ?? "").toLowerCase().includes(f)
      );
    }));
  }, [packets, filterText]);

  useEffect(() => {
    if (autoScroll && listRef.current && !isPaused && filteredPackets.length > 0) {
      listRef.current.scrollToRow({ index: 0, align: "start" });
    }
  }, [filteredPackets, autoScroll, isPaused]);

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
              <span className={`dot ${!isPaused ? 'dot-lime animate-pulse' : 'dot-ghost'}`} />
              {isPaused ? "PAUSED" : "Capturing"} · {filteredPackets.length.toLocaleString()} packets · {packetRate} pkt/s
              {!isConnected && <span className="badge badge-danger text-[10px]">OFFLINE</span>}
              {isMockMode && !isPaused && <span className="badge badge-warn text-[10px]">SIMULATED</span>}
            </div>
          }
        />

        <div className="ps-card !p-3 mb-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={togglePause}
            className={`btn ${!isPaused ? "btn-danger" : "btn-primary"} min-w-[160px]`}
          >
            {!isPaused ? <><Square size={14} /> PAUSE CAPTURE</> : <><Play size={14} /> RESUME CAPTURE</>}
          </button>

          
          <div className="flex items-center bg-carbon rounded px-2 border border-graphite">
            <Activity size={14} className="text-ghost ml-1" />
            <select className="bg-transparent border-none mono text-[11px] text-white py-1 focus:ring-0 cursor-pointer" value="Simulated Traffic" onChange={() => {}}>
              <option value="Simulated Traffic" className="bg-obsidian">Simulated Traffic</option>
            </select>
          </div>

          
          <input
            className="input mono !text-xs !py-1.5 flex-1 min-w-[200px]"
            placeholder="Filter: tcp, udp, host 192.168.1.45, port 443"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />

          
          <div className="flex items-center gap-4">
            <div className="display text-[22px] text-white mono">LIVE</div>
            <div className="w-24 h-1 bg-carbon rounded overflow-hidden">
              <div className={`h-full bg-lime rounded ${!isPaused ? 'animate-pulse' : ''}`} style={{ width: !isPaused ? "100%" : "0%" }} />
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
          
          <VirtualList
            listRef={listRef as any}
            style={{ height: 550, width: "100%" }}
            rowCount={filteredPackets.length}
            rowHeight={40}
            rowComponent={Row}
            rowProps={{ filteredPackets, setSelectedPacket }}
            onRowsRendered={({ startIndex }) => {
              setAutoScroll(startIndex === 0);
            }}
          />
        </div>
      </div>
    </div>
  );
}
