# WhereIsMyPacket — Code Reference & Function Documentation

> **Project:** PacketScope Network Forensics Engine  
> **Stack:** Python 3.11+ (FastAPI, Scapy) · React 18 (D3.js, Leaflet) · WebSocket  
> **Purpose:** Real-time packet capture, decode, and visualization

---

## Table of Contents

1. [Backend — Packet Capture Engine](#1-backend--packet-capture-engine)
2. [Backend — Packet Decoder](#2-backend--packet-decoder)
3. [Backend — DNS Resolver](#3-backend--dns-resolver)
4. [Backend — FastAPI WebSocket Server](#4-backend--fastapi-websocket-server)
5. [Frontend — D3.js Force Graph](#5-frontend--d3js-force-graph)
6. [Frontend — React Leaflet World Map](#6-frontend--react-leaflet-world-map)
7. [Frontend — WebSocket Packet Stream](#7-frontend--websocket-packet-stream)
8. [Networking Theory — BPF Filters](#8-networking-theory--bpf-filters)
9. [Official References](#9-official-references)

---

## 1. Backend — Packet Capture Engine

**File:** `backend/capture.py`

### `AsyncSniffer` (from Scapy)

```python
from scapy.sendrecv import AsyncSniffer

self._sniffer = AsyncSniffer(
    prn=on_packet,      # Callback function invoked for each captured packet
    store=False,         # Don't store packets in memory (streaming mode)
    filter=bpf_filter,   # Berkeley Packet Filter string (e.g., "ip")
    iface=iface,         # Network interface (e.g., "en0", "eth0")
)
self._sniffer.start()    # Begin non-blocking capture in background thread
self._sniffer.stop()     # Stop capture gracefully
```

**What it does:** `AsyncSniffer` hooks into the OS network interface card (NIC) in **promiscuous mode** and captures raw packets without blocking the main thread. It runs in a separate OS thread.

**Why we use it:** Unlike the blocking `sniff()` function, `AsyncSniffer` lets our FastAPI server continue handling HTTP requests and WebSocket connections while packets are being captured simultaneously.

**Official Docs:** https://scapy.readthedocs.io/en/latest/usage.html#asynchronous-sniffing

---

### `asyncio.run_coroutine_threadsafe()`

```python
asyncio.run_coroutine_threadsafe(
    self._queue.put(decoded),   # The coroutine to schedule
    self._loop                  # The event loop running in the main thread
)
```

**What it does:** This is the **thread-safe bridge** between Scapy's background capture thread and FastAPI's async event loop. Since `asyncio` objects are NOT thread-safe, you cannot call `await queue.put()` from a non-async thread. This function safely schedules the coroutine on the correct event loop.

**Returns:** A `concurrent.futures.Future` (not an `asyncio.Future`).

**Official Docs:** https://docs.python.org/3/library/asyncio-task.html#asyncio.run_coroutine_threadsafe

---

### `threading.Lock`

```python
self._lock = threading.Lock()

with self._lock:
    if self._running:
        return True
```

**What it does:** Prevents race conditions when multiple WebSocket clients try to start/stop capture simultaneously. The `with` statement acquires the lock, executes the block, and releases it automatically.

**Official Docs:** https://docs.python.org/3/library/threading.html#lock-objects

---

## 2. Backend — Packet Decoder

**File:** `backend/packet_decoder.py`

### `pkt.haslayer(IP)` / `pkt[IP]`

```python
from scapy.layers.inet import IP, TCP, UDP, ICMP
from scapy.layers.dns import DNS, DNSRR

if pkt.haslayer(IP):          # Check if packet contains IPv4 header
    ip = pkt[IP]              # Extract the IP layer object
    src = ip.src              # Source IP address (string)
    dst = ip.dst              # Destination IP address (string)

if pkt.haslayer(TCP):
    sport = pkt[TCP].sport    # Source port (int)
    dport = pkt[TCP].dport    # Destination port (int)
    flags = pkt[TCP].flags    # TCP flags (SYN, ACK, FIN, RST, etc.)
```

**What it does:** Scapy models every packet as a stack of protocol layers (like the OSI model). `haslayer()` checks if a specific layer exists, and indexing `pkt[Layer]` extracts it.

**OSI Mapping:**
| Scapy Layer | OSI Layer | Fields Extracted |
|-------------|-----------|-----------------|
| `IP` | Layer 3 (Network) | `src`, `dst` (IP addresses) |
| `TCP` | Layer 4 (Transport) | `sport`, `dport`, `flags` |
| `UDP` | Layer 4 (Transport) | `sport`, `dport` |
| `ICMP` | Layer 3 (Network) | Type, Code |
| `DNS` | Layer 7 (Application) | `qd.qname`, `an.rdata` |

**Official Docs:** https://scapy.readthedocs.io/en/latest/usage.html#stacking-layers

---

### `_decode_flags()` — TCP Flag Decoding

```python
FLAG_MAP = {
    0x02: "SYN",       # Connection initiation
    0x10: "ACK",       # Acknowledgement
    0x12: "SYN-ACK",   # Server response to SYN
    0x01: "FIN",       # Connection termination
    0x04: "RST",       # Connection reset (abrupt close)
    0x18: "PSH-ACK",   # Push data immediately + ACK
    0x11: "FIN-ACK",   # Graceful close + ACK
}
```

**Theory — TCP 3-Way Handshake:**
```
Client → Server:  SYN        (0x02)  "I want to connect"
Server → Client:  SYN-ACK    (0x12)  "OK, I acknowledge"
Client → Server:  ACK        (0x10)  "Connection established"
```

**Theory — TCP 4-Way Teardown:**
```
Client → Server:  FIN-ACK    (0x11)  "I'm done sending"
Server → Client:  ACK        (0x10)  "Acknowledged"
Server → Client:  FIN-ACK    (0x11)  "I'm done too"
Client → Server:  ACK        (0x10)  "Connection closed"
```

**Reference:** RFC 793 — https://www.rfc-editor.org/rfc/rfc793

---

### `_extract_dns_mappings()` — DNS Response Parsing

```python
dns = pkt[DNS]
if dns.qr != 1 or not dns.an:    # qr=1 means Response (not Query)
    return

queried_name = dns.qd.qname.decode()   # e.g., "github.com."
rr = dns.an                             # Answer section
if rr.type == 1:                        # Type 1 = A Record (IPv4 address)
    ip_str = rr.rdata                   # e.g., "140.82.121.3"
```

**What it does:** When your browser visits `github.com`, the OS sends a DNS query to resolve the domain to an IP. This function intercepts the DNS **response** packet, extracts the `A Record` (domain → IP mapping), and caches it so future TCP traffic to that IP can be labeled correctly.

**DNS Record Types:**
| Type | Name | Purpose |
|------|------|---------|
| 1 | A | Maps domain → IPv4 address |
| 28 | AAAA | Maps domain → IPv6 address |
| 5 | CNAME | Alias for another domain |
| 15 | MX | Mail server for domain |

**Reference:** RFC 1035 — https://www.rfc-editor.org/rfc/rfc1035

---

### `_detect_protocol()` — Protocol Classification

```python
def _detect_protocol(pkt):
    if pkt.haslayer(DNS):     return "DNS"     # Port 53
    if pkt.haslayer(HTTP):    return "HTTP"     # Port 80
    if pkt[TCP].dport == 443: return "HTTPS"   # Port 443 (TLS)
    if pkt.haslayer(TCP):     return "TCP"      # Generic TCP
    if pkt.haslayer(UDP):     return "UDP"      # Generic UDP
    if pkt.haslayer(ICMP):    return "ICMP"     # Ping/Traceroute
```

**Well-Known Ports (IANA):**
| Port | Protocol | Service |
|------|----------|---------|
| 53 | UDP/TCP | DNS |
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS (TLS) |
| 22 | TCP | SSH |
| 25 | TCP | SMTP (Email) |

**Reference:** IANA Port Numbers — https://www.iana.org/assignments/service-names-port-numbers

---

## 3. Backend — DNS Resolver

**File:** `backend/dns_resolver.py`

### `socket.gethostbyaddr()` — Reverse DNS Lookup

```python
hostname, aliaslist, ipaddrlist = socket.gethostbyaddr("142.250.190.46")
# Returns: ("del11s19-in-f14.1e100.net", [], ["142.250.190.46"])
```

**What it does:** Performs a **reverse DNS lookup** (IP → hostname) using the system's DNS resolver. This is the opposite of `gethostbyname()` which does forward lookup (hostname → IP).

**Why it's unreliable:** Many cloud providers (AWS, Google Cloud) return infrastructure names like `ec2-52-95-120-67.compute-1.amazonaws.com` instead of the actual service name. That's why we also implement DNS sniffing and SNI extraction.

**Official Docs:** https://docs.python.org/3/library/socket.html#socket.gethostbyaddr

---

### `socket.getaddrinfo()` — Forward DNS Resolution

```python
results = socket.getaddrinfo("github.com", None, socket.AF_INET)
# Returns: [(2, 1, 6, '', ('140.82.121.3', 0)), ...]
ip = results[0][4][0]   # "140.82.121.3"
```

**What it does:** Resolves a hostname to all its IP addresses. Used in `pre_resolve_popular_sites()` at startup to pre-populate the DNS cache with 40+ popular websites so their traffic is labeled correctly from the first packet.

**Official Docs:** https://docs.python.org/3/library/socket.html#socket.getaddrinfo

---

### `ipaddress.ip_address()` — IP Address Classification

```python
from ipaddress import ip_address

addr = ip_address("192.168.1.10")
addr.is_private      # True  — RFC 1918 private address
addr.is_loopback     # False — Only 127.0.0.1
addr.is_link_local   # False — Only 169.254.x.x

addr2 = ip_address("8.8.8.8")
addr2.is_private     # False — Public Google DNS
```

**RFC 1918 Private Address Ranges:**
| Range | CIDR | Usage |
|-------|------|-------|
| 10.0.0.0 – 10.255.255.255 | 10.0.0.0/8 | Large networks |
| 172.16.0.0 – 172.31.255.255 | 172.16.0.0/12 | Medium networks |
| 192.168.0.0 – 192.168.255.255 | 192.168.0.0/16 | Home/small office |

**Official Docs:** https://docs.python.org/3/library/ipaddress.html

---

## 4. Backend — FastAPI WebSocket Server

**File:** `backend/main.py`

### WebSocket Endpoint

```python
@app.websocket("/ws/capture")
async def ws_capture(websocket: WebSocket):
    await websocket.accept()                    # Complete the WS handshake
    queue = asyncio.Queue(maxsize=1000)         # Bounded buffer for packets
    capture.start(queue=queue, loop=loop)        # Start Scapy sniffer

    while True:
        packet = await asyncio.wait_for(         # Wait with timeout
            queue.get(), timeout=5.0
        )
        await websocket.send_text(json.dumps(packet))  # Stream to frontend
```

**What it does:** Opens a persistent, full-duplex WebSocket connection. Unlike REST APIs (request → response), WebSockets allow the server to **push** data to the client continuously without the client polling.

**Why WebSocket over REST:** A REST endpoint would require the frontend to send a `GET` request every 100ms to check for new packets, creating massive overhead. WebSocket sends packets the instant they arrive — sub-millisecond latency.

**Official Docs:** https://fastapi.tiangolo.com/advanced/websockets/

---

### `asyncio.wait_for()` — Timeout Pattern

```python
try:
    packet = await asyncio.wait_for(queue.get(), timeout=5.0)
except asyncio.TimeoutError:
    await websocket.send_text('{"ping": true}')   # Keep-alive
```

**What it does:** Waits for the queue to produce a packet, but gives up after 5 seconds. If no traffic arrives, it sends a ping to keep the WebSocket connection alive (browsers close idle WebSockets after ~60 seconds).

**Official Docs:** https://docs.python.org/3/library/asyncio-task.html#asyncio.wait_for

---

### CORS Middleware

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**What it does:** Enables Cross-Origin Resource Sharing. Without this, the browser blocks the React frontend (port 5173) from connecting to the Python backend (port 8000) due to the Same-Origin Policy.

**Official Docs:** https://fastapi.tiangolo.com/tutorial/cors/

---

## 5. Frontend — D3.js Force Graph

**File:** `src/routes/app.graph.tsx`

### Force Simulation

```javascript
const simulation = d3.forceSimulation(nodes)
    .force("link",      d3.forceLink(links).id(d => d.id).distance(120))
    .force("charge",    d3.forceManyBody().strength(-300))
    .force("center",    d3.forceCenter(width/2, height/2))
    .force("collision", d3.forceCollide(40));
```

| Force | Function | Purpose |
|-------|----------|---------|
| `forceLink` | Spring between connected nodes | Pulls connected nodes together |
| `forceManyBody` | Electrical charge simulation | Pushes all nodes apart (negative = repel) |
| `forceCenter` | Gravity toward center point | Prevents graph from drifting off-screen |
| `forceCollide` | Collision radius | Prevents node overlap |

**Physics Analogy:** Each node acts like a charged particle. Connected nodes are attached by springs. The simulation runs hundreds of "ticks" to find equilibrium — like dropping magnets on a table and letting them settle.

**Official Docs:** https://d3js.org/d3-force

---

### D3 Data Join Pattern (Enter/Update/Exit)

```javascript
const nodeSelection = svg.selectAll("circle").data(nodes, d => d.id);

nodeSelection.enter()                    // NEW nodes → create elements
    .append("circle")
    .attr("r", d => nodeRadius(d))
    .attr("fill", d => nodeColor(d));

nodeSelection.merge(nodeEnter)           // ALL nodes → update attributes
    .attr("r", d => nodeRadius(d));

nodeSelection.exit().remove();           // REMOVED nodes → delete elements
```

**What it does:** D3's data join efficiently maps data arrays to DOM elements. When new IPs appear, circles are created. When IPs disappear, circles are removed. Existing circles are updated in-place without recreation.

**Official Docs:** https://d3js.org/d3-selection/joining

---

### Drag Behavior

```javascript
const drag = d3.drag()
    .on("start", (event, d) => { d.fx = d.x; d.fy = d.y; })     // Pin node
    .on("drag",  (event, d) => { d.fx = event.x; d.fy = event.y; })
    .on("end",   (event, d) => { d.fx = null; d.fy = null; });   // Unpin
```

**What it does:** Allows users to click and drag nodes. Setting `fx`/`fy` pins the node to a fixed position. Setting them to `null` releases the node back into the physics simulation.

**Official Docs:** https://d3js.org/d3-drag

---

## 6. Frontend — React Leaflet World Map

**File:** `src/routes/app.map.tsx`

### Map Components

```jsx
<MapContainer center={[20, 0]} zoom={2}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Polyline positions={[[srcLat, srcLng], [dstLat, dstLng]]}
             pathOptions={{ color: "#a3ff12", dashArray: "5, 10" }} />
    <CircleMarker center={[lat, lng]} radius={6} />
</MapContainer>
```

| Component | Purpose |
|-----------|---------|
| `MapContainer` | Initializes the Leaflet map instance |
| `TileLayer` | Renders OpenStreetMap tiles |
| `Polyline` | Draws animated arcs between source and destination |
| `CircleMarker` | Plots endpoint locations on the map |

**Official Docs:** https://react-leaflet.js.org/

---

## 7. Frontend — WebSocket Packet Stream

**File:** `src/hooks/usePacketStream.ts` + `src/context/PacketStreamContext.tsx`

### React Context + useRef Pattern

```javascript
// Provider creates the WebSocket connection once
const ws = new WebSocket("ws://localhost:8000/ws/capture");
ws.onmessage = (event) => {
    const pkt = JSON.parse(event.data);
    subscribers.forEach(fn => fn(pkt));  // Fan-out to all subscribers
};

// Hooks subscribe to the stream
const { subscribe } = usePacketStream();
subscribe((pkt) => {
    // Process each packet (update graph, map, etc.)
});
```

**What it does:** A single WebSocket connection is shared across all React components via React Context. When a packet arrives, it is "fanned out" to every subscriber (graph, map, capture table) simultaneously.

**Official Docs:** https://react.dev/reference/react/useContext

---

## 8. Networking Theory — BPF Filters

### Berkeley Packet Filter Syntax

The `filter` parameter in `AsyncSniffer(filter="ip")` uses BPF syntax. This filter runs inside the OS kernel, so unwanted packets are dropped before they reach Python — massively improving performance.

| Filter | Captures |
|--------|----------|
| `ip` | All IPv4 traffic |
| `ip or ip6` | All IPv4 + IPv6 traffic |
| `tcp` | Only TCP packets |
| `udp port 53` | Only DNS traffic |
| `host 8.8.8.8` | Traffic to/from Google DNS |
| `tcp and dst port 443` | Only outgoing HTTPS |
| `not arp` | Everything except ARP |

**Reference:** `pcap-filter(7)` man page — https://man7.org/linux/man-pages/man7/pcap-filter.7.html

---

## 9. Official References

| Technology | Documentation URL |
|-----------|-------------------|
| Scapy | https://scapy.readthedocs.io/en/latest/ |
| Scapy AsyncSniffer | https://scapy.readthedocs.io/en/latest/usage.html#asynchronous-sniffing |
| FastAPI | https://fastapi.tiangolo.com/ |
| FastAPI WebSockets | https://fastapi.tiangolo.com/advanced/websockets/ |
| Python `asyncio` | https://docs.python.org/3/library/asyncio.html |
| Python `socket` | https://docs.python.org/3/library/socket.html |
| Python `ipaddress` | https://docs.python.org/3/library/ipaddress.html |
| D3.js Force Simulation | https://d3js.org/d3-force |
| D3.js Data Joins | https://d3js.org/d3-selection/joining |
| React Leaflet | https://react-leaflet.js.org/ |
| BPF Filter Syntax | https://man7.org/linux/man-pages/man7/pcap-filter.7.html |
| TCP (RFC 793) | https://www.rfc-editor.org/rfc/rfc793 |
| DNS (RFC 1035) | https://www.rfc-editor.org/rfc/rfc1035 |
| IANA Port Numbers | https://www.iana.org/assignments/service-names-port-numbers |
| RFC 1918 (Private IPs) | https://www.rfc-editor.org/rfc/rfc1918 |

---

*Generated for PacketScope Lab Evaluation — May 2026*
