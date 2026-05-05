import re

with open("src/routes/app.graph.tsx", "r") as f:
    content = f.read()

# 1. Imports
content = content.replace('import { MOCK_GRAPH_NODES, MOCK_GRAPH_EDGES } from "@/lib/mockData";', 'import { useGraphData, GraphNode as Node, GraphEdge as Link } from "@/hooks/useGraphData";')
content = content.replace('import { useWebSocket } from "@/hooks/useWebSocket";\nimport { WS } from "@/config/apiConfig";', '')

# Remove old types Node, Link, GraphLink
# we'll redefine GraphLink to extend Link
content = re.sub(r'type Node = \{.*?\};', '', content, flags=re.DOTALL)
content = re.sub(r'type Link = \{.*?\};', '', content, flags=re.DOTALL)

content = content.replace('type GraphLink = Link & {', 'type GraphLink = Link & {')
content = content.replace('uid: string;', '')

# Remove buildMockGraph, evolveMockLinks, etc.
content = re.sub(r'const buildMockGraph = \(\) => \{.*?\};\n', '', content, flags=re.DOTALL)
content = re.sub(r'const evolveMockLinks = \(prev: Link\[\], nodeIds: string\[\]\) => \{.*?\};\n', '', content, flags=re.DOTALL)
content = re.sub(r'const EDGE_COLORS: Record<number, string> = \{.*?\};\n', '', content, flags=re.DOTALL)
content = re.sub(r'const NODE_COLORS: Record<string, string> = \{.*?\};\n', '', content, flags=re.DOTALL)

# replace getLinkUid
content = content.replace('const getLinkUid = (link: Link) => `${getNodeId(link.source)}->${getNodeId(link.target)}:${link.protocol}`;', 'const getLinkUid = (link: Link) => link.id;')

# inside component:
content = content.replace('const [nodes, setNodes] = useState<Node[]>(MOCK_GRAPH_NODES);', 'const { graphData } = useGraphData();\n  const nodes = graphData.nodes;')
content = content.replace('const [links, setLinks] = useState<Link[]>(MOCK_GRAPH_EDGES);', 'const links = graphData.edges;')
content = content.replace('const [backendOffline, setBackendOffline] = useState(false);', 'const backendOffline = false;')

# remove mock stream refs
content = re.sub(r'const mockIntervalRef = useRef<ReturnType<typeof setInterval> \| null>\(null\);\n?', '', content)

content = re.sub(r'const startMockStream = useCallback.*?\]\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'const stopMockStream = useCallback.*?\]\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'const \{ connected \} = useWebSocket.*?\]\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'useEffect\(\(\) => \{\n    if \(!connected\) \{\n      startMockStream\(\);\n    \}\n.*?\}, \[connected, startMockStream\]\);\n', '', content, flags=re.DOTALL)

# filters
content = content.replace('matchesProtocol(link.protocol, protocolFilter)', 'true')
content = content.replace('matchesThreat(link.threatLevel, threatFilter)', 'true')

# Node tooltip & selection
content = content.replace('selectedNode.label', 'selectedNode.hostname')
content = content.replace('selectedNode.type', '(selectedNode.isThreat ? "threat" : selectedNode.isInternal ? "internal" : "external")')
content = content.replace('selectedNode.threatLevel >= 2', 'selectedNode.isThreat')
content = content.replace('selectedNode.threatLevel === 1', 'false')
content = content.replace('threatLabel(selectedNode.threatLevel)', '(selectedNode.isThreat ? "THREAT" : "CLEAN")')

# Protocol summary
content = content.replace('bucket[link.protocol] = (bucket[link.protocol] || 0) + link.volume;', 'bucket["TCP"] = (bucket["TCP"] || 0) + link.bytes;')

# Graph updates
content = content.replace('linkData, d => d.uid', 'linkData, d => d.id')
content = content.replace('EDGE_COLORS[Math.min(2, Math.max(0, d.threatLevel))]', 'd.isThreat ? "#ef4444" : "#a3ff12"')
content = content.replace('edgeWidth(d.volume)', 'Math.max(1, Math.min(6, Math.log2(d.packetCount + 1)))')
content = content.replace('NODE_COLORS[d.type] || "#a3ff12"', 'd.isThreat ? "#ef4444" : d.isInternal ? "#a3ff12" : "#3b82f6"')
content = content.replace('nodeRadius(d.packetCount)', '(d.isThreat ? 16 : d.isInternal ? 14 : 10)')
content = content.replace('d.label', 'd.hostname')
content = content.replace('d.active', 'true') # mock active check
content = content.replace('link.volume', 'link.bytes')

# top connections array
content = content.replace('a.volume', 'a.bytes').replace('b.volume', 'b.bytes')
content = content.replace('{link.protocol}', 'TCP')
content = content.replace('link.threatLevel >= 2', 'link.isThreat').replace('link.threatLevel === 1', 'false')

# node pulse class
content = content.replace('.attr("fill", d => d.isThreat ? "#ef4444" : d.isInternal ? "#a3ff12" : "#3b82f6")', '.attr("fill", d => d.isThreat ? "#ef4444" : d.isInternal ? "#a3ff12" : "#3b82f6")\n      .attr("class", d => d.isThreat ? "threat-pulse" : "")')

with open("src/routes/app.graph.tsx", "w") as f:
    f.write(content)
