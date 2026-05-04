export const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
export const WS_BASE  = API_BASE.replace("http", "ws");

export const WS = {
  CAPTURE:   `${WS_BASE}/ws/capture`,
  GRAPH:     `${WS_BASE}/ws/graph`,
  MAP:       `${WS_BASE}/ws/map`,
  BEACONING: `${WS_BASE}/ws/beaconing`,
  ALERTS:    `${WS_BASE}/ws/alerts`,
};
