import re

with open("src/routes/app.capture.tsx", "r") as f:
    content = f.read()

# 1. Restore Row component definition
row_component = """
const Row = memo(({
  index,
  style,
  ariaAttributes,
  filteredPackets,
  setSelectedPacket,
}: {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: any;
  filteredPackets: Packet[];
  setSelectedPacket: (p: Packet) => void;
}) => {
  const pkt = filteredPackets[index];
  if (!pkt) return null;
  return (
    <div
      style={style}
      key={pkt.id}
      className="flex items-center gap-4 px-4 border-b border-graphite/30 hover:bg-white/5 transition-colors mono text-[11px] leading-[40px] cursor-pointer"
      onClick={() => setSelectedPacket(pkt)}
      {...ariaAttributes}
    >
      <div className="w-12 text-ghost">{pkt.id}</div>
      <div className="w-24 text-silver">{new Date(pkt.timestamp).toISOString().slice(11,19)}</div>
      <div className="w-40 text-white truncate">{pkt.src_ip}:{pkt.src_port}</div>
      <div className="w-40 text-white truncate">{pkt.dst_ip}:{pkt.dst_port}</div>
      <div className="w-20"><span className={`badge ${protoBadge(pkt.protocol)}`}>{pkt.protocol}</span></div>
      <div className="w-16 text-silver">{pkt.bytes}</div>
      <div className="w-24 text-ghost truncate">{pkt.flags ?? "—"}</div>
      <div className="flex-1 text-silver truncate">{"Packet length " + pkt.bytes}</div>
    </div>
  );
});

function Capture() {"""

content = content.replace("function Capture() {", row_component)

# 2. Fix the List rendering
old_list = """          <VirtualList
            ref={listRef}
            height={550}
            itemCount={filteredPackets.length}
            itemSize={40}
            width="100%"
            onScroll={({ scrollOffset }) => {
              if (scrollOffset > 40) setAutoScroll(false);
              else setAutoScroll(true);
            }}
          >
            {({ index, style }) => {
              const pkt = filteredPackets[index];
              return (
                <div
                  style={style}
                  key={pkt.id}
                  className="flex items-center gap-4 px-4 border-b border-graphite/30 hover:bg-white/5 transition-colors mono text-[11px] leading-[40px] cursor-pointer"
                  onClick={() => setSelectedPacket(pkt)}
                >
                  <div className="w-12 text-ghost">{pkt.id}</div>
                  <div className="w-24 text-silver">{new Date(pkt.timestamp).toISOString().slice(11,19)}</div>
                  <div className="w-40 text-white truncate">{pkt.src_ip}:{pkt.src_port}</div>
                  <div className="w-40 text-white truncate">{pkt.dst_ip}:{pkt.dst_port}</div>
                  <div className="w-20"><span className={`badge ${protoBadge(pkt.protocol)}`}>{pkt.protocol}</span></div>
                  <div className="w-16 text-silver">{pkt.bytes}</div>
                  <div className="w-24 text-ghost truncate">{pkt.flags ?? "—"}</div>
                  <div className="flex-1 text-silver truncate">{"Packet length " + pkt.bytes}</div>
                </div>
              );
            }}
          </VirtualList>"""

new_list = """          <VirtualList
            listRef={listRef as any}
            style={{ height: 550, width: "100%" }}
            rowCount={filteredPackets.length}
            rowHeight={40}
            rowComponent={Row}
            rowProps={{ filteredPackets, setSelectedPacket }}
          />"""

content = content.replace(old_list, new_list)

with open("src/routes/app.capture.tsx", "w") as f:
    f.write(content)
