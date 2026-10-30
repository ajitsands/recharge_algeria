import React, { useMemo, useState } from 'react';
import { api } from '../api';

const money = (value) => `${Number(value || 0).toLocaleString()} DZD`;

export default function CollectionAgentWebApp({ lang, onBack }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [session, setSession] = useState(null);
  const [dealers, setDealers] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const isArabic = lang === 'ar';

  const filteredDealers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return dealers;
    return dealers.filter((dealer) =>
      [dealer.full_name, dealer.business_name, dealer.phone, dealer.wilaya]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [dealers, search]);

  const refreshData = async (token = session?.token) => {
    if (!token) return;
    const [dealerRes, historyRes] = await Promise.all([
      api.getCollectionDealers(token),
      api.getCollectionHistory(token)
    ]);
    if (!dealerRes.success) throw new Error(dealerRes.error || 'Could not load assigned shops.');
    if (!historyRes.success) throw new Error(historyRes.error || 'Could not load collection history.');
    setDealers(dealerRes.dealers || []);
    setHistory(historyRes.transactions || []);
    setSelectedDealer((current) => current
      ? (dealerRes.dealers || []).find((dealer) => dealer.id === current.id) || null
      : null);
  };

  const signIn = async (event) => {
    event.preventDefault();
    if (!credentials.username.trim() || !credentials.password) {
      setNotice({ message: isArabic ? 'أدخل اسم المستخدم وكلمة المرور.' : 'Enter your username and password.', error: true });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const result = await api.login(credentials);
      if (!result.success) throw new Error(result.error || 'Sign in failed.');
      if (result.user?.role !== 'collection_agent') {
        throw new Error(isArabic ? 'هذا التطبيق مخصص لحسابات المحصلين.' : 'This sign-in is for collection agent accounts only.');
      }
      await refreshData(result.token);
      setSession({ token: result.token, user: result.user });
    } catch (error) {
      setNotice({ message: error.message, error: true });
    } finally {
      setBusy(false);
    }
  };

  const startCollection = async (event) => {
    event.preventDefault();
    const paymentAmount = Number(amount);
    if (!selectedDealer || !Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setNotice({ message: isArabic ? 'اختر محلاً وأدخل مبلغاً صالحاً.' : 'Select a shop and enter a valid amount.', error: true });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const result = await api.createCollection({ dealer_id: selectedDealer.id, amount: paymentAmount }, session.token);
      if (!result.success) throw new Error(result.error || 'Could not start collection.');
      setConfirmation(result.collection);
      setConfirmationCode('');
    } catch (error) {
      setNotice({ message: error.message, error: true });
    } finally {
      setBusy(false);
    }
  };

  const confirmCollection = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(confirmationCode)) {
      setNotice({ message: isArabic ? 'أدخل الرمز المكوّن من 6 أرقام.' : 'Enter the six-digit code from the shopkeeper.', error: true });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const result = await api.confirmCollection({
        collection_id: confirmation.id,
        confirmation_code: confirmationCode
      }, session.token);
      if (!result.success) throw new Error(result.error || 'Payment confirmation failed.');
      setNotice({ message: isArabic ? 'تم تأكيد الدفع وتسجيله.' : 'Cash payment confirmed and recorded.' });
      setConfirmation(null);
      setConfirmationCode('');
      setAmount('');
      await refreshData();
    } catch (error) {
      setNotice({ message: error.message, error: true });
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontSize: '15px',
    marginTop: '6px'
  };
  const buttonStyle = {
    width: '100%',
    border: 0,
    borderRadius: '12px',
    padding: '13px 16px',
    background: 'var(--algeria-green)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 800,
    cursor: busy ? 'wait' : 'pointer',
    opacity: busy ? 0.7 : 1,
    marginTop: '14px'
  };

  return (
    <main dir={isArabic ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh',
      maxWidth: '440px',
      margin: '0 auto',
      background: 'var(--bg-surface-alt)',
      color: 'var(--text-primary)',
      fontFamily: 'inherit'
    }}>
      <header style={{
        padding: '16px 18px',
        background: 'linear-gradient(135deg, #005a2b, #008744)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        position: 'sticky',
        top: 0,
        zIndex: 2
      }}>
        <div>
          <strong style={{ display: 'block', fontSize: '17px' }}>Razik Telecom</strong>
          <span style={{ fontSize: '12px', opacity: 0.9 }}>{isArabic ? 'تطبيق محصل الديون' : 'Collection Agent App'}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button type="button" onClick={onBack} style={{ border: 0, borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', fontWeight: 700 }}>
            {isArabic ? 'نقطة البيع' : 'POS'}
          </button>
          {session && (
            <button type="button" onClick={() => { setSession(null); setConfirmation(null); }} style={{ border: '1px solid rgba(255,255,255,.6)', borderRadius: '8px', padding: '8px 10px', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
              {isArabic ? 'خروج' : 'Sign out'}
            </button>
          )}
        </div>
      </header>

      <div style={{ padding: '16px' }}>
        {notice && (
          <div role="status" style={{
            padding: '12px',
            marginBottom: '12px',
            borderRadius: '12px',
            background: notice.error ? '#fee2e2' : '#dcfce7',
            color: notice.error ? '#991b1b' : '#166534',
            fontSize: '14px',
            fontWeight: 700
          }}>{notice.message}</div>
        )}

        {!session ? (
          <form onSubmit={signIn} style={{ padding: '20px', borderRadius: '18px', background: 'var(--bg-surface)', boxShadow: '0 8px 24px rgba(15,23,42,.08)' }}>
            <h1 style={{ margin: '0 0 6px', fontSize: '21px' }}>{isArabic ? 'تسجيل دخول المحصل' : 'Collection Agent Sign In'}</h1>
            <p style={{ margin: '0 0 18px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              {isArabic ? 'استخدم الحساب الذي أنشأه المسؤول أو الموزع.' : 'Use the agent account created by your admin or dealer.'}
            </p>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700 }}>
              {isArabic ? 'اسم المستخدم' : 'Username'}
              <input autoComplete="username" value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} style={inputStyle} />
            </label>
            <label style={{ display: 'block', marginTop: '14px', fontSize: '13px', fontWeight: 700 }}>
              {isArabic ? 'كلمة المرور' : 'Password'}
              <input type="password" autoComplete="current-password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} style={inputStyle} />
            </label>
            <button type="submit" disabled={busy} style={buttonStyle}>{busy ? '…' : (isArabic ? 'دخول' : 'Sign In')}</button>
          </form>
        ) : (
          <>
            <section style={{ padding: '16px', marginBottom: '14px', borderRadius: '16px', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px' }}>{isArabic ? 'مرحباً' : 'Signed in as'}</span>
                <strong>{session.user.full_name}</strong>
              </div>
              <button type="button" onClick={() => refreshData().catch((error) => setNotice({ message: error.message, error: true }))} style={{ border: '1px solid var(--border-subtle)', borderRadius: '9px', padding: '8px 10px', background: 'var(--bg-surface)', color: 'var(--algeria-green)', fontWeight: 700 }}>
                {isArabic ? 'تحديث' : 'Refresh'}
              </button>
            </section>

            <section style={{ padding: '18px', marginBottom: '14px', borderRadius: '18px', background: 'var(--bg-surface)', boxShadow: '0 8px 24px rgba(15,23,42,.06)' }}>
              <h2 style={{ margin: '0 0 14px', fontSize: '18px' }}>{isArabic ? 'تحصيل دفعة من محل' : 'Collect dealer payment'}</h2>
              {!confirmation ? (
                <>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700 }}>
                    {isArabic ? 'ابحث عن المحل' : 'Find dealer / shop'}
                    <input value={selectedDealer ? `${selectedDealer.full_name}${selectedDealer.business_name ? ` · ${selectedDealer.business_name}` : ''}` : search}
                      onChange={(event) => { setSelectedDealer(null); setSearch(event.target.value); }}
                      placeholder={isArabic ? 'الاسم أو المتجر أو الهاتف' : 'Name, shop, phone or wilaya'}
                      style={inputStyle} />
                  </label>
                  {!selectedDealer && (
                    <div style={{ maxHeight: '220px', overflowY: 'auto', marginTop: '8px' }}>
                      {filteredDealers.map((dealer) => (
                        <button key={dealer.id} type="button" onClick={() => { setSelectedDealer(dealer); setSearch(''); setAmount(Number(dealer.outstanding_debt) > 0 ? String(dealer.outstanding_debt) : ''); }}
                          style={{ display: 'block', width: '100%', textAlign: 'start', padding: '12px', marginBottom: '6px', border: '1px solid var(--border-subtle)', borderRadius: '10px', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                          <strong style={{ display: 'block' }}>{dealer.full_name}</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{dealer.business_name || dealer.phone} · {isArabic ? 'الدين' : 'Debt'}: {money(dealer.outstanding_debt)}</span>
                        </button>
                      ))}
                      {!filteredDealers.length && <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{isArabic ? 'لا توجد محلات نشطة.' : 'No active assigned shops found.'}</p>}
                    </div>
                  )}
                  {selectedDealer && (
                    <>
                      <div style={{ marginTop: '12px', padding: '12px', borderRadius: '12px', background: 'var(--bg-surface-alt)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span>{isArabic ? 'الرصيد المستحق' : 'Outstanding debt'}</span><strong>{money(selectedDealer.outstanding_debt)}</strong>
                        </div>
                        <button type="button" onClick={() => { setSelectedDealer(null); setAmount(''); }} style={{ marginTop: '8px', border: 0, background: 'transparent', padding: 0, color: 'var(--algeria-green)', cursor: 'pointer', fontWeight: 700 }}>
                          {isArabic ? 'اختيار محل آخر' : 'Change shop'}
                        </button>
                      </div>
                      <form onSubmit={startCollection}>
                        <label style={{ display: 'block', marginTop: '14px', fontSize: '13px', fontWeight: 700 }}>
                          {isArabic ? 'المبلغ النقدي المستلم (دج)' : 'Cash received (DZD)'}
                          <input type="number" min="0.01" max={selectedDealer.outstanding_debt} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} style={inputStyle} />
                        </label>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: 0 }}>
                          {isArabic ? 'لا يمكن أن يتجاوز المبلغ الدين المستحق.' : 'Payment cannot exceed the outstanding debt.'}
                        </p>
                        <button type="submit" disabled={busy} style={buttonStyle}>{isArabic ? 'إنشاء رمز تأكيد للعميل' : 'Create customer confirmation code'}</button>
                      </form>
                    </>
                  )}
                </>
              ) : (
                <form onSubmit={confirmCollection}>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'var(--algeria-green-light)', textAlign: 'center' }}>
                    <strong style={{ display: 'block' }}>{isArabic ? 'دع صاحب المحل يراجع المبلغ' : 'Ask the shopkeeper to review the payment'}</strong>
                    <span style={{ display: 'block', margin: '8px 0', fontSize: '19px', fontWeight: 900 }}>{money(confirmation.amount)}</span>
                    <span style={{ display: 'block', fontSize: '12px' }}>{confirmation.dealer_name}{confirmation.business_name ? ` · ${confirmation.business_name}` : ''}</span>
                    <span style={{ display: 'block', marginTop: '10px', fontSize: '12px' }}>{isArabic ? 'يعطيك صاحب المحل الرمز بعد الموافقة. ينتهي خلال 10 دقائق.' : 'After checking the amount, the shopkeeper gives you their code. It expires in 10 minutes.'}</span>
                    <strong style={{ display: 'block', marginTop: '10px', fontSize: '28px', letterSpacing: '8px', fontFamily: 'monospace' }}>{confirmation.confirmation_code}</strong>
                  </div>
                  <label style={{ display: 'block', marginTop: '14px', fontSize: '13px', fontWeight: 700 }}>
                    {isArabic ? 'رمز التأكيد من صاحب المحل' : 'Six-digit code from shopkeeper'}
                    <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={confirmationCode} onChange={(event) => setConfirmationCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" style={{ ...inputStyle, textAlign: 'center', letterSpacing: '8px', fontSize: '20px' }} />
                  </label>
                  <button type="submit" disabled={busy} style={buttonStyle}>{isArabic ? 'تأكيد استلام الدفع' : 'Confirm cash payment'}</button>
                  <button type="button" disabled={busy} onClick={() => { setConfirmation(null); setConfirmationCode(''); }} style={{ ...buttonStyle, marginTop: '8px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                    {isArabic ? 'إلغاء التحصيل' : 'Cancel collection'}
                  </button>
                </form>
              )}
            </section>

            <section style={{ padding: '18px', borderRadius: '18px', background: 'var(--bg-surface)' }}>
              <h2 style={{ margin: '0 0 12px', fontSize: '17px' }}>{isArabic ? 'آخر عمليات التحصيل المؤكدة' : 'Recent confirmed collections'}</h2>
              {!history.length ? <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{isArabic ? 'لا توجد عمليات مؤكدة.' : 'No confirmed collections yet.'}</p> : history.slice(0, 10).map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '10px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px' }}>{item.dealer_name}{item.business_name ? ` · ${item.business_name}` : ''}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{item.transaction_ref} · {item.confirmed_at || item.created_at}</span>
                  </div>
                  <strong style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>{money(item.amount)}</strong>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
