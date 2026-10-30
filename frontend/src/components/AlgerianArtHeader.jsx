import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Moon, Sun, Smartphone, Monitor, Database, Clock, LogIn, LogOut, UserRound, X } from 'lucide-react';
import { api } from '../api';

export default function AlgerianArtHeader({ 
  currentMode, 
  setMode, 
  lang, 
  setLang, 
  theme, 
  setTheme, 
  t,
  onOpenQrModal,
  currentUser,
  onLogin,
  onLogout
}) {
  const [time, setTime] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginSubmitting(true);
    setLoginError('');
    try {
      const response = await api.login(credentials);
      if (!response.success) {
        setLoginError(response.error || t.loginFailed);
        return;
      }
      if (!response.token || !response.user) {
        setLoginError(t.loginFailed);
        return;
      }

      onLogin({ token: response.token, user: response.user });
      setCredentials({ username: '', password: '' });
      setLoginOpen(false);
    } catch (error) {
      console.error('Sign-in failed:', error);
      setLoginError(error.message || t.loginFailed);
    } finally {
      setLoginSubmitting(false);
    }
  };

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString(lang === 'ar' ? 'ar-DZ' : 'en-GB', { timeZone: 'Africa/Algiers' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  return (
    <header className="algeria-top-header">
      {/* Algerian Color Ribbon Top Bar */}
      <div style={{ height: '4px', width: '100%', background: 'linear-gradient(90deg, #008744 0%, #ffffff 50%, #d21034 100%)' }} />

      <div style={{ width: '100%', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand & Crest */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)'
          }}>
            {/* Algerian Emblem: Crescent & Star SVG */}
            <svg viewBox="0 0 48 48" style={{ width: '30px', height: '30px' }} xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4C13 4 4 13 4 24s9 20 20 20c3.2 0 6.2-.8 8.8-2.1-1.8.7-3.7 1.1-5.8 1.1-8.8 0-16-7.2-16-16s7.2-16 16-16c2.1 0 4 .4 5.8 1.1C30.2 4.8 27.2 4 24 4z" fill="#ffffff" />
              <polygon points="32,16 34.5,21.5 40.5,22 36,26 37.5,32 32,29 26.5,32 28,26 23.5,22 29.5,21.5" fill="#d21034" />
            </svg>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px', color: '#ffffff' }}>
                {t.appName}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}>
                ALGERIA B2B ERP
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Live Indicators & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          
          {/* Live Clock (Africa/Algiers) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '12px',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            fontFamily: 'monospace',
            fontWeight: '600'
          }}>
            <Clock style={{ width: '14px', height: '14px', color: '#fcd34d' }} />
            <span>{time || 'Africa/Algiers'}</span>
          </div>

          {/* Database Live Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            padding: '6px 14px',
            borderRadius: '10px',
            fontSize: '12px',
            color: '#a7f3d0',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            fontWeight: '600'
          }}>
            <Database style={{ width: '13px', height: '13px', color: '#34d399' }} />
            <span>MySQL 8.0</span>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }} />
          </div>

          {/* Mode Switcher: Admin Portal vs Dealer Mobile App */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            padding: '4px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <button
              id="btn-switch-admin"
              onClick={() => setMode('admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '9px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s',
                backgroundColor: currentMode === 'admin' ? '#ffffff' : 'transparent',
                color: currentMode === 'admin' ? '#005a2b' : 'rgba(255,255,255,0.85)',
                boxShadow: currentMode === 'admin' ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              <Monitor style={{ width: '15px', height: '15px' }} />
              <span>{t.portalTitle}</span>
            </button>

            <button
              id="btn-switch-mobile"
              onClick={onOpenQrModal}
              title={lang === 'ar' ? 'مسح رمز QR لفتح التطبيق على الهاتف' : 'Scan QR to open app on mobile'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '9px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s',
                backgroundColor: currentMode === 'mobile' ? '#f59e0b' : 'rgba(255, 255, 255, 0.12)',
                color: currentMode === 'mobile' ? '#0f172a' : '#ffffff',
                boxShadow: currentMode === 'mobile' ? '0 2px 6px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              <Smartphone style={{ width: '15px', height: '15px' }} />
              <span>{lang === 'ar' ? 'تطبيق الهاتف (QR)' : 'Dealer Mobile App (QR)'}</span>
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '6px',
                backgroundColor: currentMode === 'mobile' ? '#0f172a' : '#008744',
                color: '#ffffff',
                fontWeight: '800'
              }}>
                SCAN
              </span>
            </button>
          </div>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700
              }}>
                <UserRound style={{ width: '15px', height: '15px' }} />
                {currentUser.full_name || currentUser.username}
              </span>
              <button
                id="btn-logout"
                type="button"
                onClick={onLogout}
                style={authButtonStyle}
              >
                <LogOut style={{ width: '14px', height: '14px' }} />
                <span>{t.logout}</span>
              </button>
            </div>
          ) : (
            <button
              id="btn-login"
              type="button"
              onClick={() => {
                setLoginError('');
                setLoginOpen(true);
              }}
              style={authButtonStyle}
            >
              <LogIn style={{ width: '14px', height: '14px' }} />
              <span>{t.login}</span>
            </button>
          )}

          {/* Language Toggle */}
          <button
            id="btn-language-toggle"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Globe style={{ width: '14px', height: '14px' }} />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="btn-theme-toggle"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={{
              padding: '9px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={t.themeToggle}
          >
            {theme === 'light' ? <Moon style={{ width: '16px', height: '16px', color: '#fef08a' }} /> : <Sun style={{ width: '16px', height: '16px', color: '#fcd34d' }} />}
          </button>
        </div>

      </div>

      {loginOpen && createPortal(
        <div
          className="modal-overlay"
          onClick={() => !loginSubmitting && setLoginOpen(false)}
          style={{ zIndex: 100000 }}
        >
          <form
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleLogin}
            style={{ width: 'min(420px, 94vw)', display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px', fontWeight: 800 }}>{t.login}</h2>
              <button
                type="button"
                aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
                onClick={() => setLoginOpen(false)}
                disabled={loginSubmitting}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>
              {t.username} / {t.phone}
              <input
                autoComplete="username"
                required
                value={credentials.username}
                onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
                className="filter-input"
                style={{ display: 'block', width: '100%', marginTop: '6px' }}
              />
            </label>

            <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700 }}>
              {t.password}
              <input
                autoComplete="current-password"
                required
                type="password"
                value={credentials.password}
                onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                className="filter-input"
                style={{ display: 'block', width: '100%', marginTop: '6px' }}
              />
            </label>

            {loginError && (
              <p role="alert" style={{ margin: 0, color: 'var(--algeria-red)', fontSize: '13px', fontWeight: 700 }}>
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginSubmitting}
              style={{
                padding: '12px',
                border: 'none',
                borderRadius: '10px',
                background: 'var(--algeria-green)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 800,
                cursor: loginSubmitting ? 'wait' : 'pointer'
              }}
            >
              {loginSubmitting ? t.signingIn : t.login}
            </button>
          </form>
        </div>,
        document.body
      )}
    </header>
  );
}

const authButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  borderRadius: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};
