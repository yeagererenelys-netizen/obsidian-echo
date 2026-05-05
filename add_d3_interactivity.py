import re

with open("src/routes/app.graph.tsx", "r") as f:
    content = f.read()

# Add zoomRef
content = content.replace(
    'const timerRef = useRef<d3.Timer | null>(null);',
    'const timerRef = useRef<d3.Timer | null>(null);\n  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);'
)

# Update the svg group initialization and add zoom
svg_init = """    const rootGroup = svg.append("g");
    const linkGroup = rootGroup.append("g");
    const trailGroup = rootGroup.append("g");
    const pulseGroup = rootGroup.append("g");
    const nodeGroup = rootGroup.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        rootGroup.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;"""

content = content.replace(
    '    const linkGroup = svg.append("g");\n    const trailGroup = svg.append("g");\n    const pulseGroup = svg.append("g");\n    const nodeGroup = svg.append("g");',
    svg_init
)

# In the second useEffect, update the selector to find the groups within rootGroup
# Currently it is: svg.select<SVGGElement>("g")
# But now we have a root g, so the child gs are inside root g.
# Root group is the first g.
# Link group is g:nth-child(1) inside root group... actually d3.select("g").select("g") etc.
# Better to select them by class, but since they don't have classes, we can just use child selectors or select them by structure.
# Currently:
# linkSelection: svg.select<SVGGElement>("g").selectAll<SVGLineElement, GraphLink>("line")
# trailSelection: svg.select<SVGGElement>("g:nth-of-type(2)").selectAll...
# Let's change those to:
content = content.replace('svg\n      .select<SVGGElement>("g")', 'svg\n      .select<SVGGElement>("g > g:nth-of-type(1)")')
content = content.replace('svg\n      .select<SVGGElement>("g:nth-of-type(2)")', 'svg\n      .select<SVGGElement>("g > g:nth-of-type(2)")')
content = content.replace('svg\n      .select<SVGGElement>("g:nth-of-type(3)")', 'svg\n      .select<SVGGElement>("g > g:nth-of-type(3)")')
content = content.replace('svg\n      .select<SVGGElement>("g:nth-of-type(4)")', 'svg\n      .select<SVGGElement>("g > g:nth-of-type(4)")')

# Add drag behavior
drag_code = """
    const drag = d3.drag<SVGCircleElement, Node>()
      .on("start", (event, d) => {
        if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const nodeEnter = nodeSelection
      .enter()
      .append("circle")
"""

content = content.replace('    const nodeEnter = nodeSelection\n      .enter()\n      .append("circle")', drag_code)

# Add .call(drag) to nodeEnter
# Find where nodeEnter ends its initial setup (before .merge)
content = content.replace('      .on("click", (_, d) => setSelectedNodeId(d.id));', '      .on("click", (_, d) => setSelectedNodeId(d.id))\n      .call(drag as any);')

# Update handleResetLayout
reset_layout_code = """  const handleResetLayout = () => {
    simulationRef.current?.alpha(1).restart();
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };"""

content = re.sub(r'  const handleResetLayout = \(\) => \{.*?\};\n', reset_layout_code + '\n', content, flags=re.DOTALL)

with open("src/routes/app.graph.tsx", "w") as f:
    f.write(content)
