import { createFileRoute, Link } from "@tanstack/react-router";
import { VideoBackground } from "@/components/ps/VideoBackground";
import {
  Activity, Layers, Share2, Clock, Lock, Globe, Search, Cpu, FileArchive, Github, ArrowRight, ChevronDown
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PacketScope — Network Forensics Engine" },
      { name: "description", content: "Open-source network forensics engine that captures, decodes, and visualizes everything crossing your network — live." },
      { property: "og:title", content: "PacketScope — Network Forensics Engine" },
      { property: "og:description", content: "See Everything. Miss Nothing." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Activity, title: "Live Packet Capture", body: "Capture live from any interface or import any .pcap. Real-time BPF filtering, 1M+ packets/min throughput.", tag: "Scapy · PyShark", video: "/videos/features/FEAT_01_anim_web.mp4" },
  { icon: Layers, title: "Session Reconstruction", body: "Reassemble raw TCP streams into readable HTTP exchanges, DNS chains, SMTP conversations — automatically.", tag: "5-Tuple Flow", video: "/videos/features/FEAT_02_anim_web.mp4" },
  { icon: Share2, title: "Communication Graph", body: "Force-directed live node graph. Every device, every connection, visualized in real time.", tag: "D3.js Force Graph", video: "/videos/features/FEAT_03_anim_web.mp4" },
  { icon: Clock, title: "Beaconing Detection", body: "Detect C2 malware by measuring inter-packet timing regularity. Flag suspicious automation in seconds.", tag: "ML · scipy", badge: "KILLER FEATURE", video: "/videos/features/FEAT_04_anim_web.mp4" },
  { icon: Lock, title: "VPN & Proxy Detection", body: "Identify obfuscation via TTL anomalies, SOCKS5 handshakes, ASN fingerprinting, DNS-IP mismatches.", tag: "MaxMind · ASN DB", video: "/videos/features/FEAT_05_anim_web.mp4" },
  { icon: Globe, title: "GeoIP World Map", body: "Every external connection plotted on a live globe. Tor exit nodes and threat regions highlighted.", tag: "MaxMind GeoLite2", video: "/videos/features/FEAT_06_anim_web.mp4" },
  { icon: Search, title: "Deep Protocol Inspection", body: "HTTP, DNS, TLS, SMTP, FTP — parsed and readable. Not hex dumps. Human-readable forensic records.", tag: "HTTP · DNS · TLS", video: "/videos/features/FEAT_07_anim_web.mp4" },
  { icon: Cpu, title: "Behavioral Device Profiling", body: "Per-device baselines. Anomalies flagged against device's own history — dramatically fewer false positives.", tag: "Isolation Forest", video: "/videos/features/FEAT_08_anim_web.mp4" },
  { icon: FileArchive, title: "Evidence Packaging", body: "Export any flagged session as a filtered .pcap + JSON report. Opens in Wireshark. Forensic-grade.", tag: "dpkt · JSON", video: "/videos/features/FEAT_01_anim_web.mp4" },
];

function Landing() {
  return (
    <div className="bg-void text-white min-h-screen">
      {/* Hero */}
      <section className="section-video-container min-h-screen flex items-center justify-center px-6 relative">
        <VideoBackground src="/videos/hero/HERO_01_anim_web.mp4" opacity={0.4} />
        <div className="absolute inset-0 z-[1] hex-bg opacity-40" />
        <div className="absolute inset-0 z-[1]" style={{ background: "radial-gradient(ellipse at center, rgba(163,255,18,0.08), transparent 60%)" }} />
        <div className="absolute inset-x-0 bottom-0 h-1/2 z-[2]" style={{ background: "linear-gradient(to top, #000 0%, transparent 100%)" }} />
        <div className="relative z-10 text-center max-w-3xl">
          <div className="fade-in delay-1 inline-block px-3 py-1 border border-lime-border rounded-sm">
            <span className="mono text-[11px] tracking-[0.3em] text-lime">[ NETWORK FORENSICS ENGINE ]</span>
          </div>
          <h1 className="fade-up delay-2 display text-glow-lime text-white mt-6" style={{ fontSize: "clamp(72px, 10vw, 140px)", lineHeight: "0.9" }}>
            PacketScope
          </h1>
          <p className="fade-up delay-3 text-silver mt-4" style={{ fontSize: "20px", fontWeight: 300 }}>
            See Everything. Miss Nothing.
          </p>
          <p className="fade-up delay-3 text-ghost mt-4 max-w-[480px] mx-auto" style={{ fontSize: "15px", fontWeight: 300 }}>
            The open-source network forensics engine that captures, decodes, and visualizes everything crossing your network — live.
          </p>
          <div className="fade-up delay-4 flex gap-3 justify-center mt-8">
            <Link to="/app/overview" className="btn btn-primary !text-[15px] !py-3 !px-8">
              Open Dashboard <ArrowRight size={16} />
            </Link>
            <a href="https://github.com" className="btn btn-secondary !text-[15px] !py-3 !px-8">
              <Github size={16} /> View on GitHub
            </a>
          </div>
          <div className="fade-up delay-5 flex flex-wrap gap-2 justify-center mt-8">
            {["100% Open Source", "No Data Leaves Your Network", "Built on Scapy + D3.js"].map(t => (
              <span key={t} className="badge badge-neutral">[ {t} ]</span>
            ))}
          </div>
        </div>
        <ChevronDown size={20} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-ghost animate-bounce z-10" />
      </section>

      {/* Stats strip */}
      <section className="border-y border-graphite bg-obsidian py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-graphite">
          {[
            { n: "12", l: "Pages of forensics tools", c: "text-white" },
            { n: "22", l: "Detection algorithms", c: "text-white" },
            { n: "∞", l: "Packets per second", c: "text-lime" },
            { n: "0", l: "Data sent externally", c: "text-lime" },
          ].map(s => (
            <div key={s.l} className="bg-obsidian text-center py-6">
              <div className={`display text-[48px] leading-none ${s.c}`}>{s.n}</div>
              <div className="text-xs text-ghost mt-2">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 relative section-video-container">
        <VideoBackground src="/videos/backgrounds/BG_05_anim_web.mp4" opacity={0.05} />
        <div className="absolute inset-0 z-[1] hex-bg opacity-30" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="display text-white" style={{ fontSize: "64px", lineHeight: 1 }}>EVERY TOOL YOU NEED</h2>
            <p className="text-silver mt-3">A complete forensics platform in one application.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="ps-card group hover:border-lime-border hover:-translate-y-0.5 transition-all relative overflow-hidden section-video-container">
                  <VideoBackground src={f.video} opacity={0.08} className="group-hover:!opacity-25 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <Icon size={24} className="text-lime mb-4" />
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-semibold text-base">{f.title}</h3>
                      {f.badge && <span className="badge badge-lime">{f.badge}</span>}
                    </div>
                    <p className="text-sm text-silver leading-relaxed">{f.body}</p>
                    <div className="mt-4 mono text-[10px] text-ghost">[ {f.tag} ]</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-video-container py-24 px-6 border-y border-graphite relative">
        <VideoBackground src="/videos/hero/HERO_03_anim_web.mp4" opacity={0.15} />
        <div className="absolute inset-0 z-[1]" style={{ background: "radial-gradient(ellipse at center, rgba(239,68,68,0.08), transparent 70%)" }} />
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="display text-white" style={{ fontSize: "80px", lineHeight: 1 }}>CATCH THE BEACON</h2>
          <p className="text-silver mt-4 text-base">
            Load a PCAP with a simulated C2 beacon — watch PacketScope flag it in under 3 seconds.
          </p>
          <Link to="/app/overview" className="btn btn-primary !text-[15px] !py-3 !px-8 mt-8 inline-flex">
            Open Dashboard <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-void border-t border-graphite py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lime display text-2xl">⬡</span>
              <span className="text-white font-bold">PacketScope</span>
            </div>
            <p className="text-xs text-ghost">Built for the CSE Networks Lab project.</p>
          </div>
          <div>
            <div className="micro mb-3">Links</div>
            <ul className="space-y-2 text-sm text-silver">
              <li><Link to="/app/overview" className="hover:text-lime">Dashboard</Link></li>
              <li><a href="#" className="hover:text-lime">GitHub</a></li>
              <li><a href="#" className="hover:text-lime">Documentation</a></li>
              <li><a href="#" className="hover:text-lime">Attribution</a></li>
            </ul>
          </div>
          <div>
            <div className="micro mb-3">Built With</div>
            <div className="flex flex-wrap gap-1.5">
              {["Scapy", "D3.js", "MaxMind GeoLite2", "React", "FastAPI"].map(t => (
                <span key={t} className="badge badge-neutral">{t}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-graphite text-center mono text-[11px] text-ghost">
          © 2025 PacketScope — Open Source MIT License
        </div>
      </footer>
    </div>
  );
}
