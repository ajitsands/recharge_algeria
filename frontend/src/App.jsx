import React, { useState, useEffect } from 'react';
import AlgerianArtHeader from './components/AlgerianArtHeader';
import AdminPortal from './components/AdminPortal';
import DealerMobileApp from './components/DealerMobileApp';
import MobileAccessQRModal from './components/MobileAccessQRModal';
import { translations } from './i18n';

export default function App() {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isDirectMobile = searchParams ? (searchParams.get('mode') === 'mobile' || searchParams.get('view') === 'mobile') : false;

  const [mode, setModeState] = useState(() => {
    if (isDirectMobile) return 'mobile';
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('razik_app_mode');
      if (saved === 'admin' || saved === 'mobile') return saved;
    }
    return 'admin';
  });

  const [lang, setLangState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('razik_app_lang');
      if (saved === 'ar' || saved === 'en') return saved;
    }
    return 'ar';
  });

  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('razik_app_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'light';
  });

  const [qrModalOpen, setQrModalOpen] = useState(false);

  const setMode = (newMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined' && !isDirectMobile) {
      localStorage.setItem('razik_app_mode', newMode);
    }
  };

  const setLang = (newLang) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('razik_app_lang', newLang);
    }
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('razik_app_theme', newTheme);
    }
  };

  const t = translations[lang] || translations.ar;

  useEffect(() => {
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-theme', theme);
  }, [lang, theme, t.dir]);

  // If accessed directly on smartphone or preview link (?mode=mobile)
  if (isDirectMobile) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        width: '100%', 
        backgroundColor: theme === 'dark' ? '#0f172a' : '#e2e8f0', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {/* Helper bar to easily jump back to desktop Admin ERP */}
        <div style={{
          backgroundColor: '#005a2b',
          color: '#ffffff',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12.5px',
          fontWeight: '700',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          zIndex: 99
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📱 {lang === 'ar' ? 'وضع الهاتف الذكي للموزع (Dealer Mobile View)' : 'Dealer Mobile POS View'}</span>
          </div>
          <button
            onClick={() => {
              window.location.href = window.location.origin + window.location.pathname;
            }}
            style={{
              padding: '5px 14px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#005a2b',
              border: 'none',
              fontWeight: '800',
              fontSize: '11.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
            }}
          >
            {lang === 'ar' ? '🖥️ فتح لوحة تحكم الإدارة الكاملة (Desktop Admin ERP)' : '🖥️ Open Desktop Admin ERP'}
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '12px 8px' }}>
          <DealerMobileApp
            t={t}
            lang={lang}
            theme={theme}
            setLang={setLang}
            setTheme={setTheme}
            onOpenQrModal={() => setQrModalOpen(true)}
            isDirectMobile={true}
          />
        </div>

        <MobileAccessQRModal
          open={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          lang={lang}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', margin: 0, padding: 0 }}>
      {/* Enterprise Top Navigation */}
      <AlgerianArtHeader
        currentMode={mode}
        setMode={setMode}
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        t={t}
        onOpenQrModal={() => setQrModalOpen(true)}
      />

      {/* Main Workspace (100% Full Viewport Width) */}
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
        {mode === 'admin' ? (
          <AdminPortal t={t} lang={lang} theme={theme} onOpenQrModal={() => setQrModalOpen(true)} />
        ) : (
          <div style={{ width: '100%', flex: 1, padding: '24px 32px' }}>
            <DealerMobileApp
              t={t}
              lang={lang}
              theme={theme}
              setLang={setLang}
              setTheme={setTheme}
              onOpenQrModal={() => setQrModalOpen(true)}
              isDirectMobile={false}
            />
          </div>
        )}
      </div>

      {/* Full-Width Footer */}
      <footer style={{
        width: '100%',
        padding: '14px 32px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-muted)',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>© {new Date().getFullYear()} {lang === 'ar' ? 'رازيق تليكوم (الجزائر)' : 'Razik Telecom (Algiers, Algeria)'}</span>
          <span>•</span>
          <span>{lang === 'ar' ? 'منصة توزيع رصيد الهاتف النقال والخدمات الرقمية للمتعاملين الثلاثة' : 'Telecom Credit & Multi-Service Distribution Platform'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setQrModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--algeria-green)',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12px',
              textDecoration: 'underline'
            }}
          >
            {lang === 'ar' ? '📱 فتح تطبيق الهاتف (QR Scan)' : '📱 Open Mobile App (QR Scan)'}
          </button>
          <span>•</span>
          <span style={{ fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.2px' }}>
            Powered By SaNDS Lab Middle East W.L.L
          </span>
        </div>
      </footer>

      {/* QR Code Modal Popup for Smartphone Access */}
      <MobileAccessQRModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
