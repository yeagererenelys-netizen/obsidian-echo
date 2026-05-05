import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { usePacketStream } from "@/hooks/usePacketStream";

export interface Alert {
  id: string;
  timestamp: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  type: string;
  src_ip: string;
  dst_ip: string;
  dst_port: number;
  protocol: string;
  message: string;
  acknowledged: boolean;
}

interface AlertStoreContextValue {
  alerts: Alert[];
  unreadCount: number;
  acknowledge: (id: string) => void;
  acknowledgeAll: () => void;
}

export const AlertStoreContext = createContext<AlertStoreContextValue | null>(null);

const SEED_ALERTS: Alert[] = [
  {
    id: "seed-1",
    timestamp: Date.now() - 120_000,
    severity: "CRITICAL",
    type: "BEACONING_DETECTED",
    src_ip: "192.168.1.45",
    dst_ip: "167.88.162.34",
    dst_port: 443,
    protocol: "TCP",
    message: "Periodic C2 beacon detected from LAPTOP-KARAN to known C2 server",
    acknowledged: false,
  },
  {
    id: "seed-2",
    timestamp: Date.now() - 75_000,
    severity: "HIGH",
    type: "PORT_SCAN",
    src_ip: "192.168.1.200",
    dst_ip: "192.168.1.10",
    dst_port: 22,
    protocol: "TCP",
    message: "Low-port sweep detected from UNKNOWN-DEVICE — possible port scan",
    acknowledged: false,
  },
  {
    id: "seed-3",
    timestamp: Date.now() - 30_000,
    severity: "MEDIUM",
    type: "DNS_TUNNELING",
    src_ip: "192.168.1.234",
    dst_ip: "8.8.8.8",
    dst_port: 53,
    protocol: "DNS",
    message: "Oversized DNS payload detected — possible DNS tunneling attempt",
    acknowledged: false,
  },
];

export function AlertStoreProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>(SEED_ALERTS);
  const { subscribe } = usePacketStream();

  const lastFiredRef = useRef<Record<string, number>>({
    BEACONING_DETECTED: 0,
    C2_TRAFFIC: 0,
    PORT_SCAN: 0,
    DNS_TUNNELING: 0,
    SUSPICIOUS_OUTBOUND: 0,
  });

  useEffect(() => {
    const unsub = subscribe((pkt) => {
      // Guard: skip malformed packets to prevent crashes that drop good ones
      if (!pkt?.src_ip || !pkt?.dst_ip) return;

      const now = Date.now();
      const newAlerts: Alert[] = [];

      try {
        // RULE 1
        if (pkt.src_ip === "192.168.1.45" && pkt.dst_ip === "167.88.162.34") {
          if (now - lastFiredRef.current.BEACONING_DETECTED > 15000) {
            lastFiredRef.current.BEACONING_DETECTED = now;
            newAlerts.push({
              id: "alert-" + now + "-" + Math.random().toString(36).slice(2),
              timestamp: now,
              severity: "CRITICAL",
              type: "BEACONING_DETECTED",
              src_ip: pkt.src_ip,
              dst_ip: pkt.dst_ip,
              dst_port: pkt.dst_port,
              protocol: pkt.protocol,
              message: "Periodic C2 beacon detected from LAPTOP-KARAN to known C2 server",
              acknowledged: false,
            });
          }
        }

        // RULE 2
        else if (pkt.dst_ip === "185.220.101.45") {
          if (now - lastFiredRef.current.C2_TRAFFIC > 20000) {
            lastFiredRef.current.C2_TRAFFIC = now;
            newAlerts.push({
              id: "alert-" + now + "-" + Math.random().toString(36).slice(2),
              timestamp: now,
              severity: "CRITICAL",
              type: "C2_TRAFFIC",
              src_ip: pkt.src_ip,
              dst_ip: pkt.dst_ip,
              dst_port: pkt.dst_port,
              protocol: pkt.protocol,
              message: "Traffic routed through Tor exit node — possible data exfiltration",
              acknowledged: false,
            });
          }
        }

        // RULE 3
        else if (pkt.src_ip === "192.168.1.200" && pkt.dst_port < 1024) {
          if (now - lastFiredRef.current.PORT_SCAN > 10000) {
            lastFiredRef.current.PORT_SCAN = now;
            newAlerts.push({
              id: "alert-" + now + "-" + Math.random().toString(36).slice(2),
              timestamp: now,
              severity: "HIGH",
              type: "PORT_SCAN",
              src_ip: pkt.src_ip,
              dst_ip: pkt.dst_ip,
              dst_port: pkt.dst_port,
              protocol: pkt.protocol,
              message: "Low-port sweep detected from UNKNOWN-DEVICE — possible port scan",
              acknowledged: false,
            });
          }
        }

        // RULE 4
        else if (pkt.protocol === "DNS" && pkt.bytes > 400) {
          if (now - lastFiredRef.current.DNS_TUNNELING > 30000) {
            lastFiredRef.current.DNS_TUNNELING = now;
            newAlerts.push({
              id: "alert-" + now + "-" + Math.random().toString(36).slice(2),
              timestamp: now,
              severity: "MEDIUM",
              type: "DNS_TUNNELING",
              src_ip: pkt.src_ip,
              dst_ip: pkt.dst_ip,
              dst_port: pkt.dst_port,
              protocol: pkt.protocol,
              message: "Oversized DNS payload detected — possible DNS tunneling attempt",
              acknowledged: false,
            });
          }
        }

        // RULE 5 — guard with optional chaining to prevent crash on undefined src_ip
        else if (pkt.src_ip?.startsWith("192.168.") && pkt.dst_port === 443 && pkt.protocol === "TCP" && pkt.bytes > 1000) {
          if (now - lastFiredRef.current.SUSPICIOUS_OUTBOUND > 60000) {
            lastFiredRef.current.SUSPICIOUS_OUTBOUND = now;
            newAlerts.push({
              id: "alert-" + now + "-" + Math.random().toString(36).slice(2),
              timestamp: now,
              severity: "LOW",
              type: "SUSPICIOUS_OUTBOUND",
              src_ip: pkt.src_ip,
              dst_ip: pkt.dst_ip,
              dst_port: pkt.dst_port,
              protocol: pkt.protocol,
              message: "Large outbound TCP/443 transfer from internal host",
              acknowledged: false,
            });
          }
        }
      } catch (e) {
        // Never let alert processing crash and drop packets
        console.warn("[AlertStore] Rule evaluation error:", e);
      }

      if (newAlerts.length > 0) {
        setAlerts((prev) => {
          const combined = [...newAlerts, ...prev];
          return combined.slice(0, 200);
        });
      }
    });

    return unsub;
  }, [subscribe]);

  const unreadCount = alerts.filter(a => !a.acknowledged).length;

  const acknowledge = (id: string) => {
    setAlerts((prev) => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const acknowledgeAll = () => {
    setAlerts((prev) => prev.map(a => ({ ...a, acknowledged: true })));
  };

  return (
    <AlertStoreContext.Provider value={{ alerts, unreadCount, acknowledge, acknowledgeAll }}>
      {children}
    </AlertStoreContext.Provider>
  );
}
