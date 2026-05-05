import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ps/Layout";
import { VideoBackground } from "@/components/ps/VideoBackground";
import { VIDEOS } from "@/config/videoConfig";
import { Upload, Download } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/app/pcap")({ component: PCAP });

function PCAP() {
  const [exported, setExported] = useState(false);
  const [timeRange, setTimeRange] = useState("12:40:00 - 12:45:00");
  const [bpfFilter, setBpfFilter] = useState("host 167.88.162.34");
  const [isDragging, setIsDragging] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [files, setFiles] = useState([
    { n: "capture-2025-05-03-12-42.pcap", s: "428 MB", p: "1,247,832", t: "12:42:18", tags: ["beaconing", "tor"] },
    { n: "weekend-baseline.pcap", s: "2.1 GB", p: "8,141,002", t: "yesterday", tags: ["clean"] },
    { n: "incident-april.pcap", s: "891 MB", p: "3,022,481", t: "2025-04-12", tags: ["c2", "exfil"] },
  ]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const addFiles = async (fileList: FileList) => {
    const filesArray = Array.from(fileList);
    
    // 1. Add them immediately to state with 'Analyzing...' status
    const newFiles = filesArray.map(f => ({
      n: f.name,
      s: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      p: "Analyzing...",
      t: "Just now",
      tags: ["new"]
    }));
    setFiles(prev => [...newFiles, ...prev]);

    // 2. Upload them to the real backend for processing
    for (const file of filesArray) {
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        const response = await fetch("http://localhost:8000/api/upload-pcap", {
          method: "POST",
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          setFiles(prev => {
            const list = [...prev];
            const idx = list.findIndex(f => f.n === file.name && f.p === "Analyzing...");
            if (idx !== -1) {
              list[idx] = { ...list[idx], p: data.packet_count.toLocaleString(), tags: data.tags };
            }
            return list;
          });
        }
      } catch (err) {
        console.error("Upload failed", err);
        setFiles(prev => {
          const list = [...prev];
          const idx = list.findIndex(f => f.n === file.name && f.p === "Analyzing...");
          if (idx !== -1) {
            list[idx] = { ...list[idx], p: "Error", tags: ["failed"] };
          }
          return list;
        });
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleExport = () => {
    const report = JSON.stringify({
      filter: bpfFilter,
      timeRange: timeRange,
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
        <VideoBackground src={VIDEOS.FEAT_08} opacity={0.08} />
      </div>
      <div className="relative z-10">
        <PageHeader title="PCAP MANAGER" subtitle="Import, browse, and export evidence packages" />
        <div 
          className="rounded-md p-12 text-center mb-6 relative transition-all duration-300" 
          style={{ 
            background: isDragging ? "rgba(163,255,18,0.1)" : "var(--obsidian)", 
            border: `2px dashed ${isDragging ? "#a3ff12" : "rgba(163,255,18,0.3)"}` 
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload size={32} className={`mx-auto mb-3 transition-colors ${isDragging ? "text-white" : "text-lime"}`} />
          <div className="display text-2xl text-white">DROP .PCAP FILES HERE</div>
          <label className="text-sm text-lime cursor-pointer hover:underline mt-1 inline-block">
            or browse files
            <input type="file" className="hidden" accept=".pcap,.cap,.pcapng" multiple onChange={e => e.target.files?.length && addFiles(e.target.files)} />
          </label>
        </div>
        <div className="ps-card !p-0 mb-6">
          <table className="ps-table">
            <thead><tr><th>Name</th><th>Size</th><th>Packets</th><th>Captured</th><th>Tags</th><th></th></tr></thead>
            <tbody>
              {files.map((c, i) => (
                <tr key={i} className={activeFile === c.n ? "bg-white/5" : ""}>
                  <td className="text-white">
                    {c.n}
                    {activeFile === c.n && <span className="badge badge-primary ml-2">ACTIVE</span>}
                  </td>
                  <td>{c.s}</td><td>{c.p}</td><td>{c.t}</td>
                  <td>{c.tags.map(t => <span key={t} className="badge badge-neutral mr-1">{t}</span>)}</td>
                  <td>
                    <button 
                      className={`btn !text-xs ${activeFile === c.n ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => {
                        setActiveFile(c.n);
                        if (c.tags.includes("beaconing")) setBpfFilter("host 167.88.162.34");
                        else if (c.tags.includes("dns")) setBpfFilter("port 53");
                        else if (c.tags.includes("tcp")) setBpfFilter("tcp");
                        else setBpfFilter("ip");
                      }}
                    >
                      {activeFile === c.n ? "Opened" : "Open"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ps-card">
          <h3 className="display text-xl mb-4">EXPORT EVIDENCE PACKAGE</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><div className="micro mb-1">Time range</div><input className="input mono" value={timeRange} onChange={e => setTimeRange(e.target.value)} /></div>
            <div><div className="micro mb-1">BPF filter</div><input className="input mono" value={bpfFilter} onChange={e => setBpfFilter(e.target.value)} /></div>
          </div>
          <button onClick={handleExport} className="btn btn-primary">
            <Download size={14} /> {exported ? "✓ Downloaded!" : "Download Evidence Package"}
          </button>
        </div>
      </div>
    </div>
  );
}
