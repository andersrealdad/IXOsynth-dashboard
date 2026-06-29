import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Play, Activity, Server } from 'lucide-react';
import type { GraphNode } from '@/types/graph';
import type { Observation } from '@/types/observation';

const STATUS_COLORS: Record<string, string> = {
  active: '#4ADE80', building: '#FBBF24', failed: '#F87171', stale: '#9B99B8', planned: '#60A5FA',
};

interface StatusViewProps {
  node: GraphNode;
  observations: Observation[];
}

export default function StatusView({ node, observations }: StatusViewProps) {
  const [uptime, setUptime] = useState(0);
  const [responseTime, setResponseTime] = useState(42);
  const [lastCheck, setLastCheck] = useState(new Date());

  // Simulate live metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(prev => prev + 1);
      setResponseTime(20 + Math.floor(Math.random() * 180));
      setLastCheck(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const responseColor = responseTime < 50 ? '#4ADE80' : responseTime < 200 ? '#FBBF24' : '#F87171';

  const nodeObs = useMemo(() =>
    observations.filter(o => o.node_id === node.id).slice(0, 8),
    [observations, node.id]
  );

  // Health check history — mock row of colored dots
  const healthHistory = useMemo(() =>
    Array.from({ length: 20 }, () => Math.random()),
    [node.id]
  );

  // Format uptime
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  const uptimeStr = days > 0 ? `UP ${days}d ${hours}h ${mins}m` : `UP ${hours}h ${mins}m`;

  return (
    <div className="space-y-4">
      {/* Probe Header */}
      <div>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md mb-3"
          style={{
            background: node.status === 'active' ? 'rgba(74,222,128,0.15)' :
                        node.status === 'failed' ? 'rgba(248,113,113,0.15)' :
                        'rgba(251,191,36,0.15)',
            borderLeft: `3px solid ${STATUS_COLORS[node.status]}`,
          }}
        >
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-wider"
            style={{ color: STATUS_COLORS[node.status] }}
          >
            {node.status === 'active' ? 'HEALTHY' : node.status === 'failed' ? 'CRITICAL' : 'WARNING'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-text-secondary">{uptimeStr}</span>
            <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: STATUS_COLORS[node.status] }} />
          </div>
          <span className="font-mono text-[9px] text-text-tertiary">
            Checked {Math.floor((Date.now() - lastCheck.getTime()) / 1000)}s ago
          </span>
        </div>
      </div>

      {/* Health Row — gauges */}
      <div className="grid grid-cols-3 gap-3">
        <HealthGauge label="Response" value={responseTime} max={300} unit="ms" color={responseColor} />
        <HealthGauge label="Uptime" value={99.97} max={100} unit="%" color="#4ADE80" />
        <HealthGauge label="Throughput" value={87} max={100} unit="%" color="#60A5FA" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'CPU %', value: `${(30 + Math.random() * 40).toFixed(1)}`, unit: '%' },
          { label: 'Memory', value: `${(2 + Math.random() * 6).toFixed(1)}`, unit: 'GB' },
          { label: 'Req/s', value: `${Math.floor(80 + Math.random() * 400)}`, unit: 'req' },
          { label: 'Latency', value: `${responseTime}`, unit: 'ms' },
          { label: 'Errors', value: '0.12', unit: '%' },
          { label: 'Queue', value: `${Math.floor(Math.random() * 20)}`, unit: 'jobs' },
        ].map((m, i) => (
          <div
            key={i}
            className="p-3 rounded-md"
            style={{ border: '1px solid rgba(74,75,130,0.4)', background: 'rgba(34,35,74,0.3)' }}
          >
            <span className="font-mono text-[9px] text-text-secondary uppercase tracking-wider block">{m.label}</span>
            <span className="font-mono text-base font-semibold text-text-primary mt-0.5 block">{m.value}</span>
            <span className="font-mono text-[8px] text-text-tertiary">{m.unit}</span>
          </div>
        ))}
      </div>

      {/* Backend connection */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-md"
        style={{ background: 'rgba(34,35,74,0.5)', border: '1px solid rgba(74,75,130,0.3)' }}
      >
        <Server size={12} className="text-text-tertiary" />
        <span className="font-mono text-[10px] text-text-secondary">{node.backend}.local</span>
        <span className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: STATUS_COLORS[node.status] }} />
      </div>

      {/* Health check history */}
      <div>
        <span className="font-mono text-[9px] text-text-tertiary uppercase tracking-wider block mb-2">Health History</span>
        <div className="flex gap-1 flex-wrap">
          {healthHistory.map((h, i) => {
            const c = h > 0.9 ? '#4ADE80' : h > 0.7 ? '#FBBF24' : '#F87171';
            return (
              <span
                key={i}
                className="w-3 h-3 rounded-sm"
                style={{ background: c, opacity: 0.7 + h * 0.3 }}
                title={`Check ${i + 1}: ${h > 0.9 ? 'OK' : h > 0.7 ? 'Warn' : 'Fail'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Recent observation feed */}
      <div>
        <span className="font-mono text-[9px] text-text-tertiary uppercase tracking-wider block mb-2">Recent Events</span>
        <div className="max-h-[200px] overflow-y-auto space-y-1">
          {nodeObs.length > 0 ? nodeObs.map(obs => (
            <div
              key={obs.id}
              className="flex items-start gap-2 py-1.5 px-2 rounded"
              style={{ borderBottom: '1px solid rgba(74,75,130,0.15)' }}
            >
              <span className="font-mono text-[8px] text-text-tertiary w-10 flex-shrink-0">
                {new Date(obs.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
                style={{
                  background: obs.severity === 'error' ? '#F87171' : obs.severity === 'warning' ? '#FBBF24' : '#4ADE80',
                }}
              />
              <span className="font-mono text-[10px] text-text-primary flex-1 leading-snug">{obs.message}</span>
            </div>
          )) : (
            <div className="py-4 text-center">
              <span className="font-mono text-[10px] text-text-tertiary">No recent events for this node</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-colors"
          style={{ background: 'transparent', border: '1px solid #3A3B6E', color: '#E8E6F0' }}
          onClick={() => setUptime(0)}
        >
          <RefreshCw size={12} /> Refresh
        </button>
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-colors"
          style={{ background: 'transparent', border: '1px solid #3A3B6E', color: '#E8E6F0' }}
        >
          <Play size={12} /> Restart
        </button>
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-colors ml-auto"
          style={{ background: '#D4A853', color: '#1A1B3A' }}
        >
          <Activity size={12} /> Health Check
        </button>
      </div>
    </div>
  );
}

function HealthGauge({ label, value, max, unit, color }: {
  label: string; value: number; max: number; unit: string; color: string;
}) {
  const pct = Math.min(value / max, 1);
  const arc = pct * 180;

  return (
    <div
      className="flex flex-col items-center p-3 rounded-md"
      style={{ border: '1px solid rgba(74,75,130,0.4)', background: 'rgba(34,35,74,0.3)' }}
    >
      <span className="font-mono text-[9px] text-text-secondary uppercase tracking-wider">{label}</span>
      <svg viewBox="0 0 100 55" className="w-16 h-9 mt-1">
        {/* Track */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#2E2F5A"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${arc * 1.4} 252`}
          style={{ transition: 'stroke-dasharray 800ms cubic-bezier(0.4,0,1,1)' }}
        />
      </svg>
      <span className="font-mono text-sm font-semibold" style={{ color }}>{value}{unit}</span>
    </div>
  );
}
