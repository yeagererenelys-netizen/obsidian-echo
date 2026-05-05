You are working on WhereIsMyPacket — a Network Forensics Engine built in React 18 + Vite (frontend) with FastAPI + Scapy (Python backend) communicating via WebSockets. The design system is "Obsidian Terminal": true black (#000000), acid lime green (#a3ff12), arctic white (#f0f4ff), JetBrains Mono for all data, Bebas Neue for display numbers, Geist for UI copy. NO purple, NO navy anywhere.

The project has video assets already in /public/videos/ structured as:
/public/videos/hero/HERO_01_anim.mp4, HERO_02_anim.mp4, HERO_03_anim.mp4, HERO_04_anim.mp4
/public/videos/features/FEAT_01_anim.mp4 through FEAT_08_anim.mp4
/public/videos/backgrounds/BG_01_anim.mp4 through BG_05_anim.mp4
/public/videos/brand/BRAND_01_anim.mp4 through BRAND_04_anim.mp4

Fix ALL of the following issues and implement ALL enhancements listed below. Do not ask for clarification — make decisions and build.

═══════════════════════════════════════════
ISSUE 1 — START CAPTURE BUTTON NOT WORKING
═══════════════════════════════════════════

The "Start Capture" button on the Live Capture page does nothing.

FIX:
1. In the Python backend (backend/capture.py), implement a FastAPI WebSocket endpoint at ws://localhost:8000/ws/capture that:
   - Accepts a JSON message: { "action": "start", "interface": "eth0", "filter": "" }
   - Uses Scapy's AsyncSniffer to start packet capture on the specified interface
   - For each captured packet, sends a JSON object over WebSocket:
     {
       "id": incremental_int,
       "timestamp": "HH:MM:SS.mmm",
       "src": "192.168.x.x",
       "dst": "8.8.8.8",
       "srcPort": 54321,
       "dstPort": 443,
       "protocol": "TCP",
       "length": 1420,
       "info": "human readable summary",
       "flags": "SYN|ACK",
       "ttl": 64
     }
   - Accepts { "action": "stop" } to stop the sniffer
   - On interface list request { "action": "list_interfaces" }, responds with available network interfaces using Scapy's get_if_list()

2. In the React frontend (src/pages/LiveCapture.jsx):
   - The Start button connects to the WebSocket, sends { action: "start", interface: selectedInterface, filter: bpfFilter }
   - Button text and color change: "START CAPTURE" (lime bg, black text) → "STOP CAPTURE" (red bg) when active
   - A pulsing lime dot appears next to "LIVE" when capturing
   - Packets stream into the virtualized table in real time (use react-window for virtual scroll — never render more than 50 rows at once, buffer up to 10,000 in state)
   - Packet counter increments live in the header: "14,823 packets captured"
   - If WebSocket fails to connect, show a toast: "Backend offline — showing simulated data" and fall back to a mock data generator that produces realistic fake packets every 100-200ms

═══════════════════════════════════════════
ISSUE 2 — INTERFACE SELECTOR NOT WORKING
═══════════════════════════════════════════

The eth0 / wlan0 dropdown shows hardcoded options and doesn't reflect real interfaces.

FIX:
1. On page mount, send { action: "list_interfaces" } over WebSocket to backend
2. Backend responds with actual interface list from Scapy get_if_list()
3. Frontend renders these as selectable options with icons:
   - Interfaces containing "eth" or "en" → ethernet icon
   - Interfaces containing "wlan" or "wi" → wifi icon  
   - "lo" → loop icon
4. Selected interface stored in state, sent with start capture command
5. If backend offline, show these mock interfaces: ["eth0", "wlan0", "lo", "docker0"] with a "(simulated)" label
6. Add a BPF filter input field below the interface selector — placeholder "tcp port 80 or udp" — this gets sent as the filter field

═══════════════════════════════════════════
ISSUE 3 — COMMUNICATION GRAPH TOO STATIC
═══════════════════════════════════════════

The D3 force graph is not updating in real time. It looks like a frozen image.

FIX — Rebuild src/pages/CommunicationGraph.jsx completely:

1. The graph subscribes to ws://localhost:8000/ws/graph which sends node/edge updates every 2 seconds:
   {
     "nodes": [{ "id": "192.168.1.1", "label": "Router", "type": "router", "threatLevel": 0, "packetCount": 4521 }],
     "edges": [{ "source": "192.168.1.45", "target": "167.88.162.34", "volume": 8920, "protocol": "TCP", "threatLevel": 2, "active": true }]
   }

2. D3 force simulation MUST:
   - Run continuously with alphaDecay 0.02 (very slow cooling — graph stays alive)
   - Add/update nodes and links without restarting the simulation — use simulation.nodes(newNodes) and simulation.force("link").links(newLinks) then simulation.alpha(0.3).restart()
   - Animate edges: each edge has moving dots traveling along it (use D3 path animation on stroke-dashoffset)
   - Edge thickness = Math.log(volume + 1) * 2, capped at 8px
   - Edge color: threatLevel 0 = #a3ff12 (lime), 1 = #eab308 (warn), 2 = #ef4444 (threat)
   - Node radius = Math.sqrt(packetCount) * 0.8, min 8px max 40px
   - Node colors: type "router" = white, type "internal" = #a3ff12, type "external" = #3b82f6, type "threat" = #ef4444
   - On hover: node expands 1.3x, tooltip appears showing IP, packet count, top protocols, threat level
   - Active edges (currently sending data) pulse with a bright flash traveling from source to target

3. Add filter controls above the graph:
   - Protocol filter: ALL / TCP / UDP / DNS / HTTP — clicking filters visible edges
   - Threat filter: ALL / CLEAN / SUSPICIOUS / THREAT
   - "Reset Layout" button: restarts simulation alpha to 1.0 to re-layout

4. Add a live sidebar showing top 5 most active connections (sorted by volume), updating every 2 seconds

5. Add FEAT_03_anim.mp4 as a very subtle (opacity: 0.06) full-page background video

6. If backend offline: use mock data with 20 nodes and 35 edges. Add 2-3 new edges every 3 seconds. Randomly vary edge volumes. This makes the graph look alive even in demo.

═══════════════════════════════════════════
ISSUE 4 — DEVICE PROFILES PAGE UNCLICKABLE
═══════════════════════════════════════════

Clicking a device card does nothing.

FIX — Rebuild src/pages/DeviceProfiles.jsx and create src/pages/DeviceDetail.jsx:

DeviceProfiles.jsx:
1. Grid of device cards, each showing: IP (JetBrains Mono), MAC, hostname, device type icon, anomaly score ring (0-100), last seen, top protocol badge
2. Each card has a lime left border if anomaly score > 60, red if > 80
3. Clicking a card navigates to /app/devices/:ip using React Router

DeviceDetail.jsx (NEW FILE — build this from scratch):
1. Hero section: large IP in Bebas Neue (60px), device name, MAC, first seen, last seen, anomaly score as a large circular ring gauge
2. Four stat cards in a row: Total Packets, Total Bytes, Active Sessions, Unique Destinations
3. Traffic timeline chart (Recharts AreaChart): packets per minute over last hour. Lime fill, black background. Shows behavioral baseline as a dashed line — current traffic vs. baseline.
4. Protocol distribution donut chart: HTTP / HTTPS / DNS / other with percentages
5. Top 10 external destinations table: IP | ASN | Country flag | Bytes | First seen | Last seen | Threat badge
6. Behavioral anomalies panel: list of detected anomalies with severity, timestamp, description. Each row has a "Inspect" button that opens a modal with packet-level detail
7. "Export Device Report" button: downloads a JSON file with all device data
8. Background: BG_02_anim.mp4 at opacity 0.05
9. All IPs, ports, byte counts in JetBrains Mono. All section titles in Bebas Neue. All labels in Geist.

═══════════════════════════════════════════
ISSUE 5 — BEACONING PAGE INSPECT NOT WORKING
═══════════════════════════════════════════

The "Inspect" button on the Beaconing detector page does nothing.

FIX — Rebuild src/pages/BeaconingDetector.jsx completely:

1. Hero section with FEAT_04_anim.mp4 playing at opacity 0.15 as full-width background behind the hero text: "BEACONING DETECTOR" in Bebas Neue 72px lime, subtitle in Geist

2. Summary stats row: Total Suspicious Devices | Highest Regularity Score | Average Beacon Interval | Detection Confidence

3. Main table of flagged devices:
   Columns: Device IP | Destination | Interval | Regularity Score | Confidence | Status | Actions
   - Regularity score shown as a progress bar (0-1.0): green under 0.7, yellow 0.7-0.85, red above 0.85
   - Status badge: MONITORING / CONFIRMED BEACON / FALSE POSITIVE
   - Actions: "INSPECT" button (lime) | "DISMISS" button (ghost)

4. "INSPECT" button click → opens a full slide-over panel from the right (NOT a modal — a slide-over that takes 40% of viewport width):
   Inside the slide-over:
   a) Device header: IP, MAC, hostname, threat score ring
   b) "INTER-ARRIVAL TIMING CHART" — Recharts LineChart showing time between packets on the y-axis, packet sequence on x-axis. A perfectly regular beacon looks like a flat horizontal line. Normal traffic is jagged. This is the killer visualization.
   c) A "REGULARITY ANALYSIS" section showing: mean interval, standard deviation, coefficient of variation, verdict ("HIGH REGULARITY — POSSIBLE C2 BEACON")
   d) Raw packet log: last 20 packets with timestamps in JetBrains Mono
   e) "FLAG as Beacon" button (red, threat) | "Dismiss" button (ghost) | "Export Evidence" button (lime)
   f) Close button top-right. Slide-over animates in with translateX(100%) → translateX(0) over 250ms.

5. At the bottom: "BEACON SIMULATOR" section (for demo purposes):
   - A button "▶ RUN BEACON SIMULATION" — when clicked, generates mock beacon traffic every 30 seconds for 3 minutes, adds it to the table in real time, regularity score rises from 0.3 to 0.97 over time
   - This is the live demo moment for the viva

6. Background: FEAT_04_anim.mp4 in hero, BG_03_anim.mp4 at opacity 0.04 on page background

═══════════════════════════════════════════
ISSUE 6 — WORLD MAP TOO SILENT
═══════════════════════════════════════════

The world map shows static dots. Nothing moves or updates.

FIX — Rebuild src/pages/WorldMap.jsx:

1. Use react-leaflet with a dark tile layer (CartoDB DarkMatter: https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png)

2. For each active external connection:
   - Source: local network IP pinned to the user's approximate city
   - Destination: external IP plotted at its GeoIP coordinates
   - Draw an animated arc between them using Leaflet Polyline with a CSS animation on stroke-dashoffset (dashed line that animates like packets traveling)
   - Arc color: lime for normal, red for threat destinations
   - Arcs fade out after 30 seconds of inactivity

3. Connection markers:
   - Each destination city: pulsing circle marker. Size = log(bytes) * 3. Color = threat level.
   - Hover: popup showing IP, ASN, country, city, total bytes, protocol, threat flags (Tor exit node, VPN, datacenter, malicious reputation)

4. Real-time updates via ws://localhost:8000/ws/map — backend sends new connections as they're captured. Frontend adds new arcs and fades old ones.

5. Left sidebar panel (320px):
   - "ACTIVE CONNECTIONS" counter (big Bebas Neue number, animating)
   - List of top 10 destination countries with bar charts
   - "THREAT DESTINATIONS" list in red: Tor exits, known bad ASNs
   - Protocol breakdown: HTTPS / HTTP / DNS / Other

6. Add special markers:
   - Tor exit nodes: red octagon icon with "TOR" label
   - VPN endpoints: orange diamond icon
   - Datacenter ASNs (AWS, GCP, Azure, DigitalOcean): blue square icon
   - Known malicious IPs: pulsing red circle with skull emoji label

7. Top-right: "LIVE" indicator (pulsing lime dot) when WebSocket connected, "OFFLINE" in ghost when not

8. Background behind the sidebar: BG_04_anim.mp4 at opacity 0.08

9. If backend offline: animate 8-12 mock connections appearing every 3 seconds from Indian IPs to various global destinations. Include one Tor exit and one suspicious destination for demo appeal.

═══════════════════════════════════════════
ISSUE 7 — UNUSED VIDEOS — USE ALL OF THEM
═══════════════════════════════════════════

Map every video to a page/section as follows. ALL videos must be used:

HERO_01_anim.mp4 → Landing page hero: full-screen background at opacity 0.4
HERO_02_anim.mp4 → Overview/Dashboard page: ambient background at opacity 0.06
HERO_03_anim.mp4 → Protocol Inspector page: hero section at opacity 0.15
HERO_04_anim.mp4 → Alerts page: hero section at opacity 0.2 (the red pulse matches the threat aesthetic)

FEAT_01_anim.mp4 → Live Capture feature card + hero of Live Capture page at opacity 0.12
FEAT_03_anim.mp4 → Communication Graph page background at opacity 0.06
FEAT_04_anim.mp4 → Beaconing Detector page hero at opacity 0.15 AND feature card
FEAT_05_anim.mp4 → VPN Detection page hero at opacity 0.12
FEAT_06_anim.mp4 → World Map page (behind the map container) at opacity 0.08
FEAT_07_anim.mp4 → Session Timeline page: background at opacity 0.07
FEAT_08_anim.mp4 → PCAP Manager / Evidence page: hero at opacity 0.12

BG_01_anim.mp4 → Dashboard overview page: full page subtle background at opacity 0.4
BG_02_anim.mp4 → Communication Graph page: behind the D3 canvas at opacity 0.5
BG_03_anim.mp4 → Alerts page + Beaconing page: ambient at opacity 0.3
BG_04_anim.mp4 → World Map sidebar at opacity 0.4
BG_05_anim.mp4 → Landing page section 2 background at opacity 0.5

BRAND_01_anim.mp4 → Splash/loading screen: plays the logo animation
BRAND_02_anim.mp4 → Settings page hero at opacity 0.15
BRAND_03_anim.mp4 → Loading screen full background at opacity 0.3
BRAND_04_anim.mp4 → 404 error page: centered, prominent at opacity 0.6

VideoBackground component to use everywhere:
```jsx
const VideoBackground = ({ src, opacity = 0.1, className = "" }) => {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && ref.current) {
        ref.current.src = src;
        ref.current.play().catch(() => {});
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [src]);
  return (
    <video
      ref={ref}
      loop
      muted
      playsInline
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', opacity, zIndex: 0, pointerEvents: 'none'
      }}
      className={className}
    />
  );
};
```

═══════════════════════════════════════════
ISSUE 8 — BACKEND WEBSOCKET ARCHITECTURE
═══════════════════════════════════════════

Create/update backend/main.py with these WebSocket endpoints:

```python
# backend/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio, json, random, time
from scapy.all import AsyncSniffer, get_if_list, IP, TCP, UDP, DNS

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ws://localhost:8000/ws/capture — live packet stream
@app.websocket("/ws/capture")
async def capture_ws(websocket: WebSocket): ...

# ws://localhost:8000/ws/graph — graph node/edge updates
@app.websocket("/ws/graph")
async def graph_ws(websocket: WebSocket): ...

# ws://localhost:8000/ws/map — geolocation connection stream
@app.websocket("/ws/map")
async def map_ws(websocket: WebSocket): ...

# ws://localhost:8000/ws/alerts — real-time alert stream
@app.websocket("/ws/alerts")
async def alerts_ws(websocket: WebSocket): ...

# ws://localhost:8000/ws/beaconing — beaconing detection updates
@app.websocket("/ws/beaconing")
async def beaconing_ws(websocket: WebSocket): ...

# GET /api/devices — all profiled devices
# GET /api/devices/{ip} — single device full profile
# GET /api/sessions — reconstructed sessions
# POST /api/export/pcap — export filtered pcap
# POST /api/export/evidence — export evidence package JSON
```

Each WebSocket falls back to realistic mock data generation if Scapy cannot bind (e.g., no root privileges) — this ensures the demo ALWAYS works regardless of environment.

═══════════════════════════════════════════
NEW PAGE — VPN DETECTION PAGE (create this)
═══════════════════════════════════════════

Create src/pages/VPNDetection.jsx:
1. Hero with FEAT_05_anim.mp4 background: "VPN DETECTION ENGINE" Bebas Neue 64px
2. Detection method explanation: 3 cards — Port Fingerprinting (OpenVPN UDP 1194) | Protocol Heuristics (WireGuard handshake) | Traffic Pattern Analysis
3. Detected VPN/Proxy devices table: IP | Method | Confidence | Protocol | First Detected | Status
4. One pre-populated entry: 192.168.1.89 using OpenVPN on UDP 1194, confidence 94%
5. Click a row → slide-over with: traffic entropy graph, port scan results, protocol bytes breakdown
6. "ADD TO WATCHLIST" button on each row

═══════════════════════════════════════════
DESIGN CONSISTENCY AUDIT — FIX THESE
═══════════════════════════════════════════

Go through every page and fix:
1. Any purple (#7c3aed, #a78bfa, #8b5cf6 etc.) used in UI chrome (NOT charts) → replace with lime (#a3ff12) or slate (#2e2e2e)
2. Any navy (#080c14, #0f1520) background → replace with true black (#000000) or obsidian (#080808)
3. Every IP address, port number, byte count, timestamp, hash → wrap in <span style="fontFamily: 'JetBrains Mono', monospace">
4. Every page title, section header → Bebas Neue
5. Every card → background #080808, border 1px solid #222222, border-radius 6px, NO box-shadow
6. Primary buttons → background #a3ff12, color #000000, border-radius 4px, font-weight 600
7. The sidebar: 72px wide with icon + label. Active item: lime left border + lime icon. Inactive: ghost text.

═══════════════════════════════════════════
MOCK DATA THAT MAKES THE DEMO LOOK REAL
═══════════════════════════════════════════

Use this exact mock data set consistently across ALL pages:

Devices:
- 192.168.1.1 — "Gateway Router" — ASUS RT-AX88U — anomaly: 12
- 192.168.1.45 — "LAPTOP-KARAN" — Dell XPS 15 — anomaly: 97 ← THE BEACON
- 192.168.1.89 — "DESKTOP-ANUJ" — Custom PC — anomaly: 68 (VPN user)
- 192.168.1.105 — "RASPI-SENSOR" — Raspberry Pi 4 — anomaly: 23
- 192.168.1.200 — "UNKNOWN-DEVICE" — unidentified — anomaly: 89 (port scanner)
- 192.168.1.234 — "PHONE-RAHUL" — OnePlus 11 — anomaly: 45 (Tor user)

The Beaconing Event (the demo moment):
- Source: 192.168.1.45 → Destination: 167.88.162.34
- Interval: exactly 30 seconds (±0.3s jitter)
- Regularity score: 0.97
- Protocol: HTTPS (port 443), payload ~180 bytes each time
- Duration: started 47 minutes ago, 94 events so far

The suspicious DNS query:
- 192.168.1.42 queried update.verysuspicious-domain.cc at 03:47:22
- Resolved to 185.130.104.23 (known malware C2 in threat intel)

The Tor connection:
- 192.168.1.234 → 185.220.101.45 (verified Tor exit node, Germany)
- 847MB transferred over 2 hours

The port scan:
- 192.168.1.200 probed 847 ports on 192.168.1.105 between 14:23:11 and 14:25:09
- SYN packets, no ACK responses, classic stealth scan pattern

═══════════════════════════════════════════
FINAL REQUIREMENTS
═══════════════════════════════════════════

1. Every page must have at least one video background playing
2. Every interactive element (button, card, row) must DO SOMETHING when clicked
3. All numbers that update must visually animate when they change (count-up animation, not just snap)
4. The "LIVE" indicator must appear on any page actively receiving WebSocket data
5. Backend must start with: uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
6. Frontend must proxy /ws to localhost:8000 in vite.config.js
7. README.md must be updated with: setup steps, architecture diagram (ASCII is fine), and the 5-step demo script from the masterplan

Build everything. Make it work. Make it unforgettable.