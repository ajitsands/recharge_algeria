// ============================================================================
// Razik Telecom - API Client Service
// ============================================================================

const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
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
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
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
  getDealerLedger: (userId) => request(`/dealers/ledger?user_id=${encodeURIComponent(userId)}`),
  approveDealer: (payload) => request('/dealers/approve', { method: 'POST', body: JSON.stringify(payload) }),
  adjustBalance: (payload) => request('/dealers/adjust-balance', { method: 'POST', body: JSON.stringify(payload) }),

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
  resolveComplaint: (payload) => request('/complaints/resolve', { method: 'POST', body: JSON.stringify(payload) }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (payload) => request('/settings', { method: 'POST', body: JSON.stringify(payload) })
};
