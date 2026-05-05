"""
dns_resolver.py — Async, non-blocking reverse DNS cache for PacketScope.

How it works:
  - All resolved hostnames are kept in a thread-safe in-memory dict.
  
  - get_hostname(ip) always returns *instantly* (never blocks the event loop).
  
  - If the IP has not been seen before, it schedules a background asyncio task
    to resolve it and update the cache. The next packet from that IP will get
    the resolved name.
  
  - Private/local IPs such as (192.168.x.x, 10.x.x.x, 127.x.x.x) are skipped to
    avoid unnecessary lookups and to keep them labelled as "local".
"""


import asyncio
import socket
import logging
from ipaddress import ip_address

logger = logging.getLogger(__name__)

# Thread-safe cache: ip_str -> hostname_str
_dns_cache: dict[str, str] = {}

# Track IPs currently being resolved to avoid duplicate lookups
_pending: set[str] = set()

# Well-known IPs → friendly name
_KNOWN: dict[str, str] = {
    "8.8.8.8":        "Google DNS",
    "8.8.4.4":        "Google DNS",
    "1.1.1.1":        "Cloudflare DNS",
    "1.0.0.1":        "Cloudflare DNS",
    "9.9.9.9":        "Quad9 DNS",
    "208.67.222.222": "OpenDNS",
}

# Domain suffix → friendly service name
_DOMAIN_MAP: list[tuple[str, str]] = [
    ("1e100.net",                  "Google"),
    ("google.com",                 "Google"),
    ("googleusercontent.com",      "Google"),
    ("googlevideo.com",            "YouTube"),
    ("youtube.com",                "YouTube"),
    ("ytimg.com",                  "YouTube"),
    ("ggpht.com",                  "Google"),
    ("googleapis.com",             "Google APIs"),
    ("gstatic.com",                "Google Static"),
    ("doubleclick.net",            "Google Ads"),
    ("icloud.com",                 "iCloud"),
    ("apple.com",                  "Apple"),
    ("mzstatic.com",               "Apple CDN"),
    ("akadns.net",                 "Akamai CDN"),
    ("akamai.net",                 "Akamai CDN"),
    ("akamaiedge.net",             "Akamai CDN"),
    ("fastly.net",                 "Fastly CDN"),
    ("cloudflare.com",             "Cloudflare"),
    ("cloudfront.net",             "AWS CloudFront"),
    ("awsglobalaccelerator.com",   "AWS Accelerator"),
    ("amazonaws.com",              "Amazon AWS"),
    ("amazon.com",                 "Amazon"),
    ("microsoft.com",              "Microsoft"),
    ("live.com",                   "Microsoft"),
    ("office.com",                 "Microsoft Office"),
    ("office365.com",              "Microsoft 365"),
    ("msftncsi.com",               "Microsoft"),
    ("windows.com",                "Microsoft"),
    ("azure.com",                  "Microsoft Azure"),
    ("facebook.com",               "Facebook"),
    ("fbcdn.net",                  "Facebook CDN"),
    ("instagram.com",              "Instagram"),
    ("whatsapp.net",               "WhatsApp"),
    ("twitter.com",                "Twitter/X"),
    ("twimg.com",                  "Twitter/X CDN"),
    ("reddit.com",                 "Reddit"),
    ("redd.it",                    "Reddit"),
    ("redditmedia.com",            "Reddit Media"),
    ("redditstatic.com",           "Reddit Static"),
    ("github.com",                 "GitHub"),
    ("githubusercontent.com",      "GitHub CDN"),
    ("slack.com",                  "Slack"),
    ("slack-edge.com",             "Slack CDN"),
    ("discord.com",                "Discord"),
    ("discordapp.com",             "Discord"),
    ("netflix.com",                "Netflix"),
    ("nflxvideo.net",              "Netflix CDN"),
    ("spotify.com",                "Spotify"),
    ("scdn.co",                    "Spotify CDN"),
    ("codeforces.com",             "Codeforces"),
    ("leetcode.com",               "LeetCode"),
    ("stackoverflow.com",          "Stack Overflow"),
    ("stackexchange.com",          "Stack Exchange"),
    ("cloudflare-dns.com",         "Cloudflare DNS"),
    ("mdns.mcast.net",             "mDNS Multicast"),
]

def _friendly(hostname: str) -> str:
    """Map an ugly reverse-DNS hostname to a friendly service name if possible."""
    lower = hostname.lower()
    for suffix, name in _DOMAIN_MAP:
        if lower == suffix or lower.endswith("." + suffix):
            return name
    return hostname


_SENTINEL = object()  # used to mark "lookup done, no result"


def _is_private(ip_str: str) -> bool:
    """Return True for loopback, link-local, and RFC-1918 addresses."""
    try:
        addr = ip_address(ip_str)
        return addr.is_private or addr.is_loopback or addr.is_link_local
    except ValueError:
        return False

async def _resolve(ip: str) -> None:
    """Background coroutine: resolve IP and store in cache."""
    try:
        hostname, _, _ = await asyncio.to_thread(socket.gethostbyaddr, ip)
        # Strip trailing dot, then map to a friendly service name
        hostname = _friendly(hostname.rstrip("."))
        _dns_cache[ip] = hostname
        logger.debug(f"[DNS] {ip} → {hostname}")
    except (socket.herror, socket.gaierror):
        # Resolution failed — cache the raw IP so we don't retry
        _dns_cache[ip] = ip
    except Exception as e:
        logger.debug(f"[DNS] Unexpected error resolving {ip}: {e}")
        _dns_cache[ip] = ip
    finally:
        _pending.discard(ip)

def get_hostname(ip: str) -> str:
    """
    Return the cached hostname for *ip*, or the raw IP string while
    scheduling a background lookup.  Always returns immediately.
    """
    # Return cached value if we have it
    if ip in _dns_cache:
        return _dns_cache[ip]

    # Use well-known table first
    if ip in _KNOWN:
        _dns_cache[ip] = _KNOWN[ip]
        return _KNOWN[ip]

    # Skip private addresses — label them by their last octet for quick identification
    if _is_private(ip):
        label = f"local"
        _dns_cache[ip] = label
        return label

    # Schedule background resolution (only once per IP)
    if ip not in _pending:
        _pending.add(ip)
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(_resolve(ip))
        except RuntimeError:
            # No running loop (shouldn't happen in our FastAPI context)
            _pending.discard(ip)

    # Return raw IP for now; future packets will get the resolved name
    return ip

_POPULAR_SITES: list[tuple[str, str]] = [
    ("google.com",          "Google"),
    ("www.google.com",      "Google"),
    ("youtube.com",         "YouTube"),
    ("www.youtube.com",     "YouTube"),
    ("codechef.com",        "CodeChef"),
    ("www.codechef.com",    "CodeChef"),
    ("codeforces.com",      "Codeforces"),
    ("www.codeforces.com",  "Codeforces"),
    ("leetcode.com",        "LeetCode"),
    ("www.leetcode.com",    "LeetCode"),
    ("github.com",          "GitHub"),
    ("www.github.com",      "GitHub"),
    ("stackoverflow.com",   "Stack Overflow"),
    ("facebook.com",        "Facebook"),
    ("www.facebook.com",    "Facebook"),
    ("instagram.com",       "Instagram"),
    ("www.instagram.com",   "Instagram"),
    ("twitter.com",         "Twitter/X"),
    ("x.com",               "Twitter/X"),
    ("reddit.com",          "Reddit"),
    ("www.reddit.com",      "Reddit"),
    ("netflix.com",         "Netflix"),
    ("www.netflix.com",     "Netflix"),
    ("spotify.com",         "Spotify"),
    ("discord.com",         "Discord"),
    ("whatsapp.com",        "WhatsApp"),
    ("amazon.com",          "Amazon"),
    ("www.amazon.com",      "Amazon"),
    ("microsoft.com",       "Microsoft"),
    ("apple.com",           "Apple"),
    ("linkedin.com",        "LinkedIn"),
    ("twitch.tv",           "Twitch"),
    ("hackerrank.com",      "HackerRank"),
    ("geeksforgeeks.org",   "GeeksForGeeks"),
    ("hackerearth.com",     "HackerEarth"),
    ("atcoder.jp",          "AtCoder"),
    ("wikipedia.org",       "Wikipedia"),
    ("slack.com",           "Slack"),
    ("notion.so",           "Notion"),
    ("figma.com",           "Figma"),
    ("vercel.com",          "Vercel"),
    ("netlify.com",         "Netlify"),
    ("heroku.com",          "Heroku"),
    ("cloudflare.com",      "Cloudflare"),
    ("https://wordlegame.org/" , "Wordle"),
]


def _resolve_site_sync(hostname: str, friendly: str) -> None:
    """Synchronously resolve a hostname and cache all returned IPs."""
    try:
        results = socket.getaddrinfo(hostname, None, socket.AF_INET)
        for result in results:
            ip = result[4][0]
            # Only store if we don't already have a better name
            existing = _dns_cache.get(ip)
            if existing is None or existing == ip:
                _dns_cache[ip] = friendly
                logger.debug(f"[pre-resolve] {ip} → {friendly} (via {hostname})")
    except Exception as e:
        logger.debug(f"[pre-resolve] Failed for {hostname}: {e}")


async def pre_resolve_popular_sites() -> None:
    """
    Called once at startup. Forward-resolves popular websites and caches
    all their IPs with friendly names so traffic is labelled correctly
    even when reverse-DNS would give infrastructure names (e.g. Amazon AWS).
    """
    logger.info("[DNS] Pre-resolving popular sites in background...")
    tasks = [
        asyncio.to_thread(_resolve_site_sync, hostname, friendly)
        for hostname, friendly in _POPULAR_SITES
    ]
    await asyncio.gather(*tasks, return_exceptions=True)
    logger.info(f"[DNS] Pre-resolution complete. Cache has {len(_dns_cache)} entries.")

