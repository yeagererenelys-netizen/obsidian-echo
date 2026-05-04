# FILE 3 — PACKETSCOPE: NEW LOVABLE UI PROMPT
# RADICAL REDESIGN — New color palette, new aesthetic, same full functionality
# Aesthetic: Obsidian Terminal — True Black + Acid Lime + Arctic White
# Performance-first: minimal DOM, no heavy gradients, GPU-accelerated only
# Video integration: All sections use <video> background elements from FILE 2

---

## ════════════════════════════════════════════════════
## SECTION 0 — DESIGN PHILOSOPHY & WHAT CHANGED
## ════════════════════════════════════════════════════

The previous design was dark navy + purple, inspired by Nixtio — a call center tool. That aesthetic is wrong for a network forensics engine. 

The new design direction is: **Obsidian Terminal** — the aesthetic of a military-grade security console running on a $50,000 workstation. Think:
- NSA Cyber Command's actual monitoring tools
- How a hacker's ideal tool would look if designed by Apple
- Bloomberg Terminal meets Figma in a server room

WHAT IS DIFFERENT FROM THE OLD DESIGN:
1. Color palette completely replaced — no more purple, no more navy blue
2. Background is TRUE BLACK (#000000) not navy (#080c14)
3. Signature accent is ACID LIME GREEN (#a3ff12) not purple/violet
4. Secondary accent is ARCTIC WHITE (#f0f4ff) not cyan
5. Typography completely different — new font pairing
6. Layout is more compact and information-dense
7. Every major section now has a video background
8. Landing page added (old version started with dashboard)
9. Performance: no CSS backdrop-filter on every component — only 3 total
10. Sidebar is 72px with labels, not icon-only

WHAT IS THE SAME (all functions preserved):
- All 12 pages exist with identical functionality
- All detection features: beaconing, VPN, anomaly, protocol dissection
- All visualization: graph, map, timeline, packet inspector
- All data management: PCAP import/export, evidence packages
- All alert system: triage, severity levels, notifications
- All settings and configuration

---

## ════════════════════════════════════════════════════
## SECTION 1 — NEW GLOBAL DESIGN SYSTEM
## ════════════════════════════════════════════════════

### 1.1 — Color Palette (COMPLETELY NEW)

```css
:root {
  /* ─── Base ─── */
  --void:        #000000;    /* true black — page background */
  --obsidian:    #080808;    /* slightly off-black for cards */
  --charcoal:    #101010;    /* elevated surfaces */
  --carbon:      #181818;    /* hover states, secondary surfaces */
  --graphite:    #222222;    /* borders, dividers */
  --slate:       #2e2e2e;    /* focused borders */
  --ash:         #444444;    /* disabled states */

  /* ─── Signature Color ─── */
  --lime:        #a3ff12;    /* PRIMARY ACCENT — acid lime green */
  --lime-dim:    rgba(163,255,18,0.12);  /* lime backgrounds */
  --lime-glow:   rgba(163,255,18,0.06);  /* very subtle lime wash */
  --lime-border: rgba(163,255,18,0.25);  /* lime-tinted borders */
  --lime-dark:   #6ab30a;    /* darker lime for secondary elements */

  /* ─── Secondary Accent ─── */
  --arctic:      #e8f4ff;    /* near-white with slight blue */
  --white:       #ffffff;    /* pure white for primary text */
  --silver:      #a0aec0;    /* secondary text */
  --ghost:       #4a5568;    /* tertiary/muted text */

  /* ─── Semantic Colors ─── */
  --safe:        #22c55e;    /* emerald green for safe/normal */
  --safe-dim:    rgba(34,197,94,0.12);
  --warn:        #eab308;    /* yellow for warning */
  --warn-dim:    rgba(234,179,8,0.12);
  --threat:      #ef4444;    /* red for danger */
  --threat-dim:  rgba(239,68,68,0.12);
  --info:        #3b82f6;    /* blue for informational */
  --info-dim:    rgba(59,130,246,0.12);

  /* ─── Chart Colors ─── */
  --chart-1: #a3ff12;   /* lime */
  --chart-2: #ffffff;   /* white */
  --chart-3: #eab308;   /* yellow */
  --chart-4: #ef4444;   /* red */
  --chart-5: #3b82f6;   /* blue */
  --chart-6: #8b5cf6;   /* violet (charts only, not UI) */
}
```

### 1.2 — Typography (COMPLETELY NEW)

**Display / Headlines:** `"Bebas Neue"` from Google Fonts — tall, condensed, bold, architectural. Used ONLY for hero numbers (stat cards, giant metrics) and page section display titles. Single weight 400 (it's inherently bold). Creates an industrial, high-authority impression. Very different from the previous rounded DM Sans.

**UI / Labels / Body:** `"Geist"` by Vercel from Google Fonts (or `"Space Grotesk"` as fallback) — geometric, clean, technical. Used for all navigation, descriptions, button labels, card titles, paragraphs. Weights: 300, 400, 500, 600.

**Data / Technical:** `"JetBrains Mono"` — kept from the original design because it is the best monospace font for technical data. Used for ALL IPs, ports, timestamps, bytes, hashes, packet counts, protocol names, and any value that is a number or address. Weights: 400, 500, 600.

**Type Scale:**
```
--display:  clamp(48px, 6vw, 80px)  /* Bebas Neue hero numbers */
--hero:     clamp(32px, 4vw, 56px)  /* Bebas Neue section titles */
--h1:       24px / Geist 600
--h2:       20px / Geist 600  
--h3:       16px / Geist 500
--body:     14px / Geist 400
--small:    12px / Geist 400
--micro:    10px / Geist 500 / letter-spacing 0.1em / uppercase
--mono-lg:  16px / JetBrains Mono 500
--mono-md:  13px / JetBrains Mono 400
--mono-sm:  11px / JetBrains Mono 400
```

### 1.3 — Component Design Patterns

**Cards — New Style:**
Background: `--obsidian` (#080808)
Border: `1px solid --graphite` (#222222)
Border-radius: `6px` (sharper than before — more angular, less rounded)
Padding: `20px`
NO box-shadow on cards — flat, sharp edges. The darkness of the card against the void background creates sufficient contrast.
Hover: border-color transitions to `--slate` (#2e2e2e). Add `box-shadow: inset 0 0 0 1px --graphite` to maintain crisp edge.

**Lime Accent Cards (special/highlighted):**
Same as above but with `border-left: 2px solid --lime`
Very faint `background: linear-gradient(to right, rgba(163,255,18,0.04), transparent)`
Used for active alerts, selected items, critical stats

**Buttons — New Style:**
Primary: `background: --lime`, `color: --void`, `border: none`, `border-radius: 4px`, padding `9px 20px`, Geist font-weight 600, font-size 13px, letter-spacing 0.02em. The lime-on-black is the most powerful color combination in this palette. Hover: brightness 110%.
Secondary: `background: transparent`, `border: 1px solid --graphite`, `color: --silver`. Hover: `border-color: --slate`, `color: --white`.
Danger: `background: --threat-dim`, `border: 1px solid rgba(239,68,68,0.4)`, `color: --threat`.
Ghost: `background: transparent`, no border, `color: --ghost`. Hover: `color: --silver`.

**Input Fields:**
Background: `--charcoal` (#101010)
Border: `1px solid --graphite`
Border-radius: `4px`
Color: `--white`
Font: Geist 14px
Focus: `border-color: --lime`, `box-shadow: 0 0 0 2px rgba(163,255,18,0.15)`
Placeholder: `--ghost`

**Badges / Status Chips:**
Border-radius: `3px` (nearly rectangular — technical, not bubbly)
Font: JetBrains Mono 10px uppercase letter-spacing 0.08em
Padding: `2px 6px`
Safe: `background: --safe-dim`, `color: --safe`, `border: 1px solid rgba(34,197,94,0.3)`
Warn: amber colors same pattern
Threat: red colors same pattern
Info: blue colors same pattern
Neutral: `background: --carbon`, `color: --silver`, `border: 1px solid --graphite`

**Lime Glow Effect** (sparingly, only on critical/active elements):
`box-shadow: 0 0 12px rgba(163,255,18,0.3), 0 0 40px rgba(163,255,18,0.1)`
Use ONLY on: live capture button when active, critical alert severity dots, selected nav item, LIVE indicator dot. Not everywhere.

**Severity Dots:**
8×8px, border-radius 50%
Threat: `--threat` with pulsing animation + red glow
Warn: `--warn`, steady
Safe: `--safe`, steady
Live/Active: `--lime` with pulsing animation + lime glow

**Pulse Animation (CSS):**
```css
@keyframes pulse-lime {
  0%, 100% { box-shadow: 0 0 0 0 rgba(163,255,18,0.6); }
  50%       { box-shadow: 0 0 0 6px rgba(163,255,18,0); }
}
@keyframes pulse-threat {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
  50%       { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
}
```

**Custom Scrollbar:**
Width: 3px. Track: transparent. Thumb: `--graphite`. Hover: `--slate`. 

**Data Tables (new style):**
Zero background — transparent rows on the card background
Header: `color: --ghost`, Geist 10px uppercase letter-spacing 0.1em. NO header background.
Dividers: `border-bottom: 1px solid rgba(34,34,34,0.8)` — extremely subtle row separation
Hover row: `background: --charcoal`. Fast: transition 80ms.
Active/selected row: `background: rgba(163,255,18,0.05)`, `border-left: 2px solid --lime`
ALL data cells in JetBrains Mono

### 1.4 — Performance Rules

CRITICAL: This app must load fast and scroll at 60fps. Follow these rules:
1. NO `backdrop-filter: blur()` except on: top header bar, global search modal, tooltip
2. NO `box-shadow` on scrolling list items — only on static containers
3. Video elements: `preload="none"`, lazy-loaded, `will-change: opacity`
4. All animations: use `transform` and `opacity` only — never animate `width`, `height`, `top`, `left`, `background-color` on scrolling elements
5. Force GPU layers only on animated elements: `transform: translateZ(0)` only where needed
6. The live packet table must use virtual scrolling (react-window) — never render more than 50 DOM rows

### 1.5 — Video Integration Specification

Every `<video>` element in this app follows this exact pattern:
```html
<video
  src="/videos/[category]/[name].mp4"
  autoplay
  loop
  muted
  playsinline
  preload="none"
  class="section-video-bg"
/>
```

CSS for video backgrounds:
```css
.section-video-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.35;           /* never full opacity — UI reads over the top */
  z-index: 0;
  pointer-events: none;
}
.section-video-container {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}
.section-video-container > .content {
  position: relative;
  z-index: 1;              /* content always above video */
}
```

Background clips (BG series) use even lower opacity: `opacity: 0.15`
Feature card clips (FEAT series): `opacity: 0.25`

---

## ════════════════════════════════════════════════════
## SECTION 2 — NEW LANDING PAGE (ADDED — DID NOT EXIST)
## ════════════════════════════════════════════════════

**Route:** `/landing` or `index.html` (public facing, before login)
**Purpose:** The product page — explains what PacketScope is and why it is exceptional

### 2.1 — Hero Section

Full viewport height section. `background: --void`. Position: relative.

**Video background:** `<video src="/videos/hero/HERO_01_anim.mp4">` — fiber optic tunnel. Opacity: 0.4. This plays behind everything.

**Overlay gradient:** A gradient mask over the video from bottom: `linear-gradient(to top, #000000 0%, transparent 60%)` — ensures the hero content below reads clearly.

**Content (centered, z-index 1):**
- Small top label: `[ NETWORK FORENSICS ENGINE ]` — JetBrains Mono 11px, letter-spacing 0.3em, color `--lime`, uppercase. Has a 1px lime border box, padding `4px 12px`, border-radius `3px`. Appears with a fade-in animation 0.3s delay.
- Main headline: `"PacketScope"` in Bebas Neue, size `clamp(72px, 10vw, 140px)`. Color: pure white. Text-shadow: `0 0 60px rgba(163,255,18,0.3)` — very subtle green glow behind the white letters. Appears 0.5s after page load with a `translateY(20px) → translateY(0)` + fade animation.
- Sub-headline: `"See Everything. Miss Nothing."` — Geist 20px weight 300, color `--silver`. Appears 0.7s delay.
- Description: A single clean sentence — "The open-source network forensics engine that captures, decodes, and visualizes everything crossing your network — live." — Geist 15px weight 300, color `--ghost`, max-width 480px, centered.
- Two CTA buttons side by side, 1.0s delay:
  - `"Open Dashboard"` — primary lime button, large (padding 12px 32px, font-size 15px)
  - `"View on GitHub"` — secondary outline button, same size, with GitHub icon
- Below buttons: Three small trust indicators in a row — `[ 100% Open Source ] [ No Data Leaves Your Network ] [ Built on Scapy + D3.js ]` — each is a minimal tag in `--ghost` with thin borders. JetBrains Mono 11px.

**Scroll indicator:** at the very bottom of the hero, a subtle animated chevron-down or scrolling line indicator.

### 2.2 — Statistics Strip

Full-width band below the hero. `background: --obsidian`. `border-top: 1px solid --graphite`. `border-bottom: 1px solid --graphite`. Padding `32px 0`.

Four stats in a horizontal row separated by thin dividers:
- `12` — Pages of forensics tools (Bebas Neue 48px white)
- `22` — Detection algorithms (Bebas Neue 48px white)
- `∞` — Packets per second (Bebas Neue 48px lime)
- `0` — Data sent to external servers (Bebas Neue 48px lime)

Each number has a small label below in Geist 12px `--ghost`.

### 2.3 — Features Showcase Section

**Section background video:** `HERO_02_anim.mp4` — aerial network topology. Opacity 0.2.

Section title: `"EVERY TOOL YOU NEED"` in Bebas Neue 64px white.
Subtitle: "A complete forensics platform in one application." in Geist 16px `--silver`.

**3×3 feature grid (9 feature cards):**

Each feature card: `background: --obsidian`, `border: 1px solid --graphite`, border-radius 6px, padding 24px.

**On hover:** `border-color: --lime-border`, and the video inside the card (feature video) transitions from opacity 0 to opacity 0.25 over 300ms. The card lifts very slightly `translateY(-2px)`.

Feature cards in order:

1. **Live Packet Capture** — video: FEAT_01_anim.mp4
   - Icon: waveform icon in lime
   - Title: "Live Packet Capture" Geist h3
   - Body: "Capture packets live from any interface or import any .pcap file. Real-time BPF filtering, 1M+ packets/min throughput."
   - Tag: `[ Scapy · PyShark ]`

2. **Session Reconstruction** — video: FEAT_02_anim.mp4
   - Icon: layers icon
   - Title: "Session Reconstruction"
   - Body: "Reassemble raw TCP streams into readable HTTP exchanges, DNS chains, SMTP conversations — automatically."
   - Tag: `[ 5-Tuple Flow ]`

3. **Communication Graph** — video: FEAT_03_anim.mp4
   - Icon: nodes icon in lime
   - Title: "Communication Graph"
   - Body: "Force-directed live node graph. Every device, every connection, visualized in real time. Spot lateral movement instantly."
   - Tag: `[ D3.js Force Graph ]`

4. **Beaconing Detection** — video: FEAT_04_anim.mp4
   - Icon: clock/signal icon — LIME colored
   - Title: "Beaconing Detection"
   - Body: "Detect C2 malware by measuring inter-packet timing regularity. Regularity score 0-1. Flag suspicious automation in seconds."
   - Tag: `[ ML · scipy ]`
   - Badge: `[ KILLER FEATURE ]` in lime

5. **VPN/Proxy Detection** — video: FEAT_05_anim.mp4
   - Icon: tunnel/shield
   - Title: "VPN & Proxy Detection"
   - Body: "Identify traffic obfuscation via TTL anomalies, SOCKS5 handshakes, ASN fingerprinting, and DNS-IP mismatches."
   - Tag: `[ MaxMind · ASN DB ]`

6. **GeoIP World Map** — video: FEAT_06_anim.mp4
   - Icon: globe
   - Title: "GeoIP World Map"
   - Body: "Every external connection plotted on a live globe. Tor exit nodes, datacenter ASNs, and threat regions highlighted."
   - Tag: `[ MaxMind GeoLite2 ]`

7. **Protocol Inspector** — video: FEAT_07_anim.mp4
   - Icon: magnifying glass over code
   - Title: "Deep Protocol Inspection"
   - Body: "HTTP, DNS, TLS, SMTP, FTP — parsed and readable. Not hex dumps. Human-readable forensic records."
   - Tag: `[ HTTP · DNS · TLS ]`

8. **Device Profiler** — no video (static)
   - Icon: CPU chip
   - Title: "Behavioral Device Profiling"
   - Body: "Per-device behavioral baselines. Anomalies flagged against device's own history — dramatically fewer false positives."
   - Tag: `[ Isolation Forest ]`

9. **PCAP Evidence Export** — video: FEAT_08_anim.mp4
   - Icon: file export
   - Title: "Evidence Packaging"
   - Body: "Export any flagged session as a filtered .pcap + JSON report. Opens in Wireshark. Forensic-grade output."
   - Tag: `[ dpkt · JSON ]`

### 2.4 — Demo CTA Section

Full-width section. Background video: `HERO_04_anim.mp4` (the threat alert pulse). Opacity 0.3.
Content: Centered.
- Headline: `"CATCH THE BEACON"` in Bebas Neue 80px white.
- Sub: "Load a PCAP with a simulated C2 beacon — watch PacketScope flag it in under 3 seconds." Geist 16px silver.
- `[  Open Dashboard →  ]` — large primary lime button

### 2.5 — Footer

`background: --void`. `border-top: 1px solid --graphite`. Padding `40px`.
Three columns:
- Column 1: PacketScope logo + tagline + "Built for the CSE Networks Lab project"
- Column 2: Links — Dashboard, GitHub, Documentation, Attribution
- Column 3: Attribution — "Built with Scapy, D3.js, MaxMind GeoLite2, React, FastAPI" — each as a small monospace tag
Copyright: `© 2025 PacketScope — Open Source MIT License`

---

## ════════════════════════════════════════════════════
## SECTION 3 — PERSISTENT APP SHELL (ALL DASHBOARD PAGES)
## ════════════════════════════════════════════════════

### 3.1 — Top Navigation Bar

Height: 52px. `background: rgba(8,8,8,0.9)`. `backdrop-filter: blur(12px)` — ONE of the 3 allowed blur effects. `border-bottom: 1px solid --graphite`. Fixed top. Full width.

**Left:** `[ ⬡ ]` logo icon (20px, lime) + `"Packet"` (Geist 14px weight 400 `--silver`) + `"Scope"` (Geist 14px weight 700 `--white`). No space between.

Beside logo: Capture status pill. When live: `[● LIVE]` — lime pulsing dot + "LIVE" JetBrains Mono 10px uppercase lime, pill border `--lime-border`. When offline: `[○ OFFLINE]` amber. When analyzing pcap: `[▶ PCAP]` info-blue.

**Center:** Global search. Width 340px. Background `--charcoal`. Border `1px solid --graphite`. Border-radius 4px. Height 32px. Icon: magnifying glass `--ghost`. Placeholder: `"⌘K  Search everything..."` in `--ghost` JetBrains Mono 12px. On focus: border `--lime-border`, background `--carbon`.

**Right:**
- Pkt/s rate: `"2,341 pkt/s"` JetBrains Mono 12px `--lime`. Label "RATE" in micro above. Updated live.
- Bell icon + badge (threat-colored number if alerts)
- `"eth0"` interface indicator — JetBrains Mono chip, `--ghost`
- Separator `|`
- User avatar circle 28px + name Geist 13px

### 3.2 — Sidebar Navigation

**Width:** 220px. NOT icon-only this time — has both icons and labels. This is more functional and readable for a lab demo.
**Background:** `--void`. `border-right: 1px solid --graphite`.

**Logo area** (top 52px): Empty — aligns with topbar. The topbar logo appears at left.

**Nav sections with category labels:**

```
MAIN
├── Overview          (grid icon)
├── Live Capture      (radio waves)
├── Session Timeline  (layers)
└── Communication Graph (nodes)

INTELLIGENCE
├── Device Profiles   (cpu chip)
├── Alerts & Triage   (shield) [badge]
├── Beaconing         (clock signal)
└── VPN Detection     (tunnel)

INSPECTION
├── Protocol Inspector (magnifier)
├── World Map         (globe)
└── PCAP Manager      (file)

SYSTEM
├── Reports           (document)
└── Settings          (sliders)
```

Category labels: Geist 9px uppercase letter-spacing 0.12em `--ghost`. Padding `16px 16px 4px`.

Nav item: height 36px, padding `0 12px`, border-radius 4px, gap 10px. Icon 16px `--ghost`. Label Geist 13px `--silver`.
Active: `background: --lime-dim`, icon and label both `--lime`, `border-left: 2px solid --lime` (but this border comes from inset: `box-shadow: inset 2px 0 0 --lime` applied to the nav item).
Hover: `background: --charcoal`, label `--white`.

**Sidebar footer card:**
At very bottom, a minimal status card:
- "Engine Status" label micro
- `[● RUNNING]` lime dot + text
- `eth0` mono small
- `1,247,832 pkts` today in mono lime
- `[Stop Capture]` ghost button small

### 3.3 — Content Layout

```
┌─── 52px topbar (fixed) ──────────────────────────────────────┐
├─── 220px sidebar ─────┬─── flex-grow content area ───────────┤
│                       │  padding: 24px                       │
│  sidebar nav          │  max-width: 1400px                   │
│                       │                                       │
│                       │  page content scrolls here            │
└───────────────────────┴──────────────────────────────────────┘
```

Content area background: `--void` with BG_01 texture (the hexagonal grid) at 15% opacity as a `background-image`.

---

## ════════════════════════════════════════════════════
## SECTION 4 — PAGE 1: OVERVIEW DASHBOARD (REDESIGNED)
## ════════════════════════════════════════════════════

Route: `/`

**Section background video:** `BG_01_anim.mp4` applied to entire content area at 15% opacity.

### 4.1 — Page Header

Left: `"OVERVIEW"` in Bebas Neue 32px white. Below: "Network status · Updated live" in Geist 12px `--ghost` + live lime dot.
Right: `"+ Start Capture"` (lime button) + `"Export Report"` (secondary).

### 4.2 — Top Stats (4 cards, equal width)

Keep all same stats from original but restyled:

**Each stat card:**
- NO left colored border (removed — was too reminiscent of old design)
- Instead: a very small `--micro` category label top-left + a subtle lime dot indicating data type
- The BIG number: Bebas Neue `--display` size white (or lime for the hero metric)
- Small trend indicator: Geist 11px — `↑ 12%` in safe color, `↓ 3%` in muted
- Sparkline: very thin 1px line chart, no fill, just the line — simpler than before

Cards:
1. **Active Sessions** — `1,847` in white Bebas Neue
2. **Data Throughput** — `284 MB/s` in lime Bebas Neue (hero metric — most important)
3. **Active Threats** — `12` in `--threat` Bebas Neue + the threat pulsing red glow
4. **Devices Online** — `34` in white Bebas Neue

### 4.3 — Main Grid (same layout, restyled)

**Traffic Chart card:**
- Title: `"TRAFFIC VOLUME"` in Bebas Neue 20px
- Time tabs: `5m · 15m · 1h · 6h · 24h` — tab style, active gets lime underline
- Chart: TWO lines — Inbound (lime) and Outbound (white) — NO area fill at all. Just clean, crisp lines on black. This is faster to render and looks more like a real monitoring tool (Bloomberg Terminal style).
- Gridlines: extremely subtle, `rgba(255,255,255,0.04)` horizontal lines only
- Axes: JetBrains Mono `--ghost` 10px

**Protocol bar:** below chart — thin segmented bar. Lime=HTTP, white=HTTPS, yellow=DNS, red=suspicious. Percentage labels in JetBrains Mono 10px above each segment.

**Top Talkers:**
- Device IPs in JetBrains Mono
- Progress bars: now pure lime fill on `--carbon` background. 3px height bars. Sharp.
- Numbers right-aligned in mono `--ghost`

**Alert Feed (Live):**
- Background video: `BG_03_anim.mp4` at 10% opacity (subtle dark red rain)
- Same content as before but each alert row has a left `2px` colored accent matching severity

**Communication Graph Mini:**
- The card now shows a live MINI version of the force graph — a smaller D3 canvas, same logic
- "View Full Graph →" button in lime

**Geographic Summary:**
- Mini world map (simplified SVG)
- Connection arcs in lime and red
- Same stats below

**Beaconing Monitor + VPN Detection:**
- Same content, same logic
- Styled with new color system

---

## ════════════════════════════════════════════════════
## SECTION 5 — PAGE 2: LIVE CAPTURE (REDESIGNED)
## ════════════════════════════════════════════════════

Route: `/capture`

### 5.1 — Capture Control Bar

Sticky bar below topnav. `background: --obsidian`. `border-bottom: 1px solid --graphite`. Height 48px.

**CAPTURE button when inactive:**
- Full lime background (#a3ff12), black text, "● START CAPTURE" — Geist 13px bold
- When clicked → turns to a pulsing state

**CAPTURE button when ACTIVE:**
- Background: `--threat` red. "■ STOP" white text. PULSING: the button has a slow red pulse glow `box-shadow: 0 0 20px rgba(239,68,68,0.5)` animating in a breathing cycle
- This makes it immediately obvious that capture is running — you can't miss it

**Interface selector:** minimal dropdown, JetBrains Mono 13px
**BPF filter input:** `[  tcp and port 80  ]` — monospace, full clear look
**Apply button:** secondary small

**Right stats:** `2,847 pkt/s` (lime mono) · `00:14:32` (white Bebas Neue 22px) · Buffer bar (lime fill)

### 5.2 — Packet Stream Table

**Same virtual-scroll table as original but with new styling:**

Background: `--void` — the table itself is on true black. Maximum contrast.
New row style:
- No alternating row backgrounds — too cluttered on true black
- Instead: 1px bottom border in `rgba(34,34,34,0.6)` between rows
- Row hover: `background: rgba(255,255,255,0.02)` — barely visible, fast (80ms transition)
- Selected row: `background: rgba(163,255,18,0.05)` + `border-left: 2px solid --lime`

**Column header labels now have a top 2px lime border** on the entire header row — gives the table a cap.

**Protocol badges** use the new color system:
- TCP: lime-dim background, lime text
- UDP: `rgba(255,255,255,0.08)` background, white text
- DNS: warn-dim, warn text
- HTTP: info-dim, info text
- ICMP: carbon background, ghost text

**New packet row coloring for threats:**
- Flagged packets: instead of background tint, just the left border is `--threat` red (2px). The row stays black. Cleaner, faster.
- VPN/proxy packets: left border `--warn` amber
- New arrival flash: `animation: flashRow 500ms ease-out` — quickly flashes `rgba(163,255,18,0.1)` then returns to black

### 5.3 — Packet Detail Panel

Same 3-tab layout. Restyled: monospace font throughout, backgrounds all `--obsidian`, borders `--graphite`.
Tab active indicator: lime underline border on tab.
Hex dump: green-on-black like a real terminal. Selected bytes highlighted in lime background.

---

## ════════════════════════════════════════════════════
## SECTION 6 — PAGE 3: SESSION TIMELINE
## ════════════════════════════════════════════════════

Route: `/sessions`

**Background video:** `BG_05_anim.mp4` — horizontal data streams at 12% opacity across the top portion.

### Session List (left sidebar):
Same structure. New style: session cards have a thin `1px` left protocol color accent. No heavy card shadows.

### Session Detail:
**HTTP reconstruction:** Request/response cards with new style:
- Request: `background: rgba(163,255,18,0.04)` — very faint lime tint
- Response success (2xx): `background: rgba(34,197,94,0.04)` — very faint green tint
- Response error (4xx/5xx): `background: rgba(239,68,68,0.04)` — very faint red tint
- Method badges: GET=lime, POST=yellow, DELETE=red, PUT=blue
- Status badges: 200=safe, 301=info, 404=warn, 500=threat

**DNS chain:** rendered as a horizontal flow diagram with monospace text nodes connected by `→` arrows in lime.

**Action buttons:** same actions, new style.

---

## ════════════════════════════════════════════════════
## SECTION 7 — PAGE 4: DEVICE PROFILES
## ════════════════════════════════════════════════════

Route: `/devices`

Same grid/list + detail structure. New styling:

**Device cards in grid:**
- Top: device IP in JetBrains Mono 16px white + hostname Geist 12px ghost below
- Risk badge: right top. CLEAN=safe, SUSPICIOUS=warn, CRITICAL=threat with pulsing red glow
- Protocol bar: 4px height, lime=HTTP, white=HTTPS, yellow=DNS, red=suspicious. Sharp, crisp.
- Stats row: `▲ 2.4 GB` `▼ 842 MB` `⦿ 14h` — all mono ghost
- Tags: minimal chips, graphite border, ghost text
- Hover: border `--lime-border`, reveal "View Profile →" lime text button

**Device detail page:**
- Hero: IP in Bebas Neue 48px white (YES — use display font for the IP itself, it looks incredible in Bebas Neue)
- Circular risk gauge: lime arc on charcoal base circle. Score number in Bebas Neue 32px center.
- All tabs same content, restyled.
- Activity heatmap: lime cells (bright=high activity) on carbon background — like GitHub contribution graph but lime on black.

---

## ════════════════════════════════════════════════════
## SECTION 8 — PAGE 5: COMMUNICATION GRAPH
## ════════════════════════════════════════════════════

Route: `/graph`

**FULL PAGE — no card wrapper.**

**Background:** `--void` (true black) + `BG_02_anim.mp4` at 15% opacity (radar sweep background).

**Graph canvas:** Same D3 force simulation. New color scheme:

Node colors (NEW):
- Internal hub device: white circle, `box-shadow: 0 0 20px rgba(255,255,255,0.3)` white glow
- Internal normal device: `--charcoal` fill, `--slate` stroke 1.5px
- External known-safe (CDN, Google): `--graphite` fill, white stroke 1px, very dim
- External suspicious: `--warn` stroke, amber glow
- External critical/Tor: `--threat` stroke, red glow pulse animation

Edge colors (NEW):
- Normal traffic: `rgba(255,255,255,0.15)` — very subtle white
- High traffic: `rgba(255,255,255,0.35)` — brighter
- Flagged traffic: `rgba(239,68,68,0.6)` — red
- VPN traffic: `rgba(234,179,8,0.4)` — amber

Flowing particles along edges: lime `#a3ff12` tiny dots, 3px radius. They race along all active connections.

**Controls panel (top-right):** `background: rgba(8,8,8,0.92)`, `border: 1px solid --graphite`, border-radius 6px. Same controls, new style.

**Alert strip at top of graph canvas:** Same as before but styled: `background: rgba(239,68,68,0.1)`, `border-bottom: 1px solid rgba(239,68,68,0.3)`. Text in white/threat colors.

**Bottom selection panel:** Same content, new style — lime-tinted selected state, monospace all data.

---

## ════════════════════════════════════════════════════
## SECTION 9 — PAGE 6: ALERTS & TRIAGE
## ════════════════════════════════════════════════════

Route: `/alerts`

**Background video:** `BG_03_anim.mp4` — dark red matrix rain at 10% opacity. This page intentionally feels more ominous.
**Also:** `HERO_04_anim.mp4` at 8% opacity in the top summary area — the threat pulse visual.

### Alert Summary Bar:
Same 4 stat mini-cards. New: Critical number in Bebas Neue 40px `--threat` with the red glow.

### Alert List:
Same content structure. New: left border is now 3px (thicker than other pages — alerts deserve emphasis). Critical alerts have `background: rgba(239,68,68,0.04)` — just a ghost of red on the otherwise black rows.

### Alert Detail Panel:

**Evidence Section:**
Beaconing chart: lime waveform line on black background — exactly like the FEAT_04 video but as a static chart. Each spike is a vertical lime line. The regularity is immediately visible.

Regularity Score gauge: a horizontal bar, charcoal background, lime fill. `0.97 / 1.00` in Bebas Neue 40px lime. Label: "EXTREMELY REGULAR — C2 BEACON SUSPECTED" in JetBrains Mono 11px threat-red.

**Action buttons:** same as original. "Export Evidence Package" is the primary lime button here.

---

## ════════════════════════════════════════════════════
## SECTION 10 — PAGE 7: PROTOCOL INSPECTOR
## ════════════════════════════════════════════════════

Route: `/protocols`

**Background video:** `HERO_03_anim.mp4` at 12% opacity — the layered glass packet object, very subtly visible behind the content.

### Protocol tabs:
`HTTP | DNS | TLS | SMTP | FTP | ICMP | ARP | DHCP`
Tab active: lime underline, lime text, Bebas Neue font (yes, use display font for protocol tab names — they look architectural at 16px).

### HTTP Inspector:
Same functionality. New: Method badge redesign:
- GET: `--lime-dim` background, `--lime` text, `border: 1px solid --lime-border`
- POST: `--warn-dim`, `--warn`, warn border
- DELETE: `--threat-dim`, `--threat`, threat border

Status codes: large, Bebas Neue 24px right-aligned in each response row. `200` in lime. `404` in warn. `500` in threat.

### DNS Inspector:
DNS Query Chain visual: rendered as a horizontal ASCII-art style flow diagram with monospace:
```
  Client         Local DNS      Root NS       Auth NS
  192.168.1.45 → 192.168.1.1 → 198.41.0.4 → ns1.google.com
        query A google.com            →→→→→ 142.250.80.100
                                              TTL: 300s
```
All in JetBrains Mono 12px on `--charcoal` background with `--graphite` borders. Extremely clean and technical.

### TLS Inspector:
TLS Version distribution: simple horizontal bars. TLS 1.3: lime. TLS 1.2: white. TLS 1.1: warn (deprecated). SSL 3.0: threat with glow (broken, dangerous).

---

## ════════════════════════════════════════════════════
## SECTION 11 — PAGE 8: WORLD MAP
## ════════════════════════════════════════════════════

Route: `/map`

**Background video:** `BG_04_anim.mp4` at 30% opacity — the star field. Makes the globe feel like it's floating in space.

**Globe:** Same Leaflet.js map, but restyled:
- Tile style: dark/black themed tiles (use CartoDB dark tiles or similar)
- Connection arcs: lime for normal, threat-red for dangerous, warn-amber for suspicious
- Animated flowing particles on arcs: lime dots
- Connection origin (home network): large pulsing lime dot

**Country Leaderboard panel:** Right side, same content. New style: JetBrains Mono for all numbers. Country name in Geist. Mini bar in lime.

**Bottom stats bar:** same stats, restyled — all numbers in Bebas Neue 24px with mono labels below.

---

## ════════════════════════════════════════════════════
## SECTION 12 — PAGE 9: PCAP MANAGER
## ════════════════════════════════════════════════════

Route: `/pcap`

**Drop zone:**
Background `--obsidian`. Border: `2px dashed rgba(163,255,18,0.3)`. Border-radius 6px.
Center: Upload icon in lime + `"DROP .PCAP FILES HERE"` in Bebas Neue 24px white + `"or browse files"` in Geist 14px ghost below.

On drag-over: border becomes solid lime `2px solid --lime`, background `rgba(163,255,18,0.04)`.

**Saved Captures table:** same columns, new style.

**Export Builder:** same form controls, new style. Primary button `[Download Evidence Package]` — full lime.

---

## ════════════════════════════════════════════════════
## SECTION 13 — PAGE 10-12: BEACONING, VPN, REPORTS
## ════════════════════════════════════════════════════

### Beaconing Detector Page (Route: `/beaconing`)
Same content as before but featured prominently as its own page.

**Hero video:** `FEAT_04_anim.mp4` at 30% opacity in the top hero area — the oscilloscope waveform pulses behind the page header. The visual immediately tells you what this page is about before you read a word.

Page title: `"BEACONING DETECTOR"` in Bebas Neue 48px with very subtle lime glow in text-shadow.

The beaconing device list: each suspicious device shows its regularity score as a large Bebas Neue number in lime. A mini chart for each device shows the inter-arrival timing. Clicking a device goes to that device's detail page filtered to beaconing evidence.

### VPN Detection Page (Route: `/vpn`)
Same content. Hero video: `FEAT_05_anim.mp4` at 30% opacity.
The indicator table uses clear visual encoding: detected VPN traffic has an amber pulsing left border on table rows.

### Reports Page (Route: `/reports`)
Clean, simple. A list of generated reports with download buttons. Each report is a card with a document icon and metadata.

---

## ════════════════════════════════════════════════════
## SECTION 14 — SETTINGS PAGE (REDESIGNED)
## ════════════════════════════════════════════════════

Route: `/settings`

**Same 2-column layout** with category nav on left (200px) and settings content on right.

New style: Category nav items use the same sidebar nav item style — lime active state.

Each settings group has a `--micro` category header label.

Settings controls:
- Toggle switches: `background: --carbon` inactive, `background: --lime` active. Toggle knob is white, 16px, border-radius full. Clean.
- Sliders: track `--graphite`, filled portion `--lime`, thumb `--lime` with white border
- Text inputs: same as global input style
- Radio groups: custom styled. Selected: lime dot. Unselected: graphite ring.
- Dropdowns: custom styled matching overall aesthetic

**Attribution section** (important for the project rubric!):
Rendered as a styled list, each item:
```
[ Scapy ]          Network packet capture and manipulation
[ MaxMind GeoLite2 ] IP geolocation and ASN data
[ D3.js ]          Force-directed graph visualization
[ Leaflet.js ]     Interactive map rendering
[ React ]          UI framework
[ FastAPI ]        Python backend WebSocket server
[ RFC 793 ]        TCP specification reference
[ RFC 1035 ]       DNS specification reference
```
Each is a monospace tag + Geist description. All properly cited. This satisfies the Attribution rubric criterion.

---

## ════════════════════════════════════════════════════
## SECTION 15 — LOADING SCREEN & SPLASH
## ════════════════════════════════════════════════════

**Loading screen (shown on initial app load):**

Background: `--void` (pure black)
Center: `BRAND_03_anim.mp4` — the radar sweep animation plays as the background (full screen, 30% opacity)
Foreground: PacketScope logo (hex + crosshair, 64px, lime) centered
Below logo: `"INITIALIZING CAPTURE ENGINE..."` in JetBrains Mono 11px `--ghost`, letter-spacing 0.2em
A thin lime progress bar at the very bottom, 2px tall, fills from 0% to 100% over the load time
No spinner. No skeleton on the splash — just the radar and the text.

After load complete: The logo scales up very slightly (1.0 → 1.05) with a brief lime bloom, then the loading screen fades out over 300ms revealing the dashboard.

---

## ════════════════════════════════════════════════════
## SECTION 16 — MODAL & NOTIFICATION SYSTEM
## ════════════════════════════════════════════════════

### Modals:
Dark overlay: `rgba(0,0,0,0.8)`. `backdrop-filter: blur(4px)` — ONE of the 3 allowed blur uses.
Modal card: `background: --obsidian`, `border: 1px solid --graphite`, border-radius 8px, padding 32px, max-width 480px.
Open animation: `scale(0.97) → scale(1)` + fade over 150ms. Fast, snappy.
Close button: top-right, `×` in `--ghost`, hover `--white`.
Primary action button: `--lime`.

### Toasts:
Top-right, same stacking behavior.
New style: `background: --charcoal`, `border-left: 3px solid [severity color]`. No right border, no top/bottom border — just the left accent and the dark background.
Slide in from right. `translate(100%) → translate(0)` 150ms ease-out.
Progress bar: 1px tall at very bottom, lime/warn/threat color, counts down.

### Global Search Modal (⌘K):
Takes 60% of viewport width, centered. `background: rgba(8,8,8,0.96)`. `backdrop-filter: blur(20px)` — the THIRD allowed blur.
Large search input at top. Below: results grouped by type. Each result: icon + text + mono meta.

---

## ════════════════════════════════════════════════════
## SECTION 17 — MOCK DATA REFERENCE (SAME AS BEFORE)
## ════════════════════════════════════════════════════

All mock data stays identical to original prompt. Use same IP addresses, same beaconing anomaly (192.168.1.45 beaconing to 167.88.162.34 every 30 seconds, regularity 0.97), same device names, same geographic destinations.

**Add these new mock data points:**
- A Tor exit node connection: `192.168.1.234 → 185.220.101.45` (red in graph, Tor flag in world map)
- A VPN detection: `192.168.1.89` using OpenVPN on UDP 1194 — flagged by VPN detector
- One resolved DNS to a known bad domain: `192.168.1.42` queried `update.verysuspicious-domain.cc`
- A port scan: `192.168.1.200` (unknown device) probed 847 ports in 2 minutes on 192.168.1.105

---

## ════════════════════════════════════════════════════
## SECTION 18 — REACT IMPLEMENTATION NOTES
## ════════════════════════════════════════════════════

**Framework:** React 18 + React Router v6. Vite as bundler (NOT Create React App — Vite is 10x faster).

**Key dependencies:**
- `recharts` — all charts except force graph
- `d3` — force graph only, nothing else
- `leaflet` + `react-leaflet` — world map
- `lucide-react` — all icons (outline style)
- `react-window` — virtual scrolling for packet table
- `framer-motion` — page transitions and component animations (DO NOT use for inline data renders)

**Video loading strategy:**
```javascript
// Lazy load all video backgrounds — they should not block page render
const VideoBackground = ({ src, opacity }) => {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        ref.current.src = src;
        ref.current.play();
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [src]);
  return <video ref={ref} loop muted playsInline style={{ opacity }} className="section-video-bg" />;
};
```

**Routing structure:**
```
/                   → Landing page
/app                → Dashboard (redirect to /app/overview)
/app/overview       → Overview dashboard
/app/capture        → Live capture
/app/sessions       → Session timeline
/app/graph          → Communication graph
/app/devices        → Device profiles
/app/devices/:ip    → Device detail
/app/alerts         → Alerts & triage
/app/beaconing      → Beaconing detector
/app/vpn            → VPN detection
/app/protocols      → Protocol inspector
/app/map            → World map
/app/pcap           → PCAP manager
/app/reports        → Reports
/app/settings       → Settings
```

**Reusable components (same as before, renamed to match new design):**
- `<StatCard>` — hero metric cards
- `<AlertRow>` — alerts list items  
- `<SessionRow>` — sessions list
- `<PacketRow>` — live capture table (virtualized)
- `<DeviceCard>` — device grid cards
- `<MonoValue>` — JetBrains Mono data wrapper
- `<SeverityBadge>` — status/severity chips
- `<PulsingDot>` — animated live/alert indicators
- `<VideoBackground>` — lazy-loaded video element
- `<BebasNumber>` — large display number (Bebas Neue wrapper)

**CSS approach:** CSS Modules per component. Global design tokens in `src/styles/tokens.css`. No Tailwind — full CSS control for this aesthetic.

---

## ════════════════════════════════════════════════════
## SECTION 19 — FINAL BRIEF TO LOVABLE
## ════════════════════════════════════════════════════

Build a complete 16-route React application called PacketScope — a Network Forensics Engine.

THE DESIGN IDENTITY:
- True black backgrounds (#000000 / #080808)
- Acid lime green (#a3ff12) as the ONLY primary accent color
- Pure white for primary text
- Bebas Neue for all large numbers and display titles
- JetBrains Mono for ALL technical data — every IP, port, byte count, timestamp
- Geist for all UI copy, labels, navigation
- NO purple anywhere
- NO navy blue anywhere
- The product should look like it was built by a black-hat security researcher who went to design school

THE PERFORMANCE RULE:
- backdrop-filter blur used maximum 3 times total in the entire application
- Virtual scroll for packet table — never render more than 50 rows
- All animations use only transform + opacity
- Videos loaded lazily with IntersectionObserver

THE VIDEO INTEGRATION:
- Landing page hero: full-screen video background (HERO_01_anim.mp4)
- Feature cards: video reveals on hover (FEAT series)
- Page backgrounds: very low opacity ambient videos (BG series)
- Beaconing page: FEAT_04_anim.mp4 prominent in hero area
- All videos: muted, autoplay, loop, playsInline

THE DEMO MOMENT:
The entire project is designed to build to one moment — the beaconing detector flagging a suspicious device. Every page contributes to this story. The Overview shows the anomaly. The Alerts page shows the alert. The Device Profile shows the behavioral deviation. The Beaconing page shows the timing chart in full. This is the 3-minute demo that wins the viva.

Build every page. Use real-looking placeholder data. Make it fast. Make it unforgettable.
