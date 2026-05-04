import { useEffect, useRef, useState, useCallback } from "react";

export function useWebSocket<T>(url: string, onMessage: (data: T) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  const send = useCallback((data: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket(url);
      ws.current.onopen = () => setConnected(true);
      ws.current.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000);
      };
      ws.current.onmessage = (e) => {
        try { onMessage(JSON.parse(e.data)); } catch {}
      };
    };
    connect();
    return () => ws.current?.close();
  }, [url]);

  return { connected, send };
}
