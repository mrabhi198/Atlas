import React, { useState } from 'react';
import { Shield, Mail, Lock } from 'lucide-react';
import { apiFetch, apiUrl } from '../../api/client';
import { Button, Field, Alert } from '../../components/shared';

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
      const res = await apiFetch('/auth/login', {
        method: 'POST',
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
    window.location.href = apiUrl(`/auth/${provider}`);
  };

  return (
    <div className="onboarding-panel glass-panel fade-in" style={{ maxWidth: '440px' }}>
      <div className="onboarding-header">
        <Shield className="neon-purple" size={32} />
        <h2>Atlas: Access Portal</h2>
        <p>Authenticate developer nodes or initialize candidates</p>
      </div>

      {errorMsg && (
        <Alert variant="danger" className="font-mono" style={{ fontSize: '11px', marginBottom: '16px' }}>
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handlePasswordLogin} className="credentials-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Field
          label="EMAIL OR USERNAME"
          required
          className="font-mono"
          icon={<Mail size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} aria-hidden="true" />}
          type="text"
          placeholder="Enter email or username"
          value={loginId}
          onChange={e => setLoginId(e.target.value)}
          autoComplete="email"
          style={{ paddingLeft: '36px', background: '#020204' }}
        />

        <Field
          label={
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>PASSWORD</span>
              <button 
                type="button" 
                onClick={onNavigateToForgot}
                className="font-mono" 
                style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', fontSize: '10px', cursor: 'pointer' }}
              >
                FORGOT?
              </button>
            </span>
          }
          required
          className="font-mono"
          icon={<Lock size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} aria-hidden="true" />}
          type="password"
          placeholder="Enter secure passcode"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          style={{ paddingLeft: '36px', background: '#020204' }}
        />

        <Button
          type="submit"
          variant="accent"
          block
          loading={isLoading}
          className="font-sans"
          style={{ padding: '12px', height: 'auto', textShadow: 'none' }}
        >
          {isLoading ? 'DECRYPTING SIGNATURE...' : 'AUTHENTICATE SESSION'}
        </Button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)' }} />
        <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)' }}>OR FEDERATE VIA</span>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)' }} />
      </div>

      {/* OAuth Grid */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button 
          onClick={() => handleOAuthLogin('google')} 
          variant="secondary"
          disabled={isLoading}
          className="font-mono"
          style={{ flex: 1, padding: '10px', fontSize: '11px', textShadow: 'none', height: 'auto' }}
        >
          Google
        </Button>
        <Button 
          onClick={() => handleOAuthLogin('github')} 
          variant="secondary"
          disabled={isLoading}
          className="font-mono"
          style={{ flex: 1, padding: '10px', fontSize: '11px', textShadow: 'none', height: 'auto' }}
        >
          GitHub
        </Button>
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