import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Layout";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { MOCK_MAP_CONNECTIONS } from "@/lib/mockData";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export const Route = createFileRoute("/app/map")({ component: WorldMap });

// Fix Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function WorldMap() {
  const [activeConns, setActiveConns] = useState(MOCK_MAP_CONNECTIONS);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  const countries = [
    { c: "🇺🇸 United States", n: activeConns.filter(c => c.country === "US").length * 24, sev: "safe" },
    { c: "🇩🇪 Germany", n: activeConns.filter(c => c.country === "DE").length * 12, sev: activeConns.some(c => c.country === "DE" && c.threat) ? "warn" : "safe" },
    { c: "🇷🇺 Russia", n: activeConns.filter(c => c.country === "RU").length * 3, sev: "threat" },
    { c: "🇦🇺 Australia", n: activeConns.filter(c => c.country === "AU").length * 5, sev: "safe" },
    { c: "🧅 Tor exits", n: activeConns.filter(c => c.type === "tor").length, sev: "threat" },
  ];

  return (
    <div className="relative h-full flex flex-col">
      <PageHeader
        title="GEOGRAPHIC MAP"
        subtitle={<><span className="dot dot-lime" /> {activeConns.length} active connections · Updated live</>}
      />

      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Map Container */}
        <div className="col-span-9 ps-card !p-0 relative overflow-hidden flex-1 min-h-[560px]">
          <VideoBackground src="/videos/features/FEAT_06_anim.mp4" opacity={0.08} />
          
          <MapContainer 
            center={[20, 0]} 
            zoom={2} 
            className="h-full w-full bg-void z-10"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            />
            
            {activeConns.map((conn, i) => {
              const color = conn.threat ? "#ef4444" : conn.type === "tor" ? "#ef4444" : conn.type === "vpn" ? "#eab308" : "#a3ff12";
              const weight = Math.max(1, Math.log(conn.bytes / 1000) * 0.5);
              
              return (
                <div key={i}>
                  {/* Arc from India (local) to Destination */}
                  <Polyline 
                    positions={[[28.6139, 77.2090], [conn.dstLat, conn.dstLng]]}
                    pathOptions={{
                      color: color,
                      weight: weight,
                      opacity: 0.3,
                      dashArray: "5, 10",
                      dashOffset: String(-(tick * 2) % 30),
                    }}
                  />
                  
                  {/* Destination Marker */}
                  <CircleMarker
                    center={[conn.dstLat, conn.dstLng]}
                    radius={Math.max(4, Math.log(conn.bytes / 1000) * 1.5)}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.8,
                      color: color,
                      weight: conn.threat ? 2 : 0,
                      opacity: 0.5 + Math.sin(tick * 0.2 + i) * 0.3
                    }}
                  >
                    <Popup className="ps-popup">
                      <div className="ps-card !p-2 !text-xs min-w-[140px] bg-obsidian">
                        <div className="mono text-white font-bold">{conn.dst}</div>
                        <div className="text-ghost mb-1">{conn.city}, {conn.country}</div>
                        <div className="flex justify-between border-t border-graphite mt-1 pt-1">
                          <span className="text-silver">Protocol:</span>
                          <span className="mono text-lime">HTTPS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-silver">Volume:</span>
                          <span className="mono text-lime">{(conn.bytes / 1024).toFixed(1)} KB</span>
                        </div>
                        {conn.type !== 'safe' && (
                          <div className="mt-2 px-1 py-0.5 rounded bg-threat-dim/20 border border-threat/40 text-[10px] text-threat text-center uppercase mono">
                            {conn.type} Detected
                          </div>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                </div>
              );
            })}

            {/* Local Marker (India) */}
            <CircleMarker 
              center={[28.6139, 77.2090]} 
              radius={8}
              pathOptions={{ fillColor: "#a3ff12", fillOpacity: 0.9, color: "#a3ff12", weight: 0 }}
            />
          </MapContainer>

          {/* Map Overlay Controls */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 border border-lime-border">
            <span className="dot dot-lime !w-2 !h-2" />
            <span className="mono text-[10px] text-lime uppercase">Live Stream</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-3 space-y-4 flex flex-col min-h-0">
          <div className="ps-card relative overflow-hidden min-h-[100px]">
            <VideoBackground src="/videos/backgrounds/BG_04_anim.mp4" opacity={0.4} />
            <div className="relative z-10">
              <div className="micro mb-1">Active Connections</div>
              <div className="display text-[48px] text-lime leading-none animate-pulse-slow">{activeConns.length}</div>
            </div>
          </div>

          <div className="ps-card flex-1 min-h-0 overflow-y-auto">
            <h3 className="display text-lg mb-3">DESTINATION COUNTRIES</h3>
            <div className="space-y-4">
              {countries.map(c => (
                <div key={c.c}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-silver">{c.c}</span>
                    <span className={`mono ${c.sev === "threat" ? "text-threat" : c.sev === "warn" ? "text-warn" : "text-lime"}`}>{c.n}</span>
                  </div>
                  <div className="h-1 bg-carbon rounded">
                    <div 
                      className={`h-full rounded transition-all duration-1000 ${c.sev === "threat" ? "bg-threat" : c.sev === "warn" ? "bg-warn" : "bg-lime"}`}
                      style={{ width: `${Math.min((c.n / 50) * 100, 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <h3 className="display text-lg mb-3 mt-8 text-threat">THREAT ANALYSIS</h3>
            <div className="space-y-3">
              {activeConns.filter(c => c.threat).map((c, i) => (
                <div key={i} className="mono text-[10px] p-2 rounded bg-threat-dim/20 border-l-2 border-threat animate-fade-in">
                  <div className="text-white flex justify-between">
                    <span>{c.dst}</span>
                    <span className="text-threat">CRITICAL</span>
                  </div>
                  <div className="text-ghost mt-1 uppercase">
                    {c.type === "tor" ? "🧅 Tor Exit Node" : c.type === "beacon" ? "📡 C2 Beaconing" : "⚠ Malicious Rep."}
                  </div>
                  <div className="text-[9px] text-silver mt-1">{c.city}, {c.country}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
