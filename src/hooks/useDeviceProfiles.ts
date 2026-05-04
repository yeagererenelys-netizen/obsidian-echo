import { useState, useEffect, useRef } from "react";
import { usePacketStream } from "@/hooks/usePacketStream";

export interface DeviceProtocolBreakdown {
  protocol: string;
  count: number;
  percent: number;
}

export interface DeviceTimelinePoint {
  time: string;
  bytesOut: number;
  bytesIn: number;
  baseline: number;
}

export interface DeviceProfile {
  ip: string;
  hostname: string;
  totalBytesOut: number;
  totalBytesIn: number;
  totalPackets: number;
  bytesPerSecond: number;
  anomalyScore: number;
  lastSeen: number;
  protocols: DeviceProtocolBreakdown[];
  timeline: DeviceTimelinePoint[];
  isInternal: boolean;
  threatLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

const HOSTNAMES: Record<string, string> = {
  "192.168.1.10":  "DESKTOP-MAIN",
  "192.168.1.45":  "LAPTOP-KARAN",
  "192.168.1.101": "WORKSTATION-DEV",
  "192.168.1.200": "UNKNOWN-DEVICE",
  "192.168.1.234": "TOR-USER",
  "10.0.0.5":      "SERVER-INTERNAL",
  "8.8.8.8":       "Google DNS",
  "1.1.1.1":       "Cloudflare DNS",
  "93.184.216.34": "example.com",
  "172.217.14.46": "Google",
  "167.88.162.34": "C2-SERVER",
  "185.220.101.45":"Tor Exit Node",
  "104.21.14.100": "CDN-Node",
  "151.101.1.140": "Reddit CDN",
};

const BASELINES: Record<string, number> = {
  "192.168.1.10":  450,
  "192.168.1.45":  120,
  "192.168.1.101": 680,
  "192.168.1.200": 50,
  "192.168.1.234": 80,
  "10.0.0.5":      1200,
};

export function useDeviceProfiles() {
  const perDeviceBytesOut = useRef<Map<string, number>>(new Map());
  const perDeviceBytesIn  = useRef<Map<string, number>>(new Map());
  const perDevicePackets  = useRef<Map<string, number>>(new Map());
  const perDeviceProtocols = useRef<Map<string, Map<string, number>>>(new Map());
  const perDeviceLastSeen = useRef<Map<string, number>>(new Map());
  
  const secondBytesOut = useRef<Map<string, number>>(new Map());
  const secondBytesIn  = useRef<Map<string, number>>(new Map());
  const timelineBuffers = useRef<Map<string, DeviceTimelinePoint[]>>(new Map());

  const [profiles, setProfiles] = useState<DeviceProfile[]>([]);
  const [selectedIp, setSelectedIp] = useState<string | null>(null);

  const { subscribe } = usePacketStream();

  useEffect(() => {
    const unsub = subscribe((pkt) => {
      const { src_ip, dst_ip, bytes, protocol, timestamp } = pkt;

      perDeviceBytesOut.current.set(src_ip, (perDeviceBytesOut.current.get(src_ip) ?? 0) + bytes);
      perDeviceBytesIn.current.set(dst_ip, (perDeviceBytesIn.current.get(dst_ip) ?? 0) + bytes);

      perDevicePackets.current.set(src_ip, (perDevicePackets.current.get(src_ip) ?? 0) + 1);
      perDevicePackets.current.set(dst_ip, (perDevicePackets.current.get(dst_ip) ?? 0) + 1);

      if (!perDeviceProtocols.current.has(src_ip)) {
        perDeviceProtocols.current.set(src_ip, new Map());
      }
      const protoMap = perDeviceProtocols.current.get(src_ip)!;
      protoMap.set(protocol, (protoMap.get(protocol) ?? 0) + 1);

      perDeviceLastSeen.current.set(src_ip, timestamp);
      perDeviceLastSeen.current.set(dst_ip, timestamp);

      secondBytesOut.current.set(src_ip, (secondBytesOut.current.get(src_ip) ?? 0) + bytes);
      secondBytesIn.current.set(dst_ip, (secondBytesIn.current.get(dst_ip) ?? 0) + bytes);
    });

    return unsub;
  }, [subscribe]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      });

      const allIps = new Set([
        ...Object.keys(HOSTNAMES),
        ...perDeviceBytesOut.current.keys(),
        ...perDeviceBytesIn.current.keys(),
      ]);

      const newProfiles: DeviceProfile[] = [];

      for (const ip of allIps) {
        const bytesOut  = perDeviceBytesOut.current.get(ip) ?? 0;
        const bytesIn   = perDeviceBytesIn.current.get(ip) ?? 0;
        const packets   = perDevicePackets.current.get(ip) ?? 0;
        const lastSeen  = perDeviceLastSeen.current.get(ip) ?? Date.now();
        const secOut    = secondBytesOut.current.get(ip) ?? 0;
        const secIn     = secondBytesIn.current.get(ip) ?? 0;
        const bps       = secOut + secIn;
        const baseline  = BASELINES[ip] ?? 300;
        const isInternal = ip.startsWith("192.168.") || ip.startsWith("10.");

        const protoMap  = perDeviceProtocols.current.get(ip) ?? new Map();
        const protoTotal = Array.from(protoMap.values()).reduce((a,b) => a+b, 0);
        const protocols: DeviceProtocolBreakdown[] = Array.from(protoMap.entries())
          .map(([protocol, count]) => ({
            protocol,
            count,
            percent: protoTotal > 0 ? Math.round((count / protoTotal) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count);

        let anomalyScore = 0;
        if (isInternal) {
          const deviation = baseline > 0 ? bps / baseline : 0;
          anomalyScore = Math.min(100, Math.round(deviation * 30));
          
          if (ip === "192.168.1.45") anomalyScore = Math.max(anomalyScore, 87);
          if (ip === "192.168.1.200") anomalyScore = Math.max(anomalyScore, 72);
          if (ip === "192.168.1.234") anomalyScore = Math.max(anomalyScore, 65);
        }

        const threatLevel: DeviceProfile["threatLevel"] =
          anomalyScore >= 85 ? "CRITICAL" :
          anomalyScore >= 65 ? "HIGH" :
          anomalyScore >= 40 ? "MEDIUM" :
          anomalyScore >= 15 ? "LOW" : "NONE";

        if (!timelineBuffers.current.has(ip)) {
          timelineBuffers.current.set(ip, []);
        }
        const buf = timelineBuffers.current.get(ip)!;
        buf.push({
          time: timeLabel,
          bytesOut: secOut,
          bytesIn: secIn,
          baseline,
        });
        if (buf.length > 60) buf.shift();

        newProfiles.push({
          ip,
          hostname: HOSTNAMES[ip] ?? ip,
          totalBytesOut: bytesOut,
          totalBytesIn: bytesIn,
          totalPackets: packets,
          bytesPerSecond: bps,
          anomalyScore,
          lastSeen,
          protocols,
          timeline: [...buf],
          isInternal,
          threatLevel,
        });
      }

      secondBytesOut.current.clear();
      secondBytesIn.current.clear();

      newProfiles.sort((a, b) => {
        if (a.isInternal !== b.isInternal) return a.isInternal ? -1 : 1;
        return b.anomalyScore - a.anomalyScore;
      });

      setProfiles(newProfiles);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { profiles, selectedIp, setSelectedIp };
}
