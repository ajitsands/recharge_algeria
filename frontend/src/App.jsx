import React, { useState, useEffect } from 'react';
import { localizedText } from './i18n';
import AlgerianArtHeader from './components/AlgerianArtHeader';
import AdminPortal from './components/AdminPortal';
import DealerMobileApp from './components/DealerMobileApp';
import CollectionAgentWebApp from './components/CollectionAgentWebApp';
import MobileAccessQRModal from './components/MobileAccessQRModal';
import PoweredByProfileModal from './components/PoweredByProfileModal';
import { translations } from './i18n';
import { api } from './api';

const AUTH_SESSION_KEY = 'razik_auth_session';

function readAuthSession() {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(AUTH_SESSION_KEY);
    if (!saved) return null;

    const session = JSON.parse(saved);
    const [payload] = String(session.token || '').split('.');
    const claims = payload ? JSON.parse(atob(payload)) : null;
    if (!session.user || !claims?.exp || claims.exp <= Date.now() / 1000) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
    return session;
  } catch (error) {
    console.warn('Could not restore the saved sign-in session:', error);
    localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export default function App() {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const mobileMode = searchParams?.get('mode') || searchParams?.get('view');
  const isCollectionAgentMode = mobileMode === 'collection-agent';
  const isDirectMobile = mobileMode === 'mobile' || isCollectionAgentMode;

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
      if (saved === 'ar' || saved === 'en' || saved === 'fr') return saved;
    }
    return 'en';
  });
  const [branding, setBranding] = useState({ company_name: '', company_logo: '' });

  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('razik_app_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'light';
  });

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [companyProfileOpen, setCompanyProfileOpen] = useState(false);
  const [authSession, setAuthSession] = useState(readAuthSession);

  useEffect(() => {
    let active = true;
    api.getSettings()
      .then((result) => {
        if (!active) return;
        if (!result.success || !result.settings) {
          console.error('Could not load company branding settings:', result.error || 'Invalid settings response');
          return;
        }
        setBranding({
          company_name: result.settings.company_name || '',
          company_logo: result.settings.company_logo || ''
        });
      })
      .catch((error) => {
        console.error('Could not load company branding settings:', error);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleBrandingChange = (settings) => {
    setBranding((previous) => {
      const company_name = settings.company_name || '';
      const company_logo = settings.company_logo || '';
      if (previous.company_name === company_name && previous.company_logo === company_logo) return previous;
      return { company_name, company_logo };
    });
  };

  const handleLogin = (session) => {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    setAuthSession(session);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    setAuthSession(null);
  };

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

  const openMobileMode = (nextMode) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('mode', nextMode);
    url.searchParams.delete('view');
    window.location.assign(url.toString());
  };

  const t = translations[lang] || translations.ar;
  const companyName = branding.company_name || t.appName;

  useEffect(() => {
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-theme', theme);
  }, [lang, theme, t.dir]);

  useEffect(() => {
    document.title = `${companyName} | ${t.appSubtitle}`;
  }, [companyName, t.appSubtitle]);

  // If accessed directly on smartphone or preview link (?mode=mobile)
  if (isDirectMobile) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        width: '100%', 
        backgroundColor: theme === 'dark' ? '#0f172a' : '#f1f5f9', 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 0,
        margin: 0
      }}>
        {isCollectionAgentMode ? (
          <CollectionAgentWebApp
            lang={lang}
            setLang={setLang}
            companyName={companyName}
            companyLogo={branding.company_logo}
            onBack={() => openMobileMode('mobile')}
          />
        ) : (
          <DealerMobileApp
            t={t}
            lang={lang}
            theme={theme}
            setLang={setLang}
            setTheme={setTheme}
            onOpenQrModal={() => setQrModalOpen(true)}
            isDirectMobile={true}
            companyName={companyName}
            companyLogo={branding.company_logo}
          />
        )}

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
        companyName={companyName}
        companyLogo={branding.company_logo}
        onOpenQrModal={() => setQrModalOpen(true)}
        currentUser={authSession?.user || null}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Main Workspace (100% Full Viewport Width) */}
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
        {mode === 'admin' ? (
          <AdminPortal
            t={t}
            lang={lang}
            theme={theme}
            onOpenQrModal={() => setQrModalOpen(true)}
            currentUser={authSession?.user || null}
            authToken={authSession?.token || null}
            onBrandingChange={handleBrandingChange}
          />
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
              companyName={companyName}
              companyLogo={branding.company_logo}
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
          <span>© {new Date().getFullYear()} {companyName}</span>
          <span>•</span>
          <span>{localizedText(lang, 'منصة توزيع رصيد الهاتف النقال والخدمات الرقمية للمتعاملين الثلاثة', 'Telecom Credit & Multi-Service Distribution Platform')}</span>
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
            {localizedText(lang, '📱 فتح تطبيق الهاتف (QR Scan)', '📱 Open Mobile App (QR Scan)')}
          </button>
          <span>•</span>
          <button
            onClick={() => setCompanyProfileOpen(true)}
            style={{
              padding: 0,
              border: 'none',
              background: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12px',
              letterSpacing: '0.2px'
            }}
          >
            Powered By SaNDS Lab Middle East W.L.L
          </button>
        </div>
      </footer>

      {/* QR Code Modal Popup for Smartphone Access */}
      <MobileAccessQRModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        lang={lang}
      />
      <PoweredByProfileModal
        open={companyProfileOpen}
        onClose={() => setCompanyProfileOpen(false)}
      />
    </div>
  );
}
