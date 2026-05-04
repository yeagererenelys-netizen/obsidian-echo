import time
import random
import string
from scapy.packet import Packet as ScapyPacket
from scapy.layers.inet import IP, TCP, UDP, ICMP
from scapy.layers.dns import DNS
from scapy.layers.http import HTTPRequest, HTTPResponse

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
