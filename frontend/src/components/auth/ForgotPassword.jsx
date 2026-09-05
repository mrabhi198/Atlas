import React, { useState } from 'react';
import { Shield, Mail } from 'lucide-react';
import { apiFetch } from '../../api/client';
import { Button, Field, Alert } from '../../components/shared';

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
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
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
        <Alert variant="danger" className="font-mono" style={{ fontSize: '11px', marginBottom: '16px' }}>
          {errorMsg}
        </Alert>
      )}

      {successMsg ? (
        <div className="text-center">
          <Alert variant="success" className="font-mono" style={{ fontSize: '12px', marginBottom: '24px', lineHeight: '1.6' }}>
            ✓ {successMsg}
          </Alert>
          <Button onClick={onNavigateToLogin} variant="accent" block className="font-sans">
            Proceed to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="credentials-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field
            label="REGISTERED EMAIL ADDRESS"
            required
            className="font-mono"
            icon={<Mail size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} aria-hidden="true" />}
            type="email"
            placeholder="dev@domain.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
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
            {isLoading ? 'DISPATCHING TOKEN...' : 'DISPATCH PASSWORD RESET LINK'}
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