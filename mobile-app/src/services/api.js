// React Native API Client
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api';

export const api = {
  login: async (credentials) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },

  collectionDealers: async (token) => {
    const res = await fetch(`${BASE_URL}/collection/dealers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  createCollection: async (payload, token) => {
    const res = await fetch(`${BASE_URL}/collection/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  confirmCollection: async (payload, token) => {
    const res = await fetch(`${BASE_URL}/collection/collections/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  collectionHistory: async (token) => {
    const res = await fetch(`${BASE_URL}/collection/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
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
