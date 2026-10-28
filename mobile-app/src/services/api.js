// React Native API Client
const BASE_URL = 'http://10.0.2.2:8000/api'; // Android Emulator default loopback or production VPS IP

export const api = {
  login: async (credentials) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },

  recharge: async (payload) => {
    const res = await fetch(`${BASE_URL}/recharge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  getHistory: async (userId) => {
    const res = await fetch(`${BASE_URL}/recharge/history?user_id=${userId}`);
    return res.json();
  },

  requestTopup: async (payload) => {
    const res = await fetch(`${BASE_URL}/wallet/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  bookComplaint: async (payload) => {
    const res = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }
};
