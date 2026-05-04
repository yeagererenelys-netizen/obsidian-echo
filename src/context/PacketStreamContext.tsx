import React, { createContext, useCallback, useEffect, useRef, useState, ReactNode } from "react";

export interface Packet {
  id: string;
  timestamp: number;        // Unix milliseconds
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: "TCP" | "UDP" | "ICMP" | "DNS" | "HTTP" | "HTTPS" | "OTHER";
  bytes: number;
  flags?: string;
}

export interface PacketStreamState {
  packets: Packet[];        // rolling buffer, max 500 entries, newest first
  isConnected: boolean;     // true only when WebSocket is open
  isMockMode: boolean;      // true when using the simulator fallback
  packetRate: number;       // packets per second, updated every 1000ms
  totalPackets: number;     // total since page load
  lastPacket: Packet | null;
  throughput: number;
  sessionCount: number;
  threatCount: number;
  deviceCount: number;
}

export interface PacketStreamContextType extends PacketStreamState {
  subscribe: (cb: (pkt: Packet) => void) => () => void;
}

export const PacketStreamContext = createContext<PacketStreamContextType | null>(null);

const INTERNAL_IPS = [
  "192.168.1.10",   // DESKTOP-MAIN
  "192.168.1.45",   // LAPTOP-KARAN (the beaconing device — appears frequently)
  "192.168.1.101",  // WORKSTATION-DEV
  "192.168.1.200",  // UNKNOWN-DEVICE (port scanner)
  "192.168.1.234",  // TOR-USER
  "10.0.0.5",       // SERVER-INTERNAL
];

const EXTERNAL_IPS = [
  "8.8.8.8",           // Google DNS
  "1.1.1.1",           // Cloudflare DNS
  "93.184.216.34",     // example.com
  "172.217.14.46",     // Google
  "167.88.162.34",     // C2 server (beaconing target)
  "185.220.101.45",    // Tor exit node
  "104.21.14.100",     // CDN
  "151.101.1.140",     // Reddit CDN
];

const PROTOCOL_WEIGHTS: Array<{ protocol: Packet["protocol"]; weight: number; ports: [number, number] }> = [
  { protocol: "TCP",   weight: 35, ports: [443, 443] },
  { protocol: "HTTPS", weight: 25, ports: [443, 443] },
  { protocol: "HTTP",  weight: 10, ports: [80, 80] },
  { protocol: "DNS",   weight: 15, ports: [53, 53] },
  { protocol: "UDP",   weight: 10, ports: [1024, 65535] },
  { protocol: "ICMP",  weight: 3,  ports: [0, 0] },
  { protocol: "OTHER", weight: 2,  ports: [1024, 65535] },
];

function weightedProtocol() {
  const totalWeight = PROTOCOL_WEIGHTS.reduce((acc, p) => acc + p.weight, 0);
  let r = Math.random() * totalWeight;
  for (const p of PROTOCOL_WEIGHTS) {
    if (r < p.weight) return p;
    r -= p.weight;
  }
  return PROTOCOL_WEIGHTS[0];
}

function randomBytes(): number {
  const r = Math.random();
  if (r < 0.4) return Math.floor(Math.random() * 100) + 40;    // small: ACKs, DNS
  if (r < 0.7) return Math.floor(Math.random() * 500) + 100;   // medium: HTTP
  if (r < 0.9) return Math.floor(Math.random() * 900) + 500;   // large: data transfer
  return Math.floor(Math.random() * 400) + 1100;                // jumbo: file transfer
}

const MOCK_FLAGS = ["SYN", "ACK", "FIN", "RST", "PSH"];

export function PacketStreamProvider({ children }: { children: ReactNode }) {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [packetRate, setPacketRate] = useState(0);
  const [totalPackets, setTotalPackets] = useState(0);
  const [lastPacket, setLastPacket] = useState<Packet | null>(null);
  
  const [throughput, setThroughput] = useState(0);
  const [sessionCount, setSessionCount] = useState(47);
  const [threatCount, setThreatCount] = useState(3);
  const [deviceCount, setDeviceCount] = useState(0);

  const rateCounterRef = useRef(0);
  const subscribersRef = useRef<Set<(pkt: Packet) => void>>(new Set());
  const mockCounterRef = useRef(0);
  
  const throughputCounterRef = useRef(0);
  const seenDevicesRef = useRef<Set<string>>(new Set());
  const tickCounterRef = useRef(0);

  const dispatch = useCallback((pkt: Packet) => {
    setPackets(prev => {
      const next = [pkt, ...prev];
      if (next.length > 500) next.length = 500;
      return next;
    });
    setLastPacket(pkt);
    setTotalPackets(prev => prev + 1);
    rateCounterRef.current += 1;
    throughputCounterRef.current += pkt.bytes;
    seenDevicesRef.current.add(pkt.src_ip);
    seenDevicesRef.current.add(pkt.dst_ip);
    subscribersRef.current.forEach(cb => cb(pkt));
  }, []);

  const subscribe = useCallback((cb: (pkt: Packet) => void) => {
    subscribersRef.current.add(cb);
    return () => {
      subscribersRef.current.delete(cb);
    };
  }, []);

  useEffect(() => {
    const rateInterval = setInterval(() => {
      setPacketRate(rateCounterRef.current);
      rateCounterRef.current = 0;
      
      setThroughput(throughputCounterRef.current);
      throughputCounterRef.current = 0;
      
      setDeviceCount(seenDevicesRef.current.size);
      
      tickCounterRef.current += 1;
      if (tickCounterRef.current % 8 === 0) {
        setSessionCount(prev => prev + 1);
      }
      if (tickCounterRef.current % 30 === 0) {
        setThreatCount(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(rateInterval);
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let mockInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let mockStarted = false;

    const startMockMode = () => {
      if (mockStarted) return;
      mockStarted = true;
      setIsMockMode(true);
      mockInterval = setInterval(() => {
        const packetsToGen = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < packetsToGen; i++) {
          mockCounterRef.current += 1;
          
          let src_ip, dst_ip, protocol, dst_port, src_port, bytes, flags;
          
          if (Math.random() < 0.20) {
            // Beaconing mock
            src_ip = "192.168.1.45";
            dst_ip = "167.88.162.34";
            protocol = "TCP" as Packet["protocol"];
            dst_port = 443;
            src_port = Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
            bytes = randomBytes();
            flags = MOCK_FLAGS[Math.floor(Math.random() * MOCK_FLAGS.length)];
          } else {
            // Random mock
            const allIPs = [...INTERNAL_IPS, ...EXTERNAL_IPS];
            src_ip = allIPs[Math.floor(Math.random() * allIPs.length)];
            dst_ip = allIPs[Math.floor(Math.random() * allIPs.length)];
            while (dst_ip === src_ip) {
              dst_ip = allIPs[Math.floor(Math.random() * allIPs.length)];
            }
            
            const p = weightedProtocol();
            protocol = p.protocol;
            dst_port = Math.floor(Math.random() * (p.ports[1] - p.ports[0] + 1)) + p.ports[0];
            src_port = Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
            bytes = randomBytes();
            flags = protocol === "TCP" ? MOCK_FLAGS[Math.floor(Math.random() * MOCK_FLAGS.length)] : undefined;
          }

          const pkt: Packet = {
            id: `mock-${mockCounterRef.current}`,
            timestamp: Date.now(),
            src_ip,
            dst_ip,
            src_port,
            dst_port,
            protocol,
            bytes,
            flags
          };
          dispatch(pkt);
        }
      }, 800);
    };

    try {
      ws = new WebSocket("/ws/capture");

      ws.onmessage = (event) => {
        try {
          const pkt = JSON.parse(event.data) as Packet;
          dispatch(pkt);
        } catch (e) {
          console.error("Failed to parse packet", e);
        }
      };

      ws.onopen = () => {
        setIsConnected(true);
        setIsMockMode(false);
      };

      const handleCloseOrError = () => {
        setIsConnected(false);
        if (!reconnectTimeout && !mockStarted) {
          reconnectTimeout = setTimeout(() => {
            startMockMode();
          }, 3000);
        }
      };

      ws.onclose = handleCloseOrError;
      ws.onerror = handleCloseOrError;
    } catch (e) {
      console.error("WebSocket init failed", e);
      setIsConnected(false);
      if (!reconnectTimeout && !mockStarted) {
        reconnectTimeout = setTimeout(() => {
          startMockMode();
        }, 3000);
      }
    }

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
      if (mockInterval) clearInterval(mockInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [dispatch]);

  const value: PacketStreamContextType = {
    packets,
    isConnected,
    isMockMode,
    packetRate,
    totalPackets,
    lastPacket,
    throughput,
    sessionCount,
    threatCount,
    deviceCount,
    subscribe
  };

  return (
    <PacketStreamContext.Provider value={value}>
      {children}
    </PacketStreamContext.Provider>
  );
}
