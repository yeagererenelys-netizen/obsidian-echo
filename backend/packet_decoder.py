import time
import random
import string
import logging
from scapy.packet import Packet as ScapyPacket
from scapy.layers.inet import IP, TCP, UDP, ICMP
from scapy.layers.dns import DNS, DNSRR
from scapy.layers.http import HTTPRequest, HTTPResponse

try:
    from dns_resolver import _dns_cache, _friendly
except ImportError:
    from backend.dns_resolver import _dns_cache, _friendly

logger = logging.getLogger(__name__)

_counter = 0

def _unique_id() -> str:
    global _counter
    _counter += 1
    return f"pkt-{int(time.time() * 1000)}-{_counter}"

def _decode_flags(flags_int: int) -> str:
    FLAG_MAP = {
        0x02: "SYN",
        0x10: "ACK",
        0x12: "SYN-ACK",
        0x01: "FIN",
        0x04: "RST",
        0x18: "PSH-ACK",
        0x11: "FIN-ACK",
    }
    return FLAG_MAP.get(int(flags_int), hex(int(flags_int)))

def _extract_dns_mappings(pkt: ScapyPacket) -> None:
    """
    If this is a DNS response, extract all A records and cache
    IP → queried-hostname so we can label TCP connections correctly
    (e.g. codechef.com instead of AWS Accelerator).
    """
    try:
        dns = pkt[DNS]
        # Only process responses (qr=1) with at least one answer
        if dns.qr != 1 or not dns.an:
            return

        # Get the queried name (e.g. "codechef.com")
        if not dns.qd:
            return
        queried_name = dns.qd.qname.decode(errors="ignore").rstrip(".")
        if not queried_name:
            return
        friendly_name = _friendly(queried_name)  # maps known domains to friendly names

        # Walk all answer records
        rr = dns.an
        while rr and rr != 0:
            try:
                # Type 1 = A record (IPv4)
                if rr.type == 1:
                    ip_str = rr.rdata
                    if isinstance(ip_str, bytes):
                        ip_str = ".".join(str(b) for b in ip_str)
                    else:
                        ip_str = str(ip_str)
                    # Only cache if this gives us a better name than what we have
                    existing = _dns_cache.get(ip_str)
                    if existing is None or existing == ip_str:
                        _dns_cache[ip_str] = friendly_name
                        logger.debug(f"[DNS sniff] {ip_str} → {friendly_name}")
            except Exception:
                pass
            rr = rr.payload if hasattr(rr, 'payload') else None
            if rr and not hasattr(rr, 'type'):
                break
    except Exception as e:
        logger.debug(f"[DNS sniff] parse error: {e}")


def _detect_protocol(pkt: ScapyPacket) -> str:
    if pkt.haslayer(DNS):
        return "DNS"
    try:
        if pkt.haslayer(HTTPRequest) or pkt.haslayer(HTTPResponse):
            return "HTTP"
    except Exception:
        pass
    if pkt.haslayer(TCP):
        tcp = pkt[TCP]
        if tcp.dport == 443 or tcp.sport == 443:
            return "HTTPS"
        return "TCP"
    if pkt.haslayer(UDP):
        return "UDP"
    if pkt.haslayer(ICMP):
        return "ICMP"
    return "OTHER"

def decode_packet(pkt: ScapyPacket) -> dict | None:
    """
    Convert a Scapy packet to the frontend JSON format.
    Returns None if packet should be skipped (no IP layer).
    """
    if not pkt.haslayer(IP):
        return None  # skip ARP, raw Ethernet, etc.

    ip = pkt[IP]
    protocol = _detect_protocol(pkt)

    # Intercept DNS responses to build a real-time IP→hostname map
    if pkt.haslayer(DNS):
        _extract_dns_mappings(pkt)

    src_port = 0
    dst_port = 0
    flags = None

    if pkt.haslayer(TCP):
        src_port = pkt[TCP].sport
        dst_port = pkt[TCP].dport
        flags = _decode_flags(pkt[TCP].flags)
    elif pkt.haslayer(UDP):
        src_port = pkt[UDP].sport
        dst_port = pkt[UDP].dport
    elif pkt.haslayer(ICMP):
        src_port = 0
        dst_port = 0

    return {
        "id":        _unique_id(),
        "timestamp": int(time.time() * 1000),
        "src_ip":    str(ip.src),
        "dst_ip":    str(ip.dst),
        "src_port":  int(src_port),
        "dst_port":  int(dst_port),
        "protocol":  protocol,
        "bytes":     len(pkt),
        "flags":     flags,
    }
