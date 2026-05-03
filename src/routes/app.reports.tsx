import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Shell";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/app/reports")({ component: Reports });

const reports = [
  { name: "Daily Threat Report — May 3, 2026", size: "1.2 MB", date: "12:00", type: "daily" },
  { name: "Beaconing Incident — 192.168.1.45", size: "428 KB", date: "12:42", type: "incident" },
  { name: "Weekly Network Baseline", size: "3.8 MB", date: "May 1", type: "weekly" },
  { name: "Tor Exit Activity Report", size: "612 KB", date: "Apr 28", type: "intel" },
];

function Reports() {
  const handleDownload = (name: string) => {
    const blob = new Blob([JSON.stringify({ report: name, generated: new Date().toISOString(), data: "Sample report data" }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name.replace(/[^a-zA-Z0-9]/g, "_")}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <VideoBackground src="https://drive.google.com/uc?export=download&id=1k58KzilpIgYdTOlFEQL6cV9F5-pjQ84Q" opacity={0.06} />
      </div>
      <div className="relative z-10">
        <PageHeader title="REPORTS" subtitle="Generated forensic and summary reports" actions={<button className="btn btn-primary">Generate New</button>} />
        <div className="space-y-2">
          {reports.map(r => (
            <div key={r.name} className="ps-card flex items-center gap-4">
              <FileText size={20} className="text-lime" />
              <div className="flex-1">
                <div className="text-white">{r.name}</div>
                <div className="mono text-xs text-ghost">{r.size} · {r.date} · {r.type}</div>
              </div>
              <button onClick={() => handleDownload(r.name)} className="btn btn-secondary !text-xs"><Download size={12} /> Download</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
