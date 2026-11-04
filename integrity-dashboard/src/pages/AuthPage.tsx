import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Key } from 'lucide-react';
import { userapi, UserApiError } from '../services/userapi';
import { useDashboard } from '../context/DashboardContext';
import { GOOGLE_CLIENT_ID } from '../config';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { connectWallet } = useDashboard();
  const gsiInitialized = useRef(false);

  useEffect(() => {
    // 1. Check if URL has ?code= from an OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setLoading(true);
      const redirectUri = window.location.origin + window.location.pathname;
      userapi.loginWithGoogle({ code, redirect_uri: redirectUri })
        .then(() => navigate('/dashboard'))
        .catch((err: any) => setError(err?.message || 'Failed to authenticate with Google'))
        .finally(() => setLoading(false));
      return;
    }

    // 2. Initialize Google Identity Services if available (only once)
    const initGsi = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id || !GOOGLE_CLIENT_ID || gsiInitialized.current) return;
      gsiInitialized.current = true;

      try {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) return;
            setLoading(true);
            setError(null);
            try {
              await userapi.loginWithGoogle({ id_token: response.credential });
              navigate('/dashboard');
            } catch (err: any) {
              setError(err?.message || 'Google authentication failed');
            } finally {
              setLoading(false);
            }
          },
        });

        const container = document.getElementById('google-signin-container');
        if (container) {
          google.accounts.id.renderButton(container, {
            theme: 'filled_black',
            size: 'large',
            width: 400,
            text: 'continue_with',
            shape: 'rectangular',
          });
        }
      } catch (e) {
        console.warn('Google Identity Services init warning:', e);
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(timer);
          initGsi();
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) await userapi.login(email, password);
      else await userapi.register(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof UserApiError) {
        if (err.status === 401) setError('Invalid email or password. If this is a new account, choose Create Account first.');
        else if (err.status === 429) setError('Too many sign-in attempts. Wait briefly and try again.');
        else if (err.status >= 500) setError('The account service returned an internal error. Try again shortly.');
        else setError(err.message);
      } else {
        setError('Authentication service is unreachable. Check that UserAPI is running on port 8090.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWalletAuth = async () => {
    const connected = await connectWallet();
    if (connected) navigate('/dashboard');
  };

  const handleGoogleAuth = () => {
    setError(null);
    const google = (window as any).google;
    if (google?.accounts?.oauth2) {
      const client = google.accounts.oauth2.initCodeClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: async (resp: { code?: string; error?: string }) => {
          if (resp.code) {
            setLoading(true);
            try {
              await userapi.loginWithGoogle({ code: resp.code, redirect_uri: 'postmessage' });
              navigate('/dashboard');
            } catch (err: any) {
              setError(err?.message || 'Google authentication failed');
            } finally {
              setLoading(false);
            }
          } else if (resp.error) {
            setError(`Google sign-in canceled: ${resp.error}`);
          }
        },
      });
      client.requestCode();
      return;
    }
    if (google?.accounts?.id) {
      google.accounts.id.prompt();
      return;
    }
    // Fallback: full redirect to Google OAuth
    const redirectUri = window.location.origin + '/auth';
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return (
    <div className="auth-page" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      {/* Left side: Brand/Visual */}
      <div className="auth-brand-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', background: 'var(--surface-color)', borderRight: '1px solid var(--border-color)' }}>
        <img src="/logo.png" alt="Xibalba Solutions" style={{ height: '48px', alignSelf: 'flex-start', marginBottom: 'auto' }} />
        <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontFamily: 'Raleway, sans-serif' }}>Access the Agentic Economy.</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '500px', lineHeight: 1.6 }}>
            Sign in to manage your sovereign hardware endpoints, view protocol telemetry, and direct capital flow.
          </p>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="auth-form-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            {isLogin ? 'Enter your credentials to access the platform.' : 'Register to get started with Integrity Protocol.'}
          </p>

          {/* Social Auth Providers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            <div id="google-signin-container" style={{ width: '100%', minHeight: '44px', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="secondary-button"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: '#222',
                  color: '#fff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleWalletAuth}
              disabled={loading}
              className="secondary-button"
              style={{
                width: '100%',
                padding: '0.85rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.75rem',
                background: '#333',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              <Key size={18} />
              <span>Continue with Web3 Wallet</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label htmlFor="auth-email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
              <input id="auth-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} placeholder="john@example.com" />
            </div>
            <div>
              <label htmlFor="auth-password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
              <input id="auth-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} placeholder="••••••••" />
            </div>
            {error && <div style={{ color: 'var(--danger, #f44336)', fontSize: '0.85rem' }}>{error}</div>}
            <button type="submit" disabled={loading} className="primary-button" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? 'Working…' : isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
