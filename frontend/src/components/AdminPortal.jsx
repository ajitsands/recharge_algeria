import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, History, CreditCard, Percent, LifeBuoy, Settings,
  TrendingUp, AlertTriangle, CheckCircle, Clock, XCircle, Search, RefreshCw,
  PlusCircle, ArrowUpRight, ArrowDownLeft, ShieldCheck, DollarSign, PhoneCall,
  Check, X, FileText, Download, Building, MapPin, ChevronDown, Smartphone, QrCode
} from 'lucide-react';
import { api } from '../api';
import DataTable from './DataTable';

export default function AdminPortal({ t, lang, theme, onOpenQrModal }) {
  const validTabs = ['dashboard', 'dealers', 'recharges', 'topups', 'commissions', 'complaints', 'settings'];
  
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (validTabs.includes(hash)) return hash;
      const saved = localStorage.getItem('razik_admin_active_tab');
      if (validTabs.includes(saved)) return saved;
    }
    return 'dashboard';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('razik_admin_active_tab', tab);
      if (window.location.hash.replace('#', '') !== tab) {
        window.location.hash = tab;
      }
    }
  };
  const [stats, setStats] = useState(null);
  const [operators, setOperators] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [recharges, setRecharges] = useState([]);
  const [topupRequests, setTopupRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    timezone: 'Africa/Algiers',
    currency: 'DZD',
    currency_symbol_ar: 'د.ج',
    date_format: 'd/m/Y H:i',
    default_language: 'ar',
    default_theme: 'light'
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Filter states
  const [rechargeFilter, setRechargeFilter] = useState({ operator: '', status: '', search: '' });

  // Modals
  const [balanceModal, setBalanceModal] = useState({ open: false, dealer: null, amount: '', type: 'credit', notes: '' });
  const [providerAdjustmentModal, setProviderAdjustmentModal] = useState({ open: false, operator: null, amount: '', type: 'credit', description: '' });
  const [providerLedgerModal, setProviderLedgerModal] = useState({ open: false, operator: null, transactions: [], loading: false });
  const [providerAdjustmentSubmitting, setProviderAdjustmentSubmitting] = useState(false);
  const [dealerLedgerModal, setDealerLedgerModal] = useState({ open: false, dealer: null, transactions: [], loading: false });
  const [complaintModal, setComplaintModal] = useState({ open: false, ticket: null, status: 'resolved_confirmed', response: '', refund: false });
  const [disputeModal, setDisputeModal] = useState({ open: false, recharge: null, subject: '', description: '', status: 'investigating' });
  const [opDropdownOpen, setOpDropdownOpen] = useState(false);

  const notify = (msg, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [stRes, opRes, dlRes, rcRes, tpRes, cpRes, cfgRes] = await Promise.all([
        api.getStats(),
        api.getOperators(),
        api.getDealers(),
        api.getRecharges(),
        api.getTopupRequests(),
        api.getComplaints(),
        api.getSettings()
      ]);

      if (stRes.success) setStats(stRes);
      if (opRes.success) setOperators(opRes.operators);
      if (dlRes.success) setDealers(dlRes.dealers);
      if (rcRes.success) setRecharges(rcRes.recharges);
      if (tpRes.success) setTopupRequests(tpRes.requests);
      if (cpRes.success) setComplaints(cpRes.complaints);
      if (cfgRes.success && cfgRes.settings) setSystemSettings(prev => ({ ...prev, ...cfgRes.settings }));
    } catch (err) {
      console.error(err);
      notify("Failed to connect to backend", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const intervalTimer = setInterval(loadAllData, 20000); // 20s live sync

    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (validTabs.includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);

    return () => {
      clearInterval(intervalTimer);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  const handleApproveDealer = async (userId, decision) => {
    const res = await api.approveDealer({ user_id: userId, decision });
    if (res.success) {
      notify(res.message);
      loadAllData();
    } else {
      notify(res.error || "Action failed", true);
    }
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    if (!balanceModal.dealer || !balanceModal.amount) return;
    const res = await api.adjustBalance({
      user_id: balanceModal.dealer.id,
      type: balanceModal.type,
      amount: parseFloat(balanceModal.amount),
      notes: balanceModal.notes
    });
    if (res.success) {
      notify(res.message);
      setBalanceModal({ open: false, dealer: null, amount: '', type: 'credit', notes: '' });
      loadAllData();
    } else {
      notify(res.error || "Adjustment failed", true);
    }
  };

  const handleTopupDecision = async (requestId, decision) => {
    const res = await api.approveTopup({ request_id: requestId, decision });
    if (res.success) {
      notify(res.message);
      loadAllData();
    } else {
      notify(res.error || "Action failed", true);
    }
  };

  const handleUpdateCommission = async (opId, newPct, threshold) => {
    const res = await api.updateOperator({
      id: opId,
      default_commission_pct: parseFloat(newPct),
      low_balance_threshold: parseFloat(threshold)
    });
    if (res.success) {
      notify(res.message);
      loadAllData();
    } else {
      notify(res.error || "Update failed", true);
    }
  };

  const handleAdjustOperatorBalance = async (e) => {
    e.preventDefault();
    const description = providerAdjustmentModal.description.trim();
    const amount = Number(providerAdjustmentModal.amount);
    if (!providerAdjustmentModal.operator || !Number.isFinite(amount) || amount <= 0 || !description) {
      notify(lang === 'ar' ? 'يرجى إدخال مبلغ صحيح ووصف للعملية.' : 'Enter a valid amount and transaction description.', true);
      return;
    }

    setProviderAdjustmentSubmitting(true);
    try {
      const res = await api.adjustOperatorBalance({
        operator_id: providerAdjustmentModal.operator.id,
        type: providerAdjustmentModal.type,
        amount,
        description
      });
      if (!res.success) {
        notify(res.error || (lang === 'ar' ? 'تعذر تعديل رصيد المتعامل.' : 'Provider balance adjustment failed.'), true);
        return;
      }

      notify(res.message);
      setProviderAdjustmentModal({ open: false, operator: null, amount: '', type: 'credit', description: '' });
      await loadAllData();
    } finally {
      setProviderAdjustmentSubmitting(false);
    }
  };

  const openProviderLedger = async (operator) => {
    setProviderLedgerModal({ open: true, operator, transactions: [], loading: true });
    const res = await api.getOperatorLedger(operator.id);
    if (res.success) {
      setProviderLedgerModal({ open: true, operator, transactions: res.transactions || [], loading: false });
      return;
    }
    setProviderLedgerModal({ open: true, operator, transactions: [], loading: false });
    notify(res.error || (lang === 'ar' ? 'تعذر تحميل سجل المتعامل.' : 'Could not load provider ledger.'), true);
  };

  const openDealerLedger = async (dealer) => {
    setDealerLedgerModal({ open: true, dealer, transactions: [], loading: true });
    const res = await api.getDealerLedger(dealer.id);
    if (res.success) {
      setDealerLedgerModal({ open: true, dealer: res.dealer, transactions: res.transactions || [], loading: false });
      return;
    }
    setDealerLedgerModal({ open: true, dealer, transactions: [], loading: false });
    notify(res.error || (lang === 'ar' ? 'تعذر تحميل سجل المحل.' : 'Could not load dealer/store ledger.'), true);
  };

  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!complaintModal.ticket) return;
    const res = await api.resolveComplaint({
      complaint_id: complaintModal.ticket.id,
      status: complaintModal.status,
      admin_response: complaintModal.response,
      refund_to_wallet: complaintModal.refund
    });
    if (res.success) {
      notify(res.message);
      setComplaintModal({ open: false, ticket: null, status: 'resolved_confirmed', response: '', refund: false });
      loadAllData();
    } else {
      notify(res.error || "Resolution failed", true);
    }
  };

  const currencyLabel = lang === 'ar' ? (systemSettings.currency_symbol_ar || 'د.ج') : (systemSettings.currency || 'DZD');

  const handleOpenBookDispute = (recharge) => {
    setDisputeModal({
      open: true,
      recharge,
      subject: lang === 'ar' 
        ? `نزاع شحن رصيد - مرجع ${recharge.recharge_ref}` 
        : `Recharge Dispute - Ref ${recharge.recharge_ref}`,
      description: lang === 'ar'
        ? `الزبون أبلغ بعدم وصول رصيد الشحن إلى رقمه (${recharge.phone_number}). تم فتح تذكرة نزاع وتوجيهها للتحقيق الفني مع المتعامل.`
        : `Customer reported balance not received for phone ${recharge.phone_number}. Flagged for NOC operator investigation.`,
      status: 'investigating'
    });
  };

  const handleConfirmBookDispute = async (e) => {
    e.preventDefault();
    if (!disputeModal.recharge) return;
    const res = await api.bookComplaint({
      recharge_id: disputeModal.recharge.id,
      user_id: disputeModal.recharge.user_id,
      phone_number: disputeModal.recharge.phone_number,
      subject: disputeModal.subject,
      description: disputeModal.description,
      status: 'investigating'
    });
    if (res.success) {
      notify(lang === 'ar' 
        ? `تم تسجيل النزاع وحالته: قيد التحقيق (Investigating) - تذكرة: ${res.ticket_ref}` 
        : `Dispute booked with status Investigating! Ticket: ${res.ticket_ref}`);
      setDisputeModal({ open: false, recharge: null, subject: '', description: '', status: 'investigating' });
      await loadAllData();
      setActiveTab('complaints'); // Automatically redirect to Dispute Center
    } else {
      notify(res.error || 'Failed to book dispute', true);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateSettings(systemSettings);
      if (res.success) {
        notify(lang === 'ar' ? 'تم حفظ إعدادات النظام بنجاح' : 'System settings saved successfully');
        loadAllData();
      } else {
        notify(res.error || (lang === 'ar' ? 'تعذر حفظ الإعدادات' : 'Failed to save settings'), true);
      }
    } catch (err) {
      console.error(err);
      notify(lang === 'ar' ? 'خطأ في الاتصال بالسيرفر' : 'Network error saving settings', true);
    }
  };

  // Filtered Recharges for Audit Ledger Tab
  const filteredRecharges = useMemo(() => {
    return (recharges || []).filter(r => {
      if (rechargeFilter.operator && String(r.operator_id) !== String(rechargeFilter.operator)) {
        return false;
      }
      if (rechargeFilter.status && r.status !== rechargeFilter.status) {
        return false;
      }
      if (rechargeFilter.search) {
        const q = rechargeFilter.search.toLowerCase().trim();
        const phone = (r.phone_number || '').toLowerCase();
        const ref = (r.recharge_ref || '').toLowerCase();
        const dealer = (r.dealer_name || '').toLowerCase();
        const biz = (r.business_name || '').toLowerCase();
        if (!phone.includes(q) && !ref.includes(q) && !dealer.includes(q) && !biz.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [recharges, rechargeFilter]);

  // Recharges Table Columns (Shared for Dashboard & Full Ledger)
  const rechargeColumns = useMemo(() => [
    {
      key: 'recharge_ref',
      header: lang === 'ar' ? 'رقم المرجع والوقت' : 'Ref & Time',
      sortKey: 'id',
      render: (r) => (
        <div>
          <div style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--text-primary)' }}>{r.recharge_ref}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.created_at}</div>
        </div>
      )
    },
    {
      key: 'dealer_name',
      header: lang === 'ar' ? 'الموزع / المحل' : 'Dealer / Store',
      sortKey: 'dealer_name',
      render: (r) => (
        <div>
          <div style={{ fontWeight: '700' }}>{r.dealer_name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.business_name}</div>
        </div>
      )
    },
    {
      key: 'operator_name',
      header: lang === 'ar' ? 'الشبكة' : 'Operator',
      sortKey: 'operator_name',
      render: (r) => (
        <span style={{
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '700',
          backgroundColor: `${r.operator_color}18`,
          color: r.operator_color
        }}>
          {lang === 'ar' ? r.operator_name_ar : r.operator_name}
        </span>
      )
    },
    {
      key: 'phone_number',
      header: lang === 'ar' ? 'رقم الزبون' : 'Customer Phone',
      sortKey: 'phone_number',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '13.5px' }}>
          {r.phone_number}
        </span>
      )
    },
    {
      key: 'face_value',
      header: lang === 'ar' ? 'قيمة الشحن' : 'Face Value',
      sortKey: 'face_value',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>
          {parseFloat(r.face_value).toLocaleString()} {currencyLabel}
        </span>
      )
    },
    {
      key: 'commission_amount',
      header: lang === 'ar' ? 'العمولة المقتطعة' : 'Commission',
      sortKey: 'commission_amount',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--algeria-green)' }}>
          -{parseFloat(r.commission_amount).toLocaleString()} {currencyLabel} ({r.commission_pct}%)
        </span>
      )
    },
    {
      key: 'net_debited',
      header: lang === 'ar' ? 'المخصوم من المحفظة' : 'Net Debited',
      sortKey: 'net_debited',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: '13.5px', color: 'var(--text-primary)' }}>
          {parseFloat(r.net_debited).toLocaleString()} {currencyLabel}
        </span>
      )
    },
    {
      key: 'dealer_profit',
      header: lang === 'ar' ? 'ربح الموزع' : 'Dealer Profit',
      sortKey: 'dealer_profit',
      render: (r) => (
        <span style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--algeria-green)' }}>
          +{parseFloat(r.dealer_profit).toLocaleString()} {currencyLabel}
        </span>
      )
    },
    {
      key: 'status',
      header: lang === 'ar' ? 'الحالة' : 'Status',
      sortKey: 'status',
      render: (r) => (
        <span className={`badge ${
          r.status === 'success' ? 'badge-success' : r.status === 'pending' ? 'badge-pending' : 'badge-failed'
        }`}>
          {r.status}
        </span>
      )
    },
    {
      key: 'dispute_action',
      header: lang === 'ar' ? 'تسجيل نزاع / Dispute' : 'Dispute Action',
      align: 'center',
      render: (r) => {
        if (r.complaint_id || r.complaint_status) {
          const isInvestigating = r.complaint_status === 'investigating';
          return (
            <button
              onClick={() => setActiveTab('complaints')}
              title={lang === 'ar' ? 'انقر للانتقال إلى مركز النزاعات ومتابعة التذكرة' : 'Click to jump to Dispute Center'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: isInvestigating ? 'rgba(247, 127, 0, 0.15)' : 'rgba(0, 135, 68, 0.15)',
                border: isInvestigating ? '1px solid rgba(247, 127, 0, 0.4)' : '1px solid rgba(0, 135, 68, 0.4)',
                color: isInvestigating ? '#f77f00' : 'var(--algeria-green)',
                fontWeight: '800',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              <LifeBuoy style={{ width: '13px', height: '13px' }} />
              <span>{isInvestigating ? (lang === 'ar' ? 'قيد التحقيق 🔍' : 'Investigating 🔍') : (lang === 'ar' ? 'تمت التسوية' : 'Settled')}</span>
            </button>
          );
        }

        return (
          <button
            onClick={() => handleOpenBookDispute(r)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(214, 40, 40, 0.12)',
              border: '1px solid rgba(214, 40, 40, 0.35)',
              color: 'var(--algeria-red)',
              fontWeight: '800',
              fontSize: '11.5px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <AlertTriangle style={{ width: '13px', height: '13px' }} />
            <span>{lang === 'ar' ? 'تسجيل نزاع' : 'Book Dispute'}</span>
          </button>
        );
      }
    }
  ], [lang, currencyLabel]);

  // Dealers Table Columns
  const dealerColumns = [
    {
      key: 'id',
      header: 'ID',
      sortKey: 'id',
      render: (d) => <span style={{ color: 'var(--text-muted)' }}>#{d.id}</span>
    },
    {
      key: 'full_name',
      header: lang === 'ar' ? 'الموزع / المحل' : 'Dealer / Store',
      sortKey: 'full_name',
      render: (d) => (
        <div>
          <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{d.full_name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.business_name}</div>
        </div>
      )
    },
    {
      key: 'phone',
      header: lang === 'ar' ? 'رقم الهاتف' : 'Phone',
      sortKey: 'phone',
      render: (d) => <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{d.phone}</span>
    },
    {
      key: 'wilaya',
      header: lang === 'ar' ? 'الولاية والبلدية' : 'Wilaya & Commune',
      sortKey: 'wilaya',
      render: (d) => <span>{d.wilaya} {d.commune ? `- ${d.commune}` : ''}</span>
    },
    {
      key: 'wallet_balance',
      header: lang === 'ar' ? 'رصيد المحفظة المتوفر' : 'Wallet Balance',
      sortKey: 'wallet_balance',
      render: (d) => (
        <span style={{ fontFamily: 'monospace', fontWeight: '900', color: 'var(--algeria-green)', fontSize: '15px' }}>
          {parseFloat(d.wallet_balance || 0).toLocaleString()} {currencyLabel}
        </span>
      )
    },
    {
      key: 'credit_limit',
      header: lang === 'ar' ? 'السقف الائتماني' : 'Credit Limit',
      sortKey: 'credit_limit',
      render: (d) => (
        <span style={{ fontFamily: 'monospace', fontWeight: '600', color: 'var(--text-secondary)' }}>
          {parseFloat(d.credit_limit || 0).toLocaleString()} {currencyLabel}
        </span>
      )
    },
    {
      key: 'status',
      header: lang === 'ar' ? 'الحالة' : 'Status',
      sortKey: 'status',
      render: (d) => (
        <span className={`badge ${
          d.status === 'active' ? 'badge-success' : d.status === 'pending' ? 'badge-pending' : 'badge-failed'
        }`}>
          {d.status}
        </span>
      )
    },
    {
      key: 'actions',
      header: lang === 'ar' ? 'الإجراءات' : 'Actions',
      align: 'center',
      render: (d) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={() => openDealerLedger(d)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface-alt)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <History style={{ width: '14px', height: '14px', color: 'var(--algeria-green)' }} />
            <span>{lang === 'ar' ? 'السجل' : 'Ledger'}</span>
          </button>
          {d.status === 'pending' ? (
            <>
              <button
                onClick={() => handleApproveDealer(d.id, 'active')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--algeria-green)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {lang === 'ar' ? 'موافقة وتفعيل' : 'Approve'}
              </button>
              <button
                onClick={() => handleApproveDealer(d.id, 'rejected')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--algeria-red-light)',
                  color: 'var(--algeria-red)',
                  fontWeight: '700',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {lang === 'ar' ? 'رفض' : 'Reject'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setBalanceModal({ open: true, dealer: d, amount: '', type: 'credit', notes: '' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface-alt)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <PlusCircle style={{ width: '14px', height: '14px', color: 'var(--algeria-green)' }} />
              <span>{lang === 'ar' ? 'شحن / تعديل الرصيد' : 'Adjust Wallet'}</span>
            </button>
          )}
        </div>
      )
    }
  ];

  // Top-Up Requests Columns
  const topupColumns = useMemo(() => [
    {
      key: 'request_ref',
      header: lang === 'ar' ? 'المرجع والوقت' : 'Ref & Time',
      sortKey: 'id',
      render: (tr) => <div style={{ fontFamily: 'monospace', fontWeight: '700' }}>{tr.request_ref}</div>
    },
    {
      key: 'dealer_name',
      header: lang === 'ar' ? 'الموزع' : 'Dealer',
      sortKey: 'dealer_name',
      render: (tr) => (
        <div>
          <div style={{ fontWeight: '800' }}>{tr.dealer_name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tr.dealer_phone}</div>
        </div>
      )
    },
    {
      key: 'amount',
      header: lang === 'ar' ? 'المبلغ المطلوب' : 'Requested Amount',
      sortKey: 'amount',
      render: (tr) => (
        <span style={{ fontFamily: 'monospace', fontWeight: '900', color: 'var(--algeria-green)', fontSize: '16px' }}>
          {parseFloat(tr.amount).toLocaleString()} {currencyLabel}
        </span>
      )
    },
    {
      key: 'payment_method',
      header: lang === 'ar' ? 'طريقة الدفع' : 'Payment Method',
      sortKey: 'payment_method',
      render: (tr) => (
        <span style={{ padding: '4px 10px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-alt)', border: '1px solid var(--border-subtle)', fontWeight: '700', fontSize: '12px' }}>
          {tr.payment_method.replace('_', ' ').toUpperCase()}
        </span>
      )
    },
    {
      key: 'proof_reference',
      header: lang === 'ar' ? 'إيصال / مرجع الدفع' : 'Payment Proof',
      sortKey: 'proof_reference',
      render: (tr) => <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{tr.proof_reference || '-'}</span>
    },
    {
      key: 'status',
      header: lang === 'ar' ? 'الحالة' : 'Status',
      sortKey: 'status',
      render: (tr) => (
        <span className={`badge ${
          tr.status === 'approved' ? 'badge-success' : tr.status === 'pending' ? 'badge-pending' : 'badge-failed'
        }`}>
          {tr.status}
        </span>
      )
    },
    {
      key: 'actions',
      header: lang === 'ar' ? 'الإجراء' : 'Actions',
      align: 'center',
      render: (tr) => (
        <div style={{ textAlign: 'center' }}>
          {tr.status === 'pending' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <button
                onClick={() => handleTopupDecision(tr.id, 'approved')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--algeria-green)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {lang === 'ar' ? 'تأكيد وشحن المحفظة' : 'Approve & Credit'}
              </button>
              <button
                onClick={() => handleTopupDecision(tr.id, 'rejected')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--algeria-red-light)',
                  color: 'var(--algeria-red)',
                  fontWeight: '700',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {lang === 'ar' ? 'رفض' : 'Reject'}
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
              {lang === 'ar' ? 'تمت المعالجة' : 'Processed'}
            </span>
          )}
        </div>
      )
    }
  ], [lang, currencyLabel]);

  // Complaints / Dispute Center Columns
  const complaintColumns = useMemo(() => [
    {
      key: 'ticket_ref',
      header: lang === 'ar' ? 'رقم التذكرة' : 'Ticket Ref',
      sortKey: 'id',
      render: (c) => <span style={{ fontFamily: 'monospace', fontWeight: '800' }}>{c.ticket_ref}</span>
    },
    {
      key: 'dealer_name',
      header: lang === 'ar' ? 'الموزع' : 'Dealer',
      sortKey: 'dealer_name',
      render: (c) => <span style={{ fontWeight: '700' }}>{c.dealer_name}</span>
    },
    {
      key: 'phone_number',
      header: lang === 'ar' ? 'رقم الهاتف المتنازع عليه' : 'Disputed Phone',
      sortKey: 'phone_number',
      render: (c) => <span style={{ fontFamily: 'monospace', fontWeight: '800' }}>{c.phone_number}</span>
    },
    {
      key: 'subject',
      header: lang === 'ar' ? 'الموضوع والملاحظات' : 'Subject & Description',
      sortKey: 'subject',
      render: (c) => (
        <div>
          <div style={{ fontWeight: '700' }}>{c.subject}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.description}</div>
          {c.admin_response && (
            <div style={{ fontSize: '11px', color: 'var(--algeria-green)', fontWeight: '700', marginTop: '4px' }}>
              {lang === 'ar' ? 'رد الإدارة:' : 'Admin Note:'} {c.admin_response}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'net_debited',
      header: lang === 'ar' ? 'المبلغ المقتطع' : 'Net Debited',
      sortKey: 'net_debited',
      render: (c) => (
        <span style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--text-primary)' }}>
          {c.net_debited ? `${parseFloat(c.net_debited).toLocaleString()} ${currencyLabel}` : '-'}
        </span>
      )
    },
    {
      key: 'status',
      header: lang === 'ar' ? 'الحالة' : 'Status',
      sortKey: 'status',
      render: (c) => (
        <span className={`badge ${
          c.status.includes('resolved') ? 'badge-success' : c.status === 'investigating' ? 'badge-pending' : 'badge-failed'
        }`}>
          {c.status.replace('_', ' ').toUpperCase()}
        </span>
      )
    },
    {
      key: 'actions',
      header: lang === 'ar' ? 'الإجراء' : 'Actions',
      align: 'center',
      render: (c) => (
        <div style={{ textAlign: 'center' }}>
          {!c.status.includes('resolved') ? (
            <button
              onClick={() => setComplaintModal({ open: true, ticket: c, status: 'resolved_refunded', response: 'Refund approved by admin', refund: true })}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--algeria-green)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '12px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {lang === 'ar' ? 'معالجة واسترجاع للمحفظة' : 'Resolve & Refund'}
            </button>
          ) : (
            <span style={{ color: 'var(--algeria-green)', fontWeight: '700', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle style={{ width: '14px', height: '14px' }} />
              <span>{lang === 'ar' ? 'تمت التسوية' : 'Settled'}</span>
            </span>
          )}
        </div>
      )
    }
  ], [lang, currencyLabel]);

  const dealerLedgerColumns = useMemo(() => [
    {
      key: 'created_at',
      header: lang === 'ar' ? 'التاريخ' : 'Date',
      sortKey: 'created_at',
      render: (transaction) => <span style={{ whiteSpace: 'nowrap' }}>{transaction.created_at}</span>
    },
    {
      key: 'type',
      header: lang === 'ar' ? 'النوع' : 'Type',
      sortKey: 'type',
      render: (transaction) => {
        const isCredit = ['credit_topup', 'commission_credit', 'refund', 'refund_credit'].includes(transaction.type);
        const typeLabel = {
          credit_topup: lang === 'ar' ? 'إضافة رصيد' : 'Wallet credit',
          recharge_debit: lang === 'ar' ? 'خصم شحن' : 'Recharge debit',
          commission_credit: lang === 'ar' ? 'عمولة' : 'Commission',
          refund: lang === 'ar' ? 'استرجاع' : 'Refund',
          refund_credit: lang === 'ar' ? 'استرجاع' : 'Refund',
          adjustment: lang === 'ar' ? 'تعديل' : 'Adjustment'
        }[transaction.type] || transaction.type;
        return (
          <span style={{ color: isCredit ? 'var(--algeria-green)' : 'var(--algeria-red)', fontWeight: '800', whiteSpace: 'nowrap' }}>
            {typeLabel}
          </span>
        );
      }
    },
    {
      key: 'amount',
      header: lang === 'ar' ? 'المبلغ' : 'Amount',
      sortKey: 'amount',
      render: (transaction) => (
        <span style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontWeight: '800' }}>
          {parseFloat(transaction.amount).toLocaleString()} {currencyLabel}
        </span>
      )
    },
    {
      key: 'balance_before',
      header: lang === 'ar' ? 'الرصيد قبل' : 'Before',
      sortKey: 'balance_before',
      render: (transaction) => <span style={{ whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{parseFloat(transaction.balance_before).toLocaleString()}</span>
    },
    {
      key: 'balance_after',
      header: lang === 'ar' ? 'الرصيد بعد' : 'After',
      sortKey: 'balance_after',
      render: (transaction) => <span style={{ whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{parseFloat(transaction.balance_after).toLocaleString()}</span>
    },
    {
      key: 'notes',
      header: lang === 'ar' ? 'الوصف' : 'Description',
      sortKey: 'notes',
      cellStyle: { minWidth: '200px' },
      render: (transaction) => (
        <div>
          <div>{transaction.notes || '—'}</div>
          <small style={{ color: 'var(--text-muted)' }}>{transaction.transaction_ref}</small>
        </div>
      )
    }
  ], [lang, currencyLabel]);

  return (
    <div className="erp-container">
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: lang === 'ar' ? 'auto' : '24px',
          left: lang === 'ar' ? '24px' : 'auto',
          zIndex: 9999,
          padding: '14px 22px',
          borderRadius: '14px',
          backgroundColor: notification.isError ? '#d21034' : '#008744',
          color: '#ffffff',
          fontWeight: '700',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)'
        }}>
          {notification.isError ? <AlertTriangle style={{ width: '18px', height: '18px' }} /> : <CheckCircle style={{ width: '18px', height: '18px' }} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Horizontal Menu Bar Directly Under the Header */}
      <nav className="horizontal-nav-bar">
        {/* Horizontal Navigation Items */}
        <div className="horizontal-nav-menu">
          {[
            { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
            { id: 'dealers', label: t.navDealers, icon: Users, badge: stats?.pending_dealers },
            { id: 'recharges', label: t.navRecharges, icon: History },
            { id: 'topups', label: t.navTopups, icon: CreditCard, badge: stats?.pending_topups },
            { id: 'commissions', label: t.navCommissions, icon: Percent },
            { id: 'complaints', label: t.navComplaints, icon: LifeBuoy, badge: stats?.open_complaints },
            { id: 'settings', label: t.navSettings, icon: Settings }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`horizontal-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon style={{ width: '16px', height: '16px' }} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '800',
                    backgroundColor: isActive ? '#ffffff' : '#d21034',
                    color: isActive ? '#008744' : '#ffffff'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Horizontal Ticker with Operators Dropdown & Live Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Operator Rates Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              id="btn-operator-rates-dropdown"
              onClick={() => setOpDropdownOpen(!opDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: opDropdownOpen ? 'var(--algeria-green)' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#008744' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d21034' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ed1c24' }} />
              </div>
              <span>{lang === 'ar' ? 'نسب العمولات' : 'Commissions'}</span>
              <span style={{ color: '#34d399', fontFamily: 'monospace', fontWeight: '800' }}>
                5% / 4.5% / 5.2%
              </span>
              <ChevronDown style={{ width: '14px', height: '14px', transform: opDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Dropdown Menu Popup */}
            {opDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                [lang === 'ar' ? 'left' : 'right']: 0,
                zIndex: 100,
                width: '280px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: '14px',
                padding: '12px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
                animation: 'modalPop 0.15s ease-out'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {lang === 'ar' ? 'نسب العمولات المقتطعة' : 'Commission Discount Rates'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {lang === 'ar' ? 'خصم فوري' : 'Instant Discount'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {operators.map(op => (
                    <div key={op.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface-alt)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: op.color_hex }} />
                        <div>
                          <strong style={{ fontSize: '12px', display: 'block', color: 'var(--text-primary)' }}>
                            {lang === 'ar' ? op.name_ar : op.name}
                          </strong>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {op.prefixes}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'end' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--algeria-green)', fontFamily: 'monospace' }}>
                          {op.default_commission_pct}%
                        </strong>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block' }}>
                          {lang === 'ar' ? 'عمولة' : 'Discount'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setActiveTab('commissions');
                    setOpDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--algeria-green-light)',
                    color: 'var(--algeria-green)',
                    fontWeight: '800',
                    fontSize: '11.5px',
                    border: '1px solid rgba(0,135,68,0.2)',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {lang === 'ar' ? '⚙️ تعديل نسب العمولات والحدود' : '⚙️ Configure Commission Rules'}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={loadAllData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            title="Refresh"
          >
            <RefreshCw style={{ width: '13px', height: '13px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>{lang === 'ar' ? 'تحديث' : 'Sync'}</span>
          </button>
        </div>
      </nav>

      {/* Expansive Main Content Area */}
      <main className="erp-main">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Welcome Banner */}
            <div className="welcome-hero-banner">
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  {lang === 'ar' ? 'مرحباً، مدير رازيق تليكوم (Algiers HQ)' : 'Welcome, Razik Telecom Administrator'}
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  {lang === 'ar' 
                    ? 'منصة توزيع الرصيد المباشرة: إدارة الموزعين، متابعة الأرصدة الإجمالية، واحتساب العمولات الفورية'
                    : 'Real-time multi-operator distribution platform: Dealer wallets, wholesale quotas, and auto commissions.'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  id="btn-admin-open-qr"
                  onClick={onOpenQrModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    backgroundColor: '#f59e0b',
                    color: '#0f172a',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  <Smartphone style={{ width: '16px', height: '16px' }} />
                  <span>{lang === 'ar' ? 'ربط تطبيق الهاتف (QR)' : 'Connect Mobile POS (QR)'}</span>
                </button>

                <button
                  onClick={loadAllData}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--algeria-green)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 135, 68, 0.25)'
                  }}
                >
                  <RefreshCw style={{ width: '15px', height: '15px' }} />
                  <span>{lang === 'ar' ? 'تحديث البيانات' : 'Sync Live Data'}</span>
                </button>
              </div>
            </div>

            {/* Metric KPI Cards (Full Width Grid) */}
            <div className="kpi-grid">
              {/* Total Recharge Sales */}
              <div className="kpi-card green">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    {t.todaySales}
                  </span>
                  <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'var(--algeria-green-light)', color: 'var(--algeria-green)' }}>
                    <TrendingUp style={{ width: '20px', height: '20px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                    {parseFloat(stats?.all_time?.total_volume ?? stats?.today?.total_volume ?? 0).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)' }}>{currencyLabel}</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                  {stats?.all_time?.total_count || 0} {lang === 'ar' ? 'عملية إجمالية' : 'total operations'}
                  {stats?.today?.total_count > 0 && ` (${stats.today.total_count} ${lang === 'ar' ? 'اليوم' : 'today'} - ${parseFloat(stats.today.total_volume).toLocaleString()} ${currencyLabel})`}
                </span>
              </div>

              {/* Total Commission Paid */}
              <div className="kpi-card gold">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    {t.commissionEarned}
                  </span>
                  <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'var(--algeria-gold-light)', color: 'var(--algeria-gold)' }}>
                    <Percent style={{ width: '20px', height: '20px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'monospace', color: 'var(--algeria-gold)' }}>
                    {parseFloat(stats?.all_time?.total_commission ?? stats?.today?.total_commission ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)' }}>{currencyLabel}</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                  {lang === 'ar' ? 'خصم فوري مباشر لمحلات الموزعين' : 'Instant discounts granted to dealers'}
                  {stats?.today?.total_commission > 0 && ` (${parseFloat(stats.today.total_commission).toFixed(2)} ${currencyLabel} ${lang === 'ar' ? 'اليوم' : 'today'})`}
                </span>
              </div>

              {/* Active Dealers */}
              <div className="kpi-card blue">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    {t.totalDealers}
                  </span>
                  <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                    <Users style={{ width: '20px', height: '20px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                    {stats?.dealers_count || 0}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'محل معتمد' : 'stores'}</span>
                </div>
                {stats?.pending_dealers > 0 ? (
                  <span style={{ fontSize: '12px', color: '#d97706', fontWeight: '700', marginTop: '6px', display: 'block' }}>
                    {stats.pending_dealers} {lang === 'ar' ? 'بانتظار الموافقة والتفعيل' : 'pending approval'}
                    {stats?.total_dealer_wallet > 0 && ` • ${parseFloat(stats.total_dealer_wallet).toLocaleString()} ${currencyLabel} ${lang === 'ar' ? 'أرصدة' : 'float'}`}
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                    {lang === 'ar' ? 'جميع الحسابات نشطة' : 'All accounts verified'}
                    {stats?.total_dealer_wallet > 0 && ` • ${parseFloat(stats.total_dealer_wallet).toLocaleString()} ${currencyLabel} ${lang === 'ar' ? 'أرصدة' : 'float'}`}
                  </span>
                )}
              </div>

              {/* Pending Top-ups */}
              <div className="kpi-card purple">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    {t.pendingRequests}
                  </span>
                  <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#faf5ff', color: '#9333ea' }}>
                    <CreditCard style={{ width: '20px', height: '20px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'monospace', color: '#9333ea' }}>
                    {stats?.pending_topups || 0}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'طلبات محفظة' : 'requests'}</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                  {stats?.pending_topup_amount > 0 && (
                    <strong style={{ color: '#9333ea' }}>{parseFloat(stats.pending_topup_amount).toLocaleString()} {currencyLabel} • </strong>
                  )}
                  {lang === 'ar' ? 'تتطلب تأكيد الدفع النقدي أو بريدي موب' : 'Require cash or BaridiMob verification'}
                </span>
              </div>

              {/* Open Complaints */}
              <div className="kpi-card red">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    {t.openTickets}
                  </span>
                  <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'var(--algeria-red-light)', color: 'var(--algeria-red)' }}>
                    <LifeBuoy style={{ width: '20px', height: '20px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'monospace', color: 'var(--algeria-red)' }}>
                    {stats?.open_complaints || 0}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'شكوى مفتوحة' : 'disputes'}</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                  {lang === 'ar' ? 'معالجة فورية مع استرجاع الرصيد' : 'Immediate refund capabilities'}
                </span>
              </div>
            </div>

            {/* Operator Wholesale Balances (Full Width Enterprise Cards) */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck style={{ width: '22px', height: '22px', color: 'var(--algeria-green)' }} />
                  <h2 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    {t.wholesaleBalances}
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {stats?.total_wholesale_balance > 0 && (
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--algeria-green-light)',
                      color: 'var(--algeria-green)',
                      fontSize: '13px',
                      fontWeight: '800'
                    }}>
                      {lang === 'ar' ? 'إجمالي رصيد الجملة:' : 'Total Wholesale Pool:'} {parseFloat(stats.total_wholesale_balance).toLocaleString()} {currencyLabel}
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {lang === 'ar' ? 'الرصيد المشترى بالجملة من طرف رازيق تليكوم لدى المتعاملين' : 'Wholesale credit purchased by Razik Telecom'}
                  </span>
                </div>
              </div>

              <div className="operator-grid">
                {operators.map(op => {
                  const balance = parseFloat(op.balance || 0);
                  const threshold = parseFloat(op.low_balance_threshold || 50000);
                  const maxQuota = 1000000; // 1 Million DZD reference quota
                  const pctRemaining = Math.min(100, Math.round((balance / maxQuota) * 100));
                  const isLow = balance <= threshold;

                  return (
                    <div key={op.id} className="operator-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: op.color_hex }} />
                          <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                            {lang === 'ar' ? op.name_ar : op.name}
                          </h3>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '800',
                          backgroundColor: `${op.color_hex}15`,
                          color: op.color_hex,
                          border: `1px solid ${op.color_hex}30`
                        }}>
                          {op.default_commission_pct}% {lang === 'ar' ? 'عمولة الموزع' : 'Commission'}
                        </span>
                      </div>

                      {/* Large Balance Display */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '12px 0 16px 0' }}>
                        <span style={{ fontSize: '26px', fontWeight: '900', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {balance.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>{currencyLabel}</span>
                      </div>

                      {/* Progress Bar Meter */}
                      <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-surface-hover)', overflow: 'hidden', marginBottom: '12px' }}>
                        <div style={{
                          width: `${pctRemaining}%`,
                          height: '100%',
                          backgroundColor: isLow ? '#d21034' : op.color_hex,
                          borderRadius: '4px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span>{lang === 'ar' ? 'بوادئ الأرقام:' : 'Prefixes:'} <strong style={{ color: 'var(--text-primary)' }}>{op.prefixes}</strong></span>
                        {isLow ? (
                          <span style={{ color: '#d21034', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle style={{ width: '13px', height: '13px' }} />
                            {lang === 'ar' ? 'رصيد منخفض!' : 'Low Balance!'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--algeria-green)', fontWeight: '700' }}>
                            {pctRemaining}% {lang === 'ar' ? 'متوفر' : 'Available'}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
                        <button
                          type="button"
                          onClick={() => setProviderAdjustmentModal({ open: true, operator: op, amount: '', type: 'credit', description: '' })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            flex: 1,
                            padding: '9px 10px',
                            border: '1px solid var(--algeria-green)',
                            borderRadius: '8px',
                            background: 'var(--algeria-green)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          <PlusCircle style={{ width: '15px', height: '15px' }} />
                          {lang === 'ar' ? 'إضافة رصيد' : 'Add Amount'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setProviderAdjustmentModal({ open: true, operator: op, amount: '', type: 'debit', description: '' })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            flex: 1,
                            padding: '9px 10px',
                            border: '1px solid var(--algeria-red)',
                            borderRadius: '8px',
                            background: 'transparent',
                            color: 'var(--algeria-red)',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          <ArrowDownLeft style={{ width: '15px', height: '15px' }} />
                          {lang === 'ar' ? 'خصم رصيد' : 'Remove Amount'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openProviderLedger(op)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            flex: 1,
                            padding: '9px 10px',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '8px',
                            background: 'var(--bg-surface-alt)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          <History style={{ width: '15px', height: '15px' }} />
                          {lang === 'ar' ? 'السجل' : 'Ledger'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Recharges Table (Full Width with DataTable & Book Dispute) */}
            <div className="erp-table-container">
              <div className="erp-table-header">
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    {lang === 'ar' ? 'سجل عمليات الشحن المباشرة والنزاعات (Live Transactions & Disputes)' : 'Live Recharge Transactions & Dispute Booking'}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {lang === 'ar' ? 'جدول سريع متكامل: بحث فوري، فرز الأعمدة، وترقيم الصفحات مع إمكانية فتح نزاع مباشر لكل عملية (Investigating)' : 'High-speed interactive DataTable with live search, sorting, and 1-click dispute booking.'}
                  </span>
                </div>

                <button
                  onClick={() => setActiveTab('recharges')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface-alt)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'var(--algeria-green)',
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'ar' ? 'فتح السجل الكامل والمتقدم' : 'View Full Ledger'}
                </button>
              </div>

              <DataTable
                columns={rechargeColumns}
                data={recharges}
                keyField="id"
                defaultPageSize={10}
                pageSizeOptions={[5, 10, 25, 50]}
                defaultSortField="id"
                defaultSortDir="desc"
                lang={lang}
                searchPlaceholder={lang === 'ar' ? 'بحث فوري في العمليات المباشرة (رقم الهاتف، المرجع، الموزع)...' : 'Search live recharges (phone, ref, dealer)...'}
              />
            </div>

          </div>
        )}

        {/* TAB 2: DEALERS MANAGEMENT */}
        {activeTab === 'dealers' && (
          <div className="erp-table-container">
            <div className="erp-table-header">
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  {t.navDealers}
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {lang === 'ar' ? 'إدارة حسابات الموزعين، اعتماد المحلات الجديدة، وضبط الأرصدة والسقوف الائتمانية' : 'Manage dealer KYC, approvals, wallet balances, and credit limits.'}
                </span>
              </div>
            </div>

            <DataTable
              columns={dealerColumns}
              data={dealers}
              keyField="id"
              defaultPageSize={10}
              pageSizeOptions={[5, 10, 25, 50]}
              defaultSortField="id"
              defaultSortDir="asc"
              lang={lang}
              searchPlaceholder={lang === 'ar' ? 'بحث فوري في الموزعين (الاسم، الهاتف، الولاية)...' : 'Search dealers (name, phone, wilaya)...'}
            />
          </div>
        )}

        {/* TAB 3: RECHARGES AUDIT */}
        {activeTab === 'recharges' && (
          <div className="erp-table-container">
            <div className="erp-table-header">
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  {t.navRecharges}
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {lang === 'ar' ? 'سجل تدقيق كامل لكافة عمليات الشحن المالي ونسب الخصم والربح' : 'Complete financial audit ledger for all mobile recharges and services.'}
                </span>
              </div>

              {/* Multi-Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{ width: '14px', height: '14px', position: 'absolute', top: '10px', left: lang === 'ar' ? 'auto' : '10px', right: lang === 'ar' ? '10px' : 'auto', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'بحث برقم الهاتف، المرجع...' : 'Search phone, ref...'}
                    value={rechargeFilter.search}
                    onChange={(e) => setRechargeFilter(prev => ({ ...prev, search: e.target.value }))}
                    className="filter-input"
                    style={{ paddingLeft: lang === 'ar' ? '12px' : '30px', paddingRight: lang === 'ar' ? '30px' : '12px', width: '220px' }}
                  />
                </div>

                <select
                  value={rechargeFilter.operator}
                  onChange={(e) => setRechargeFilter(prev => ({ ...prev, operator: e.target.value }))}
                  className="filter-input"
                >
                  <option value="">{lang === 'ar' ? 'جميع المتعاملين' : 'All Operators'}</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>{lang === 'ar' ? op.name_ar : op.name}</option>
                  ))}
                </select>

                <select
                  value={rechargeFilter.status}
                  onChange={(e) => setRechargeFilter(prev => ({ ...prev, status: e.target.value }))}
                  className="filter-input"
                >
                  <option value="">{lang === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="reversed">Reversed</option>
                </select>
              </div>
            </div>

            <DataTable
              columns={rechargeColumns}
              data={filteredRecharges}
              keyField="id"
              defaultPageSize={10}
              pageSizeOptions={[5, 10, 25, 50]}
              defaultSortField="id"
              defaultSortDir="desc"
              lang={lang}
              searchPlaceholder={lang === 'ar' ? 'بحث سريع في سجل العمليات والنزاعات...' : 'Fast search recharge ledger & disputes...'}
            />
          </div>
        )}

        {/* TAB 4: TOP-UP REQUESTS */}
        {activeTab === 'topups' && (
          <div className="erp-table-container">
            <div className="erp-table-header">
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  {t.navTopups}
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {lang === 'ar' ? 'طلبات شحن الأرصدة المقدمة من الموزعين (تحصيل نقدي، بريدي موب، أو CCP)' : 'Dealer wallet balance requests requiring administrative confirmation.'}
                </span>
              </div>
            </div>

            <DataTable
              columns={topupColumns}
              data={topupRequests}
              keyField="id"
              defaultPageSize={10}
              pageSizeOptions={[5, 10, 25, 50]}
              defaultSortField="id"
              defaultSortDir="desc"
              lang={lang}
              searchPlaceholder={lang === 'ar' ? 'بحث في طلبات الشحن (الموزع، المرجع، المبلغ)...' : 'Search top-up requests (dealer, ref, amount)...'}
            />
          </div>
        )}

        {/* TAB 5: COMMISSIONS & OPERATOR RULES */}
        {activeTab === 'commissions' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                {t.navCommissions}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {lang === 'ar' ? 'تحديد نسب العمولة المقتطعة تلقائياً للموزعين عند كل شحن (مثال: 5% تخصم 95 د.ج فقط من محفظة الموزع)' : 'Configure operator discount commissions and low-balance warning triggers.'}
              </span>
            </div>

            <div className="operator-grid">
              {operators.map(op => (
                <div key={op.id} className="operator-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: op.color_hex }} />
                      <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>{lang === 'ar' ? op.name_ar : op.name}</h3>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', backgroundColor: 'var(--algeria-green-light)', color: 'var(--algeria-green)' }}>
                      {op.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                        {lang === 'ar' ? 'نسبة العمولة المقتطعة (%)' : 'Default Commission (%)'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={op.default_commission_pct}
                        id={`comm-input-${op.id}`}
                        className="filter-input"
                        style={{ width: '100%', fontSize: '16px', fontWeight: '800', fontFamily: 'monospace' }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                        {lang === 'ar' 
                          ? `شحن 100 د.ج يخصم ${100 - (100 * op.default_commission_pct / 100)} د.ج فقط من رصيد المحل`
                          : `100 DZD recharge deducts ${100 - (100 * op.default_commission_pct / 100)} DZD net from wallet`}
                      </span>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                        {lang === 'ar' ? 'حد تنبيه الرصيد المنخفض (د.ج)' : 'Low Balance Alert Threshold'}
                      </label>
                      <input
                        type="number"
                        defaultValue={op.low_balance_threshold}
                        id={`thresh-input-${op.id}`}
                        className="filter-input"
                        style={{ width: '100%', fontSize: '14px', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-alt)', border: '1px solid var(--border-subtle)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'الرصيد المشترى بالجملة:' : 'Wholesale Available:'}</span>
                        <strong style={{ fontFamily: 'monospace' }}>{parseFloat(op.balance).toLocaleString()} {currencyLabel}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'البوادئ المعتمدة:' : 'Active Prefixes:'}</span>
                        <strong style={{ color: 'var(--algeria-green)', fontFamily: 'monospace' }}>{op.prefixes}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const newComm = document.getElementById(`comm-input-${op.id}`).value;
                        const newThresh = document.getElementById(`thresh-input-${op.id}`).value;
                        handleUpdateCommission(op.id, newComm, newThresh);
                      }}
                      style={{
                        marginTop: '8px',
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--algeria-green)',
                        color: '#ffffff',
                        fontWeight: '800',
                        fontSize: '13px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(0, 135, 68, 0.2)'
                      }}
                    >
                      {lang === 'ar' ? 'حفظ إعدادات المتعامل' : 'Save Operator Settings'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: COMPLAINTS & DISPUTES */}
        {activeTab === 'complaints' && (
          <div className="erp-table-container">
            <div className="erp-table-header">
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  {t.navComplaints}
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {lang === 'ar' ? 'تذاكر شكاوى الموزعين للعمليات المعلقة أو الفاشلة مع إمكانية استرجاع الرصيد بنقرة واحدة' : 'Resolve dealer recharge disputes with one-click wallet refunds.'}
                </span>
              </div>
            </div>

            <DataTable
              columns={complaintColumns}
              data={complaints}
              keyField="id"
              defaultPageSize={10}
              pageSizeOptions={[5, 10, 25, 50]}
              defaultSortField="id"
              defaultSortDir="desc"
              lang={lang}
              searchPlaceholder={lang === 'ar' ? 'بحث في التذاكر والنزاعات (رقم التذكرة، الموزع، الهاتف)...' : 'Search dispute tickets (ticket ref, dealer, phone)...'}
            />
          </div>
        )}

        {/* TAB 7: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="erp-table-container" style={{ padding: '28px', maxWidth: '700px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
              {t.navSettings}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {lang === 'ar' ? 'ضبط المنطقة الزمنية، العملة الرسمية الجزائرية، وصيغة التاريخ والوقت' : 'Configure Algerian timezone, currency DZD, and date formatting.'}
            </p>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {t.timezoneLabel}
                </label>
                <select
                  value={systemSettings.timezone}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, timezone: e.target.value }))}
                  className="filter-input"
                  style={{ width: '100%', fontSize: '14px' }}
                >
                  <option value="Africa/Algiers">Africa/Algiers (UTC+1) - توقيت الجزائر الرسمي</option>
                  <option value="UTC">UTC Standard</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    {t.currencyLabel} (Latin)
                  </label>
                  <input
                    type="text"
                    value={systemSettings.currency}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, currency: e.target.value }))}
                    className="filter-input"
                    style={{ width: '100%', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    رمز العملة بالعربية
                  </label>
                  <input
                    type="text"
                    value={systemSettings.currency_symbol_ar}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, currency_symbol_ar: e.target.value }))}
                    className="filter-input"
                    style={{ width: '100%', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {t.dateFormatLabel}
                </label>
                <input
                  type="text"
                  value={systemSettings.date_format}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, date_format: e.target.value }))}
                  className="filter-input"
                  style={{ width: '100%', fontSize: '14px', fontFamily: 'monospace' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '12px',
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--algeria-green)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 135, 68, 0.25)'
                }}
              >
                {t.saveSettings}
              </button>
            </form>
          </div>
        )}

      </main>

      {/* MODAL: Balance Adjustment */}
      {balanceModal.open && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', color: 'var(--text-primary)' }}>
              {lang === 'ar' ? 'تعديل رصيد محفظة الموزع' : 'Adjust Dealer Wallet Balance'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {balanceModal.dealer?.full_name} ({balanceModal.dealer?.business_name})
            </p>

            <form onSubmit={handleAdjustBalance} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setBalanceModal(prev => ({ ...prev, type: 'credit' }))}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '800',
                    border: '1px solid',
                    cursor: 'pointer',
                    backgroundColor: balanceModal.type === 'credit' ? 'var(--algeria-green)' : 'var(--bg-surface-alt)',
                    color: balanceModal.type === 'credit' ? '#ffffff' : 'var(--text-primary)',
                    borderColor: balanceModal.type === 'credit' ? 'var(--algeria-green)' : 'var(--border-strong)'
                  }}
                >
                  + {lang === 'ar' ? 'إيداع رصيد (شحن)' : 'Credit (Add)'}
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceModal(prev => ({ ...prev, type: 'debit' }))}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '800',
                    border: '1px solid',
                    cursor: 'pointer',
                    backgroundColor: balanceModal.type === 'debit' ? 'var(--algeria-red)' : 'var(--bg-surface-alt)',
                    color: balanceModal.type === 'debit' ? '#ffffff' : 'var(--text-primary)',
                    borderColor: balanceModal.type === 'debit' ? 'var(--algeria-red)' : 'var(--border-strong)'
                  }}
                >
                  - {lang === 'ar' ? 'خصم من الرصيد' : 'Debit (Deduct)'}
                </button>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'المبلغ (د.ج)' : 'Amount (DZD)'}
                </label>
                <input
                  type="number"
                  required
                  placeholder="5000"
                  value={balanceModal.amount}
                  onChange={(e) => setBalanceModal(prev => ({ ...prev, amount: e.target.value }))}
                  className="filter-input"
                  style={{ width: '100%', fontSize: '16px', fontWeight: '800', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'ملاحظة الإدارة' : 'Notes'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'مثال: إيداع نقدي، بريدي موب...' : 'e.g. Cash collection deposit'}
                  value={balanceModal.notes}
                  onChange={(e) => setBalanceModal(prev => ({ ...prev, notes: e.target.value }))}
                  className="filter-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setBalanceModal({ open: false, dealer: null, amount: '', type: 'credit', notes: '' })}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface-alt)', color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer' }}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--algeria-green)', color: '#ffffff', fontWeight: '800', cursor: 'pointer' }}
                >
                  {lang === 'ar' ? 'تأكيد التعديل' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Complaint Resolution */}
      {complaintModal.open && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', color: 'var(--text-primary)' }}>
              {lang === 'ar' ? 'معالجة الشكوى واسترجاع الرصيد' : 'Resolve Dispute & Refund'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {complaintModal.ticket?.ticket_ref} - {complaintModal.ticket?.phone_number}
            </p>

            <form onSubmit={handleResolveTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'قرار المعالجة' : 'Resolution Decision'}
                </label>
                <select
                  value={complaintModal.status}
                  onChange={(e) => setComplaintModal(prev => ({ 
                    ...prev, 
                    status: e.target.value,
                    refund: e.target.value === 'resolved_refunded'
                  }))}
                  className="filter-input"
                  style={{ width: '100%', fontSize: '14px', fontWeight: '700' }}
                >
                  <option value="resolved_refunded">{lang === 'ar' ? 'استرجاع الرصيد للمحفظة فوراً (إلغاء العملية)' : 'Refund to Dealer Wallet'}</option>
                  <option value="resolved_confirmed">{lang === 'ar' ? 'تأكيد وصول الرصيد للزبون' : 'Confirmed Delivered by Operator'}</option>
                  <option value="rejected">{lang === 'ar' ? 'رفض الشكوى' : 'Reject Dispute'}</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'رد الإدارة على الموزع' : 'Admin Response Note'}
                </label>
                <textarea
                  rows="3"
                  required
                  value={complaintModal.response}
                  onChange={(e) => setComplaintModal(prev => ({ ...prev, response: e.target.value }))}
                  className="filter-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setComplaintModal({ open: false, ticket: null, status: 'resolved_confirmed', response: '', refund: false })}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface-alt)', color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer' }}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--algeria-green)', color: '#ffffff', fontWeight: '800', cursor: 'pointer' }}
                >
                  {lang === 'ar' ? 'تطبيق القرار' : 'Apply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Book Dispute */}
      {disputeModal.open && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(214, 40, 40, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--algeria-red)'
              }}>
                <AlertTriangle style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  {lang === 'ar' ? 'تسجيل نزاع لعملية شحن (Book Dispute)' : 'Book Transaction Dispute'}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {lang === 'ar' ? 'الحالة المبدئية للنزاع: قيد التحقيق (Investigating)' : 'Initial Status will be set to: Investigating'}
                </span>
              </div>
            </div>

            {disputeModal.recharge && (
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-surface-alt)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '12.5px'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>{lang === 'ar' ? 'مرجع الشحن' : 'Ref'}:</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{disputeModal.recharge.recharge_ref}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>{lang === 'ar' ? 'رقم الزبون' : 'Phone'}:</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{disputeModal.recharge.phone_number}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>{lang === 'ar' ? 'الموزع' : 'Dealer'}:</span>
                  <strong>{disputeModal.recharge.dealer_name}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>{lang === 'ar' ? 'القيمة والمخصوم' : 'Amount'}:</span>
                  <strong style={{ color: 'var(--algeria-green)' }}>{parseFloat(disputeModal.recharge.face_value).toLocaleString()} {currencyLabel}</strong>
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmBookDispute} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'حالة التذكرة (Status)' : 'Ticket Status'}
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(247, 127, 0, 0.12)',
                  border: '1px solid rgba(247, 127, 0, 0.35)',
                  color: '#f77f00',
                  fontWeight: '800',
                  fontSize: '13px'
                }}>
                  <Clock style={{ width: '16px', height: '16px' }} />
                  <span>{lang === 'ar' ? 'قيد التحقيق الفني مع المتعامل (Investigating)' : 'Investigating (Forwarded to NOC)'}</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'موضوع النزاع' : 'Dispute Subject'}
                </label>
                <input
                  type="text"
                  required
                  value={disputeModal.subject}
                  onChange={(e) => setDisputeModal(prev => ({ ...prev, subject: e.target.value }))}
                  className="filter-input"
                  style={{ width: '100%', fontSize: '13px', fontWeight: '700' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'تفاصيل النزاع والملاحظة الفنية' : 'Dispute Details & Technical Notes'}
                </label>
                <textarea
                  rows="3"
                  required
                  value={disputeModal.description}
                  onChange={(e) => setDisputeModal(prev => ({ ...prev, description: e.target.value }))}
                  className="filter-input"
                  style={{ width: '100%', fontSize: '13px', lineHeight: '1.5' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDisputeModal({ open: false, recharge: null, subject: '', description: '', status: 'investigating' })}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface-alt)', color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer' }}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  style={{ flex: 1.5, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--algeria-red)', color: '#ffffff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <AlertTriangle style={{ width: '16px', height: '16px' }} />
                  <span>{lang === 'ar' ? 'تأكيد النزاع والذهاب للسجل' : 'Confirm Dispute & View Tickets'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {providerAdjustmentModal.open && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', color: 'var(--text-primary)' }}>
              {providerAdjustmentModal.type === 'credit'
                ? (lang === 'ar' ? 'إضافة رصيد للمتعامل' : `Add Balance to ${providerAdjustmentModal.operator?.name}`)
                : (lang === 'ar' ? 'خصم رصيد من المتعامل' : `Debit Balance from ${providerAdjustmentModal.operator?.name}`)}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {lang === 'ar' ? 'الرصيد الحالي:' : 'Current balance:'}{' '}
              <strong>{parseFloat(providerAdjustmentModal.operator?.balance || 0).toLocaleString()} {currencyLabel}</strong>
            </p>

            <form onSubmit={handleAdjustOperatorBalance} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'المبلغ (د.ج)' : 'Amount (DZD)'}
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  autoFocus
                  value={providerAdjustmentModal.amount}
                  onChange={(e) => setProviderAdjustmentModal(prev => ({ ...prev, amount: e.target.value }))}
                  className="filter-input"
                  style={{ width: '100%', fontSize: '16px', fontWeight: '800', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'وصف العملية (إلزامي)' : 'Transaction description (required)'}
                </label>
                <textarea
                  rows="3"
                  required
                  maxLength="2000"
                  value={providerAdjustmentModal.description}
                  onChange={(e) => setProviderAdjustmentModal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={lang === 'ar' ? 'مثال: شحن رصيد من المورد، تسوية...' : 'e.g. Provider payment, balance correction...'}
                  className="filter-input"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  disabled={providerAdjustmentSubmitting}
                  onClick={() => setProviderAdjustmentModal({ open: false, operator: null, amount: '', type: 'credit', description: '' })}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface-alt)', color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer' }}
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={providerAdjustmentSubmitting || !providerAdjustmentModal.amount || !providerAdjustmentModal.description.trim()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: providerAdjustmentModal.type === 'credit' ? 'var(--algeria-green)' : 'var(--algeria-red)',
                    color: '#ffffff',
                    fontWeight: '800',
                    cursor: providerAdjustmentSubmitting ? 'wait' : 'pointer',
                    opacity: providerAdjustmentSubmitting || !providerAdjustmentModal.amount || !providerAdjustmentModal.description.trim() ? 0.6 : 1
                  }}
                >
                  {providerAdjustmentSubmitting
                    ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...')
                    : (lang === 'ar' ? 'تأكيد وحفظ في السجل' : 'Submit & Record in Ledger')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {providerLedgerModal.open && (
        <div className="modal-overlay" onClick={() => setProviderLedgerModal({ open: false, operator: null, transactions: [], loading: false })}>
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
            style={{ width: 'min(900px, 96vw)', maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {lang === 'ar' ? 'سجل حركات رصيد' : 'Provider Balance Ledger'}{' '}
                  {lang === 'ar' ? providerLedgerModal.operator?.name_ar : providerLedgerModal.operator?.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {lang === 'ar' ? 'يشمل الإضافات والخصومات وحركات الشحن.' : 'Credits, debits, and recharge balance movements.'}
                </p>
              </div>
              <button
                type="button"
                aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
                onClick={() => setProviderLedgerModal({ open: false, operator: null, transactions: [], loading: false })}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ overflow: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface-alt)', textAlign: 'left' }}>
                    {[lang === 'ar' ? 'التاريخ' : 'Date', lang === 'ar' ? 'النوع' : 'Type', lang === 'ar' ? 'المبلغ' : 'Amount', lang === 'ar' ? 'الرصيد قبل' : 'Before', lang === 'ar' ? 'الرصيد بعد' : 'After', lang === 'ar' ? 'الوصف' : 'Description'].map((heading) => (
                      <th key={heading} style={{ padding: '10px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {providerLedgerModal.loading ? (
                    <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'جارٍ تحميل السجل...' : 'Loading ledger...'}</td></tr>
                  ) : providerLedgerModal.transactions.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>{lang === 'ar' ? 'لا توجد حركات مسجلة بعد.' : 'No provider transactions recorded yet.'}</td></tr>
                  ) : providerLedgerModal.transactions.map((transaction) => {
                    const isCredit = transaction.type === 'credit';
                    const typeLabel = isCredit
                      ? (lang === 'ar' ? 'إضافة' : 'Credit')
                      : transaction.type === 'debit'
                        ? (lang === 'ar' ? 'خصم' : 'Debit')
                        : (lang === 'ar' ? 'خصم شحن' : 'Recharge');
                    return (
                      <tr key={transaction.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{transaction.created_at}</td>
                        <td style={{ padding: '10px', color: isCredit ? 'var(--algeria-green)' : 'var(--algeria-red)', fontWeight: '800', whiteSpace: 'nowrap' }}>{typeLabel}</td>
                        <td style={{ padding: '10px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{parseFloat(transaction.amount).toLocaleString()} {currencyLabel}</td>
                        <td style={{ padding: '10px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{parseFloat(transaction.balance_before).toLocaleString()}</td>
                        <td style={{ padding: '10px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{parseFloat(transaction.balance_after).toLocaleString()}</td>
                        <td style={{ padding: '10px', minWidth: '200px' }}>
                          <div>{transaction.description}</div>
                          <small style={{ color: 'var(--text-muted)' }}>{transaction.transaction_ref}</small>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {dealerLedgerModal.open && (
        <div className="modal-overlay" onClick={() => setDealerLedgerModal({ open: false, dealer: null, transactions: [], loading: false })}>
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
            style={{ width: 'min(900px, 96vw)', maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {lang === 'ar' ? 'السجل المالي للموزع / المحل' : 'Dealer & Store Wallet Ledger'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <strong>{dealerLedgerModal.dealer?.full_name}</strong>
                  {dealerLedgerModal.dealer?.business_name ? ` · ${dealerLedgerModal.dealer.business_name}` : ''}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {lang === 'ar' ? 'الرصيد الحالي:' : 'Current wallet balance:'}{' '}
                  <strong style={{ color: 'var(--algeria-green)' }}>
                    {parseFloat(dealerLedgerModal.dealer?.wallet_balance || 0).toLocaleString()} {currencyLabel}
                  </strong>
                  {' · '}
                  {lang === 'ar' ? 'السقف الائتماني:' : 'Credit limit:'}{' '}
                  <strong>{parseFloat(dealerLedgerModal.dealer?.credit_limit || 0).toLocaleString()} {currencyLabel}</strong>
                </p>
              </div>
              <button
                type="button"
                aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
                onClick={() => setDealerLedgerModal({ open: false, dealer: null, transactions: [], loading: false })}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ minHeight: 0, overflowY: 'auto' }}>
              <DataTable
                columns={dealerLedgerColumns}
                data={dealerLedgerModal.transactions}
                keyField="id"
                defaultPageSize={10}
                pageSizeOptions={[5, 10, 25, 50]}
                defaultSortField="id"
                defaultSortDir="desc"
                lang={lang}
                searchPlaceholder={lang === 'ar' ? 'بحث في سجل المحفظة...' : 'Search wallet ledger...'}
                emptyMessage={
                  dealerLedgerModal.loading
                    ? (lang === 'ar' ? 'جارٍ تحميل السجل...' : 'Loading ledger...')
                    : (lang === 'ar' ? 'لا توجد حركات مسجلة لهذا المحل.' : 'No wallet transactions recorded for this store.')
                }
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
