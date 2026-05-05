import asyncio
import threading
import logging
from typing import Optional
from scapy.sendrecv import AsyncSniffer
from scapy.packet import Packet as ScapyPacket
try:
    from backend.packet_decoder import decode_packet
except ImportError:
    from packet_decoder import decode_packet

logger = logging.getLogger(__name__)

class PacketCapture:
    """
    Manages a Scapy AsyncSniffer running in a background thread.
    Decoded packets are placed into an asyncio.Queue for WebSocket 
    consumption.
    """

    def __init__(self):
        self._sniffer: Optional[AsyncSniffer] = None
        self._queue: Optional[asyncio.Queue] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._lock = threading.Lock()
        self._running = False

    def start(
        self, 
        queue: asyncio.Queue, 
        loop: asyncio.AbstractEventLoop,
        iface: Optional[str] = None,
        bpf_filter: str = "ip",
    ) -> bool:
        """
        Start packet capture. Returns True if started successfully.
        Requires root/admin privileges for Scapy to work.
        """
        with self._lock:
            if self._running:
                return True

            self._queue = queue
            self._loop = loop

            def on_packet(pkt: ScapyPacket):
                decoded = decode_packet(pkt)
                if decoded is None:
                    return
                # Thread-safe: schedule coroutine on the event loop
                asyncio.run_coroutine_threadsafe(
                    self._queue.put(decoded), 
                    self._loop
                )

            try:
                kwargs = {
                    "prn": on_packet,
                    "store": False,
                    "filter": bpf_filter,
                }
                if iface:
                    kwargs["iface"] = iface

                self._sniffer = AsyncSniffer(**kwargs)
                self._sniffer.start()
                self._running = True
                logger.info(f"Packet capture started on iface={iface or 'default'}")
                return True

            except Exception as e:
                logger.error(f"Failed to start capture: {e}")
                logger.error(
                    "Scapy requires root/admin privileges. "
                    "Run with: sudo uvicorn backend.main:app --port 8000"
                )
                self._running = False
                return False

    def stop(self):
        with self._lock:
            if self._sniffer and self._running:
                try:
                    self._sniffer.stop()
                except Exception as e:
                    logger.warning(f"Error stopping sniffer: {e}")
                self._running = False
                logger.info("Packet capture stopped")

    @property
    def is_running(self) -> bool:
        return self._running

# Module-level singleton
capture = PacketCapture()
