import asyncio
import json
import logging
import sys
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tempfile

# Handle both direct run and module run:
# python backend/main.py  →  from capture import capture
# uvicorn backend.main:app → from backend.capture import capture
try:
    from capture import capture
except ImportError:
    from backend.capture import capture

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Lifespan — startup / shutdown

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("PacketScope backend starting...")
    yield
    logger.info("PacketScope backend shutting down...")
    capture.stop()

# App

app = FastAPI(
    title="PacketScope Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "capture_running": capture.is_running,
    }

@app.get("/api/interfaces")
async def list_interfaces():
    """List available network interfaces for the frontend selector."""
    try:
        from scapy.arch import get_if_list
        return {"interfaces": get_if_list()}
    except Exception as e:
        return {"interfaces": [], "error": str(e)}

@app.post("/api/upload-pcap")
async def upload_pcap(file: UploadFile = File(...)):
    content = await file.read()
    
    def process_pcap(data):
        from scapy.utils import PcapReader
        import os
        
        packet_count = 0
        tags = set()
        
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(data)
            tmp_path = tmp.name
            
        try:
            with PcapReader(tmp_path) as pr:
                for pkt in pr:
                    packet_count += 1
                    if pkt.haslayer("TCP"):
                        tags.add("tcp")
                    elif pkt.haslayer("UDP"):
                        tags.add("udp")
                    elif pkt.haslayer("ICMP"):
                        tags.add("icmp")
                    elif pkt.haslayer("DNS"):
                        tags.add("dns")
                    
                    if packet_count >= 50000:
                        break
        except Exception as e:
            logger.error(f"Error parsing PCAP: {e}")
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
        # Limit tags to max 3
        final_tags = list(tags)[:3]
        if not final_tags:
            final_tags = ["clean"]
            
        return {
            "packet_count": packet_count,
            "tags": final_tags
        }

    result = await asyncio.to_thread(process_pcap, content)
    return result

# WebSocket — /ws/capture
# This is the endpoint the frontend connects to.

@app.websocket("/ws/capture")
async def ws_capture(
    websocket: WebSocket,
    iface: Optional[str] = Query(default=None),
    filter: str = Query(default="ip"),
):
    await websocket.accept()
    logger.info(f"Frontend connected to /ws/capture (iface={iface}, filter={filter})")

    # Each WebSocket connection gets its own asyncio Queue.
    # The capture module puts packets into it from the Scapy thread.
    queue: asyncio.Queue = asyncio.Queue(maxsize=1000)
    loop = asyncio.get_event_loop()

    # Start capture (no-operation if already running from another connection)
    started = capture.start(queue=queue, loop=loop, iface=iface, bpf_filter=filter)

    if not started:
        # Send a special error message so the frontend knows why it's falling back to mock mode.
        await websocket.send_text(json.dumps({
            "error": "capture_failed",
            "reason": "Scapy requires root/admin privileges. "
                      "Run: sudo uvicorn backend.main:app --port 8000"
        }))
        await websocket.close()
        return

    
    try:
        while True:
            # Wait for next packet from the queue (timeout avoids blocking forever if no traffic)
            try:
                packet_dict = await asyncio.wait_for(
                    queue.get(), 
                    timeout=5.0
                )
                await websocket.send_text(json.dumps(packet_dict))
            except asyncio.TimeoutError:
                # Send a ping to keep connection alive
                try:
                    await websocket.send_text(json.dumps({"ping": True}))
                except Exception:
                    break
    
    except WebSocketDisconnect:
        logger.info("Frontend disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # For simplicity, if a client disconnects, we stop capture.
        # A better approach would be to refcount, if there are muktiple clients.
        capture.stop()
