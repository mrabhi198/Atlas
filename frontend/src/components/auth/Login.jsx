import React, { useState } from 'react';
import { Shield, Key, Mail, Lock, User, Cpu } from 'lucide-react';

export default function Login({ 
  onLoginSuccess, 
  onNavigateToRegister, 
  onNavigateToForgot,
  onNavigateToStudentKeypad 
}) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!loginId || !password) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password })
      });

      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data);
      } else {
        if (data.requiresVerification) {
          setErrorMsg(`Email not verified. Please check the backend terminal logs for your verification link, or check your database.`);
        } else {
          setErrorMsg(data.error || 'Authentication failed.');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Ecosystem Server offline. Verify backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    setIsLoading(true);
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
    window.location.href = `${backendUrl}/auth/${provider}`;
  };

  return (
    <div className="onboarding-panel glass-panel fade-in" style={{ maxWidth: '440px' }}>
      <div className="onboarding-header">
        <Shield className="neon-purple" size={32} />
        <h2>Atlas: Access Portal</h2>
        <p>Authenticate developer nodes or initialize candidates</p>
      </div>

      {errorMsg && (
        <div className="admin-alert error font-mono" style={{ fontSize: '11px', marginBottom: '16px', wordBreak: 'break-all' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handlePasswordLogin} className="credentials-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group" style={{ textAlign: 'left' }}>
          <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>EMAIL OR USERNAME</label>
          <div style={{ position: 'relative' }}>
            <Mail size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              required
              placeholder="Enter email or username"
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              className="tech-input font-mono"
              style={{ paddingLeft: '36px', textTransform: 'none', background: '#020204' }}
            />
          </div>
        </div>

        <div className="form-group" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <label className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>PASSWORD</label>
            <button 
              type="button" 
              onClick={onNavigateToForgot}
              className="font-mono" 
              style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', fontSize: '10px', cursor: 'pointer' }}
            >
              FORGOT?
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} />
            <input
              type="password"
              required
              placeholder="Enter secure passcode"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
          {isLoading ? 'DECRYPTING SIGNATURE...' : 'AUTHENTICATE SESSION'}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)' }} />
        <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)' }}>OR FEDERATE VIA</span>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)' }} />
      </div>

      {/* OAuth Grid */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => handleOAuthLogin('google')} 
          className="neon-btn secondary font-mono"
          style={{ flex: 1, padding: '10px', fontSize: '11px', textShadow: 'none', height: 'auto' }}
        >
          Google
        </button>
        <button 
          onClick={() => handleOAuthLogin('github')} 
          className="neon-btn secondary font-mono"
          style={{ flex: 1, padding: '10px', fontSize: '11px', textShadow: 'none', height: 'auto' }}
        >
          GitHub
        </button>
      </div>

      {/* Bottom Switch Links */}
      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
        <button 
          onClick={onNavigateToRegister} 
          className="font-mono"
          style={{ background: 'none', border: 'none', color: '#00f0ff', fontSize: '11px', cursor: 'pointer', textAlign: 'center', textShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }}
        >
          CREATE NEW ACCOUNT [SIGN UP]
        </button>
        <button 
          onClick={onNavigateToStudentKeypad} 
          className="font-mono"
          style={{ background: 'none', border: 'none', color: '#a0a0b0', fontSize: '10px', cursor: 'pointer', textAlign: 'center', transition: 'color 0.2s' }}
          onMouseEnter={(e) => e.target.style.color = '#ffffff'}
          onMouseLeave={(e) => e.target.style.color = '#a0a0b0'}
        >
          BYPASS LOGIN WITH ACCESS KEYPAD
        </button>
      </div>
    </div>
  );
}
