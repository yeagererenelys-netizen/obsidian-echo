# 🔬 PacketScope — Network Forensics Engine

> See Everything. Miss Nothing.

PacketScope is an open-source network forensics engine that captures, decodes, and visualizes everything crossing your network — live.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Overview  │ │ Capture  │ │  Graph   │ │ Beacon   │  ...  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       └──────────┬──┴──────────┬─┘────────────┘             │
│              WebSocket + REST API                            │
│       ┌──────────┴──────────────┴─┐                         │
│       │      Vite Dev Proxy       │ (port 8080 → 8000)      │
└───────┴───────────────────────────┴─────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI + Python)                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ /ws/capture│ │ /ws/graph  │ │ /ws/map    │  WebSockets  │
│  │ /ws/alerts │ │/ws/beacon  │ │ /api/...   │  REST API    │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘              │
│        │ Scapy AsyncSniffer    │ Mock Data Gen │             │
│        │ (if root/admin)       │ (fallback)    │             │
└────────┴───────────────────────┴───────────────┴────────────┘
```

## Quick Start

### Frontend
```bash
cd obsidian-echo
npm install
npm run dev          # → http://localhost:8080
```

### Backend (optional — frontend works standalone with mock data)
```bash
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

## 5-Step Demo Script (Viva)

### Step 1: Landing Page Impact (30 seconds)
Open `http://localhost:8080`. The hero section features a full-screen video background with the PacketScope logo. Scroll down to showcase the 9 feature cards with embedded video previews.

### Step 2: Start Live Capture (60 seconds)
Navigate to **Live Capture** → Click **START CAPTURE** → Watch packets stream in real-time. Point out the BPF filter input, interface selector, and live packet rate counter.

### Step 3: The Beaconing Detection Demo (90 seconds)
Navigate to **Beaconing** → Click **▶ RUN BEACON SIMULATION** → Watch the regularity score climb from 0.31 to 0.97 in real-time. Click **Inspect** on the flagged device to reveal the inter-arrival timing chart — the "flat line" proves automated C2 communication.

### Step 4: Network Visualization (60 seconds)
Switch to **Communication Graph** → Show the animated node-edge graph with pulsing threat connections. Toggle the threat filter to isolate suspicious traffic. Open **World Map** to show geographic distribution with animated arcs.

### Step 5: Device Forensics (60 seconds)
Navigate to **Device Profiles** → Click on `192.168.1.45` (LAPTOP-KARAN) → Show the anomaly score ring (97/100), traffic timeline vs baseline, protocol distribution, and behavioral anomalies. Click **Export Device Report** to download the evidence JSON.

## Video Assets

All video backgrounds are in `/public/videos/`:
- `hero/` — 5 hero clips for page backgrounds
- `features/` — 8 feature clips mapped to individual feature pages
- `backgrounds/` — 5 ambient background clips
- `brand/` — 4 brand/logo clips for sidebar, settings, loading, 404

## Design System: Obsidian Terminal

| Token | Value | Usage |
|-------|-------|-------|
| Void | `#000000` | Page backgrounds |
| Obsidian | `#080808` | Card backgrounds |
| Graphite | `#222222` | Borders |
| Lime | `#a3ff12` | Primary accent, active states |
| Threat | `#ef4444` | Critical alerts, threats |
| Warn | `#eab308` | Warnings, suspicious |

**Typography:**
- `Bebas Neue` — Display numbers, page titles
- `JetBrains Mono` — All data: IPs, ports, timestamps, hashes
- `Geist` — UI copy, labels, body text

## Tech Stack

- **Frontend:** React 18, TanStack Router, Vite, Tailwind CSS v4, Recharts
- **Backend:** FastAPI, Scapy, Python 3.11+
- **Communication:** WebSocket (real-time), REST (queries)
- **Design:** Obsidian Terminal design system — true black, acid lime, no purple

## License

MIT License — © 2025 PacketScope
