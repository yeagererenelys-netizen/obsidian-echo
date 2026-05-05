import re

with open("src/routes/app.map.tsx", "r") as f:
    content = f.read()

# 1. Imports
content = re.sub(
    r'import \{ useState, useEffect \} from "react";',
    'import { useState, useEffect, useMemo } from "react";\nimport { useMapArcs } from "@/hooks/useMapArcs";\nimport { GEOIP } from "@/data/geoipData";',
    content
)

# 2. Add useMapArcs to WorldMap
content = re.sub(
    r'function WorldMap\(\) \{([\s\S]*?)const countries = \[',
    r'function WorldMap() {\n  const { arcs } = useMapArcs();\n  const [tick, setTick] = useState(0);\n\n  useEffect(() => {\n    const interval = setInterval(() => setTick(t => t + 1), 100);\n    return () => clearInterval(interval);\n  }, []);\n\n  const uniqueEndpoints = useMemo(() => {\n    const seen = new Set<string>();\n    const points: Array<{lat: number; lng: number; ip: string; city: string; isThreat: boolean}> = [];\n    arcs.forEach(arc => {\n      if (!seen.has(arc.srcIp)) {\n        seen.add(arc.srcIp);\n        points.push({ lat: arc.srcLat, lng: arc.srcLng, ip: arc.srcIp, city: arc.srcCity, isThreat: false });\n      }\n      if (!seen.has(arc.dstIp)) {\n        seen.add(arc.dstIp);\n        points.push({ lat: arc.dstLat, lng: arc.dstLng, ip: arc.dstIp, city: arc.dstCity, isThreat: GEOIP[arc.dstIp]?.isThreat ?? false });\n      }\n    });\n    return points;\n  }, [arcs]);\n\n  const countries = [',
    content
)

# 3. Fix the active connections count in page header
content = re.sub(
    r'\{activeConns\.length\} active connections',
    '{arcs.filter(a => a.isActive).length} active connections',
    content
)

# 4. Fix the MapContainer rendering
old_map = r'\{activeConns\.map\(\(conn, i\) => \{[\s\S]*?\{/\* Local Marker \(India\) \*/\}[\s\S]*?</MapContainer>'

new_map = """{arcs.map((arc, i) => {
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
          </MapContainer>"""

content = re.sub(old_map, new_map, content)

# 5. Fix Active Connections sidebar
content = re.sub(
    r'<div className="display text-\[48px\] text-lime leading-none animate-pulse-slow">\{activeConns\.length\}</div>',
    '<div className="display text-[48px] text-lime leading-none animate-pulse-slow">{arcs.filter(a => a.isActive).length}</div>',
    content
)

# 6. Fix THREAT ANALYSIS sidebar
old_threats = r'\{activeConns\.filter\(c => c\.threat\)\.map\(\(c, i\) => \([\s\S]*?\)\)\}'
new_threats = """{arcs.filter(a => a.isThreat && a.isActive).map((c, i) => (
                <div key={i} className="mono text-[10px] p-2 rounded bg-threat-dim/20 border-l-2 border-threat animate-fade-in">
                  <div className="text-white flex justify-between">
                    <span>{c.dstIp}</span>
                    <span className="text-threat">CRITICAL</span>
                  </div>
                  <div className="text-[9px] text-silver mt-1">{c.dstCity}</div>
                </div>
              ))}"""
content = re.sub(old_threats, new_threats, content)

with open("src/routes/app.map.tsx", "w") as f:
    f.write(content)
