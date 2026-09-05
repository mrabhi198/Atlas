import React, { useState, useEffect } from 'react';
import { Shield, Lock } from 'lucide-react';
import { apiFetch } from '../../api/client';
import { Button, Field, Alert, PasswordStrength } from '../../components/shared';

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

  return (
    <div className="onboarding-panel glass-panel fade-in" style={{ maxWidth: '440px' }}>
      <div className="onboarding-header">
        <Shield className="neon-purple" size={32} />
        <h2>Signature Reset</h2>
        <p>Define new secure decryption passcode for your developer node</p>
      </div>

      {errorMsg && (
        <Alert variant="danger" className="font-mono" style={{ fontSize: '11px', marginBottom: '16px', wordBreak: 'break-all' }}>
          {errorMsg}
        </Alert>
      )}

      {successMsg ? (
        <div className="text-center">
          <Alert variant="success" className="font-mono" style={{ fontSize: '12px', marginBottom: '24px', lineHeight: '1.6' }}>
            ✓ {successMsg}
          </Alert>
          <Button onClick={onNavigateToLogin} variant="accent" block className="font-sans">
            Proceed to Sign In
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="credentials-form" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field
            label="NEW PASSWORD"
            required
            className="font-mono"
            icon={<Lock size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} aria-hidden="true" />}
            type="password"
            disabled={!token}
            placeholder="Min 10 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            style={{ paddingLeft: '36px', background: '#020204' }}
          />

          <Field
            label="CONFIRM NEW PASSWORD"
            required
            className="font-mono"
            icon={<Lock size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} aria-hidden="true" />}
            type="password"
            disabled={!token}
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            style={{ paddingLeft: '36px', background: '#020204' }}
          />

          {/* Password Strength Meter */}
          <PasswordStrength score={strengthScore} criteria={passwordCriteria} />

          <Button
            type="submit"
            variant="accent"
            block
            disabled={!token}
            loading={isLoading}
            className="font-sans"
            style={{ padding: '12px', height: 'auto', textShadow: 'none', marginTop: '6px' }}
          >
            {isLoading ? 'ENCRYPTING PASSWORDS...' : 'COMMIT PASSWORD RESET'}
          </Button>

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