from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio, json, random, time, threading
from datetime import datetime

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── Try to import Scapy (needs admin) ───
try:
    from scapy.all import AsyncSniffer, get_if_list, IP, TCP, UDP, DNS, ICMP, ARP
    SCAPY_AVAILABLE = True
except Exception:
    SCAPY_AVAILABLE = False

print(f"Scapy available: {SCAPY_AVAILABLE}")

# ─── Shared state ───
packet_store = []
device_store = {}
connection_store = {}
alert_store = []
beacon_store = {}
packet_counter = 0

def parse_packet(pkt):
    global packet_counter
    packet_counter += 1
    now = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    
    src = dst = protocol = info = flags = ""
    src_port = dst_port = length = ttl = 0

    if IP in pkt:
        src = pkt[IP].src
        dst = pkt[IP].dst
        ttl = pkt[IP].ttl
        length = len(pkt)

        if TCP in pkt:
            protocol = "TCP"
            src_port = pkt[TCP].sport
            dst_port = pkt[TCP].dport
            flag_map = {0x02:"SYN",0x10:"ACK",0x12:"SYN|ACK",0x01:"FIN",0x04:"RST",0x18:"PSH|ACK"}
            flags = flag_map.get(int(pkt[TCP].flags), str(pkt[TCP].flags))
            if dst_port == 443: info = f"HTTPS {src}:{src_port} → {dst}:{dst_port}"
            elif dst_port == 80: info = f"HTTP {src}:{src_port} → {dst}:{dst_port}"
            else: info = f"TCP {src}:{src_port} → {dst}:{dst_port} [{flags}]"

        elif UDP in pkt:
            protocol = "UDP"
            src_port = pkt[UDP].sport
            dst_port = pkt[UDP].dport
            if dst_port == 53 or src_port == 53:
                protocol = "DNS"
                if DNS in pkt and pkt[DNS].qd:
                    info = f"DNS Query: {pkt[DNS].qd.qname.decode()}"
                else:
                    info = "DNS Response"
            else:
                info = f"UDP {src}:{src_port} → {dst}:{dst_port}"

        elif ICMP in pkt:
            protocol = "ICMP"
            info = f"ICMP {src} → {dst} type={pkt[ICMP].type}"

        else:
            protocol = "IP"
            info = f"IP {src} → {dst}"

        # Update device store
        update_device(src, protocol, length)
        update_device(dst, protocol, length)
        
        # Update connection store
        conn_key = f"{src}:{src_port}-{dst}:{dst_port}"
        if conn_key not in connection_store:
            connection_store[conn_key] = {"src":src,"dst":dst,"srcPort":src_port,"dstPort":dst_port,"protocol":protocol,"volume":0,"packets":0}
        connection_store[conn_key]["volume"] += length
        connection_store[conn_key]["packets"] += 1

        # Beaconing detection
        detect_beacon(src, dst, dst_port)

        return {
            "id": packet_counter,
            "timestamp": now,
            "src": src,
            "dst": dst,
            "srcPort": src_port,
            "dstPort": dst_port,
            "protocol": protocol,
            "length": length,
            "info": info,
            "flags": flags,
            "ttl": ttl
        }
    return None

def update_device(ip, protocol, length):
    if not ip or ip.startswith("0.") or ip == "255.255.255.255":
        return
    if ip not in device_store:
        device_store[ip] = {
            "ip": ip,
            "packets": 0,
            "bytes": 0,
            "protocols": {},
            "firstSeen": datetime.now().isoformat(),
            "lastSeen": datetime.now().isoformat(),
            "anomalyScore": 0
        }
    device_store[ip]["packets"] += 1
    device_store[ip]["bytes"] += length
    device_store[ip]["lastSeen"] = datetime.now().isoformat()
    device_store[ip]["protocols"][protocol] = device_store[ip]["protocols"].get(protocol, 0) + 1

beacon_timing = {}
def detect_beacon(src, dst, dst_port):
    key = f"{src}-{dst}:{dst_port}"
    now = time.time()
    if key not in beacon_timing:
        beacon_timing[key] = []
    beacon_timing[key].append(now)
    # Keep last 20 timestamps
    beacon_timing[key] = beacon_timing[key][-20:]
    
    if len(beacon_timing[key]) >= 5:
        intervals = [beacon_timing[key][i+1] - beacon_timing[key][i] 
                    for i in range(len(beacon_timing[key])-1)]
        mean = sum(intervals) / len(intervals)
        if mean > 0:
            variance = sum((x-mean)**2 for x in intervals) / len(intervals)
            std = variance ** 0.5
            cv = std / mean  # coefficient of variation — low = regular = beacon
            regularity = max(0, 1 - cv)
            
            if regularity > 0.7:
                beacon_store[key] = {
                    "src": src,
                    "dst": dst,
                    "dstPort": dst_port,
                    "interval": round(mean, 2),
                    "regularityScore": round(regularity, 3),
                    "confidence": round(regularity * 100, 1),
                    "count": len(beacon_timing[key]),
                    "timestamps": beacon_timing[key][-20:],
                    "status": "CONFIRMED BEACON" if regularity > 0.85 else "MONITORING"
                }
                # Fire alert
                if regularity > 0.85:
                    alert_store.append({
                        "type": "alert",
                        "data": {
                            "id": len(alert_store)+1,
                            "severity": "HIGH",
                            "title": f"Beaconing Detected: {src}",
                            "message": f"{src} → {dst}:{dst_port} | interval={round(mean,1)}s | regularity={round(regularity,3)}",
                            "timestamp": datetime.now().isoformat()
                        }
                    })

# ─── HEALTH CHECK ───
@app.get("/api/health")
def health():
    return {"status": "ok", "scapy": SCAPY_AVAILABLE, "packets": packet_counter}

@app.get("/api/devices")
def get_devices():
    return list(device_store.values())

@app.get("/api/devices/{ip}")
def get_device(ip: str):
    return device_store.get(ip, {})

# ─── CAPTURE WEBSOCKET ───
@app.websocket("/ws/capture")
async def capture_ws(websocket: WebSocket):
    await websocket.accept()
    sniffer = None
    packet_queue = asyncio.Queue()

    def on_packet(pkt):
        parsed = parse_packet(pkt)
        if parsed:
            asyncio.run_coroutine_threadsafe(packet_queue.put(parsed), loop)

    loop = asyncio.get_event_loop()

    try:
        while True:
            # Check for incoming commands (non-blocking)
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=0.05)
                msg = json.loads(raw)
                
                if msg.get("action") == "list_interfaces":
                    if SCAPY_AVAILABLE:
                        ifaces = get_if_list()
                    else:
                        ifaces = ["eth0","wlan0","lo","docker0"]
                    await websocket.send_text(json.dumps({
                        "type": "interfaces",
                        "interfaces": ifaces,
                        "simulated": not SCAPY_AVAILABLE
                    }))

                elif msg.get("action") == "start":
                    iface = msg.get("interface", "eth0")
                    bpf = msg.get("filter", "")
                    
                    if iface == "Simulated Traffic":
                        await websocket.send_text(json.dumps({"type":"status","status":"capturing","simulated":True}))
                        websocket.mock_task = asyncio.create_task(mock_packet_generator(packet_queue))
                    elif SCAPY_AVAILABLE:
                        try:
                            sniffer = AsyncSniffer(
                                iface=iface,
                                filter=bpf if bpf else None,
                                prn=on_packet,
                                store=False
                            )
                            sniffer.start()
                            await websocket.send_text(json.dumps({"type":"status","status":"capturing","simulated":False}))
                        except Exception as e:
                            await websocket.send_text(json.dumps({"type":"status","status":"error","message":str(e),"simulated":True}))
                            # Fall back to mock
                            websocket.mock_task = asyncio.create_task(mock_packet_generator(packet_queue))
                    else:
                        await websocket.send_text(json.dumps({"type":"status","status":"capturing","simulated":True}))
                        websocket.mock_task = asyncio.create_task(mock_packet_generator(packet_queue))

                elif msg.get("action") == "stop":
                    if sniffer:
                        sniffer.stop()
                        sniffer = None
                    if hasattr(websocket, 'mock_task'):
                        websocket.mock_task.cancel()
                    await websocket.send_text(json.dumps({"type":"status","status":"stopped"}))

            except asyncio.TimeoutError:
                pass

            # Send queued packets
            batch = []
            while not packet_queue.empty() and len(batch) < 20:
                batch.append(await packet_queue.get())
            if batch:
                await websocket.send_text(json.dumps({"type":"packets","data":batch}))

    except WebSocketDisconnect:
        if sniffer:
            sniffer.stop()

async def mock_packet_generator(queue):
    protocols = ["TCP","UDP","DNS","HTTPS","HTTP","ICMP"]
    ips = ["192.168.1.1","192.168.1.45","192.168.1.89","192.168.1.105","8.8.8.8","1.1.1.1","167.88.162.34","185.220.101.45"]
    global packet_counter
    while True:
        await asyncio.sleep(random.uniform(0.1, 0.3))
        packet_counter += 1
        proto = random.choice(protocols)
        src = random.choice(ips[:5])
        dst = random.choice(ips[3:])
        pkt = {
            "id": packet_counter,
            "timestamp": datetime.now().strftime("%H:%M:%S.%f")[:-3],
            "src": src, "dst": dst,
            "srcPort": random.randint(1024,65535),
            "dstPort": random.choice([80,443,53,22,8080]),
            "protocol": proto,
            "length": random.randint(64,1500),
            "info": f"{proto} {src} → {dst}",
            "flags": random.choice(["SYN","ACK","SYN|ACK","PSH|ACK",""]),
            "ttl": random.randint(32,128)
        }
        await queue.put(pkt)

# ─── GRAPH WEBSOCKET ───
@app.websocket("/ws/graph")
async def graph_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Build real graph from device/connection store
            nodes = []
            for ip, dev in list(device_store.items())[:30]:
                is_local = ip.startswith("192.168.")
                nodes.append({
                    "id": ip,
                    "label": ip,
                    "type": "internal" if is_local else "external",
                    "threatLevel": 2 if ip in ["185.220.101.45","167.88.162.34"] else 0,
                    "packetCount": dev["packets"]
                })

            edges = []
            for key, conn in list(connection_store.items())[:50]:
                edges.append({
                    "source": conn["src"],
                    "target": conn["dst"],
                    "volume": conn["volume"],
                    "protocol": conn["protocol"],
                    "threatLevel": 2 if conn["dst"] in ["185.220.101.45","167.88.162.34"] else 0,
                    "active": True
                })

            await websocket.send_text(json.dumps({"nodes": nodes, "edges": edges}))
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass

def mock_graph_data():
    nodes = [
        {"id":"192.168.1.1","label":"Router","type":"router","threatLevel":0,"packetCount":9823},
        {"id":"192.168.1.45","label":"LAPTOP-KARAN","type":"internal","threatLevel":1,"packetCount":5621},
        {"id":"192.168.1.89","label":"DESKTOP-ANUJ","type":"internal","threatLevel":0,"packetCount":3210},
        {"id":"192.168.1.200","label":"UNKNOWN","type":"internal","threatLevel":2,"packetCount":8920},
        {"id":"192.168.1.234","label":"PHONE-RAHUL","type":"internal","threatLevel":1,"packetCount":1205},
        {"id":"8.8.8.8","label":"Google DNS","type":"external","threatLevel":0,"packetCount":4521},
        {"id":"167.88.162.34","label":"C2 Server","type":"threat","threatLevel":2,"packetCount":94},
        {"id":"185.220.101.45","label":"Tor Exit","type":"threat","threatLevel":2,"packetCount":423},
        {"id":"1.1.1.1","label":"Cloudflare","type":"external","threatLevel":0,"packetCount":2341},
    ]
    edges = [
        {"source":"192.168.1.45","target":"167.88.162.34","volume":random.randint(8000,9500),"protocol":"HTTPS","threatLevel":2,"active":True},
        {"source":"192.168.1.234","target":"185.220.101.45","volume":random.randint(500000,900000),"protocol":"TCP","threatLevel":2,"active":True},
        {"source":"192.168.1.1","target":"8.8.8.8","volume":random.randint(3000,5000),"protocol":"DNS","threatLevel":0,"active":True},
        {"source":"192.168.1.89","target":"1.1.1.1","volume":random.randint(1000,3000),"protocol":"HTTPS","threatLevel":0,"active":False},
        {"source":"192.168.1.200","target":"192.168.1.105","volume":random.randint(200,800),"protocol":"TCP","threatLevel":2,"active":True},
    ]
    return nodes, edges

# ─── MAP WEBSOCKET ───
@app.websocket("/ws/map")
async def map_ws(websocket: WebSocket):
    await websocket.accept()
    GEO = {
        "8.8.8.8":       {"lat":37.4056,"lng":-122.0775,"city":"Mountain View","country":"US","asn":"Google"},
        "1.1.1.1":       {"lat":33.4484,"lng":-112.0740,"city":"Phoenix","country":"US","asn":"Cloudflare"},
        "167.88.162.34": {"lat":52.5200,"lng":13.4050,"city":"Berlin","country":"DE","asn":"Unknown","threat":True},
        "185.220.101.45":{"lat":51.1657,"lng":10.4515,"city":"Frankfurt","country":"DE","asn":"Tor Exit","tor":True},
    }
    try:
        while True:
            conns = []
            for key, conn in list(connection_store.items()):
                dst = conn["dst"]
                if dst in GEO:
                    geo = GEO[dst]
                    conns.append({
                        "src": conn["src"],
                        "dst": dst,
                        "srcLat": 26.8467, "srcLng": 80.9462,  # Lucknow/UP
                        "dstLat": geo["lat"], "dstLng": geo["lng"],
                        "city": geo["city"], "country": geo["country"],
                        "asn": geo.get("asn",""),
                        "bytes": conn["volume"],
                        "protocol": conn["protocol"],
                        "threat": geo.get("threat", False),
                        "tor": geo.get("tor", False)
                    })
            
            if not conns:
                conns = mock_map_data()

            await websocket.send_text(json.dumps({"type":"connections","data":conns}))
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        pass

def mock_map_data():
    return [
        {"src":"192.168.1.45","dst":"167.88.162.34","srcLat":26.84,"srcLng":80.94,"dstLat":52.52,"dstLng":13.40,"city":"Berlin","country":"DE","asn":"Unknown","bytes":random.randint(8000,9500),"protocol":"HTTPS","threat":True,"tor":False},
        {"src":"192.168.1.234","dst":"185.220.101.45","srcLat":26.84,"srcLng":80.94,"dstLat":51.16,"dstLng":10.45,"city":"Frankfurt","country":"DE","asn":"Tor Exit","bytes":random.randint(800000,900000),"protocol":"TCP","threat":True,"tor":True},
        {"src":"192.168.1.1","dst":"8.8.8.8","srcLat":26.84,"srcLng":80.94,"dstLat":37.40,"dstLng":-122.07,"city":"Mountain View","country":"US","asn":"Google","bytes":random.randint(3000,5000),"protocol":"DNS","threat":False,"tor":False},
        {"src":"192.168.1.89","dst":"1.1.1.1","srcLat":26.84,"srcLng":80.94,"dstLat":33.44,"dstLng":-112.07,"city":"Phoenix","country":"US","asn":"Cloudflare","bytes":random.randint(1000,3000),"protocol":"HTTPS","threat":False,"tor":False},
    ]

# ─── ALERTS WEBSOCKET ───
@app.websocket("/ws/alerts")
async def alerts_ws(websocket: WebSocket):
    await websocket.accept()
    sent = 0
    try:
        while True:
            while sent < len(alert_store):
                await websocket.send_text(json.dumps(alert_store[sent]))
                sent += 1
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass

# ─── BEACONING WEBSOCKET ───
@app.websocket("/ws/beaconing")
async def beaconing_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            beacons = list(beacon_store.values())
            if not beacons:
                beacons = [{
                    "src":"192.168.1.45","dst":"167.88.162.34","dstPort":443,
                    "interval":30.2,"regularityScore":0.97,"confidence":97.0,
                    "count":94,"status":"CONFIRMED BEACON",
                    "timestamps":[time.time() - i*30 for i in range(20,0,-1)]
                }]
            await websocket.send_text(json.dumps({"type":"beaconing_update","beacons":beacons}))
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
