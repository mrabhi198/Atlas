import React, { useState } from 'react';
import { Shield, Mail, Key } from 'lucide-react';

export default function ForgotPassword({ onNavigateToLogin }) {
  const [email, setEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
      } else {
        setErrorMsg(data.error || 'Failed to dispatch reset key.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to connect to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-panel glass-panel fade-in" style={{ maxWidth: '440px' }}>
      <div className="onboarding-header">
        <Shield className="neon-purple" size={32} />
        <h2>Protocol Recovery</h2>
        <p>Recover system access credentials via registered node email</p>
      </div>

      {errorMsg && (
        <div className="admin-alert error font-mono" style={{ fontSize: '11px', marginBottom: '16px' }}>
          {errorMsg}
        </div>
      )}

      {successMsg ? (
        <div className="text-center">
          <div className="admin-alert success font-mono" style={{ fontSize: '12px', marginBottom: '24px', lineHeight: '1.6' }}>
            ✓ {successMsg}
          </div>
          <button onClick={onNavigateToLogin} className="neon-btn accent font-sans w-full">
            Proceed to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="credentials-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>REGISTERED EMAIL ADDRESS</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} />
              <input
                type="email"
                required
                placeholder="dev@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="tech-input font-mono"
                style={{ paddingLeft: '36px', textTransform: 'none', background: '#020204' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="neon-btn accent font-sans w-full"
            style={{ padding: '12px', height: 'auto', textShadow: 'none' }}
          >
            {isLoading ? 'DISPATCHING TOKEN...' : 'DISPATCH PASSWORD RESET LINK'}
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
