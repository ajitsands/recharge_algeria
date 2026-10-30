// ============================================================================
// Razik Telecom - API Client Service
// ============================================================================

const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    // The local PHP server serves the frontend from the project root on port 3031.
    if (window.location.port === '3031') {
      return `${window.location.origin}/backend/index.php/api`;
    }
    // If running in local Vite development mode on port 1001
    if (window.location.port === '1001') {
      return `http://${window.location.hostname}:8000/api`;
    }
    // If deployed on live server (e.g. http://recharge.teamtoob.in/)
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  return 'http://127.0.0.1:8000/api';
};

const API_BASE = getApiBase();

async function request(endpoint, options = {}) {
  try {
    const { headers: requestHeaders = {}, ...requestOptions } = options;
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...requestOptions,
      headers: {
        'Content-Type': 'application/json',
        ...requestHeaders
      }
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn(`API call to ${endpoint} failed, checking fallback:`, err);
    return { success: false, error: err.message, fallback: true };
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  changeDealerPassword: (payload, token) => request('/auth/change-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  // Dashboard Stats
  getStats: () => request('/admin/stats'),

  // Operators
  getOperators: () => request('/operators'),
  updateOperator: (payload) => request('/operators', { method: 'POST', body: JSON.stringify(payload) }),
  adjustOperatorBalance: (payload) => request('/operators/adjust-balance', { method: 'POST', body: JSON.stringify(payload) }),
  getOperatorLedger: (operatorId) => request(`/operators/ledger?operator_id=${encodeURIComponent(operatorId)}`),

  // Dealers
  getDealers: (status) => request(status ? `/dealers?status=${status}` : '/dealers'),
  createDealer: (payload, token) => request('/dealers/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  setDealerStatus: (payload, token) => request('/dealers/status', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  resetDealerPassword: (payload, token) => request('/dealers/reset-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  getDealerLedger: (userId) => request(`/dealers/ledger?user_id=${encodeURIComponent(userId)}`),
  approveDealer: (payload, token) => request('/dealers/approve', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  adjustBalance: (payload) => request('/dealers/adjust-balance', { method: 'POST', body: JSON.stringify(payload) }),

  // Collection agents
  getCollectionAgents: (token) => request('/collection/agents', { headers: { Authorization: `Bearer ${token}` } }),
  createCollectionAgent: (payload, token) => request('/collection/agents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),

  getCollectionDealers: (token) => request('/collection/dealers', { headers: { Authorization: `Bearer ${token}` } }),
  getCollectionHistory: (token) => request('/collection/transactions', { headers: { Authorization: `Bearer ${token}` } }),
  createCollection: (payload, token) => request('/collection/collections', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  confirmCollection: (payload, token) => request('/collection/collections/confirm', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),

  // Recharges
  recharge: (payload) => request('/recharge', { method: 'POST', body: JSON.stringify(payload) }),
  getRecharges: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(q ? `/recharge/history?${q}` : '/recharge/history');
  },

  // Wallet
  requestTopup: (payload) => request('/wallet/request', { method: 'POST', body: JSON.stringify(payload) }),
  getTopupRequests: () => request('/wallet/requests'),
  approveTopup: (payload) => request('/wallet/approve', { method: 'POST', body: JSON.stringify(payload) }),

  // Complaints
  getComplaints: (userId) => request(userId ? `/complaints?user_id=${userId}` : '/complaints'),
  bookComplaint: (payload) => request('/complaints', { method: 'POST', body: JSON.stringify(payload) }),
  resolveComplaint: (payload, token) => request('/complaints/resolve', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),
  undoComplaintRefund: (payload, token) => request('/complaints/undo-refund', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (payload) => request('/settings', { method: 'POST', body: JSON.stringify(payload) })
};
