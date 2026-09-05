import React from 'react';

export default function PasswordStrength({ score, criteria }) {
  let label;
  if (score === 0) label = { text: 'EMPTY', color: 'var(--text-dim)' };
  else if (score <= 2) label = { text: 'WEAK / COMPROMISED', color: 'var(--neon-red)' };
  else if (score <= 4) label = { text: 'MEDIUM COMPLEXITY', color: 'var(--neon-yellow)' };
  else label = { text: 'SECURE / STRONG', color: 'var(--neon-lime)' };

  return (
    <div style={{ textAlign: 'left', background: '#080a12', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '6px' }} className="font-mono">
        <span>SECURITY RATING:</span>
        <span style={{ color: label.color }}>{label.text}</span>
      </div>

      <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '10px' }} aria-hidden="true">
        {[1, 2, 3, 4, 5].map(stepIndex => (
          <div
            key={stepIndex}
            style={{
              flex: 1,
              borderRadius: '2px',
              background: stepIndex <= score ? label.color : 'rgba(255,255,255,0.05)',
              transition: 'background 0.3s'
            }}
          />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '9px', color: 'var(--text-dim)' }} className="font-mono">
        <span style={{ color: criteria.length ? 'var(--neon-lime)' : '' }}>• 10+ Characters</span>
        <span style={{ color: criteria.upper ? 'var(--neon-lime)' : '' }}>• Uppercase Letter</span>
        <span style={{ color: criteria.lower ? 'var(--neon-lime)' : '' }}>• Lowercase Letter</span>
        <span style={{ color: criteria.number ? 'var(--neon-lime)' : '' }}>• Numeric Digit</span>
        <span style={{ color: criteria.special ? 'var(--neon-lime)' : '' }}>• Special Symbol (@$!%*?&)</span>
      </div>
    </div>
  );
}