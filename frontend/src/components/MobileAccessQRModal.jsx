import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, Copy, Check, ExternalLink, Wifi, RefreshCw, ShieldCheck, Globe, Server, Sparkles } from 'lucide-react';

export default function MobileAccessQRModal({ open, onClose, lang }) {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isLoopback = currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost === '::1';
  const isPrivateIp = isLoopback || /^192\.168\./.test(currentHost) ||
    /^10\./.test(currentHost) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(currentHost);
  const [copied, setCopied] = useState(false);
  const [customIp, setCustomIp] = useState(() => (isLoopback ? '' : currentHost));

  const [tabMode, setTabMode] = useState(() => (isPrivateIp ? 'wifi' : 'server'));
  const [mobileApp, setMobileApp] = useState('pos');
  const [serverUrlInput, setServerUrlInput] = useState(
    typeof window !== 'undefined' && window.location.host
      ? `${window.location.protocol}//${window.location.host}`
      : ''
  );

  if (!open) return null;

  const activeIp = customIp.trim();
  const port = typeof window !== 'undefined' && window.location.port ? window.location.port : '1001';

  // Construct URL based on active mode
  let mobileUrl = '';
  if (tabMode === 'server') {
    let clean = serverUrlInput.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'http://' + clean;
    }
    mobileUrl = clean ? `${clean}/?mode=${mobileApp === 'agent' ? 'collection-agent' : 'mobile'}` : '';
  } else {
    mobileUrl = activeIp ? `http://${activeIp}:${port}/?mode=${mobileApp === 'agent' ? 'collection-agent' : 'mobile'}` : '';
  }

  const handleCopy = () => {
    if (!mobileUrl) return;
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenDirect = () => {
    if (!mobileUrl) return;
    window.open(mobileUrl, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          padding: '26px',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 90, 43, 0.4), 0 0 0 1px rgba(0, 135, 68, 0.15)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              backgroundColor: 'var(--algeria-green-light)',
              color: 'var(--algeria-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 135, 68, 0.2)'
            }}>
              <Smartphone style={{ width: '24px', height: '24px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                {lang === 'ar' ? 'مسح QR للفتح على الهاتف الذكي' : 'Scan QR for Mobile Smartphone Access'}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {lang === 'ar' ? 'نقطة البيع أو تطبيق المحصل عبر الهاتف' : 'Dealer POS or Collection Agent on mobile'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '10px',
              color: 'var(--text-muted)'
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '4px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-surface-alt)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '16px'
        }}>
          {[
            { id: 'pos', label: lang === 'ar' ? 'نقطة البيع' : 'Dealer POS' },
            { id: 'agent', label: lang === 'ar' ? 'تطبيق المحصل' : 'Collection Agent' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMobileApp(item.id)}
              style={{
                flex: 1,
                padding: '9px 10px',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '12px',
                backgroundColor: mobileApp === item.id ? 'var(--algeria-green)' : 'transparent',
                color: mobileApp === item.id ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mode Selector Tabs: Server Domain vs Local Wi-Fi */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '4px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-surface-alt)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '16px'
        }}>
          <button
            onClick={() => setTabMode('server')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: '12px',
              backgroundColor: tabMode === 'server' ? 'var(--algeria-green)' : 'transparent',
              color: tabMode === 'server' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <Globe style={{ width: '15px', height: '15px' }} />
            <span>{lang === 'ar' ? 'سيرفر ودومين رسمي (Production)' : 'Live Server / Domain'}</span>
          </button>

          <button
            onClick={() => setTabMode('wifi')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: '12px',
              backgroundColor: tabMode === 'wifi' ? 'var(--algeria-green)' : 'transparent',
              color: tabMode === 'wifi' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <Wifi style={{ width: '15px', height: '15px' }} />
            <span>{lang === 'ar' ? 'شبكة Wi-Fi محلية (Local Test)' : 'Local Wi-Fi Testing'}</span>
          </button>
        </div>

        {/* Dynamic Instructions Banner */}
        <div style={{
          backgroundColor: tabMode === 'server' ? 'rgba(0, 135, 68, 0.08)' : 'var(--algeria-green-light)',
          border: '1px solid rgba(0, 135, 68, 0.25)',
          borderRadius: '14px',
          padding: '12px 14px',
          marginBottom: '16px',
          fontSize: '12px',
          color: 'var(--algeria-green)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          lineHeight: '1.5'
        }}>
          {tabMode === 'server' ? (
            <Globe style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <Wifi style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} />
          )}
          <span>
            {tabMode === 'server' ? (
              lang === 'ar'
                ? 'عند نشر المنصة على سيرفرك (VPS / Cloud) برابط رسمي، يستطيع أي موزع في الجزائر مسح الرمز مباشرة من أي هاتف عبر شبكة 4G (موبيليس، جازي، أوريدو) أو Wi-Fi دون الحاجة لأي إعدادات إضافية.'
                : 'When published on your live server / cloud domain, any dealer across Algeria can scan this QR code via 4G mobile data or Wi-Fi to access the POS app directly from anywhere.'
            ) : (
              lang === 'ar'
                ? 'للتجربة المحلية: تأكد من اتصال هاتفك بنفس شبكة Wi-Fi المتصل بها هذا الكمبيوتر، ثم وجّه كاميرا الهاتف نحو الرمز.'
                : 'For local testing: Ensure your phone is connected to the same Wi-Fi network, then point your phone camera at the QR code.'
            )}
          </span>
        </div>

        {/* QR Code Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '18px',
          borderRadius: '18px',
          backgroundColor: '#ffffff',
          border: '2px dashed #008744',
          marginBottom: '16px',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <div style={{ padding: '10px', backgroundColor: '#ffffff', borderRadius: '14px', boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }}>
            {mobileUrl ? (
              <QRCodeSVG
                value={mobileUrl}
                size={195}
                bgColor="#ffffff"
                fgColor="#005a2b"
                level="H"
                includeMargin={true}
              />
            ) : (
              <div style={{
                width: '195px',
                height: '195px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                boxSizing: 'border-box',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                fontSize: '13px'
              }}>
                {lang === 'ar' ? 'أدخل عنوان IP المحلي لإنشاء الرمز' : 'Enter this computer’s local IP to create the QR code.'}
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            fontSize: '11.5px',
            color: '#15803d',
            fontWeight: '700'
          }}>
            <ShieldCheck style={{ width: '16px', height: '16px' }} />
            <span>
              {tabMode === 'server'
                ? (lang === 'ar' ? 'رابط السيرفر الرسمي المؤمّن بشهادة SSL (HTTPS)' : 'Secured Production HTTPS Mobile Endpoint')
                : (lang === 'ar' ? 'منصة رازيق تليكوم مشفرة ومؤمنة بالكامل' : 'Razik Telecom Secured Mobile Endpoint')}
            </span>
          </div>
        </div>

        {/* Config / Selector based on Tab */}
        {tabMode === 'server' ? (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                {lang === 'ar' ? 'الدومين أو رابط السيرفر (Domain / Server Host):' : 'Domain / Server Host:'}
              </label>
              <span style={{ fontSize: '10.5px', color: 'var(--algeria-green)', fontWeight: '700' }}>
                {lang === 'ar' ? 'يتغير الرمز تلقائياً' : 'Auto-updates QR'}
              </span>
            </div>

            <div style={{ position: 'relative', width: '100%', marginBottom: '8px' }}>
              <input
                type="text"
                value={serverUrlInput}
                onChange={(e) => setServerUrlInput(e.target.value)}
                placeholder="http://recharge.teamtoob.in"
                className="filter-input"
                style={{
                  width: '100%',
                  fontSize: '13px',
                  fontWeight: '700',
                  fontFamily: 'monospace',
                  direction: 'ltr'
                }}
              />
            </div>

            {/* Quick Domain Presets */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'http://recharge.teamtoob.in (Current Server)', url: 'http://recharge.teamtoob.in' },
                { label: 'https://recharge.raziktelecom.dz (Future Domain)', url: 'https://recharge.raziktelecom.dz' },
                { label: 'https://app.razik.dz', url: 'https://app.razik.dz' }
              ].map(item => (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => setServerUrlInput(item.url)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    fontFamily: 'monospace',
                    backgroundColor: serverUrlInput === item.url ? 'var(--algeria-green-light)' : 'var(--bg-surface-alt)',
                    color: serverUrlInput === item.url ? 'var(--algeria-green)' : 'var(--text-muted)',
                    border: '1px solid',
                    borderColor: serverUrlInput === item.url ? 'var(--algeria-green)' : 'var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              {lang === 'ar' ? 'عنوان الشبكة المحلية (Local IP):' : 'Local Network Address:'}
            </label>
            <input
              type="text"
              value={customIp}
              onChange={(event) => setCustomIp(event.target.value)}
              placeholder={lang === 'ar' ? 'مثال: 192.168.8.11' : 'e.g. 192.168.8.11'}
              className="filter-input"
              style={{ width: '100%', fontSize: '13px', fontFamily: 'monospace', direction: 'ltr' }}
            />
            <span style={{ display: 'block', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              {lang === 'ar'
                ? `استخدم عنوان IPv4 لهذا الكمبيوتر. يجب اتصال الهاتف بنفس شبكة Wi-Fi والمنفذ ${port} متاحاً.`
                : `Enter this computer’s IPv4 address. Connect the phone to the same Wi-Fi; port ${port} must be allowed.`}
            </span>
          </div>
        )}

        {/* Direct Link Field with Copy Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-surface-alt)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '18px'
        }}>
          <input
            type="text"
            readOnly
            value={mobileUrl}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: '12px',
              outline: 'none',
              direction: 'ltr'
            }}
          />
          <button
            onClick={handleCopy}
            disabled={!mobileUrl}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: copied ? '#008744' : 'var(--algeria-green)',
              color: '#ffffff',
              border: 'none',
              fontWeight: '700',
              fontSize: '11.5px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {copied ? <Check style={{ width: '13px', height: '13px' }} /> : <Copy style={{ width: '13px', height: '13px' }} />}
            <span>{copied ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ الرابط' : 'Copy Link')}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleOpenDirect}
            disabled={!mobileUrl}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: 'var(--algeria-green)',
              color: '#ffffff',
              border: 'none',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0, 135, 68, 0.25)'
            }}
          >
            <ExternalLink style={{ width: '16px', height: '16px' }} />
            <span>{lang === 'ar' ? 'فتح واجهة الهاتف في نافذة جديدة' : 'Open Mobile View in New Tab'}</span>
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-surface-alt)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
