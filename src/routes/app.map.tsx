import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Layout";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { VIDEOS } from "@/config/videoConfig";
import { MOCK_MAP_CONNECTIONS } from "@/lib/mockData";
import { useState, useEffect, useMemo } from "react";
import { useMapArcs } from "@/hooks/useMapArcs";
import { GEOIP } from "@/data/geoipData";
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
  const { arcs } = useMapArcs();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  const uniqueEndpoints = useMemo(() => {
    const seen = new Set<string>();
    const points: Array<{lat: number; lng: number; ip: string; city: string; isThreat: boolean}> = [];
    arcs.forEach(arc => {
      if (!seen.has(arc.srcIp)) {
        seen.add(arc.srcIp);
        points.push({ lat: arc.srcLat, lng: arc.srcLng, ip: arc.srcIp, city: arc.srcCity, isThreat: false });
      }
      if (!seen.has(arc.dstIp)) {
        seen.add(arc.dstIp);
        points.push({ lat: arc.dstLat, lng: arc.dstLng, ip: arc.dstIp, city: arc.dstCity, isThreat: GEOIP[arc.dstIp]?.isThreat ?? false });
      }
    });
    return points;
  }, [arcs]);

  const countries = [
    { c: "🇺🇸 United States", n: arcs.filter(a => GEOIP[a.dstIp]?.country === "US").length, sev: "safe" },
    { c: "🇩🇪 Germany", n: arcs.filter(a => GEOIP[a.dstIp]?.country === "DE").length, sev: arcs.some(a => GEOIP[a.dstIp]?.country === "DE" && a.isThreat) ? "warn" : "safe" },
    { c: "🇷🇺 Russia", n: arcs.filter(a => GEOIP[a.dstIp]?.country === "RU").length, sev: "threat" },
    { c: "🇦🇺 Australia", n: arcs.filter(a => GEOIP[a.dstIp]?.country === "AU").length, sev: "safe" },
    { c: "🧅 Tor exits", n: arcs.filter(a => a.isThreat && a.dstCity === "Paris").length, sev: "threat" },
  ];

  return (
    <div className="relative h-full flex flex-col">
      <PageHeader
        title="GEOGRAPHIC MAP"
        subtitle={<><span className="dot dot-lime" /> {arcs.filter(a => a.isActive).length} active connections · Updated live</>}
      />

      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Map Container */}
        <div className="col-span-9 ps-card !p-0 relative overflow-hidden flex-1 min-h-[560px]">
          <VideoBackground src={VIDEOS.FEAT_06} opacity={0.08} />
          
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
            
            {arcs.map((arc, i) => {
              const color = arc.isThreat ? "#ef4444" : arc.isActive ? "#a3ff12" : "#444444";
              const weight = Math.max(1, Math.min(4, Math.log2(arc.packetCount + 1)));
              const opacity = arc.isActive ? 0.8 : 0.3;
              
              return (
                <div key={arc.id}>
                  <Polyline 
                    positions={[[arc.srcLat, arc.srcLng], [arc.dstLat, arc.dstLng]]}
                    pathOptions={{
                      color: color,
                      weight: weight,
                      opacity: opacity,
                      dashArray: "5, 10",
                      dashOffset: String(-(tick * 2) % 30),
                    }}
                  />
                </div>
              );
            })}

            {uniqueEndpoints.map((pt, i) => (
              <CircleMarker
                key={pt.ip}
                center={[pt.lat, pt.lng]}
                radius={pt.isThreat ? 8 : 5}
                pathOptions={{
                  fillColor: pt.isThreat ? "#ef4444" : "#a3ff12",
                  fillOpacity: pt.isThreat ? 0.8 : 0.9,
                  color: pt.isThreat ? "#ef4444" : "#a3ff12",
                  weight: pt.isThreat ? 2 : 0,
                  opacity: pt.isThreat ? (0.5 + Math.sin(tick * 0.2 + i) * 0.3) : 1
                }}
              >
                <Popup className="ps-popup">
                  <div className="ps-card !p-2 !text-xs min-w-[140px] bg-obsidian">
                    <div className="mono text-white font-bold">{pt.ip}</div>
                    <div className="text-ghost mb-1">{pt.city}</div>
                    {pt.isThreat && (
                      <div className="mt-2 px-1 py-0.5 rounded bg-threat-dim/20 border border-threat/40 text-[10px] text-threat text-center uppercase mono">
                        Threat Detected
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
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
            <VideoBackground src={VIDEOS.BG_04} opacity={0.4} />
            <div className="relative z-10">
              <div className="micro mb-1">Active Connections</div>
              <div className="display text-[48px] text-lime leading-none animate-pulse-slow">{arcs.filter(a => a.isActive).length}</div>
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
              {arcs.filter(a => a.isThreat && a.isActive).map((c, i) => (
                <div key={i} className="mono text-[10px] p-2 rounded bg-threat-dim/20 border-l-2 border-threat animate-fade-in">
                  <div className="text-white flex justify-between">
                    <span>{c.dstIp}</span>
                    <span className="text-threat">CRITICAL</span>
                  </div>
                  <div className="text-[9px] text-silver mt-1">{c.dstCity}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
