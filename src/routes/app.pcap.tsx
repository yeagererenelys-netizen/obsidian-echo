import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Layout";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { Upload, Download } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/pcap")({ component: PCAP });

function PCAP() {
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    const report = JSON.stringify({
      filter: "host 167.88.162.34",
      timeRange: "12:40:00 - 12:45:00",
      packets: 247,
      sessions: 3,
      exportDate: new Date().toISOString(),
    }, null, 2);
    const blob = new Blob([report], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "evidence-package.json"; a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src="/videos/features/FEAT_08_anim.mp4" opacity={0.08} />
      </div>
      <div className="relative z-10">
        <PageHeader title="PCAP MANAGER" subtitle="Import, browse, and export evidence packages" />
        <div className="rounded-md p-12 text-center mb-6" style={{ background: "var(--obsidian)", border: "2px dashed rgba(163,255,18,0.3)" }}>
          <Upload size={32} className="text-lime mx-auto mb-3" />
          <div className="display text-2xl text-white">DROP .PCAP FILES HERE</div>
          <div className="text-sm text-ghost mt-1">or browse files</div>
        </div>
        <div className="ps-card !p-0 mb-6">
          <table className="ps-table">
            <thead><tr><th>Name</th><th>Size</th><th>Packets</th><th>Captured</th><th>Tags</th><th></th></tr></thead>
            <tbody>
              {[
                { n: "capture-2025-05-03-12-42.pcap", s: "428 MB", p: "1,247,832", t: "12:42:18", tags: ["beaconing", "tor"] },
                { n: "weekend-baseline.pcap", s: "2.1 GB", p: "8,141,002", t: "yesterday", tags: ["clean"] },
                { n: "incident-april.pcap", s: "891 MB", p: "3,022,481", t: "2025-04-12", tags: ["c2", "exfil"] },
              ].map((c, i) => (
                <tr key={i}>
                  <td className="text-white">{c.n}</td><td>{c.s}</td><td>{c.p}</td><td>{c.t}</td>
                  <td>{c.tags.map(t => <span key={t} className="badge badge-neutral mr-1">{t}</span>)}</td>
                  <td><button className="btn btn-secondary !text-xs">Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ps-card">
          <h3 className="display text-xl mb-4">EXPORT EVIDENCE PACKAGE</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><div className="micro mb-1">Time range</div><input className="input mono" defaultValue="12:40:00 - 12:45:00" /></div>
            <div><div className="micro mb-1">BPF filter</div><input className="input mono" defaultValue="host 167.88.162.34" /></div>
          </div>
          <button onClick={handleExport} className="btn btn-primary">
            <Download size={14} /> {exported ? "✓ Downloaded!" : "Download Evidence Package"}
          </button>
        </div>
      </div>
    </div>
  );
}
