import React, { useEffect, useId, useState } from 'react';

let mermaidReady: Promise<(typeof import('mermaid'))['default']> | null = null;

function loadMermaid() {
  if (!mermaidReady) {
    mermaidReady = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'Inter, system-ui, sans-serif',
        themeVariables: {
          darkMode: true,
          background: '#090d16',
          primaryColor: '#1e293b',
          primaryTextColor: '#f8fafc',
          primaryBorderColor: '#334155',
          lineColor: '#64748b',
          secondaryColor: '#0f172a',
          tertiaryColor: '#1e293b',
        },
      });
      return mermaid;
    });
  }
  return mermaidReady;
}

export interface MermaidDiagramProps {
  source: string;
  className?: string;
  title?: string;
  description?: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  source,
  className = '',
  title,
  description,
}) => {
  const reactId = useId();
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setSvg('');
    setError('');

    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        setError('Diagram rendering timed out.');
      }
    }, 8000);

    const render = async () => {
      try {
        const mermaid = await loadMermaid();
        const id = `diagram-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}-${Math.random().toString(36).slice(2, 6)}`;
        const result = await mermaid.render(id, source);
        if (!cancelled) {
          window.clearTimeout(timeout);
          setSvg(result.svg);
        }
      } catch (reason) {
        if (!cancelled) {
          window.clearTimeout(timeout);
          setError(reason instanceof Error ? reason.message : 'Unable to render diagram');
        }
      }
    };

    render();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [reactId, source]);

  if (error) {
    return (
      <div className="border border-rose-900/40 bg-rose-950/20 p-4 text-xs font-mono text-rose-300">
        <div>Failed to render diagram: {error}</div>
        <pre className="mt-2 overflow-x-auto text-[11px] text-slate-400">{source}</pre>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto border border-slate-800/80 bg-slate-950/70 p-5 ${className}`}>
      {title && (
        <div className="mb-1 text-sm font-semibold text-white">
          {title}
        </div>
      )}
      {description && (
        <div className="mb-4 text-xs text-slate-400 leading-relaxed">
          {description}
        </div>
      )}
      {!svg ? (
        <div className="flex items-center justify-center p-8 text-xs text-slate-500 font-mono">
          Rendering diagram...
        </div>
      ) : (
        <div
          className="mermaid-svg-container flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  );
};
