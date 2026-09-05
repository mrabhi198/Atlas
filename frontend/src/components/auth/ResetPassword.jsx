import React, { useState, useEffect } from 'react';
import { Shield, Key, Lock, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '../../api/client';

export default function ResetPassword({ onNavigateToLogin }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });
  const [strengthScore, setStrengthScore] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getHashParam = (name) => {
      const hash = window.location.hash;
      const index = hash.indexOf('?');
      if (index === -1) return null;
      const params = new URLSearchParams(hash.slice(index));
      return params.get(name);
    };

    const t = getHashParam('token');
    if (!t) {
      setErrorMsg('Required token signature is missing in this URL path.');
    } else {
      setToken(t);
    }
  }, []);

  // Real-time strength meter
  useEffect(() => {
    const criteria = {
      length: password.length >= 10,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };
    setPasswordCriteria(criteria);

    const score = Object.values(criteria).filter(Boolean).length;
    setStrengthScore(score);
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || isLoading) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (strengthScore < 5) {
      setErrorMsg('Password does not satisfy all core complexity guardrails.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(data.error || 'Failed to update password.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Ecosystem reset service offline.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthLabel = () => {
    if (strengthScore === 0) return { text: 'EMPTY', color: 'var(--text-dim)' };
    if (strengthScore <= 2) return { text: 'WEAK / COMPROMISED', color: 'var(--neon-red)' };
    if (strengthScore <= 4) return { text: 'MEDIUM COMPLEXITY', color: 'var(--neon-yellow)' };
    return { text: 'SECURE / STRONG', color: 'var(--neon-lime)' };
  };

  const labelMeta = getStrengthLabel();

  return (
    <div className="onboarding-panel glass-panel fade-in" style={{ maxWidth: '440px' }}>
      <div className="onboarding-header">
        <Shield className="neon-purple" size={32} />
        <h2>Signature Reset</h2>
        <p>Define new secure decryption passcode for your developer node</p>
      </div>

      {errorMsg && (
        <div className="admin-alert error font-mono" style={{ fontSize: '11px', marginBottom: '16px', wordBreak: 'break-all' }}>
          {errorMsg}
        </div>
      )}

      {successMsg ? (
        <div className="text-center">
          <div className="admin-alert success font-mono" style={{ fontSize: '12px', marginBottom: '24px', lineHeight: '1.6' }}>
            ✓ {successMsg}
          </div>
          <button onClick={onNavigateToLogin} className="neon-btn accent font-sans w-full">
            Proceed to Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="credentials-form" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>NEW PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} />
              <input
                type="password"
                required
                disabled={!token}
                placeholder="Min 10 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="tech-input font-mono"
                style={{ paddingLeft: '36px', textTransform: 'none', background: '#020204' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>CONFIRM NEW PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} />
              <input
                type="password"
                required
                disabled={!token}
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="tech-input font-mono"
                style={{ paddingLeft: '36px', textTransform: 'none', background: '#020204' }}
              />
            </div>
          </div>

          {/* Password Strength Meter */}
          <div style={{ textAlign: 'left', background: '#080a12', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '6px' }} className="font-mono">
              <span>SECURITY RATING:</span>
              <span style={{ color: labelMeta.color }}>{labelMeta.text}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '10px' }}>
              {[1, 2, 3, 4, 5].map(stepIndex => (
                <div 
                  key={stepIndex} 
                  style={{ 
                    flex: 1, 
                    borderRadius: '2px',
                    background: stepIndex <= strengthScore ? labelMeta.color : 'rgba(255,255,255,0.05)',
                    transition: 'background 0.3s'
                  }} 
                />
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '9px', color: 'var(--text-dim)' }} className="font-mono">
              <span style={{ color: passwordCriteria.length ? 'var(--neon-lime)' : '' }}>• 10+ Characters</span>
              <span style={{ color: passwordCriteria.upper ? 'var(--neon-lime)' : '' }}>• Uppercase Letter</span>
              <span style={{ color: passwordCriteria.lower ? 'var(--neon-lime)' : '' }}>• Lowercase Letter</span>
              <span style={{ color: passwordCriteria.number ? 'var(--neon-lime)' : '' }}>• Numeric Digit</span>
              <span style={{ color: passwordCriteria.special ? 'var(--neon-lime)' : '' }}>• Special Symbol (@$!%*?&)</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !token}
            className="neon-btn accent font-sans w-full"
            style={{ padding: '12px', height: 'auto', textShadow: 'none', marginTop: '6px' }}
          >
            {isLoading ? 'ENCRYPTING PASSWORDS...' : 'COMMIT PASSWORD RESET'}
          </button>

          <button 
            type="button" 
            onClick={onNavigateToLogin} 
            className="font-mono"
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '10px', cursor: 'pointer', marginTop: '10px' }}
          >
            RETURN TO SIGN IN
          </button>
        </form>
      )}
    </div>
  );
}
