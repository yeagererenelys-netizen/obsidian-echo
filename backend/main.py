"""
PacketScope Backend — FastAPI + Scapy Network Engine.
Run: uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import asyncio, json, random, time, math
import threading
try:
    from scapy.all import AsyncSniffer, get_if_list, IP, TCP, UDP, DNS
    SCAPY_AVAILABLE = True
except Exception as e:
    print(f"Scapy not available: {e}")
    SCAPY_AVAILABLE = False

app = FastAPI(title="PacketScope Backend", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── Global State ───
pkt_counter = 0
active_sniffer = None
beacon_counter = 0
alert_counter = 0

# ─── Mock Data Helpers ───
DEVICES = [
    {"ip": "192.168.1.1", "name": "Gateway Router", "mac": "A8:5E:45:F3:21:0A", "type": "router", "anomaly": 12},
    {"ip": "192.168.1.45", "name": "LAPTOP-KARAN", "mac": "4C:CC:6A:BB:11:22", "type": "internal", "anomaly": 97},
    {"ip": "192.168.1.89", "name": "DESKTOP-ANUJ", "mac": "D4:3B:04:EC:99:AA", "type": "internal", "anomaly": 68},
    {"ip": "192.168.1.105", "name": "RASPI-SENSOR", "mac": "B8:27:EB:11:22:33", "type": "internal", "anomaly": 23},
    {"ip": "192.168.1.200", "name": "UNKNOWN-DEVICE", "mac": "00:11:22:33:44:55", "type": "threat", "anomaly": 89},
    {"ip": "192.168.1.234", "name": "PHONE-RAHUL", "mac": "F0:77:C3:44:55:66", "type": "internal", "anomaly": 45},
]
DST_IPS = [
    {"ip": "142.250.80.100", "name": "Google APIs", "country": "US", "lat": 37.386, "lng": -122.084, "type": "safe"},
    {"ip": "167.88.162.34", "name": "C2 Server", "country": "Unknown", "lat": 0, "lng": 0, "type": "beacon"},
    {"ip": "185.220.101.45", "name": "Tor Exit", "country": "NL", "lat": 52.370, "lng": 4.895, "type": "tor"},
    {"ip": "104.21.55.10", "name": "Cloudflare CDN", "country": "US", "lat": 37.386, "lng": -122.084, "type": "safe"},
    {"ip": "8.8.8.8", "name": "Google DNS", "country": "US", "lat": 37.386, "lng": -122.084, "type": "safe"},
    {"ip": "1.1.1.1", "name": "Cloudflare DNS", "country": "AU", "lat": -33.865, "lng": 151.209, "type": "safe"},
]

def generate_mock_packet():
    global pkt_counter
    pkt_counter += 1
    src = random.choice([d["ip"] for d in DEVICES])
    is_beacon = src == "192.168.1.45" and random.random() > 0.7
    dst_choice = random.choice(DST_IPS)
    dst = dst_choice["ip"]
    proto = random.choice(["TCP", "UDP", "DNS", "HTTPS", "TLS"])
    now = time.time()
    return {
        "id": pkt_counter,
        "timestamp": time.strftime("%H:%M:%S", time.localtime(now)) + f".{int((now % 1) * 1000):03d}",
        "src": src,
        "dst": dst,
        "srcPort": random.randint(1024, 65535),
        "dstPort": 443 if proto in ["HTTPS", "TLS"] else 53 if proto == "DNS" else 80,
        "protocol": proto,
        "length": random.randint(60, 1500),
        "info": "Beaconing pattern detected" if is_beacon else f"{proto} payload",
        "flags": "ACK",
        "ttl": 64
    }

def generate_beacon():
    global beacon_counter
    beacon_counter += 1
    src = random.choice([d["ip"] for d in DEVICES])
    dst_choice = random.choice(DST_IPS)
    return {
        "id": beacon_counter,
        "ip": src,
        "destination": dst_choice["ip"],
        "destinationName": dst_choice["name"],
        "interval": 30 + random.randint(-5, 5),
        "jitter": random.uniform(0, 0.5),
        "regularity": random.uniform(0.4, 0.99),
        "confidence": random.randint(60, 99),
        "eventCount": random.randint(5, 100),
        "duration": f"{random.randint(5, 120)}m",
        "status": "active",
        "severity": random.randint(1, 3),
        "protocol": random.choice(["TCP", "UDP", "DNS"]),
        "port": random.choice([53, 80, 443, 22, 25]),
        "payloadSize": random.randint(50, 500),
    }

def generate_alert():
    global alert_counter
    alert_counter += 1
    severity_levels = ["critical", "high", "medium", "low"]
    src = random.choice([d["ip"] for d in DEVICES])
    dst_choice = random.choice(DST_IPS)
    return {
        "id": alert_counter,
        "timestamp": time.time(),
        "severity": random.choice(severity_levels),
        "title": random.choice([
            "Beaconing detected - 192.168.1.45 → 167.88.162.34",
            "Anomalous port scan detected",
            "DNS tunneling detected",
            "Tor connection established",
            "VPN/Proxy tunnel identified",
            "Suspicious outbound connection",
            "C2 communication pattern detected",
            "Data exfiltration suspected",
        ]),
        "source": src,
        "destination": dst_choice["ip"],
        "protocol": random.choice(["TCP", "UDP", "DNS"]),
        "port": random.choice([53, 80, 443, 22, 25]),
        "confidence": random.randint(60, 100),
        "description": "Automated threat detection engine alert",
    }

# ─── WebSocket Endpoints ───

@app.websocket("/ws/capture")
async def capture_ws(websocket: WebSocket):
    await websocket.accept()
    queue = asyncio.Queue()
    
    def packet_callback(pkt):
        global pkt_counter
        pkt_counter += 1
        data = {"id": pkt_counter, "timestamp": time.strftime("%H:%M:%S"), "protocol": "OTHER", "length": len(pkt), "info": pkt.summary()}
        if IP in pkt:
            data.update({"src": pkt[IP].src, "dst": pkt[IP].dst, "ttl": pkt[IP].ttl})
            if TCP in pkt:
                data.update({"protocol": "TCP", "srcPort": pkt[TCP].sport, "dstPort": pkt[TCP].dport, "flags": str(pkt[TCP].flags)})
            elif UDP in pkt:
                data.update({"protocol": "UDP", "srcPort": pkt[UDP].sport, "dstPort": pkt[UDP].dport})
        
        # Use call_soon_threadsafe to put in queue
        loop.call_soon_threadsafe(queue.put_nowait, data)

    loop = asyncio.get_event_loop()
    sniffer = None
    is_running = False

    try:
        while True:
            try:
                # Listen for commands from client
                msg_text = await asyncio.wait_for(websocket.receive_text(), timeout=0.01)
                msg = json.loads(msg_text)
                action = msg.get("action")
                
                if action == "start":
                    if SCAPY_AVAILABLE:
                        try:
                            iface = msg.get("interface", "eth0")
                            filter_str = msg.get("filter", "")
                            sniffer = AsyncSniffer(iface=iface, filter=filter_str, prn=packet_callback, store=0)
                            sniffer.start()
                            is_running = True
                            await websocket.send_json({"status": "started", "mode": "live"})
                        except Exception as e:
                            print(f"Sniffer failed: {e}")
                            is_running = True
                            await websocket.send_json({"status": "started", "mode": "mock", "error": str(e)})
                    else:
                        is_running = True
                        await websocket.send_json({"status": "started", "mode": "mock"})
                
                elif action == "stop":
                    if sniffer: sniffer.stop()
                    is_running = False
                    await websocket.send_json({"status": "stopped"})
                
                elif action == "list_interfaces":
                    ifaces = get_if_list() if SCAPY_AVAILABLE else ["eth0", "wlan0", "lo", "docker0"]
                    await websocket.send_json({"interfaces": ifaces})

            except asyncio.TimeoutError:
                pass

            # Send packets from queue or generate mock
            if is_running:
                if not queue.empty():
                    batch = []
                    while not queue.empty() and len(batch) < 10:
                        batch.append(await queue.get())
                    await websocket.send_json(batch)
                elif not SCAPY_AVAILABLE or sniffer is None:
                    # Mock mode
                    await websocket.send_json([generate_mock_packet() for _ in range(random.randint(1, 3))])
                    await asyncio.sleep(0.2)
            else:
                await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        if sniffer: sniffer.stop()

@app.websocket("/ws/graph")
async def graph_ws(websocket: WebSocket):
    await websocket.accept()
    nodes = [
        {"id": "192.168.1.1", "label": "Gateway Router", "type": "router", "threatLevel": 0, "packetCount": 184210},
        {"id": "192.168.1.45", "label": "LAPTOP-KARAN", "type": "internal", "threatLevel": 97, "packetCount": 94021},
        {"id": "192.168.1.89", "label": "DESKTOP-ANUJ", "type": "internal", "threatLevel": 1, "packetCount": 64820},
        {"id": "192.168.1.105", "label": "RASPI-SENSOR", "type": "internal", "threatLevel": 0, "packetCount": 23100},
        {"id": "192.168.1.200", "label": "UNKNOWN-DEVICE", "type": "threat", "threatLevel": 89, "packetCount": 12840},
        {"id": "142.250.80.100", "label": "Google", "type": "external", "threatLevel": 0, "packetCount": 32100},
        {"id": "167.88.162.34", "label": "C2 Server?", "type": "threat", "threatLevel": 97, "packetCount": 940},
        {"id": "185.220.101.45", "label": "Tor Exit", "type": "threat", "threatLevel": 85, "packetCount": 640},
    ]
    edges = [
        {"source": "192.168.1.45", "target": "167.88.162.34", "volume": 8920, "protocol": "TCP", "threatLevel": 97, "active": True},
        {"source": "192.168.1.45", "target": "185.220.101.45", "volume": 640, "protocol": "HTTPS", "threatLevel": 85, "active": True},
        {"source": "192.168.1.1", "target": "142.250.80.100", "volume": 32100, "protocol": "HTTPS", "threatLevel": 0, "active": True},
        {"source": "192.168.1.200", "target": "104.21.55.10", "volume": 2100, "protocol": "TCP", "threatLevel": 50, "active": True},
    ]
    try:
        while True:
            for e in edges:
                e["volume"] += random.randint(10, 500)
                e["active"] = random.random() > 0.3
            for n in nodes:
                n["packetCount"] += random.randint(1, 50)
            await websocket.send_json({"nodes": nodes, "edges": edges})
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass

@app.websocket("/ws/map")
async def map_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            src = random.choice(DEVICES)
            dst = random.choice(DST_IPS)
            await websocket.send_json({
                "src": src["ip"],
                "srcLat": 28.6139,
                "srcLng": 77.2090,
                "dst": dst["ip"],
                "dstLat": dst["lat"],
                "dstLng": dst["lng"],
                "dstName": dst["name"],
                "country": dst["country"],
                "bytes": random.randint(1000, 10000000),
                "protocol": random.choice(["TCP", "UDP", "HTTPS"]),
                "threat": dst["type"] in ["tor", "beacon"],
                "type": dst["type"],
            })
            await asyncio.sleep(random.uniform(1, 3))
    except WebSocketDisconnect:
        pass

@app.websocket("/ws/beaconing")
async def beaconing_ws(websocket: WebSocket):
    """Beaconing detection stream with regularity scoring"""
    await websocket.accept()
    try:
        while True:
            beacons = [generate_beacon() for _ in range(random.randint(1, 3))]
            await websocket.send_json({
                "type": "beaconing_update",
                "timestamp": time.time(),
                "beacons": beacons,
            })
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        pass

@app.websocket("/ws/alerts")
async def alerts_ws(websocket: WebSocket):
    """Live security alerts stream"""
    await websocket.accept()
    try:
        while True:
            alert = generate_alert()
            await websocket.send_json({
                "type": "alert",
                "data": alert,
            })
            await asyncio.sleep(random.uniform(5, 10))
    except WebSocketDisconnect:
        pass

# ─── HTTP REST Endpoints ───

@app.get("/api/devices")
async def get_devices():
    return {"devices": DEVICES}

@app.get("/api/interfaces")
async def get_interfaces():
    ifaces = get_if_list() if SCAPY_AVAILABLE else ["eth0", "wlan0", "lo", "docker0"]
    return {"interfaces": ifaces}

@app.get("/api/health")
async def health():
    return {"status": "ok", "engine": "PacketScope", "scapy": SCAPY_AVAILABLE}
