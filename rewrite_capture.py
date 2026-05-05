import re

with open("src/routes/app.capture.tsx", "r") as f:
    content = f.read()

# 1. Imports
content = re.sub(
    r'import \{ useState, useEffect, useRef, memo \} from "react";\nimport \{ List \} from "react-window";\nimport \{ useWebSocket \} from "@/hooks/useWebSocket";\nimport \{ WS \} from "@/config/apiConfig";',
    '''import { useState, useEffect, useRef, memo, useCallback } from "react";
import { FixedSizeList as VirtualList } from "react-window";
import { usePacketStream } from "@/hooks/usePacketStream";
import type { Packet } from "@/context/PacketStreamContext";''',
    content
)

# Remove old type Packet
content = re.sub(r'type Packet = \{.*?\};\n', '', content, flags=re.DOTALL)

# 2. Inside Capture component
component_code = '''function Capture() {
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
      listRef.current.scrollToItem(0, "start");
    }
  }, [filteredPackets, autoScroll, isPaused]);
'''

content = re.sub(r'function Capture\(\) \{.*?\n  // On mount — fetch interfaces.*?const ss = String\(elapsed % 60\)\.padStart\(2, "0"\);\n', component_code, content, flags=re.DOTALL)

# Header substitution
content = re.sub(r'\{capturing \? `Capturing on \$\{selectedIface\} · \$\{packets\.length\.toLocaleString\(\)\} packets` : "Engine Idle"\}',
                 '{isPaused ? "PAUSED" : "Capturing"} · {filteredPackets.length.toLocaleString()} packets · {packetRate} pkt/s', content)
content = re.sub(r'\{!connected && <span className="badge badge-danger text-\[10px\]">OFFLINE</span>\}',
                 '{!isConnected && <span className="badge badge-danger text-[10px]">OFFLINE</span>}', content)
content = re.sub(r'\{simulated && capturing && <span className="badge badge-warn text-\[10px\]">SIMULATED</span>\}',
                 '{isMockMode && !isPaused && <span className="badge badge-warn text-[10px]">SIMULATED</span>}', content)
content = re.sub(r'\{`dot \$\{capturing \? \'dot-lime animate-pulse\' : \'dot-ghost\'\}`\}',
                 '={`dot ${!isPaused ? "dot-lime animate-pulse" : "dot-ghost"}`}', content)

# Buttons and inputs substitution
content = re.sub(r'onClick=\{.*?\}[\s\n]*disabled=\{!connected\}[\s\n]*className=\{`btn \$\{capturing \? "btn-danger" : "btn-primary"\} min-w-\[160px\]`\}[\s\n]*>[\s\n]*\{capturing \? <><Square size=\{14\} /> STOP CAPTURE</> : <><Play size=\{14\} /> START CAPTURE</>\}',
                 '''onClick={togglePause}
            className={`btn ${!isPaused ? "btn-danger" : "btn-primary"} min-w-[160px]`}
          >
            {!isPaused ? <><Square size={14} /> PAUSE CAPTURE</> : <><Play size={14} /> RESUME CAPTURE</>}''', content)

content = re.sub(r'value=\{selectedIface\} onChange=\{e => setSelectedIface\(e.target.value\)\}[\s\n]*>[\s\n]*\{interfaces\.map\(i => \([\s\n]*<option key=\{i\} value=\{i\} className="bg-obsidian">\{i\}</option>[\s\n]*\)\)\}',
                 '''value="Simulated Traffic" onChange={() => {}}>
              <option value="Simulated Traffic" className="bg-obsidian">Simulated Traffic</option>''', content)

content = re.sub(r'className="input mono !text-xs !py-1\.5 flex-1 min-w-\[200px\]"[\s\n]*placeholder="tcp port 80 or udp"[\s\n]*value=\{bpf\}[\s\n]*onChange=\{e => setBpf\(e.target.value\)\}',
                 '''className="input mono !text-xs !py-1.5 flex-1 min-w-[200px]"
            placeholder="Filter: tcp, udp, host 192.168.1.45, port 443"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}''', content)

# Remove the old hh:mm:ss since we don't have elapsed anymore, maybe just put 00:00:00 for now.
content = re.sub(r'<div className="display text-\[22px\] text-white mono">\{hh\}:\{mm\}:\{ss\}</div>',
                 '<div className="display text-[22px] text-white mono">LIVE</div>', content)
content = re.sub(r'\{`h-full bg-lime rounded \$\{capturing \? \'animate-pulse\' : \'\'\}`\} style=\{\{ width: capturing \? "100%" : "0%" \}\}',
                 '{`h-full bg-lime rounded ${!isPaused ? "animate-pulse" : ""}`} style={{ width: !isPaused ? "100%" : "0%" }}', content)


# List replacement
list_code = """<VirtualList
            ref={listRef}
            height={550}
            itemCount={filteredPackets.length}
            itemSize={40}
            width="100%"
            onScroll={({ scrollOffset }) => {
              if (scrollOffset > 40) setAutoScroll(false);
              else setAutoScroll(true);
            }}
          >
            {({ index, style }) => {
              const pkt = filteredPackets[index];
              return (
                <div
                  style={style}
                  key={pkt.id}
                  className="flex items-center gap-4 px-4 border-b border-graphite/30 hover:bg-white/5 transition-colors mono text-[11px] leading-[40px]"
                  onClick={() => setSelectedPacket(pkt)}
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
            }}
          </VirtualList>"""

content = re.sub(r'<List.*?/>', list_code, content, flags=re.DOTALL)
content = re.sub(r'\{packets\.length === 0 && !capturing && \([\s\S]*?</button>\n            </div>\n          \)\}', '', content)

# Remove Row memo component
content = re.sub(r'const Row = memo\(\(\{.*?\}\);', '', content, flags=re.DOTALL)

with open("src/routes/app.capture.tsx", "w") as f:
    f.write(content)

