import { useState, useEffect, useRef } from "react";
import { usePacketStream } from "@/hooks/usePacketStream";

export interface GraphNode {
  id: string;
  hostname: string;
  isInternal: boolean;
  isThreat: boolean;
  totalBytes: number;
  packetCount: number;
  lastSeen: number;
  // D3 force simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  index?: number;
}

export interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  bytes: number;
  packetCount: number;
  lastActive: number;
  isThreat: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const THREAT_IPS = new Set([
  "167.88.162.34",
  "185.220.101.45",
]);

const HOSTNAMES: Record<string, string> = {
  "192.168.1.10":   "DESKTOP-MAIN",
  "192.168.1.45":   "LAPTOP-KARAN",
  "192.168.1.101":  "WORKSTATION-DEV",
  "192.168.1.200":  "UNKNOWN-DEVICE",
  "192.168.1.234":  "TOR-USER",
  "10.0.0.5":       "SERVER-INTERNAL",
  "8.8.8.8":        "Google DNS",
  "1.1.1.1":        "Cloudflare DNS",
  "93.184.216.34":  "example.com",
  "172.217.14.46":  "Google",
  "167.88.162.34":  "C2-SERVER",
  "185.220.101.45": "Tor Exit Node",
  "104.21.14.100":  "CDN-Node",
  "151.101.1.140":  "Reddit CDN",
};

export function useGraphData() {
  const nodeMap = useRef<Map<string, GraphNode>>(new Map());
  const edgeMap = useRef<Map<string, GraphEdge>>(new Map());

  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const { subscribe } = usePacketStream();

  useEffect(() => {
    const unsub = subscribe((pkt) => {
      const { src_ip, dst_ip, bytes, timestamp } = pkt;
      const isInternal = (ip: string) => ip.startsWith("192.168.") || ip.startsWith("10.");

      // Upsert source node
      const srcNode = nodeMap.current.get(src_ip) ?? {
        id: src_ip,
        hostname: HOSTNAMES[src_ip] ?? src_ip,
        isInternal: isInternal(src_ip),
        isThreat: THREAT_IPS.has(src_ip),
        totalBytes: 0,
        packetCount: 0,
        lastSeen: timestamp,
      };
      srcNode.totalBytes += bytes;
      srcNode.packetCount += 1;
      srcNode.lastSeen = timestamp;
      nodeMap.current.set(src_ip, srcNode);

      // Upsert destination node
      const dstNode = nodeMap.current.get(dst_ip) ?? {
        id: dst_ip,
        hostname: HOSTNAMES[dst_ip] ?? dst_ip,
        isInternal: isInternal(dst_ip),
        isThreat: THREAT_IPS.has(dst_ip),
        totalBytes: 0,
        packetCount: 0,
        lastSeen: timestamp,
      };
      dstNode.totalBytes += bytes;
      dstNode.packetCount += 1;
      dstNode.lastSeen = timestamp;
      nodeMap.current.set(dst_ip, dstNode);

      // Upsert edge
      const edgeKey = `${src_ip}→${dst_ip}`;
      const edge = edgeMap.current.get(edgeKey) ?? {
        id: edgeKey,
        source: src_ip,
        target: dst_ip,
        bytes: 0,
        packetCount: 0,
        lastActive: timestamp,
        isThreat: THREAT_IPS.has(src_ip) || THREAT_IPS.has(dst_ip),
      };
      edge.bytes += bytes;
      edge.packetCount += 1;
      edge.lastActive = timestamp;
      edgeMap.current.set(edgeKey, edge);
    });

    return unsub;
  }, [subscribe]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGraphData({
        nodes: Array.from(nodeMap.current.values()),
        edges: Array.from(edgeMap.current.values()),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { graphData };
}
