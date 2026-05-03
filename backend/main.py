"""
PacketScope Backend — FastAPI + WebSocket mock data server.
Run: uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio, json, random, time, math

app = FastAPI(title="PacketScope Backend", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── Mock Data ───

DEVICES = [
    {"ip": "192.168.1.1", "name": "Gateway Router", "mac": "A8:5E:45:F3:21:0A", "type": "router", "anomaly": 12},
    {"ip": "192.168.1.45", "name": "LAPTOP-KARAN", "mac": "4C:CC:6A:BB:11:22", "type": "internal", "anomaly": 97},
    {"ip": "192.168.1.89", "name": "DESKTOP-ANUJ", "mac": "D4:3B:04:EC:99:AA", "type": "internal", "anomaly": 68},
    {"ip": "192.168.1.105", "name": "RASPI-SENSOR", "mac": "B8:27:EB:11:22:33", "type": "internal", "anomaly": 23},
    {"ip": "192.168.1.200", "name": "UNKNOWN-DEVICE", "mac": "00:11:22:33:44:55", "type": "threat", "anomaly": 89},
    {"ip": "192.168.1.234", "name": "PHONE-RAHUL", "mac": "F0:77:C3:44:55:66", "type": "internal", "anomaly": 45},
]

PROTOS = ["TCP", "UDP", "DNS", "HTTP", "TLS", "ICMP"]
SRC_IPS = [d["ip"] for d in DEVICES]
DST_IPS = ["142.250.80.100", "167.88.162.34", "185.220.101.45", "104.21.55.10", "8.8.8.8", "1.1.1.1"]

pkt_id = 0

def generate_packet():
    global pkt_id
    pkt_id += 1
    src = random.choice(SRC_IPS)
    is_beacon = src == "192.168.1.45" and random.random() > 0.7
    dst = "167.88.162.34" if is_beacon else random.choice(DST_IPS)
    proto = random.choice(PROTOS)
    now = time.time()
    ms = int((now % 1) * 1000)
    t = time.strftime("%H:%M:%S", time.localtime(now))
    return {
        "id": pkt_id,
        "timestamp": f"{t}.{ms:03d}",
        "src": src,
        "dst": dst,
        "srcPort": random.randint(1024, 65535),
        "dstPort": random.choice([80, 443, 53, 8080, 1194, 9001]),
        "protocol": proto,
        "length": random.randint(60, 1500),
        "info": "TCP keepalive — beacon candidate" if is_beacon else f"{proto} {dst}",
        "flags": random.choice(["SYN", "SYN|ACK", "ACK", "PSH|ACK", ""]) if proto == "TCP" else "",
        "ttl": random.choice([64, 128, 255]),
    }

# ─── WebSocket Endpoints ───

@app.websocket("/ws/capture")
async def capture_ws(websocket: WebSocket):
    await websocket.accept()
    capturing = False
    try:
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                data = json.loads(msg)
                if data.get("action") == "start":
                    capturing = True
                    await websocket.send_json({"status": "started", "interface": data.get("interface", "eth0")})
                elif data.get("action") == "stop":
                    capturing = False
                    await websocket.send_json({"status": "stopped"})
                elif data.get("action") == "list_interfaces":
                    try:
                        from scapy.all import get_if_list
                        interfaces = get_if_list()
                    except Exception:
                        interfaces = ["eth0", "wlan0", "lo", "docker0"]
                    await websocket.send_json({"interfaces": interfaces})
            except asyncio.TimeoutError:
                pass
            if capturing:
                batch = [generate_packet() for _ in range(random.randint(2, 6))]
                await websocket.send_json({"packets": batch})
                await asyncio.sleep(0.15)
            else:
                await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass

@app.websocket("/ws/graph")
async def graph_ws(websocket: WebSocket):
    await websocket.accept()
    nodes = [
        {"id": "192.168.1.1", "label": "Gateway Router", "type": "router", "threatLevel": 0, "packetCount": 184210},
        {"id": "192.168.1.45", "label": "LAPTOP-KARAN", "type": "internal", "threatLevel": 2, "packetCount": 94021},
        {"id": "192.168.1.89", "label": "DESKTOP-ANUJ", "type": "internal", "threatLevel": 1, "packetCount": 64820},
        {"id": "142.250.80.100", "label": "Google", "type": "external", "threatLevel": 0, "packetCount": 32100},
        {"id": "167.88.162.34", "label": "C2 Server?", "type": "threat", "threatLevel": 2, "packetCount": 940},
        {"id": "185.220.101.45", "label": "Tor Exit", "type": "threat", "threatLevel": 2, "packetCount": 4200},
    ]
    edges = [
        {"source": "192.168.1.45", "target": "167.88.162.34", "volume": 8920, "protocol": "TCP", "threatLevel": 2, "active": True},
        {"source": "192.168.1.1", "target": "142.250.80.100", "volume": 32100, "protocol": "HTTPS", "threatLevel": 0, "active": True},
        {"source": "192.168.1.234", "target": "185.220.101.45", "volume": 42000, "protocol": "Tor", "threatLevel": 2, "active": True},
        {"source": "192.168.1.89", "target": "142.250.80.100", "volume": 12300, "protocol": "HTTPS", "threatLevel": 0, "active": True},
    ]
    try:
        while True:
            for e in edges:
                e["volume"] += random.randint(10, 500)
                e["active"] = random.random() > 0.2
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
            conn = {
                "src": random.choice(SRC_IPS),
                "srcLat": 28.6139, "srcLng": 77.2090,
                "dst": random.choice(DST_IPS),
                "dstLat": random.uniform(-40, 60), "dstLng": random.uniform(-120, 150),
                "bytes": random.randint(1000, 10000000),
                "protocol": random.choice(["HTTPS", "DNS", "TCP", "Tor"]),
                "threat": random.random() > 0.7,
            }
            await websocket.send_json(conn)
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        pass

@app.websocket("/ws/alerts")
async def alerts_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            alert = {
                "id": random.randint(100, 999),
                "sev": random.choice(["critical", "warn"]),
                "title": random.choice(["Beaconing detected", "Port scan", "Suspicious DNS", "VPN traffic"]),
                "src": random.choice(SRC_IPS),
                "dst": random.choice(DST_IPS),
                "timestamp": time.strftime("%H:%M:%S"),
            }
            await websocket.send_json(alert)
            await asyncio.sleep(random.uniform(5, 15))
    except WebSocketDisconnect:
        pass

@app.websocket("/ws/beaconing")
async def beaconing_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            update = {
                "ip": "192.168.1.45",
                "dst": "167.88.162.34",
                "regularity": 0.97 + random.uniform(-0.01, 0.01),
                "interval": 30.0 + random.uniform(-0.3, 0.3),
                "events": pkt_id // 100,
                "timestamp": time.strftime("%H:%M:%S"),
            }
            await websocket.send_json(update)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        pass

# ─── REST Endpoints ───

@app.get("/api/devices")
async def get_devices():
    return DEVICES

@app.get("/api/devices/{ip}")
async def get_device(ip: str):
    device = next((d for d in DEVICES if d["ip"] == ip), None)
    if device:
        return device
    return {"error": "Device not found"}

@app.get("/api/health")
async def health():
    return {"status": "ok", "engine": "PacketScope", "version": "1.0.0"}
