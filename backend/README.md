# PacketScope Backend

This is the real packet-capturing backend for PacketScope, powered by FastAPI and Scapy. 
It captures live network traffic on the host machine, decodes it, and streams the raw packets over a WebSocket (`/ws/capture`) directly into the React frontend.

## Quick Start

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server (Root / Admin privileges are required by Scapy to sniff packets!):
```bash
sudo uvicorn main:app --port 8000 --reload
```

## How It Works

- The frontend attempts to connect to `ws://localhost:8000/ws/capture` on load.
- If this server is running, the frontend seamlessly transitions out of the simulated Mock Mode and begins streaming your live traffic.
- If you shut down this server, the frontend will drop the connection and fall back to the internal mock stream after a short timeout.
