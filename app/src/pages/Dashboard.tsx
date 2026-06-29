import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useData } from '@/hooks/useData';
import { useAppStore } from '@/store/useAppStore';
import { PanelShell } from '@/components/PanelShell';
import NodeDetailPanel from '@/components/NodeDetailPanel';
import { getLensEmphasis } from '@/lib/lens';
import { Eye, Plus, Minus, Maximize2, Activity } from 'lucide-react';
import type { GraphNode, GraphEdge } from '@/types/graph';

const GROUP_COLORS: Record<number, string> = {
  1: '#D4A853', 2: '#5B8DB8', 3: '#8B6F9B', 4: '#6BA87C',
  5: '#C97A5B', 6: '#6B8FC4', 7: '#A89060', 8: '#C4A040', 9: '#7A8B9A',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#4ADE80', building: '#FBBF24', failed: '#F87171', stale: '#9B99B8', planned: '#60A5FA',
};

const EDGE_DASH: Record<string, string> = {
  depends_on: '4,4', feeds: '0', triggers: '2,6', references: '8,4', hosts: '0', proxies_to: '2,2',
};

const STYLE_ABBR: Record<string, string> = {
  magazine: 'MG', lego: 'LG', deepdive: 'DD', data: 'DT', card: 'CD', status: 'ST',
};

export default function Dashboard() {
  const { data: graphData } = useData('graph');
  const { data: viewsData } = useData('views');
  const { data: obsData } = useData('observations');
  const { data: handoffsData } = useData('handoffs');
  const { data: partsData } = useData('participants');
  const selectedNode = useAppStore(s => s.selectedNode);
  const setSelectedNode = useAppStore(s => s.setSelectedNode);
  const activeCuratedView = useAppStore(s => s.activeCuratedView);
  const activeLens = useAppStore(s => s.activeLens);
  const setActiveCuratedView = useAppStore(s => s.setActiveCuratedView);
  const setActiveLens = useAppStore(s => s.setActiveLens);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [svgSize, setSvgSize] = useState({ w: 800, h: 600 });
  const [simNodes, setSimNodes] = useState<GraphNode[]>([]);
  const [simEdges, setSimEdges] = useState<GraphEdge[]>([]);

  // Initialize simulation
  useEffect(() => {
    if (!graphData) return;
    const nodes = graphData.nodes.map(n => ({ ...n }));
    const edges = graphData.edges.map(e => ({ ...e }));
    setSimNodes(nodes);
    setSimEdges(edges);

    const sim = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('charge', d3.forceManyBody().strength(-400))
      .force('link', d3.forceLink(edges.map(e => ({ source: e.from, target: e.to }))).id((d: any) => d.id).distance(140))
      .force('center', d3.forceCenter(svgSize.w / 2, svgSize.h / 2))
      .force('collision', d3.forceCollide().radius(35))
      .alphaDecay(0.02)
      .velocityDecay(0.3)
      .on('tick', () => {
        setSimNodes(prev => prev.map((n, i) => ({ ...n, x: nodes[i].x, y: nodes[i].y })));
      });

    simulationRef.current = sim as unknown as d3.Simulation<GraphNode, undefined>;

    return () => { sim.stop(); };
  }, [graphData, svgSize.w, svgSize.h]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setSvgSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Zoom setup
  useEffect(() => {
    if (!svgRef.current) return;
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on('zoom', (event) => {
        d3.select(svgRef.current).select('.zoom-layer').attr('transform', event.transform);
      });
    d3.select(svgRef.current).call(zoom);
    zoomRef.current = zoom;
  }, []);

  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
  }, []);
  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
  }, []);
  const handleFit = useCallback(() => {
    if (!svgRef.current || !simNodes.length || !zoomRef.current) return;
    const xs = simNodes.map(n => n.x);
    const ys = simNodes.map(n => n.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = 0.9 / Math.max((x1 - x0) / svgSize.w, (y1 - y0) / svgSize.h);
    const tx = (svgSize.w - k * (x0 + x1)) / 2;
    const ty = (svgSize.h - k * (y0 + y1)) / 2;
    d3.select(svgRef.current).transition().duration(600).call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
  }, [simNodes, svgSize]);

  // Filtering
  const visibleNodes = useMemo(() => {
    if (!simNodes.length) return [];
    let nodes = simNodes;
    if (activeCuratedView) {
      const ids = new Set(activeCuratedView.node_ids);
      nodes = nodes.filter(n => ids.has(n.id));
    }
    return nodes;
  }, [simNodes, activeCuratedView]);

  const visibleEdges = useMemo(() => {
    if (!visibleNodes.length) return [];
    const ids = new Set(visibleNodes.map(n => n.id));
    return simEdges.filter(e => ids.has(e.from) && ids.has(e.to));
  }, [visibleNodes, simEdges]);

  // Lens emphasis values
  const lensEmphasis = useMemo(() => {
    if (!activeLens || !simNodes.length) return null;
    return getLensEmphasis(simNodes, simEdges, activeLens.algorithm);
  }, [activeLens, simNodes, simEdges]);

  // D3 drag behavior
  useEffect(() => {
    if (!svgRef.current || !simulationRef.current) return;

    type SimNode = GraphNode & { fx: number | null; fy: number | null };

    const drag = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulationRef.current!.alphaTarget(0.3).restart();
        const sd = d as SimNode;
        sd.fx = d.x;
        sd.fy = d.y;
      })
      .on('drag', (event, d) => {
        const sd = d as SimNode;
        sd.fx = event.x;
        sd.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulationRef.current!.alphaTarget(0);
        const sd = d as SimNode;
        sd.fx = null;
        sd.fy = null;
      });

    // Apply drag to all node groups after render
    const timeout = setTimeout(() => {
      d3.select(svgRef.current)
        .selectAll<SVGGElement, GraphNode>('.node-group')
        .call(drag);
    }, 100);

    return () => clearTimeout(timeout);
  }, [visibleNodes]);

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ background: '#131428' }}>
      {/* SVG Graph */}
      <svg ref={svgRef} className="w-full h-full" style={{ background: '#131428' }}>
        {/* Background dot grid pattern */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="rgba(74,75,130,0.12)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <g className="zoom-layer">
          {/* Edges */}
          {visibleEdges.map((e, i) => {
            const src = visibleNodes.find(n => n.id === e.from);
            const tgt = visibleNodes.find(n => n.id === e.to);
            if (!src || !tgt) return null;
            const isConnectedToSelected = selectedNode && (e.from === selectedNode.id || e.to === selectedNode.id);
            const gcolor = GROUP_COLORS[src.group] || '#7A8B9A';
            return (
              <path
                key={i}
                d={`M${src.x},${src.y} C${src.x + 20},${src.y} ${tgt.x - 20},${tgt.y} ${tgt.x},${tgt.y}`}
                fill="none"
                stroke={isConnectedToSelected ? gcolor : 'rgba(212,168,83,0.25)'}
                strokeWidth={isConnectedToSelected ? 2.5 : 1.5}
                strokeOpacity={isConnectedToSelected ? 0.8 : 0.4}
                strokeDasharray={EDGE_DASH[e.kind] || '0'}
                style={{ transition: 'stroke-opacity 200ms' }}
              />
            );
          })}

          {/* Nodes */}
          {visibleNodes.map(node => {
            const gcolor = GROUP_COLORS[node.group] || '#7A8B9A';
            const isSelected = selectedNode?.id === node.id;
            const emphasis = lensEmphasis?.get(node.id);
            const opacity = emphasis?.opacity ?? 1;
            const scale = emphasis?.scale ?? 1;

            return (
              <g
                key={node.id}
                className="node-group"
                transform={`translate(${node.x},${node.y}) scale(${scale})`}
                style={{
                  cursor: 'pointer',
                  opacity,
                  transition: lensEmphasis ? 'opacity 400ms, transform 300ms' : undefined,
                }}
                onClick={() => setSelectedNode(isSelected ? null : node)}
              >
                {/* Glow ring on select */}
                {isSelected && <circle r="30" fill="none" stroke="#D4A853" strokeWidth="2" opacity="0.6" />}
                {/* Main circle */}
                <circle r="24" fill="#22234A" stroke={gcolor} strokeWidth="2" />
                {/* Cover thumbnail */}
                {node.cover && (
                  <defs>
                    <clipPath id={`clip-${node.id}`}><circle r="18" /></clipPath>
                  </defs>
                )}
                {node.cover && <image href={node.cover} x="-18" y="-18" width="36" height="36" clipPath={`url(#clip-${node.id})`} preserveAspectRatio="xMidYMid slice" />}
                {/* Status dot */}
                <circle cx="16" cy="16" r="5" fill={STATUS_COLORS[node.status] || '#9B99B8'} stroke="#22234A" strokeWidth="2" />
                {/* Show style badge */}
                <g transform="translate(14, -18)">
                  <rect x="-10" y="-7" width="20" height="14" rx="3" fill={gcolor} opacity="0.9" />
                  <text y="1" textAnchor="middle" fill="#1A1B3A" fontSize="7" fontFamily="'JetBrains Mono', monospace" fontWeight="700" letterSpacing="0.04em">{STYLE_ABBR[node.show_style] || node.show_style.slice(0,2).toUpperCase()}</text>
                </g>
                {/* Label */}
                <text y="36" textAnchor="middle" fill={isSelected ? '#D4A853' : '#9B99B8'} fontSize="9" fontFamily="'JetBrains Mono', monospace" fontWeight="400" style={{ transition: 'fill 200ms' }}>
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Left Panel */}
      <div className="absolute left-0 top-0 bottom-0">
        <PanelShell side="left" title="Views & Lens" icon={<Eye size={14} />}>
          <div className="space-y-4">
            {/* Curated Views */}
            <div>
              <h3 className="font-sans text-[10px] font-bold tracking-widest text-text-tertiary uppercase mb-2">Curated Views</h3>
              <div className="space-y-1">
                {viewsData?.curated.map(view => (
                  <button
                    key={view.id}
                    onClick={() => setActiveCuratedView(activeCuratedView?.id === view.id ? null : view)}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition-all ${activeCuratedView?.id === view.id ? 'bg-navy-700 text-gold border border-gold/30' : 'text-text-secondary hover:bg-navy-700/50 hover:text-text-primary'}`}
                  >
                    <div className="font-medium">{view.name}</div>
                    <div className="text-[10px] text-text-tertiary mt-0.5">{view.node_ids.length} nodes</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Lens */}
            <div>
              <h3 className="font-sans text-[10px] font-bold tracking-widest text-text-tertiary uppercase mb-2">Lens</h3>
              <div className="flex flex-wrap gap-1.5">
                {viewsData?.lens.map(lens => (
                  <button
                    key={lens.id}
                    onClick={() => setActiveLens(activeLens?.id === lens.id ? null : lens)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-medium transition-all border ${activeLens?.id === lens.id ? 'bg-navy-700 text-gold border-gold/40' : 'text-text-secondary border-navy-600 hover:border-navy-500 hover:text-text-primary'}`}
                  >
                    {lens.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Legend */}
            <div className="pt-2 border-t border-navy-600/40">
              <h3 className="font-sans text-[10px] font-bold tracking-widest text-text-tertiary uppercase mb-2">Legend</h3>
              {Object.entries({ surface: 1, agent: 2, build_order: 3, notebook: 4, runbook: 5, article: 6, dataset: 7, devbook: 8 }).map(([kind, group]) => (
                <div key={kind} className="flex items-center gap-2 py-0.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: GROUP_COLORS[group] }} />
                  <span className="font-mono text-[10px] text-text-secondary capitalize">{kind.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </PanelShell>
      </div>

      {/* Right Panel */}
      <div className="absolute right-0 top-0 bottom-0">
        <PanelShell side="right" title="Live Feed" icon={<Activity size={14} />}>
          <Tabs defaultValue="obs" tabs={[
            { value: 'obs', label: 'Observations', content: (
              <div className="space-y-0">
                {obsData?.observations.map(obs => {
                  const node = graphData?.nodes.find(n => n.id === obs.node_id);
                  const gcolor = node ? (GROUP_COLORS[node.group] || '#7A8B9A') : '#7A8B9A';
                  return (
                    <div key={obs.id} className="py-2 border-b border-navy-600/20 hover:bg-gold-dim/30 transition-colors px-1">
                      <div className="flex items-start gap-2">
                        <span className="font-mono text-[9px] text-text-tertiary w-12 flex-shrink-0 pt-0.5">
                          {new Date(obs.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: gcolor }} />
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-[9px] text-text-secondary block truncate">{obs.node_id}</span>
                          <span className="text-[11px] text-text-primary leading-snug block mt-0.5">{obs.message}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )},
            { value: 'handoffs', label: 'Handoffs', content: (
              <div className="space-y-0">
                {handoffsData?.handoffs.map(ho => (
                  <div key={ho.id} className="py-2 border-b border-navy-600/20 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] text-text-secondary truncate max-w-[70px]">{ho.from_node}</span>
                      <span className="text-text-tertiary text-[10px]">&rarr;</span>
                      <span className="font-mono text-[9px] text-text-secondary truncate max-w-[70px]">{ho.to_node}</span>
                      <span className={`ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 ${ho.status === 'completed' ? 'bg-status-active' : ho.status === 'failed' ? 'bg-status-failed' : ho.status === 'in_progress' ? 'bg-status-building' : 'bg-status-planned'}`} />
                    </div>
                    <span className="font-mono text-[8px] text-text-tertiary mt-0.5 block">{ho.payload_type}</span>
                  </div>
                ))}
              </div>
            )},
            { value: 'participants', label: 'Participants', content: (
              <div className="space-y-1">
                {partsData?.participants.map(p => (
                  <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-navy-700/30 transition-colors">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-text-primary flex-shrink-0" style={{ background: '#2E2F5A' }}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[10px] text-text-primary block truncate">{p.name}</span>
                      <span className="font-mono text-[8px] text-text-tertiary block">{p.role}</span>
                    </div>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.active ? 'bg-status-active animate-pulse-dot' : 'bg-status-stale'}`} />
                  </div>
                ))}
              </div>
            )},
          ]} />
        </PanelShell>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-30">
        <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center rounded-md bg-navy-800 border border-navy-600 text-text-secondary hover:text-text-primary hover:bg-navy-700 transition-colors">
          <Plus size={14} />
        </button>
        <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center rounded-md bg-navy-800 border border-navy-600 text-text-secondary hover:text-text-primary hover:bg-navy-700 transition-colors">
          <Minus size={14} />
        </button>
        <button onClick={handleFit} className="w-8 h-8 flex items-center justify-center rounded-md bg-navy-800 border border-navy-600 text-text-secondary hover:text-text-primary hover:bg-navy-700 transition-colors">
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Detail Panel — uses NodeDetailPanel component */}
      {selectedNode && graphData && (
        <NodeDetailPanel
          node={selectedNode}
          edges={simEdges}
          allNodes={graphData.nodes}
          observations={obsData?.observations || []}
        />
      )}
    </div>
  );
}

function Tabs({ defaultValue, tabs }: { defaultValue: string; tabs: { value: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(defaultValue);
  return (
    <div>
      <div className="flex gap-0.5 mb-2 border-b border-navy-600/30 pb-1">
        {tabs.map(t => (
          <button key={t.value} onClick={() => setActive(t.value)}
            className={`px-2 py-1 font-mono text-[9px] font-medium rounded-t transition-colors ${active === t.value ? 'text-gold bg-navy-700/50' : 'text-text-tertiary hover:text-text-secondary'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tabs.find(t => t.value === active)?.content}
    </div>
  );
}
