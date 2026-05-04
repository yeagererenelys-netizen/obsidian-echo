import { useState, useRef, useEffect } from "react";
import { usePacketStream } from "@/hooks/usePacketStream";

export interface BeaconDevice {
  ip: string;
  targetIp: string;
  targetPort: number;
  regularityScore: number;
  packetCount: number;
  avgIntervalMs: number;
  stdDevMs: number;
  lastSeen: number;
  interArrivalTimes: number[];
}

export function useBeaconDetector() {
  const perDeviceTimestamps = useRef<Map<string, number[]>>(new Map());
  const [beaconDevices, setBeaconDevices] = useState<BeaconDevice[]>([]);
  const [isSimulating, setIsSimulatingState] = useState(false);
  const isSimulatingRef = useRef(false);

  const setIsSimulating = (val: boolean) => {
    isSimulatingRef.current = val;
    setIsSimulatingState(val);
  };

  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { subscribe } = usePacketStream();

  const analyzeFlow = (key: string, timestamps: number[]) => {
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;
    const regularityScore = Math.max(0, Math.min(1, 1 - cv));

    const [src, dstPortStr] = key.split("→");
    const [dst, portStr] = dstPortStr.split(":");
    const port = parseInt(portStr, 10);

    setBeaconDevices((prev) => {
      const next = [...prev];
      const idx = next.findIndex(d => d.ip === src && d.targetIp === dst && d.targetPort === port);

      if (regularityScore >= 0.60 && intervals.length >= 4) {
        const newDevice: BeaconDevice = {
          ip: src,
          targetIp: dst,
          targetPort: port,
          regularityScore,
          packetCount: timestamps.length,
          avgIntervalMs: mean,
          stdDevMs: stdDev,
          lastSeen: timestamps[timestamps.length - 1],
          interArrivalTimes: intervals.slice(-60)
        };

        if (idx >= 0) {
          next[idx] = newDevice;
        } else {
          next.push(newDevice);
        }
        return next.sort((a, b) => b.regularityScore - a.regularityScore);
      } else {
        if (idx >= 0) {
          next.splice(idx, 1);
          return next;
        }
        return prev;
      }
    });
  };

  useEffect(() => {
    const unsub = subscribe((pkt) => {
      const flowKey = `${pkt.src_ip}→${pkt.dst_ip}:${pkt.dst_port}`;
      if (isSimulatingRef.current && flowKey === "192.168.1.45→167.88.162.34:443") {
        return; // Ignore real packets for this flow while simulating
      }
      
      let timestamps = perDeviceTimestamps.current.get(flowKey) || [];
      timestamps.push(pkt.timestamp);
      if (timestamps.length > 100) timestamps.shift();
      perDeviceTimestamps.current.set(flowKey, timestamps);

      if (timestamps.length >= 5) {
        analyzeFlow(flowKey, timestamps);
      }
    });

    return unsub;
  }, [subscribe]);

  useEffect(() => {
    const interval = setInterval(() => {
      perDeviceTimestamps.current.forEach((timestamps, flowKey) => {
        if (timestamps.length >= 5) {
          analyzeFlow(flowKey, timestamps);
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const startSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    const flowKey = "192.168.1.45→167.88.162.34:443";
    const now = Date.now();
    const seeds = [
      now - 120000, now - 90000, now - 60000, now - 30000, now
    ];
    perDeviceTimestamps.current.set(flowKey, seeds);
    analyzeFlow(flowKey, seeds);

    simulationIntervalRef.current = setInterval(() => {
      const currentTimestamps = perDeviceTimestamps.current.get(flowKey) || [];
      currentTimestamps.push(Date.now());
      if (currentTimestamps.length > 100) currentTimestamps.shift();
      perDeviceTimestamps.current.set(flowKey, currentTimestamps);
      analyzeFlow(flowKey, currentTimestamps);
    }, 30000);

    setTimeout(() => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      setIsSimulating(false);
    }, 600000); // 10 minutes
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    setIsSimulating(false);
  };

  return {
    beaconDevices,
    isSimulating,
    startSimulation,
    stopSimulation
  };
}
