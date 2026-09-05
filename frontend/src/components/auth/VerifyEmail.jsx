import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../api/client';
import { Button, Field, Alert } from '../../components/shared';

export default function VerifyEmail({ onNavigateToLogin }) {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    // Get token from URL hash path (e.g. #verify-email?token=xyz)
    const getHashParam = (name) => {
      const hash = window.location.hash;
      const index = hash.indexOf('?');
      if (index === -1) return null;
      const params = new URLSearchParams(hash.slice(index));
      return params.get(name);
    };

    const token = getHashParam('token');
    if (!token) {
      setStatus('error');
      setErrorMsg('Security token missing from request payload.');
      return;
    }

    const verify = async () => {
      try {
        const res = await apiFetch('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token })
        });

        const data = await res.json();
        if (res.ok) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMsg(data.error || 'Token verification rejected.');
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
        setErrorMsg('Failed to establish contact with authentication node.');
      }
    };

    verify();
  }, []);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResendLoading(true);
    setResendSuccess('');
    setErrorMsg('');

    try {
      const res = await apiFetch('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: resendEmail })
      });

      const data = await res.json();
      if (res.ok) {
        setResendSuccess(data.message);
        setResendEmail('');
      } else {
        setErrorMsg(data.error || 'Failed to dispatch new token.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Verification dispatcher offline.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="onboarding-panel glass-panel text-center fade-in" style={{ maxWidth: '440px' }}>
      <div className="onboarding-header">
        <Shield className="neon-purple" size={32} style={{ margin: '0 auto' }} />
        <h2>Developer Node Verification</h2>
      </div>

      {status === 'verifying' && (
        <div style={{ padding: '30px 0' }}>
          <RefreshCw className="spin neon-cyan" size={32} style={{ margin: '0 auto 16px' }} />
          <p className="font-mono text-sm">Decryption in progress... Validating signature tokens.</p>
        </div>
      )}

      {status === 'success' && (
        <div style={{ padding: '20px 0' }}>
          <CheckCircle className="neon-lime" size={48} style={{ margin: '0 auto 16px' }} />
          <Alert variant="success" className="font-mono" style={{ fontSize: '11px', marginBottom: '24px', lineHeight: '1.5' }}>
            ✓ AUTHENTICATION INTEGRITY CONFIRMED. Your developer credentials are now active on the system registry.
          </Alert>
          <Button onClick={onNavigateToLogin} variant="accent" block className="font-sans">
            Proceed to Sign In
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div style={{ padding: '10px 0' }}>
          <XCircle className="neon-red" size={48} style={{ margin: '0 auto 16px' }} />
          <Alert variant="danger" className="font-mono" style={{ fontSize: '11px', marginBottom: '24px', wordBreak: 'break-all' }}>
            ✗ SIGNATURE REJECTED: {errorMsg}
          </Alert>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '20px 0' }} />

          <form onSubmit={handleResend} className="credentials-form" style={{ textAlign: 'left' }}>
            <Field
              label="RESEND VERIFICATION LINK"
              required
              className="font-mono"
              type="email"
              placeholder="Enter registered email"
              value={resendEmail}
              onChange={e => setResendEmail(e.target.value)}
              autoComplete="email"
              style={{ background: '#020204', marginBottom: '14px' }}
            />
            {resendSuccess && (
              <Alert variant="success" className="font-mono" style={{ fontSize: '10px', marginBottom: '12px' }}>
                {resendSuccess}
              </Alert>
            )}
            <Button
              type="submit"
              variant="secondary"
              block
              loading={resendLoading}
              className="font-sans"
              style={{ padding: '10px', height: 'auto', textShadow: 'none' }}
            >
              {resendLoading ? 'DISPATCHING LINK...' : 'DISPATCH NEW LINK'}
            </Button>
          </form>

          <button 
            onClick={onNavigateToLogin} 
            className="font-mono"
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '10px', cursor: 'pointer', marginTop: '20px' }}
          >
            RETURN TO SIGN IN
          </button>
        </div>
      )}
    </div>
  );
}