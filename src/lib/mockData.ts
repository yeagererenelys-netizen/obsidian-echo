// ─── PacketScope Mock Data — consistent across all pages ───

export const MOCK_DEVICES = [
  { ip: "192.168.1.1", name: "Gateway Router", mac: "A8:5E:45:F3:21:0A", model: "ASUS RT-AX88U", type: "router", anomaly: 12, firstSeen: "2025-04-28 08:12:00", lastSeen: "now", totalPackets: 184210, totalBytes: 2_140_000_000, sessions: 842, uniqueDests: 18, topProtos: { HTTP: 30, HTTPS: 50, DNS: 15, Other: 5 } },
  { ip: "192.168.1.45", name: "LAPTOP-KARAN", mac: "4C:CC:6A:BB:11:22", model: "Dell XPS 15", type: "internal", anomaly: 97, firstSeen: "2025-04-28 09:04:00", lastSeen: "now", totalPackets: 94021, totalBytes: 890_000_000, sessions: 412, uniqueDests: 47, topProtos: { HTTP: 15, HTTPS: 60, DNS: 20, Suspicious: 5 } },
  { ip: "192.168.1.89", name: "DESKTOP-ANUJ", mac: "D4:3B:04:EC:99:AA", model: "Custom PC", type: "internal", anomaly: 68, firstSeen: "2025-04-29 14:30:00", lastSeen: "now", totalPackets: 64820, totalBytes: 720_000_000, sessions: 301, uniqueDests: 34, topProtos: { HTTP: 10, HTTPS: 55, DNS: 10, VPN: 25 } },
  { ip: "192.168.1.105", name: "RASPI-SENSOR", mac: "B8:27:EB:11:22:33", model: "Raspberry Pi 4", type: "internal", anomaly: 23, firstSeen: "2025-04-28 08:15:00", lastSeen: "now", totalPackets: 21400, totalBytes: 180_000_000, sessions: 64, uniqueDests: 8, topProtos: { HTTP: 40, HTTPS: 30, DNS: 25, MQTT: 5 } },
  { ip: "192.168.1.200", name: "UNKNOWN-DEVICE", mac: "00:11:22:33:44:55", model: "unidentified", type: "threat", anomaly: 89, firstSeen: "2025-05-03 14:23:00", lastSeen: "now", totalPackets: 12847, totalBytes: 42_000_000, sessions: 847, uniqueDests: 1, topProtos: { TCP: 95, ICMP: 5 } },
  { ip: "192.168.1.234", name: "PHONE-RAHUL", mac: "F0:77:C3:44:55:66", model: "OnePlus 11", type: "internal", anomaly: 45, firstSeen: "2025-05-01 18:22:00", lastSeen: "now", totalPackets: 38200, totalBytes: 1_200_000_000, sessions: 122, uniqueDests: 28, topProtos: { HTTP: 5, HTTPS: 60, DNS: 10, Tor: 25 } },
];

export const MOCK_BEACONS = [
  { ip: "192.168.1.45", dst: "167.88.162.34", interval: "30.0s", jitter: "0.3s", reg: 0.97, confidence: 98, events: 94, duration: "47m", status: "CONFIRMED BEACON", sev: "critical", protocol: "HTTPS", port: 443, payloadSize: 180 },
  { ip: "192.168.1.42", dst: "update.verysuspicious-domain.cc", interval: "60.2s", jitter: "1.1s", reg: 0.84, confidence: 78, events: 41, duration: "41m", status: "MONITORING", sev: "warn", protocol: "DNS", port: 53, payloadSize: 64 },
  { ip: "192.168.1.89", dst: "104.21.55.10", interval: "120.5s", jitter: "4.2s", reg: 0.71, confidence: 52, events: 18, duration: "36m", status: "MONITORING", sev: "warn", protocol: "HTTPS", port: 443, payloadSize: 320 },
];

export const MOCK_ALERTS = [
  { id: 1, sev: "critical", title: "C2 Beacon Suspected", src: "192.168.1.45", dst: "167.88.162.34", t: "12:42:18", desc: "Inter-arrival regularity 0.97 — extremely periodic HTTPS connections to unregistered IP.", evidence: "30.0s ± 0.2s for 94 packets over 47 minutes" },
  { id: 2, sev: "critical", title: "Tor Exit Node Connection", src: "192.168.1.234", dst: "185.220.101.45", t: "12:39:55", desc: "Connection to known Tor exit node. 847MB transferred over 2 hours.", evidence: "ASN 60729 — Zwiebelfreunde e.V., Frankfurt, Germany" },
  { id: 3, sev: "warn", title: "VPN Traffic (OpenVPN)", src: "192.168.1.89", dst: "UDP 1194", t: "12:41:02", desc: "OpenVPN handshake detected on non-standard port.", evidence: "TLS-style handshake on UDP 1194, M247 VPN provider" },
  { id: 4, sev: "warn", title: "Suspicious Domain Lookup", src: "192.168.1.42", dst: "update.verysuspicious-domain.cc", t: "12:38:11", desc: "Lookup of low-reputation .cc domain matching DGA pattern.", evidence: "Resolved to 185.130.104.23 — known malware C2 in threat intel" },
  { id: 5, sev: "critical", title: "Port Scan Detected", src: "192.168.1.200", dst: "192.168.1.105", t: "12:36:40", desc: "847 distinct ports probed in 2 minutes. Classic SYN stealth scan.", evidence: "SYN-scan: 847 ports on 192.168.1.105, 14:23:11–14:25:09" },
];

export const MOCK_VPN = [
  { ip: "192.168.1.89", type: "OpenVPN", method: "Port Fingerprinting", confidence: 94, protocol: "UDP 1194", evidence: "TLS handshake on UDP 1194", asn: "AS9009 M247", country: "DE", firstDetected: "12:41:02", status: "CONFIRMED" },
  { ip: "192.168.1.234", type: "Tor", method: "Exit Node Match", confidence: 99, protocol: "TCP 9001", evidence: "Exit node match (185.220.101.45)", asn: "AS60729", country: "DE", firstDetected: "12:39:55", status: "CONFIRMED" },
  { ip: "192.168.1.42", type: "SOCKS5", method: "Protocol Heuristics", confidence: 72, protocol: "TCP 1080", evidence: "SOCKS5 handshake on TCP 1080", asn: "AS14061 DigitalOcean", country: "US", firstDetected: "12:38:11", status: "MONITORING" },
];

export const MOCK_MAP_CONNECTIONS = [
  { src: "192.168.1.45", srcLat: 28.6139, srcLng: 77.2090, dst: "167.88.162.34", dstLat: 40.7128, dstLng: -74.006, country: "US", city: "New York", bytes: 8920000, protocol: "HTTPS", threat: true, type: "beacon" },
  { src: "192.168.1.234", srcLat: 28.6139, srcLng: 77.2090, dst: "185.220.101.45", dstLat: 50.1109, dstLng: 8.6821, country: "DE", city: "Frankfurt", bytes: 847000000, protocol: "Tor", threat: true, type: "tor" },
  { src: "192.168.1.89", srcLat: 28.6139, srcLng: 77.2090, dst: "45.76.113.201", dstLat: 52.5200, dstLng: 13.4050, country: "DE", city: "Berlin", bytes: 520000000, protocol: "VPN", threat: false, type: "vpn" },
  { src: "192.168.1.1", srcLat: 28.6139, srcLng: 77.2090, dst: "142.250.80.100", dstLat: 37.3861, dstLng: -122.084, country: "US", city: "Mountain View", bytes: 42000000, protocol: "HTTPS", threat: false, type: "normal" },
  { src: "192.168.1.1", srcLat: 28.6139, srcLng: 77.2090, dst: "151.101.1.140", dstLat: 37.7749, dstLng: -122.4194, country: "US", city: "San Francisco", bytes: 18000000, protocol: "HTTPS", threat: false, type: "normal" },
  { src: "192.168.1.45", srcLat: 28.6139, srcLng: 77.2090, dst: "104.16.123.96", dstLat: 37.7749, dstLng: -122.4194, country: "US", city: "San Francisco", bytes: 12000000, protocol: "HTTPS", threat: false, type: "cdn" },
  { src: "192.168.1.105", srcLat: 28.6139, srcLng: 77.2090, dst: "13.107.42.14", dstLat: 47.6062, dstLng: -122.3321, country: "US", city: "Seattle", bytes: 3400000, protocol: "HTTPS", threat: false, type: "datacenter" },
  { src: "192.168.1.200", srcLat: 28.6139, srcLng: 77.2090, dst: "91.239.100.100", dstLat: 55.7558, dstLng: 37.6173, country: "RU", city: "Moscow", bytes: 2100000, protocol: "TCP", threat: true, type: "suspicious" },
  { src: "192.168.1.1", srcLat: 28.6139, srcLng: 77.2090, dst: "1.1.1.1", dstLat: -33.8688, dstLng: 151.2093, country: "AU", city: "Sydney", bytes: 8200000, protocol: "DNS", threat: false, type: "normal" },
  { src: "192.168.1.234", srcLat: 28.6139, srcLng: 77.2090, dst: "116.202.120.166", dstLat: 49.4875, dstLng: 8.4660, country: "DE", city: "Mannheim", bytes: 21000000, protocol: "Tor", threat: true, type: "tor" },
];

export const MOCK_GRAPH_NODES = [
  { id: "192.168.1.1", label: "Gateway Router", type: "router", threatLevel: 0, packetCount: 184210 },
  { id: "192.168.1.45", label: "LAPTOP-KARAN", type: "internal", threatLevel: 2, packetCount: 94021 },
  { id: "192.168.1.89", label: "DESKTOP-ANUJ", type: "internal", threatLevel: 1, packetCount: 64820 },
  { id: "192.168.1.105", label: "RASPI-SENSOR", type: "internal", threatLevel: 0, packetCount: 21400 },
  { id: "192.168.1.200", label: "UNKNOWN", type: "threat", threatLevel: 2, packetCount: 12847 },
  { id: "192.168.1.234", label: "PHONE-RAHUL", type: "internal", threatLevel: 1, packetCount: 38200 },
  { id: "142.250.80.100", label: "Google", type: "external", threatLevel: 0, packetCount: 32100 },
  { id: "167.88.162.34", label: "C2 Server?", type: "threat", threatLevel: 2, packetCount: 940 },
  { id: "185.220.101.45", label: "Tor Exit", type: "threat", threatLevel: 2, packetCount: 4200 },
  { id: "104.21.55.10", label: "Cloudflare", type: "external", threatLevel: 0, packetCount: 8400 },
  { id: "151.101.1.140", label: "Fastly CDN", type: "external", threatLevel: 0, packetCount: 12800 },
  { id: "1.1.1.1", label: "Cloudflare DNS", type: "external", threatLevel: 0, packetCount: 22000 },
  { id: "8.8.8.8", label: "Google DNS", type: "external", threatLevel: 0, packetCount: 18500 },
  { id: "91.239.100.100", label: "Suspicious RU", type: "threat", threatLevel: 2, packetCount: 2100 },
  { id: "13.107.42.14", label: "Microsoft", type: "external", threatLevel: 0, packetCount: 6800 },
  { id: "45.76.113.201", label: "VPN Endpoint", type: "external", threatLevel: 1, packetCount: 42000 },
  { id: "104.16.123.96", label: "Cloudflare", type: "external", threatLevel: 0, packetCount: 9200 },
  { id: "185.130.104.23", label: "Malware C2", type: "threat", threatLevel: 2, packetCount: 410 },
  { id: "116.202.120.166", label: "Tor Relay", type: "threat", threatLevel: 2, packetCount: 3100 },
  { id: "198.41.0.4", label: "Root DNS", type: "external", threatLevel: 0, packetCount: 4800 },
];

export const MOCK_GRAPH_EDGES = [
  { source: "192.168.1.1", target: "142.250.80.100", volume: 32100, protocol: "HTTPS", threatLevel: 0, active: true },
  { source: "192.168.1.45", target: "167.88.162.34", volume: 8920, protocol: "HTTPS", threatLevel: 2, active: true },
  { source: "192.168.1.45", target: "142.250.80.100", volume: 18200, protocol: "HTTPS", threatLevel: 0, active: true },
  { source: "192.168.1.234", target: "185.220.101.45", volume: 42000, protocol: "Tor", threatLevel: 2, active: true },
  { source: "192.168.1.234", target: "116.202.120.166", volume: 21000, protocol: "Tor", threatLevel: 2, active: false },
  { source: "192.168.1.89", target: "45.76.113.201", volume: 42000, protocol: "VPN", threatLevel: 1, active: true },
  { source: "192.168.1.89", target: "104.21.55.10", volume: 8400, protocol: "HTTPS", threatLevel: 0, active: true },
  { source: "192.168.1.200", target: "192.168.1.105", volume: 847, protocol: "TCP", threatLevel: 2, active: false },
  { source: "192.168.1.200", target: "91.239.100.100", volume: 2100, protocol: "TCP", threatLevel: 2, active: true },
  { source: "192.168.1.1", target: "1.1.1.1", volume: 22000, protocol: "DNS", threatLevel: 0, active: true },
  { source: "192.168.1.1", target: "8.8.8.8", volume: 18500, protocol: "DNS", threatLevel: 0, active: true },
  { source: "192.168.1.45", target: "151.101.1.140", volume: 12800, protocol: "HTTPS", threatLevel: 0, active: true },
  { source: "192.168.1.45", target: "104.16.123.96", volume: 9200, protocol: "HTTPS", threatLevel: 0, active: false },
  { source: "192.168.1.1", target: "13.107.42.14", volume: 6800, protocol: "HTTPS", threatLevel: 0, active: true },
  { source: "192.168.1.1", target: "198.41.0.4", volume: 4800, protocol: "DNS", threatLevel: 0, active: false },
  { source: "192.168.1.42", target: "185.130.104.23", volume: 410, protocol: "DNS", threatLevel: 2, active: false },
  { source: "192.168.1.105", target: "142.250.80.100", volume: 3400, protocol: "HTTPS", threatLevel: 0, active: true },
  { source: "192.168.1.234", target: "104.16.123.96", volume: 4100, protocol: "HTTPS", threatLevel: 0, active: true },
  { source: "192.168.1.89", target: "142.250.80.100", volume: 12300, protocol: "HTTPS", threatLevel: 0, active: true },
  { source: "192.168.1.1", target: "192.168.1.45", volume: 94021, protocol: "Mixed", threatLevel: 0, active: true },
  { source: "192.168.1.1", target: "192.168.1.89", volume: 64820, protocol: "Mixed", threatLevel: 0, active: true },
  { source: "192.168.1.1", target: "192.168.1.105", volume: 21400, protocol: "Mixed", threatLevel: 0, active: true },
  { source: "192.168.1.1", target: "192.168.1.200", volume: 12847, protocol: "TCP", threatLevel: 1, active: true },
  { source: "192.168.1.1", target: "192.168.1.234", volume: 38200, protocol: "Mixed", threatLevel: 0, active: true },
];

const PROTOS = ["TCP", "UDP", "DNS", "HTTP", "TLS", "ICMP"] as const;
const IPS_SRC = ["192.168.1.45", "192.168.1.89", "192.168.1.105", "192.168.1.200", "192.168.1.234", "192.168.1.1"];
const IPS_DST = ["142.250.80.100", "167.88.162.34", "185.220.101.45", "104.21.55.10", "8.8.8.8", "1.1.1.1", "91.239.100.100"];

let _pktId = 8472;
export function generateMockPacket() {
  _pktId++;
  const now = new Date();
  const src = IPS_SRC[Math.floor(Math.random() * IPS_SRC.length)];
  const isBeacon = src === "192.168.1.45" && Math.random() > 0.7;
  const dst = isBeacon ? "167.88.162.34" : IPS_DST[Math.floor(Math.random() * IPS_DST.length)];
  const proto = PROTOS[Math.floor(Math.random() * PROTOS.length)];
  return {
    id: _pktId,
    timestamp: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`,
    src,
    dst,
    srcPort: 1024 + Math.floor(Math.random() * 64000),
    dstPort: [80, 443, 53, 8080, 1194, 9001][Math.floor(Math.random() * 6)],
    protocol: proto,
    length: 60 + Math.floor(Math.random() * 1400),
    info: isBeacon ? "TCP keepalive — beacon candidate" : `${proto} ${dst}`,
    flags: proto === "TCP" ? ["SYN", "SYN|ACK", "ACK", "PSH|ACK", "FIN|ACK"][Math.floor(Math.random() * 5)] : "",
    ttl: [64, 128, 255][Math.floor(Math.random() * 3)],
    flag: isBeacon ? "threat" as const : src === "192.168.1.200" ? "warn" as const : null,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1073741824).toFixed(1) + " GB";
}
