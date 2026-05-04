import { useState, useEffect, useRef } from "react";
import { usePacketStream } from "./usePacketStream";
import { GEOIP } from "@/data/geoipData";

export interface MapArc {
  id: string;               // "src_ip→dst_ip"
  srcIp: string;
  dstIp: string;
  srcLat: number;
  srcLng: number;
  dstLat: number;
  dstLng: number;
  srcCity: string;
  dstCity: string;
  packetCount: number;
  bytes: number;
  protocol: string;
  isThreat: boolean;
  lastActive: number;       // Unix ms — arc fades if stale > 10s
  isActive: boolean;        // true if lastActive within last 10 seconds
}

export function useMapArcs() {
  const { subscribe } = usePacketStream();
  const arcMap = useRef<Map<string, MapArc>>(new Map());
  const [arcs, setArcs] = useState<MapArc[]>([]);

  useEffect(() => {
    const unsub = subscribe((pkt) => {
      const { src_ip, dst_ip, bytes, protocol, timestamp } = pkt;
      
      const srcGeo = GEOIP[src_ip];
      const dstGeo = GEOIP[dst_ip];
      if (!srcGeo || !dstGeo) return;
      
      const srcInternal = src_ip.startsWith("192.168.") || src_ip.startsWith("10.");
      const dstInternal = dst_ip.startsWith("192.168.") || dst_ip.startsWith("10.");
      if (srcInternal && dstInternal) return;

      const arcKey = `${src_ip}→${dst_ip}`;
      const existing = arcMap.current.get(arcKey);

      if (existing) {
        existing.packetCount += 1;
        existing.bytes += bytes;
        existing.lastActive = timestamp;
        existing.isActive = true;
        existing.protocol = protocol;
      } else {
        arcMap.current.set(arcKey, {
          id: arcKey,
          srcIp: src_ip,
          dstIp: dst_ip,
          srcLat: srcGeo.lat,
          srcLng: srcGeo.lng,
          dstLat: dstGeo.lat,
          dstLng: dstGeo.lng,
          srcCity: srcGeo.city,
          dstCity: dstGeo.city,
          packetCount: 1,
          bytes,
          protocol,
          isThreat: srcGeo.isThreat || dstGeo.isThreat,
          lastActive: timestamp,
          isActive: true,
        });
      }
    });

    return unsub;
  }, [subscribe]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const STALE_MS = 10_000;

      for (const arc of arcMap.current.values()) {
        arc.isActive = (now - arc.lastActive) < STALE_MS;
      }

      for (const [key, arc] of arcMap.current.entries()) {
        if ((now - arc.lastActive) > 30_000) {
          arcMap.current.delete(key);
        }
      }

      setArcs(Array.from(arcMap.current.values()));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { arcs };
}
