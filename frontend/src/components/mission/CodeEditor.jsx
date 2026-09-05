import React, { useMemo, useRef } from 'react';
import hljs from 'highlight.js';
import { Lock } from 'lucide-react';

const INDENT = '    ';

function escapeHtml(text) {
  return text.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// Native-textarea code editor with a syntax-highlight overlay. The textarea is the
// single scroll owner; the highlight backdrop and the line-number gutter are
// mirrored via transforms on scroll so long files stay aligned without
// re-rendering on every scroll tick.
export default function CodeEditor({ code, onChange, readOnly, fileName, onRun, runDisabled }) {
  const areaRef = useRef(null);
  const gutterRef = useRef(null);
  const highlightRef = useRef(null);

  const lineCount = useMemo(() => code.split('\n').length, [code]);
  const lineNumbers = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);

  const highlighted = useMemo(() => {
    if (!code) return '';
    try {
      return hljs.highlight(code, { language: 'kotlin', ignoreIllegals: true }).value;
    } catch {
      return escapeHtml(code);
    }
  }, [code]);

  const syncScroll = (e) => {
    const area = e.target;
    if (gutterRef.current) {
      gutterRef.current.style.transform = `translate3d(0, ${-area.scrollTop}px, 0)`;
    }
    if (highlightRef.current) {
      highlightRef.current.style.transform = `translate3d(${-area.scrollLeft}px, ${-area.scrollTop}px, 0)`;
    }
  };

  const commitText = (next, caretStart, caretEnd) => {
    onChange(next);
    requestAnimationFrame(() => {
      const area = areaRef.current;
      if (area) area.setSelectionRange(caretStart, caretEnd);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const area = areaRef.current;
      if (readOnly || !area) return;
      const { selectionStart, selectionEnd, value } = area;

      if (!e.shiftKey) {
        commitText(
          value.slice(0, selectionStart) + INDENT + value.slice(selectionEnd),
          selectionStart + INDENT.length,
          selectionEnd + INDENT.length
        );
        return;
      }

      // Shift+Tab: remove up to one indent from every line touched by the selection.
      const lines = value.split('\n');
      const startLine = value.slice(0, selectionStart).split('\n').length - 1;
      const endLine = value.slice(0, selectionEnd).split('\n').length - 1;
      for (let i = startLine; i <= endLine; i++) {
        const match = lines[i].match(/^ {1,4}/);
        if (match) lines[i] = lines[i].slice(match[0].length);
      }
      commitText(lines.join('\n'), Math.max(0, selectionStart - 4), Math.max(0, selectionEnd - 4));
      return;
    }

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!readOnly && !runDisabled && onRun) onRun();
    }
  };

  return (
    <div className="editor-surface">
      <textarea
        ref={areaRef}
        className="code-textarea"
        value={code}
        onChange={e => onChange(e.target.value)}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        spellCheck="false"
        autoComplete="off"
        wrap="off"
        aria-label={`Code editor${readOnly ? ' (read only)' : ''}: ${fileName}`}
      />
      <pre ref={highlightRef} className="code-highlight hljs" aria-hidden="true">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
      <div ref={gutterRef} className="line-numbers" aria-hidden="true">
        {lineNumbers.map(n => <div key={n}>{n}</div>)}
      </div>
      {readOnly && (
        <div className="editor-readonly-tag" aria-hidden="true">
          <Lock size={11} /> READ ONLY
        </div>
      )}
    </div>
  );
}