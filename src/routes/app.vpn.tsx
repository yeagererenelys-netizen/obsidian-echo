import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ps/Shell";

export const Route = createFileRoute("/app/vpn")({ component: VPN });

const vpn = [
  { ip:"192.168.1.89", type:"OpenVPN", evidence:"TLS handshake on UDP 1194", asn:"AS9009 M247", country:"DE" },
  { ip:"192.168.1.234", type:"Tor", evidence:"Exit node match (185.220.101.45)", asn:"AS60729", country:"DE" },
  { ip:"192.168.1.42", type:"SOCKS5", evidence:"SOCKS5 handshake on TCP 1080", asn:"AS14061 DigitalOcean", country:"US" },
];

function VPN() {
  return (
    <div>
      <PageHeader title="VPN & PROXY DETECTION" subtitle="ASN · TTL · Handshake fingerprint analysis" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="VPN Detections" value="8" color="lime" />
        <StatCard label="Tor Exits" value="2" color="threat" />
        <StatCard label="Proxies" value="4" />
      </div>
      <div className="ps-card !p-0">
        <table className="ps-table">
          <thead><tr><th>Device</th><th>Type</th><th>Evidence</th><th>ASN</th><th>Country</th><th></th></tr></thead>
          <tbody>
            {vpn.map(v => (
              <tr key={v.ip} style={{ boxShadow: "inset 3px 0 0 #eab308" }}>
                <td className="text-white">{v.ip}</td>
                <td><span className={`badge ${v.type==="Tor"?"badge-threat":"badge-warn"}`}>{v.type}</span></td>
                <td>{v.evidence}</td>
                <td>{v.asn}</td>
                <td>{v.country}</td>
                <td><button className="btn btn-ghost !text-xs">→</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
