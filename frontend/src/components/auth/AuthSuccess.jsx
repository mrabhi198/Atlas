import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthSuccess({ onLoginSuccess }) {
  useEffect(() => {
    // Extract tokens from URL
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accessToken');
    const refreshToken = urlParams.get('refreshToken');
    const sessionId = urlParams.get('sessionId');
    const error = urlParams.get('error');

    if (error) {
      window.location.href = `/login?error=${error}`;
      return;
    }

    if (accessToken && refreshToken) {
      // Decode JWT to get user info (basic decode without verification just to populate state)
      try {
        const payloadBase64 = accessToken.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        
        const userData = {
          user: decodedPayload,
          accessToken,
          refreshToken,
          sessionId
        };
        
        onLoginSuccess(userData);
      } catch (e) {
        console.error('Failed to parse token payload', e);
        window.location.href = '/login?error=invalid_token';
      }
    } else {
      window.location.href = '/login?error=missing_tokens';
    }
  }, [onLoginSuccess]);

  return (
    <div className="onboarding-root">
      <div className="subtle-grid"></div>
      <div className="onboarding-panel glass-panel" style={{ textAlign: 'center', maxWidth: '400px' }}>
        <Loader2 className="neon-cyan" size={48} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <h2>Authenticating...</h2>
        <p>Establishing secure link to the Atlas Mesh.</p>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
