import React from 'react';
import { CheckCircle2, Circle, PlayCircle, Code2, Gauge } from 'lucide-react';

const STATUS_META = {
  'not-started': { label: 'NOT STARTED', Icon: Circle, color: 'var(--text-dim)', className: 'not-started' },
  'in-progress': { label: 'IN PROGRESS', Icon: PlayCircle, color: 'var(--neon-cyan)', className: 'in-progress' },
  verified: { label: 'VERIFIED', Icon: CheckCircle2, color: 'var(--neon-green)', className: 'verified' }
};

export default function MissionHeader({ title, difficulty, type, language, status }) {
  const meta = STATUS_META[status] || STATUS_META['not-started'];
  return (
    <header className="mission-header">
      <div className="mission-header__info">
        <h1 className="mission-header__title">
          {title}
        </h1>
        <div className="mission-header__tags">
          <span className="mission-tag mission-tag--difficulty font-mono">{difficulty}</span>
          <span className="mission-tag mission-tag--type font-mono">{type}</span>
          <span className="mission-tag mission-tag--lang font-mono">
            <Code2 size={11} aria-hidden="true" /> {language}
          </span>
        </div>
      </div>

      <div className={`mission-header__status mission-status--${meta.className}`}>
        <meta.Icon size={16} style={{ color: meta.color }} aria-hidden="true" />
        <span style={{ color: meta.color }} className="font-mono">{meta.label}</span>
        {status === 'verified' && (
          <Gauge size={13} style={{ color: 'var(--neon-green)' }} aria-hidden="true" />
        )}
      </div>
    </header>
  );
}