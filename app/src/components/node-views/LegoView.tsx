import { useMemo } from 'react';
import { CheckCircle2, Loader2, Clock, XCircle } from 'lucide-react';
import type { GraphNode, GraphEdge } from '@/types/graph';

const STATUS_COLORS: Record<string, string> = {
  active: '#4ADE80', building: '#FBBF24', failed: '#F87171', stale: '#9B99B8', planned: '#60A5FA',
};

const STATUS_BG: Record<string, string> = {
  active: 'rgba(74,222,128,0.08)',
  building: 'rgba(251,191,36,0.08)',
  failed: 'rgba(248,113,113,0.08)',
  stale: '#22234A',
  planned: '#22234A',
};

const STATUS_BORDER: Record<string, string> = {
  active: '#4ADE80',
  building: '#FBBF24',
  failed: '#F87171',
  stale: '#6B6988',
  planned: '#60A5FA',
};

interface LegoViewProps {
  node: GraphNode;
  edges: GraphEdge[];
  allNodes: GraphNode[];
}

interface BuildStep {
  number: number;
  title: string;
  description: string;
  status: 'active' | 'building' | 'failed' | 'stale' | 'planned';
  progress: number;
}

export default function LegoView({ node, edges, allNodes }: LegoViewProps) {
  const gcolor = '#D4A853';

  // Derive build steps from node.status progression + connected nodes
  const steps: BuildStep[] = useMemo(() => {
    const connected = allNodes.filter(n => edges.some(e => e.from === node.id && e.to === n.id));
    const baseSteps: BuildStep[] = [
      { number: 1, title: 'Initialize', description: `Setup ${node.kind} environment on ${node.backend}`, status: 'active', progress: 100 },
      { number: 2, title: 'Configure', description: node.description, status: node.status === 'active' ? 'active' : node.status, progress: node.status === 'active' ? 100 : node.status === 'building' ? 65 : node.status === 'failed' ? 60 : 0 },
      { number: 3, title: 'Deploy', description: `Deploy to ${node.backend}.local`, status: node.status === 'active' ? 'active' : 'planned', progress: node.status === 'active' ? 100 : 0 },
    ];
    connected.slice(0, 3).forEach((n) => {
      baseSteps.push({
        number: baseSteps.length + 1,
        title: `Connect: ${n.label}`,
        description: `Establish ${edges.find(e => e.from === node.id && e.to === n.id)?.kind || 'link'} to ${n.kind}`,
        status: n.status,
        progress: n.status === 'active' ? 100 : n.status === 'building' ? 45 : 0,
      });
    });
    return baseSteps;
  }, [node, edges, allNodes]);

  const overallProgress = Math.round(steps.reduce((s, st) => s + st.progress, 0) / steps.length);
  const completedSteps = steps.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-4">
      {/* Build Header */}
      <div>
        <h2 className="font-serif text-2xl font-semibold text-text-primary">{node.label}</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-4 h-4 rounded-full" style={{ background: STATUS_COLORS[node.status] }} />
          <span className="font-sans text-sm font-semibold text-text-primary capitalize">{node.status}</span>
        </div>

        {/* Overall progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] text-text-secondary uppercase tracking-wider">Overall Progress</span>
            <span className="font-mono text-xs text-gold">{overallProgress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: '#2E2F5A' }}>
            <div
              className="h-full rounded-full transition-all duration-800"
              style={{
                width: `${overallProgress}%`,
                background: `linear-gradient(to right, ${gcolor}, #E8C97A)`,
                transition: 'width 800ms cubic-bezier(0.4,0,1,1)',
              }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[
            { label: 'Steps', value: steps.length },
            { label: 'Done', value: completedSteps },
            { label: 'Failed', value: steps.filter(s => s.status === 'failed').length },
            { label: 'Pending', value: steps.filter(s => s.status === 'planned' || s.status === 'stale').length },
          ].map(s => (
            <div key={s.label} className="text-center p-1.5 rounded" style={{ background: 'rgba(34,35,74,0.5)' }}>
              <span className="font-mono text-xs font-semibold text-text-primary">{s.value}</span>
              <span className="font-mono text-[8px] text-text-tertiary uppercase tracking-wider block">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps with vertical gold line */}
      <div className="relative pl-4">
        {/* Vertical connector line */}
        <div
          className="absolute left-[19px] top-4 bottom-4 w-px"
          style={{ background: 'linear-gradient(to bottom, #D4A853, rgba(212,168,83,0.2))' }}
        />

        <div className="space-y-3">
          {steps.map((step, i) => (
            <StepBlock key={step.number} step={step} gcolor={gcolor} delay={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepBlock({ step, gcolor, delay }: { step: BuildStep; gcolor: string; delay: number }) {
  const StatusIcon =
    step.status === 'active' ? CheckCircle2 :
    step.status === 'building' ? Loader2 :
    step.status === 'failed' ? XCircle :
    Clock;

  const isSpinning = step.status === 'building';

  return (
    <div
      className="relative rounded-lg p-4"
      style={{
        background: STATUS_BG[step.status],
        borderLeft: `3px solid ${STATUS_BORDER[step.status]}`,
        animation: `stepSlide 200ms cubic-bezier(0,0,0.2,1) ${delay * 80}ms both`,
      }}
    >
      <style>{`@keyframes stepSlide { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div className="flex items-center gap-3">
        {/* Step number circle */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: gcolor }}
        >
          <span className="font-mono text-[10px] font-bold" style={{ color: '#1A1B3A' }}>{step.number}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-sans text-sm font-semibold text-text-primary">{step.title}</span>
            <StatusIcon
              size={14}
              style={{ color: STATUS_COLORS[step.status] }}
              className={isSpinning ? 'animate-spin' : ''}
            />
          </div>
          <p className="text-xs text-text-secondary mt-0.5">{step.description}</p>
        </div>

        <span className="font-mono text-xs text-text-secondary flex-shrink-0">{step.progress}%</span>
      </div>

      {/* Per-step progress bar */}
      <div className="mt-2 ml-9">
        <div className="w-full h-1 rounded-full" style={{ background: '#2E2F5A' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${step.progress}%`,
              background: STATUS_COLORS[step.status],
              transition: 'width 800ms cubic-bezier(0.4,0,1,1)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
