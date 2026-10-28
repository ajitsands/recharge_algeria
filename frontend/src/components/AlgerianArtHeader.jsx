import React, { useState, useEffect } from 'react';
import { Globe, Moon, Sun, Smartphone, Monitor, Database, Clock } from 'lucide-react';

export default function AlgerianArtHeader({ 
  currentMode, 
  setMode, 
  lang, 
  setLang, 
  theme, 
  setTheme, 
  t,
  onOpenQrModal
}) {
  const [time, setTime] = useState('');

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
    </header>
  );
}
