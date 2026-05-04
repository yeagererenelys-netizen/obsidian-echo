import { useContext } from "react";
import { PacketStreamContext } from "@/context/PacketStreamContext";

export function usePacketStream() {
  const ctx = useContext(PacketStreamContext);
  if (!ctx) throw new Error("usePacketStream must be used inside PacketStreamProvider");
  return ctx;
}
