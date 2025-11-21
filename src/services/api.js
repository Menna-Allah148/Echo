// src/services/api.js
import dataStore from '../utils/dataStore';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

function getAuthToken() {
  // Replace with your AuthContext/token store as needed
  return localStorage.getItem('authToken') || null;
}

async function request(path, opts = {}) {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  const headers = { ...(opts.headers || {}) };

  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // let FormData pass through
  let body = opts.body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const res = await fetch(url, { ...opts, headers, body, credentials: 'include' });
  const text = await res.text();
  if (!res.ok) {
    const msg = text || `API error ${res.status}`;
    throw new Error(msg);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? JSON.parse(text || '{}') : text;
}

const api = {
  cases: {
    list: (query = '') => request(`/api/cases${query ? `?${query}` : ''}`, { method: 'GET' }),
    get: (id) => request(`/api/cases/${id}`, { method: 'GET' }),
    create: (formData) => {
      const url = API_BASE ? `${API_BASE}/api/cases` : `/api/cases`;
      const headers = {};
      const token = getAuthToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      return fetch(url, { method: 'POST', body: formData, headers, credentials: 'include' })
        .then(async r => {
          const t = await r.text();
          if (!r.ok) throw new Error(t || `Upload failed (${r.status})`);
          try { return JSON.parse(t || '{}'); } catch { return { raw: t }; }
        });
    },
    delete: (id) => request(`/api/cases/${id}`, { method: 'DELETE' })
  },
  analysis: {
    getResults: (id) => request(`/api/cases/${id}/results`, { method: 'GET' })
  },
  patients: {
    list: () => request(`/api/patients`, { method: 'GET' }),
    get: (medicalId) => request(`/api/patients/${medicalId}`, { method: 'GET' })
  }
};

export default api;