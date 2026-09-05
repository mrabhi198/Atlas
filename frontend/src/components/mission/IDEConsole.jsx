import React, { useEffect, useRef } from 'react';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';

const STATE_META = {
  idle: { label: 'IDLE', className: '' },
  running: { label: 'EXECUTING', className: 'active' },
  success: { label: 'SUCCESS', className: 'success' },
  failed: { label: 'FAILED', className: 'failed' },
  api_error: { label: 'CONNECTION ERROR', className: 'error' }
};

function classifyLine(log) {
  if (log.includes('FAILED') || log.includes('Error') || log.includes('ERROR') || log.includes('❌')) return 'error';
  if (log.includes('PASS') || log.includes('SUCCESS')) return 'success';
  if (log.includes('BUILD SUCCESSFUL')) return 'success';
  if (log.includes('BUILD FAILED')) return 'error';
  if (/^\[(BENCHMARK|ERROR|CONNECTION)\]/.test(log.trim())) return 'benchmark';
  return '';
}

export default function IDEConsole({ logs, state, collapsed, onToggleCollapse }) {
  const scrollerRef = useRef(null);
  const meta = STATE_META[state] || STATE_META.idle;

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <footer className="ide-console glass-panel">
      <div className="ide-console__header">
        <div className="ide-console__title">
          <Terminal size={14} className="neon-cyan" aria-hidden="true" />
          <span>EXECUTION CONSOLE</span>
        </div>
        <div className="ide-console__status">
          <span className={`indicator-bulb ${meta.className}`} aria-hidden="true" />
          <span className={`ide-console__status-label ${meta.className ? `is-${meta.className}` : ''}`}>
            {meta.label}
          </span>
          <button
            type="button"
            className="ide-console__toggle"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-controls="ide-console-log"
            aria-label="Toggle execution console"
          >
            {collapsed ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div id="ide-console-log" ref={scrollerRef} className="ide-console__log" role="log" aria-live="polite">
          {logs.map((log, index) => {
            const cls = classifyLine(log);
            return (
              <div key={index} className={`ide-console__line ${cls}`}>
                {log || '\u00A0'}
              </div>
            );
          })}
        </div>
      )}
    </footer>
  );
}