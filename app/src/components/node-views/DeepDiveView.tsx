import type { GraphNode } from '@/types/graph';

interface DeepDiveViewProps {
  node: GraphNode;
}

// Inline syntax highlighting colors (dark theme)
const SYNTAX = {
  keyword: '#C678DD',
  string: '#98C379',
  number: '#D19A66',
  function: '#61AFEF',
  comment: '#5C6370',
  variable: '#E06C75',
  default: '#ABB2BF',
};

function Token({ type, children }: { type: keyof typeof SYNTAX; children: React.ReactNode }) {
  return <span style={{ color: SYNTAX[type] || SYNTAX.default }}>{children}</span>;
}

export default function DeepDiveView({ node }: DeepDiveViewProps) {
  return (
    <div className="space-y-4">
      {/* Notebook header */}
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(74,75,130,0.4)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="font-mono text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80' }}
            >
              Notebook
            </span>
            <span className="font-mono text-[10px] text-text-tertiary">{node.label}</span>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-text-primary">{node.label}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(74,222,128,0.1)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }}
          >
            IDLE
          </span>
          <span className="font-mono text-[9px] text-text-tertiary">3 cells</span>
        </div>
      </div>

      {/* Cell 1 — Markdown narrative */}
      <div className="py-2">
        <div className="flex gap-3">
          <span className="font-mono text-[10px] text-text-tertiary w-8 text-right pt-1 select-none">[ ]</span>
          <div className="flex-1">
            <p className="font-serif text-sm text-text-primary leading-relaxed">
              Analysis of <strong className="text-text-primary">{node.label}</strong> — {node.description}
              This notebook explores the data relationships and operational metrics
              associated with the {node.kind} node running on the {node.backend} backend.
            </p>
          </div>
        </div>
      </div>

      {/* Cell 2 — Code: imports */}
      <CodeCell cellNum={1}>
        <div className="font-mono text-xs leading-relaxed">
          <Token type="keyword">import</Token> <Token type="variable">pandas</Token> <Token type="keyword">as</Token> <Token type="variable">pd</Token>{'\n'}
          <Token type="keyword">import</Token> <Token type="variable">numpy</Token> <Token type="keyword">as</Token> <Token type="variable">np</Token>{'\n'}
          <Token type="keyword">from</Token> <Token type="variable">datetime</Token> <Token type="keyword">import</Token> <Token type="variable">datetime</Token>, <Token type="variable">timedelta</Token>{'\n'}{'\n'}
          <Token type="comment"># Load node operational data</Token>{'\n'}
          <Token type="variable">df</Token> = <Token type="variable">pd</Token>.<Token type="function">read_csv</Token>(<Token type="string">&apos;{node.id}_metrics.csv&apos;</Token>){'\n'}
          <Token type="variable">df</Token>[<Token type="string">&apos;timestamp&apos;</Token>] = <Token type="variable">pd</Token>.<Token type="function">to_datetime</Token>(<Token type="variable">df</Token>[<Token type="string">&apos;timestamp&apos;</Token>]){'\n'}
          <Token type="function">print</Token>(<Token type="string">f&quot;Loaded {'{'}len(df){'}'} rows for {node.label}&quot;</Token>)
        </div>
      </CodeCell>

      {/* Output for cell 2 */}
      <OutputCell>
        <span className="font-mono text-xs text-text-primary">Loaded 1,247 rows for {node.label}</span>
      </OutputCell>

      {/* Narrative between cells */}
      <div className="py-2">
        <div className="flex gap-3">
          <span className="font-mono text-[10px] text-text-tertiary w-8 text-right pt-1 select-none">[ ]</span>
          <div className="flex-1">
            <p className="font-serif text-sm text-text-primary leading-relaxed">
              The dataset contains operational metrics spanning 14 days. We observe
              normal patterns in request latency with occasional spikes during
              peak hours. Let&apos;s compute summary statistics.
            </p>
          </div>
        </div>
      </div>

      {/* Cell 3 — Code: analysis */}
      <CodeCell cellNum={2}>
        <div className="font-mono text-xs leading-relaxed">
          <Token type="comment"># Compute rolling statistics</Token>{'\n'}
          <Token type="variable">df</Token>[<Token type="string">&apos;rolling_mean&apos;</Token>] = <Token type="variable">df</Token>[<Token type="string">&apos;latency_ms&apos;</Token>].<Token type="function">rolling</Token>(<Token type="number">24</Token>).<Token type="function">mean</Token>(){'\n'}
          <Token type="variable">summary</Token> = <Token type="variable">df</Token>.<Token type="function">agg</Token>({'\n'}
          {'    '}<Token type="string">&apos;latency_ms&apos;</Token>: [<Token type="string">&apos;mean&apos;</Token>, <Token type="string">&apos;std&apos;</Token>, <Token type="string">&apos;max&apos;</Token>],{'\n'}
          {'    '}<Token type="string">&apos;requests_sec&apos;</Token>: [<Token type="string">&apos;mean&apos;</Token>, <Token type="string">&apos;sum&apos;</Token>]{'\n'}
          ){'\n'}
          <Token type="function">display</Token>(<Token type="variable">summary</Token>.<Token type="function">round</Token>(<Token type="number">2</Token>))
        </div>
      </CodeCell>

      {/* Output for cell 3 */}
      <OutputCell>
        <div className="overflow-x-auto">
          <table className="font-mono text-[10px]">
            <thead>
              <tr style={{ color: '#9B99B8', background: '#2E2F5A' }}>
                <th className="text-left px-2 py-1">metric</th>
                <th className="text-right px-2 py-1">mean</th>
                <th className="text-right px-2 py-1">std</th>
                <th className="text-right px-2 py-1">max</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['latency_ms', '42.3', '18.7', '312.0'],
                ['requests_sec', '128.5', '45.2', '892.0'],
              ].map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#22234A' : 'transparent' }}>
                  {row.map((cell, j) => (
                    <td key={j} className={`px-2 py-1 ${j > 0 ? 'text-right' : 'text-text-primary'}`} style={{ color: j > 0 ? '#ABB2BF' : '#E8E6F0' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OutputCell>

      {/* Cell 4 — Code: visualization */}
      <CodeCell cellNum={3}>
        <div className="font-mono text-xs leading-relaxed">
          <Token type="keyword">import</Token> <Token type="variable">matplotlib.pyplot</Token> <Token type="keyword">as</Token> <Token type="variable">plt</Token>{'\n'}{'\n'}
          <Token type="variable">fig</Token>, <Token type="variable">ax</Token> = <Token type="variable">plt</Token>.<Token type="function">subplots</Token>(<Token type="number">1</Token>, <Token type="number">1</Token>, figsize=(<Token type="number">10</Token>, <Token type="number">4</Token>)){'\n'}
          <Token type="variable">ax</Token>.<Token type="function">plot</Token>(<Token type="variable">df</Token>[<Token type="string">&apos;timestamp&apos;</Token>], <Token type="variable">df</Token>[<Token type="string">&apos;latency_ms&apos;</Token>], color=<Token type="string">&apos;#D4A853&apos;</Token>, linewidth=<Token type="number">0.8</Token>){'\n'}
          <Token type="variable">ax</Token>.<Token type="function">set_title</Token>(<Token type="string">f&apos;Latency: {node.label}&apos;</Token>, fontsize=<Token type="number">11</Token>){'\n'}
          <Token type="variable">ax</Token>.<Token type="function">set_ylabel</Token>(<Token type="string">&apos;Latency (ms)&apos;</Token>){'\n'}
          <Token type="variable">plt</Token>.<Token type="function">show</Token>()
        </div>
      </CodeCell>

      {/* Output for cell 4 */}
      <OutputCell>
        <div
          className="w-full h-20 rounded flex items-center justify-center font-mono text-[10px]"
          style={{ background: 'rgba(212,168,83,0.05)', border: '1px dashed rgba(212,168,83,0.2)' }}
        >
          <span className="text-text-tertiary">[matplotlib figure: latency time series]</span>
        </div>
      </OutputCell>
    </div>
  );
}

function CodeCell({ cellNum, children }: { cellNum: number; children: React.ReactNode }) {
  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ border: '1px solid rgba(74,75,130,0.4)' }}
    >
      {/* Language badge */}
      <div className="flex items-center justify-between px-3 py-1" style={{ background: '#1A1B3A' }}>
        <span className="font-mono text-[9px] text-text-tertiary">In [{cellNum}]</span>
        <span className="font-mono text-[8px] text-text-tertiary uppercase">python</span>
      </div>
      {/* Code area */}
      <div className="flex">
        <div className="w-8 flex-shrink-0 py-3 text-right pr-2 select-none" style={{ background: '#131428' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div key={n} className="font-mono text-[9px] text-text-tertiary leading-relaxed">{n}</div>
          ))}
        </div>
        <div className="flex-1 p-3" style={{ background: '#131428' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function OutputCell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-3 rounded-b-md -mt-3 mb-1"
      style={{ borderTop: '1px solid rgba(74,75,130,0.3)', background: 'rgba(26,27,58,0.5)' }}
    >
      <span className="font-mono text-[8px] text-text-tertiary uppercase block mb-1">Out</span>
      {children}
    </div>
  );
}
