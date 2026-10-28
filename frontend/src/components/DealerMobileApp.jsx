import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Zap, Droplet, Bus, Wifi, ShieldCheck, CheckCircle2,
  Clock, AlertCircle, ArrowUpRight, Plus, RefreshCw, Send, Share2,
  Printer, ArrowLeft, ArrowRight, ChevronRight, FileText, Check, Phone, DollarSign,
  TrendingUp, Sparkles, MessageSquare, Terminal, MonitorCheck, Receipt
} from 'lucide-react';
import { api } from '../api';

export default function DealerMobileApp({ t, lang, theme, setLang, setTheme, onOpenQrModal, isDirectMobile }) {
  const [currentScreen, setCurrentScreenState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('razik_dealer_screen');
      if (saved && ['home', 'recharge', 'history', 'request_balance'].includes(saved)) {
        return saved;
      }
    }
    return 'home';
  });

  const setCurrentScreen = (screen) => {
    setCurrentScreenState(screen);
    if (typeof window !== 'undefined') {
      localStorage.setItem('razik_dealer_screen', screen);
    }
  };

  const [dealer, setDealer] = useState({
    id: 2,
    username: 'dealer_algiers',
    full_name: 'Karim Benali',
    business_name: 'Kiosque Bab El Oued',
    phone: '0661234567',
    wilaya: 'Alger',
    wallet_balance: 44905.00,
    credit_limit: 20000.00
  });

  const [operators, setOperators] = useState([
    { id: 1, code: 'mobilis', name: 'Mobilis', name_ar: 'موبيليس', prefixes: '065,066,067,069', default_commission_pct: 5.0, color_hex: '#008a3e' },
    { id: 2, code: 'djezzy', name: 'Djezzy', name_ar: 'جازي', prefixes: '077,078,079', default_commission_pct: 4.5, color_hex: '#e4002b' },
    { id: 3, code: 'ooredoo', name: 'Ooredoo', name_ar: 'أوريدو', prefixes: '054,055,056', default_commission_pct: 5.2, color_hex: '#ed1c24' }
  ]);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Recharge Form State
  const [phoneInput, setPhoneInput] = useState('');
  const [detectedOp, setDetectedOp] = useState(null);
  const [amountInput, setAmountInput] = useState('100');
  const [selectedService, setSelectedService] = useState('mobile_flexy');
  const [rechargeProcessing, setRechargeProcessing] = useState(false);

  const [lastReceipt, setLastReceiptState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('razik_dealer_last_receipt');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const setLastReceipt = (rcpt) => {
    setLastReceiptState(rcpt);
    if (typeof window !== 'undefined') {
      if (rcpt) {
        localStorage.setItem('razik_dealer_last_receipt', JSON.stringify(rcpt));
      } else {
        localStorage.removeItem('razik_dealer_last_receipt');
      }
    }
  };

  // Topup Form State
  const [topupAmount, setTopupAmount] = useState('');
  const [topupMethod, setTopupMethod] = useState('cash_collection');
  const [topupProof, setTopupProof] = useState('');

  // Complaint State
  const [complaintModal, setComplaintModal] = useState({ open: false, recharge: null, desc: '' });

  const notify = (msg, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const [opRes, rcRes, dlRes] = await Promise.all([
        api.getOperators(),
        api.getRecharges({ user_id: dealer.id }),
        api.getDealers()
      ]);
      if (opRes.success && opRes.operators) setOperators(opRes.operators);
      if (rcRes.success && rcRes.recharges) setHistory(rcRes.recharges);
      if (dlRes.success && dlRes.dealers) {
        const me = dlRes.dealers.find(d => d.id === dealer.id);
        if (me) setDealer(me);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const timer = setInterval(refreshData, 20000); // 20s auto sync
    return () => clearInterval(timer);
  }, []);

  // Real-time Operator Detection on Phone Input
  useEffect(() => {
    const clean = phoneInput.replace(/[^0-9]/g, '');
    let matched = null;

    if (clean.length >= 2) {
      for (const op of operators) {
        const prefixes = op.prefixes.split(',').map(p => p.trim());
        for (const pfx of prefixes) {
          if (clean.startsWith(pfx) || clean.startsWith(pfx.replace(/^0/, ''))) {
            matched = op;
            break;
          }
        }
        if (matched) break;
      }
    }
    setDetectedOp(matched);
  }, [phoneInput, operators]);

  // Live Commission Math
  const faceVal = parseFloat(amountInput) || 0;
  const commPct = detectedOp ? parseFloat(detectedOp.default_commission_pct) : 5.0;
  const commAmount = (faceVal * commPct) / 100;
  const netDebited = faceVal - commAmount;
  const instantProfit = commAmount;

  // Execute Recharge
  const handleRechargeSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!detectedOp) {
      notify(lang === 'ar' ? 'الرجاء إدخال رقم هاتف جزائري صالح (موبيليس 06، جازي 07، أوريدو 05)' : 'Please enter a valid Algerian phone number', true);
      return;
    }
    if (faceVal <= 0) {
      notify(lang === 'ar' ? 'الرجاء تحديد مبلغ شحن صالح' : 'Please enter a valid amount', true);
      return;
    }

    if (netDebited > (parseFloat(dealer.wallet_balance) + parseFloat(dealer.credit_limit))) {
      notify(lang === 'ar' ? `رصيدك غير كافٍ! المطلوب بعد خصم العمولة: ${netDebited} د.ج` : `Insufficient balance! Required: ${netDebited} DZD`, true);
      return;
    }

    setRechargeProcessing(true);
    try {
      const res = await api.recharge({
        user_id: dealer.id,
        phone_number: phoneInput,
        face_value: faceVal,
        operator_id: detectedOp.id,
        service_type: selectedService,
        simulate_status: 'success'
      });

      if (res.success) {
        setLastReceipt(res.data);
        notify(lang === 'ar' ? 'تمت عملية الشحن بنجاح!' : 'Recharge successful!');
        setPhoneInput('');
        refreshData();
      } else {
        notify(res.error || 'Recharge failed', true);
      }
    } catch (err) {
      notify(err.message, true);
    } finally {
      setRechargeProcessing(false);
    }
  };

  // Submit Top-up Request
  const handleTopupSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(topupAmount);
    if (!amt || amt <= 0) return;

    const res = await api.requestTopup({
      user_id: dealer.id,
      amount: amt,
      payment_method: topupMethod,
      proof_reference: topupProof,
      notes: `Requested from mobile app by ${dealer.business_name}`
    });

    if (res.success) {
      notify(lang === 'ar' ? 'تم إرسال طلب شحن المحفظة للإدارة بنجاح!' : 'Top-up request sent to admin!');
      setTopupAmount('');
      setTopupProof('');
      setCurrentScreen('home');
      refreshData();
    } else {
      notify(res.error || 'Request failed', true);
    }
  };

  // Submit Complaint
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!complaintModal.recharge || !complaintModal.desc) return;

    const res = await api.bookComplaint({
      user_id: dealer.id,
      recharge_id: complaintModal.recharge.id,
      phone_number: complaintModal.recharge.phone_number,
      subject: `Dispute for ${complaintModal.recharge.operator_name} recharge ${complaintModal.recharge.face_value} DZD`,
      description: complaintModal.desc
    });

    if (res.success) {
      notify(lang === 'ar' ? 'تم تسجيل الشكوى بنجاح وسيتم التحقق منها فوراً' : 'Dispute booked successfully!');
      setComplaintModal({ open: false, recharge: null, desc: '' });
      refreshData();
    } else {
      notify(res.error || 'Failed to submit complaint', true);
    }
  };

  const currencyLabel = lang === 'ar' ? 'د.ج' : 'DZD';

  return (
    <div style={{ width: '100%' }}>
      
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '50%',
          transform: 'translateX(50%)',
          zIndex: 9999,
          padding: '12px 24px',
          borderRadius: '16px',
          backgroundColor: notification.isError ? '#d21034' : '#008744',
          color: '#ffffff',
          fontWeight: '700',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
        }}>
          {notification.isError ? <AlertCircle style={{ width: '18px', height: '18px' }} /> : <CheckCircle2 style={{ width: '18px', height: '18px' }} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Dual Big-Screen Workspace: Smartphone Device on Left + Live POS Terminal on Right */}
      <div className={isDirectMobile ? "" : "simulator-workspace"}>
        
        {/* LEFT: Realistic Mobile Chassis Running Android App */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: isDirectMobile ? '100%' : 'auto' }}>
          
          {!isDirectMobile && (
            <div style={{ marginBottom: '14px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <button
                id="btn-open-mobile-qr"
                onClick={onOpenQrModal}
                title={lang === 'ar' ? 'انقر لمسح رمز QR والفتح على هاتفك الذكي' : 'Click to scan QR code and open on smartphone'}
                style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: '#ffffff',
                  backgroundColor: 'var(--algeria-green)',
                  padding: '8px 18px',
                  borderRadius: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 135, 68, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{lang === 'ar' ? '📱 محاكي تطبيق الأندرويد للموزعين' : '📱 Android Dealer Mobile Application'}</span>
                <span style={{
                  backgroundColor: '#f59e0b',
                  color: '#0f172a',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '900'
                }}>
                  {lang === 'ar' ? 'مسح QR للهاتف 📷' : 'Scan Phone QR 📷'}
                </span>
              </button>
            </div>
          )}

          <div
            className={isDirectMobile ? "" : "mobile-device-chassis"}
            style={isDirectMobile ? {
              width: '100%',
              maxWidth: '440px',
              minHeight: '100vh',
              margin: '0 auto',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: '0 0 30px rgba(0,0,0,0.1)'
            } : {
              width: '400px',
              height: '800px'
            }}
          >
            {/* Phone Notch (Desktop Simulator Only) */}
            {!isDirectMobile && (
              <div className="mobile-notch">
                <div className="mobile-notch-camera" />
                <div style={{ width: '32px', height: '5px', backgroundColor: '#0f172a', borderRadius: '3px' }} />
              </div>
            )}

            {/* Direct Mobile Top Bar */}
            {isDirectMobile && (
              <div style={{
                padding: '12px 18px',
                backgroundColor: '#005a2b',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 40,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '800', fontSize: '15px' }}>{lang === 'ar' ? 'رازيق تليكوم' : 'Razik Telecom'}</span>
                  <span style={{ fontSize: '10px', backgroundColor: '#d21034', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>POS</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {lang === 'ar' ? 'EN' : 'عربي'}
                  </button>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    {theme === 'dark' ? '☀️' : '🌙'}
                  </button>
                  <button
                    onClick={onOpenQrModal}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                    title="QR Code"
                  >
                    📱 QR
                  </button>
                </div>
              </div>
            )}

            {/* Status Bar */}
            <div style={{ paddingTop: isDirectMobile ? '10px' : '26px', paddingInline: '24px', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>
              <span>09:41</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Mobilis 4G</span>
                <Wifi style={{ width: '12px', height: '12px' }} />
                <div style={{ width: '18px', height: '9px', border: '1px solid currentColor', borderRadius: '2px', padding: '1px' }}>
                  <div style={{ width: '80%', height: '100%', backgroundColor: 'var(--algeria-green)', borderRadius: '1px' }} />
                </div>
              </div>
            </div>

            {/* =============================================================
                SCREEN 1: HOME
               ============================================================= */}
            {currentScreen === 'home' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 80px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Dealer Info Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{lang === 'ar' ? 'مرحباً بك' : 'Welcome back'}</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{dealer.full_name}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--algeria-green)', fontWeight: '700' }}>
                      {dealer.business_name} • {dealer.wilaya}
                    </div>
                  </div>

                  <button onClick={refreshData} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}>
                    <RefreshCw style={{ width: '16px', height: '16px', color: 'var(--text-muted)', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                  </button>
                </div>

                {/* Algerian Emerald Wallet Balance Card (Fixed Rich Background & High-Contrast Typography) */}
                <div
                  className="algerian-hero-pattern"
                  style={{
                    borderRadius: '18px',
                    padding: '18px',
                    background: 'linear-gradient(135deg, #005a2b 0%, #008744 50%, #004d24 100%)',
                    color: '#ffffff',
                    boxShadow: '0 10px 25px -4px rgba(0, 135, 68, 0.4), 0 4px 10px -2px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#ffffff' }}>
                    <span style={{ color: '#ffffff', opacity: 0.95, letterSpacing: '0.3px' }}>{t.walletBalance}</span>
                    <span style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#ffffff', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '800' }}>
                      {lang === 'ar' ? 'نشط' : 'Active'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '8px 0' }}>
                    <span style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'monospace', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                      {parseFloat(dealer.wallet_balance || 0).toLocaleString()}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#fef08a', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{currencyLabel}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.25)', fontSize: '11px', color: '#ffffff' }}>
                    <span style={{ color: '#ffffff', opacity: 0.95 }}>
                      {lang === 'ar' ? 'سقف الدين:' : 'Credit:'} <strong style={{ color: '#ffffff' }}>{parseFloat(dealer.credit_limit || 0).toLocaleString()} {currencyLabel}</strong>
                    </span>

                    <button
                      id="btn-request-topup"
                      onClick={() => setCurrentScreen('request_balance')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#f59e0b',
                        color: '#0f172a',
                        fontWeight: '800',
                        fontSize: '11px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}
                    >
                      <Plus style={{ width: '12px', height: '12px' }} />
                      <span>{t.requestBalance}</span>
                    </button>
                  </div>
                </div>

                {/* Instant Commission Discounts Ticker */}
                <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-alt)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--algeria-green)', display: 'block', marginBottom: '6px' }}>
                    {lang === 'ar' ? '⚡ نسب الخصم المقتطعة تلقائياً للمحل:' : '⚡ Live Commission Discounts:'}
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', fontSize: '11px' }}>
                    {operators.map(op => (
                      <div key={op.id} style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', fontWeight: '700' }}>
                        <span style={{ color: op.color_hex, display: 'block', fontSize: '10px' }}>{lang === 'ar' ? op.name_ar : op.name}</span>
                        <span style={{ fontFamily: 'monospace' }}>{op.default_commission_pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Services Grid */}
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                    {t.servicesTitle}
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {/* Flexy */}
                    <button
                      id="service-flexy"
                      onClick={() => { setSelectedService('mobile_flexy'); setCurrentScreen('recharge'); }}
                      style={{
                        padding: '12px 6px',
                        borderRadius: '14px',
                        backgroundColor: 'var(--algeria-green-light)',
                        border: '1px solid rgba(0, 135, 68, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--algeria-green)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Smartphone style={{ width: '20px', height: '20px' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>{t.serviceFlexy}</span>
                    </button>

                    {/* Sonelgaz */}
                    <button
                      id="service-sonelgaz"
                      onClick={() => { setSelectedService('sonelgaz_elec'); setCurrentScreen('recharge'); }}
                      style={{
                        padding: '12px 6px',
                        borderRadius: '14px',
                        backgroundColor: 'var(--algeria-gold-light)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--algeria-gold)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap style={{ width: '20px', height: '20px' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>{t.serviceSonelgaz}</span>
                    </button>

                    {/* ADE Water */}
                    <button
                      id="service-ade"
                      onClick={() => { setSelectedService('ade_water'); setCurrentScreen('recharge'); }}
                      style={{
                        padding: '12px 6px',
                        borderRadius: '14px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid rgba(37, 99, 235, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Droplet style={{ width: '20px', height: '20px' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>{t.serviceAde}</span>
                    </button>

                    {/* Bus Tickets */}
                    <button
                      id="service-bus"
                      onClick={() => { setSelectedService('bus_ticket'); setCurrentScreen('recharge'); }}
                      style={{
                        padding: '12px 6px',
                        borderRadius: '14px',
                        backgroundColor: 'var(--algeria-red-light)',
                        border: '1px solid rgba(210, 16, 52, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--algeria-red)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bus style={{ width: '20px', height: '20px' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>{t.serviceBus}</span>
                    </button>

                    {/* 4G Internet */}
                    <button
                      id="service-internet"
                      onClick={() => { setSelectedService('adsl_4g'); setCurrentScreen('recharge'); }}
                      style={{
                        padding: '12px 6px',
                        borderRadius: '14px',
                        backgroundColor: '#faf5ff',
                        border: '1px solid rgba(147, 51, 234, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#9333ea', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wifi style={{ width: '20px', height: '20px' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>{t.serviceInternet}</span>
                    </button>

                    {/* Dispute Center */}
                    <button
                      onClick={() => setCurrentScreen('history')}
                      style={{
                        padding: '12px 6px',
                        borderRadius: '14px',
                        backgroundColor: 'var(--bg-surface-alt)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#475569', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare style={{ width: '20px', height: '20px' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>{lang === 'ar' ? 'الشكاوى' : 'Disputes'}</span>
                    </button>
                  </div>
                </div>

                {/* Recent Recharges Mini List */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {lang === 'ar' ? 'آخر العمليات مع العمولات' : 'Recent Recharges'}
                    </span>
                    <button onClick={() => setCurrentScreen('history')} style={{ fontSize: '11px', color: 'var(--algeria-green)', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {lang === 'ar' ? 'عرض الكل' : 'View All'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {history.slice(0, 3).map(item => (
                      <div key={item.id} style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.operator_color || '#008744' }} />
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'monospace', display: 'block' }}>{item.phone_number}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.operator_name}</span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'end' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'monospace', display: 'block' }}>{parseFloat(item.face_value)} {currencyLabel}</span>
                          <span style={{ fontSize: '10px', color: 'var(--algeria-green)', fontWeight: '700' }}>خُصم: {parseFloat(item.net_debited)} {currencyLabel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* =============================================================
                SCREEN 2: RECHARGE FORM
               ============================================================= */}
            {currentScreen === 'recharge' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 80px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={() => setCurrentScreen('home')} style={{ padding: '6px', borderRadius: '8px', background: 'none', border: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {lang === 'ar' ? <ArrowRight style={{ width: '16px', height: '16px' }} /> : <ArrowLeft style={{ width: '16px', height: '16px' }} />}
                  </button>
                  <strong style={{ fontSize: '15px' }}>{t.quickRecharge}</strong>
                </div>

                <form onSubmit={handleRechargeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Phone Input with Auto Operator Badge */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                      {t.enterPhone}
                    </label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input
                        type="tel"
                        required
                        placeholder="0661234567"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="filter-input"
                        style={{
                          width: '100%',
                          fontSize: '18px',
                          fontWeight: '900',
                          fontFamily: 'monospace',
                          paddingTop: '12px',
                          paddingBottom: '12px',
                          paddingLeft: lang === 'ar' ? (detectedOp ? '125px' : '16px') : '16px',
                          paddingRight: lang === 'ar' ? '16px' : (detectedOp ? '125px' : '16px'),
                          textAlign: lang === 'ar' ? 'right' : 'left',
                          direction: 'ltr',
                          unicodeBidi: 'plaintext'
                        }}
                      />
                      {detectedOp && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          left: lang === 'ar' ? '10px' : 'auto',
                          right: lang === 'ar' ? 'auto' : '10px',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          backgroundColor: detectedOp.color_hex,
                          color: '#ffffff',
                          fontWeight: '800',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          pointerEvents: 'none',
                          zIndex: 2
                        }}>
                          <Sparkles style={{ width: '12px', height: '12px' }} />
                          <span>{lang === 'ar' ? detectedOp.name_ar : detectedOp.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amounts */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                      {t.selectAmount}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '8px' }}>
                      {['100', '200', '500', '1000', '2000'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAmountInput(val)}
                          style={{
                            padding: '8px 2px',
                            borderRadius: '8px',
                            border: '1px solid',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '800',
                            fontFamily: 'monospace',
                            backgroundColor: amountInput === val ? 'var(--algeria-green)' : 'var(--bg-surface-alt)',
                            color: amountInput === val ? '#ffffff' : 'var(--text-primary)',
                            borderColor: amountInput === val ? 'var(--algeria-green)' : 'var(--border-subtle)'
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>

                    <div style={{ position: 'relative', width: '100%' }}>
                      <input
                        type="number"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        className="filter-input"
                        style={{
                          width: '100%',
                          fontSize: '17px',
                          fontWeight: '800',
                          fontFamily: 'monospace',
                          paddingTop: '10px',
                          paddingBottom: '10px',
                          paddingLeft: lang === 'ar' ? '54px' : '14px',
                          paddingRight: lang === 'ar' ? '14px' : '54px',
                          textAlign: lang === 'ar' ? 'right' : 'left',
                          direction: 'ltr'
                        }}
                        placeholder={t.customAmount}
                      />
                      <span style={{
                        position: 'absolute',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        left: lang === 'ar' ? '14px' : 'auto',
                        right: lang === 'ar' ? 'auto' : '14px',
                        fontSize: '13px',
                        fontWeight: '800',
                        color: 'var(--text-secondary)',
                        pointerEvents: 'none'
                      }}>
                        {currencyLabel}
                      </span>
                    </div>
                  </div>

                  {/* Real-time Commission Math Card */}
                  <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--algeria-green-light)', border: '1px solid rgba(0, 135, 68, 0.25)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{t.faceValue}:</span>
                      <bdi dir="ltr" style={{ fontFamily: 'monospace', fontWeight: '800' }}>
                        {faceVal.toLocaleString()} {currencyLabel}
                      </bdi>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--algeria-green)', fontWeight: '700' }}>
                      <span>
                        {lang === 'ar' ? 'نسبة عمولتك (' : 'Your commission ('}
                        <bdi dir="ltr">{commPct}%</bdi>
                        {lang === 'ar' ? '):' : '):'}
                      </span>
                      <bdi dir="ltr" style={{ fontFamily: 'monospace', fontWeight: '800' }}>
                        - {commAmount.toFixed(2)} {currencyLabel}
                      </bdi>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(0, 135, 68, 0.2)', fontWeight: '900', fontSize: '14px' }}>
                      <span>{t.netDeducted}:</span>
                      <bdi dir="ltr" style={{ color: 'var(--algeria-green)', fontFamily: 'monospace' }}>
                        {netDebited.toFixed(2)} {currencyLabel}
                      </bdi>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef3c7', padding: '6px 10px', borderRadius: '8px', color: '#92400e', fontWeight: '800' }}>
                      <span>{t.instantProfit}:</span>
                      <bdi dir="ltr" style={{ fontFamily: 'monospace' }}>
                        + {instantProfit.toFixed(2)} {currencyLabel}
                      </bdi>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-execute-recharge"
                    disabled={rechargeProcessing || !detectedOp || faceVal <= 0}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--algeria-green)',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '14px',
                      border: 'none',
                      cursor: (rechargeProcessing || !detectedOp || faceVal <= 0) ? 'not-allowed' : 'pointer',
                      opacity: (rechargeProcessing || !detectedOp || faceVal <= 0) ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(0, 135, 68, 0.3)'
                    }}
                  >
                    {rechargeProcessing ? (
                      <>
                        <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                        <span>جاري المعالجة...</span>
                      </>
                    ) : (
                      <>
                        <Send style={{ width: '16px', height: '16px' }} />
                        <span>{t.executeRecharge} &lrm;({netDebited.toFixed(0)} {currencyLabel})&lrm;</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* =============================================================
                SCREEN 3: HISTORY
               ============================================================= */}
            {currentScreen === 'history' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 80px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={() => setCurrentScreen('home')} style={{ padding: '6px', borderRadius: '8px', background: 'none', border: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {lang === 'ar' ? <ArrowRight style={{ width: '16px', height: '16px' }} /> : <ArrowLeft style={{ width: '16px', height: '16px' }} />}
                  </button>
                  <strong style={{ fontSize: '15px' }}>{lang === 'ar' ? 'سجل العمليات والشكاوى' : 'History & Disputes'}</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {history.map(item => (
                    <div key={item.id} style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '13px' }}>{item.phone_number}</span>
                        <span className={`badge ${
                          item.status === 'success' ? 'badge-success' : item.status === 'pending' ? 'badge-pending' : 'badge-failed'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span>{lang === 'ar' ? 'القيمة:' : 'Face Value:'} <strong>{parseFloat(item.face_value)} {currencyLabel}</strong></span>
                        <span style={{ color: 'var(--algeria-green)', fontWeight: '700' }}>{lang === 'ar' ? 'المخصوم:' : 'Debited:'} {parseFloat(item.net_debited)} {currencyLabel}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{item.recharge_ref}</span>
                        <button
                          onClick={() => setComplaintModal({ open: true, recharge: item, desc: '' })}
                          style={{ color: '#d21034', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <AlertCircle style={{ width: '12px', height: '12px' }} />
                          <span>{t.bookComplaint}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =============================================================
                SCREEN 4: TOP-UP REQUEST
               ============================================================= */}
            {currentScreen === 'request_balance' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 80px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={() => setCurrentScreen('home')} style={{ padding: '6px', borderRadius: '8px', background: 'none', border: '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {lang === 'ar' ? <ArrowRight style={{ width: '16px', height: '16px' }} /> : <ArrowLeft style={{ width: '16px', height: '16px' }} />}
                  </button>
                  <strong style={{ fontSize: '15px' }}>{t.requestBalance}</strong>
                </div>

                <form onSubmit={handleTopupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                      {lang === 'ar' ? 'المبلغ المطلوب شحنه (د.ج)' : 'Amount to Request (DZD)'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="500"
                      placeholder="20000"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      className="filter-input"
                      style={{
                        width: '100%',
                        fontSize: '16px',
                        fontWeight: '800',
                        fontFamily: 'monospace',
                        textAlign: lang === 'ar' ? 'right' : 'left',
                        direction: 'ltr'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                      {lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                    </label>
                    <select
                      value={topupMethod}
                      onChange={(e) => setTopupMethod(e.target.value)}
                      className="filter-input"
                      style={{ width: '100%', textAlign: lang === 'ar' ? 'right' : 'left' }}
                    >
                      <option value="cash_collection">{lang === 'ar' ? 'دفع نقدي للمسؤول (Cash Collection)' : 'Cash Collection'}</option>
                      <option value="baridimob">{lang === 'ar' ? 'بريدي موب (BaridiMob)' : 'BaridiMob'}</option>
                      <option value="bank_ccp">{lang === 'ar' ? 'حوالة بريدية CCP' : 'CCP Transfer'}</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                      {lang === 'ar' ? 'رقم الإيصال أو المرجع' : 'Receipt / Reference No.'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BM-9812739"
                      value={topupProof}
                      onChange={(e) => setTopupProof(e.target.value)}
                      className="filter-input"
                      style={{ width: '100%', textAlign: lang === 'ar' ? 'right' : 'left' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      marginTop: '8px',
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--algeria-green)',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    إرسال طلب شحن المحفظة
                  </button>
                </form>
              </div>
            )}

            {/* Bottom Android Nav Bar */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              backgroundColor: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              paddingInline: '20px',
              zIndex: 30
            }}>
              <button onClick={() => setCurrentScreen('home')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', color: currentScreen === 'home' ? 'var(--algeria-green)' : 'var(--text-muted)', fontWeight: '700', fontSize: '10px' }}>
                <Smartphone style={{ width: '18px', height: '18px' }} />
                <span>الرئيسية</span>
              </button>

              <button onClick={() => setCurrentScreen('recharge')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', color: currentScreen === 'recharge' ? 'var(--algeria-green)' : 'var(--text-muted)', fontWeight: '700', fontSize: '10px' }}>
                <Zap style={{ width: '18px', height: '18px' }} />
                <span>فليكسي</span>
              </button>

              <button onClick={() => setCurrentScreen('history')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', color: currentScreen === 'history' ? 'var(--algeria-green)' : 'var(--text-muted)', fontWeight: '700', fontSize: '10px' }}>
                <FileText style={{ width: '18px', height: '18px' }} />
                <span>السجل</span>
              </button>
            </div>

            {/* Home Indicator */}
            <div className="mobile-home-indicator" />

          </div>
        </div>

        {/* RIGHT: Live POS Terminal & API Gateway Inspector (Expands Wide to Fill Screen) */}
        {!isDirectMobile && (
          <div className="simulator-side-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MonitorCheck style={{ width: '22px', height: '22px', color: 'var(--algeria-green)' }} />
              <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                {lang === 'ar' ? 'لوحة نقطة البيع للموزع واختبار بوابات الربط (POS Console)' : 'Dealer POS Terminal & API Gateway'}
              </h3>
            </div>
            <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px', backgroundColor: 'var(--algeria-green-light)', color: 'var(--algeria-green)', fontWeight: '800' }}>
              مباشر ONLINE
            </span>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-alt)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>رصيد المحل الحالي</span>
              <strong style={{ fontSize: '18px', fontFamily: 'monospace', color: 'var(--algeria-green)' }}>{parseFloat(dealer.wallet_balance).toLocaleString()} {currencyLabel}</strong>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-alt)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>السقف الائتماني الممنوح</span>
              <strong style={{ fontSize: '18px', fontFamily: 'monospace' }}>{parseFloat(dealer.credit_limit).toLocaleString()} {currencyLabel}</strong>
            </div>

            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-alt)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>العمليات المنجزة</span>
              <strong style={{ fontSize: '18px', fontFamily: 'monospace', color: 'var(--algeria-gold)' }}>{history.length} عمليات</strong>
            </div>
          </div>

          {/* Real-time Operator Gateway Inspector */}
          <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'var(--sidebar-bg)', color: '#f8fafc', marginBottom: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal style={{ width: '14px', height: '14px', color: '#34d399' }} />
                <span style={{ fontWeight: '700', color: '#34d399' }}>Telecom Gateway Inspector</span>
              </div>
              <span style={{ color: '#94a3b8', fontSize: '11px' }}>POST /api/recharge</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Detected Operator:</strong> <span style={{ color: detectedOp ? detectedOp.color_hex : '#94a3b8' }}>{detectedOp ? `${detectedOp.name} (${detectedOp.code})` : 'Awaiting input...'}</span></div>
              <div><strong>Input Phone:</strong> <span style={{ color: '#38bdf8' }}>{phoneInput || 'None'}</span></div>
              <div><strong>Recharge Face Value:</strong> <span>{faceVal} DZD</span></div>
              <div><strong>Dealer Discount:</strong> <span style={{ color: '#4ade80' }}>-{commAmount.toFixed(2)} DZD ({commPct}%)</span></div>
              <div><strong>Net Debited from Wallet:</strong> <span style={{ color: '#fcd34d', fontWeight: '800' }}>{netDebited.toFixed(2)} DZD</span></div>
            </div>
          </div>

          {/* Quick POS Flexy Buttons */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '10px', color: 'var(--text-primary)' }}>
              {lang === 'ar' ? 'عمليات شحن نموذجية سريعة بنقرة واحدة:' : 'Quick One-Click Test Recharges:'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                onClick={() => {
                  setPhoneInput('0661234567');
                  setAmountInput('100');
                  setCurrentScreen('recharge');
                }}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--algeria-green-light)',
                  border: '1px solid rgba(0, 135, 68, 0.3)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <strong style={{ color: 'var(--algeria-green)', display: 'block', fontSize: '13px' }}>Mobilis 100 د.ج</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>خصم: 95 د.ج فقط (5%)</span>
              </button>

              <button
                onClick={() => {
                  setPhoneInput('0770987654');
                  setAmountInput('500');
                  setCurrentScreen('recharge');
                }}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--algeria-red-light)',
                  border: '1px solid rgba(210, 16, 52, 0.3)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <strong style={{ color: 'var(--algeria-red)', display: 'block', fontSize: '13px' }}>Djezzy 500 د.ج</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>خصم: 477.5 د.ج (4.5%)</span>
              </button>

              <button
                onClick={() => {
                  setPhoneInput('0555432109');
                  setAmountInput('1000');
                  setCurrentScreen('recharge');
                }}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid rgba(237, 28, 36, 0.3)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <strong style={{ color: '#ed1c24', display: 'block', fontSize: '13px' }}>Ooredoo 1000 د.ج</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>خصم: 948 د.ج (5.2%)</span>
              </button>
            </div>
          </div>
        </div>
        )}

      </div>

      {/* RECEIPT MODAL */}
      {lastReceipt && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--algeria-green-light)', color: 'var(--algeria-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <CheckCircle2 style={{ width: '32px', height: '32px' }} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {t.rechargeSuccess}
            </h3>
            <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-muted)' }}>
              {lastReceipt.recharge_ref}
            </span>

            {/* Receipt Paper Card */}
            <div style={{ margin: '20px 0', padding: '18px', borderRadius: '16px', backgroundColor: 'var(--bg-surface-alt)', border: '1px dashed var(--border-strong)', textAlign: 'start', fontFamily: 'monospace', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Operator:</span>
                <strong>{lastReceipt.operator}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Customer Phone:</span>
                <strong>{lastReceipt.phone_number}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Recharge Face Value:</span>
                <strong>{lastReceipt.face_value} DZD</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--algeria-green)' }}>
                <span>Commission ({lastReceipt.commission_pct}%):</span>
                <strong>-{lastReceipt.commission_amount} DZD</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontWeight: '900', fontSize: '15px' }}>
                <span>Net Debited:</span>
                <span style={{ color: 'var(--algeria-green)' }}>{lastReceipt.net_debited} DZD</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setLastReceipt(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface-alt)', color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer' }}
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  alert('تم إرسال أمر الطباعة إلى الطابعة الحرارية بلوتوث!');
                  setLastReceipt(null);
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--algeria-green)', color: '#ffffff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Printer style={{ width: '16px', height: '16px' }} />
                <span>طباعة الوصل</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
