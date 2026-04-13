const API_BASE = '/api';

type User = { id: number; email: string; role: 'student' | 'teacher' | 'admin'; xp: number; level: number; avatar?: string };

const tokenKey = 'edunexus_token';
const userKey = 'edunexus_user';

const token = () => localStorage.getItem(tokenKey) || '';
const setSession = (t: string, u: User) => {
  localStorage.setItem(tokenKey, t);
  localStorage.setItem(userKey, JSON.stringify(u));
};
const getUser = (): User | null => {
  const raw = localStorage.getItem(userKey);
  return raw ? JSON.parse(raw) : null;
};
const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

async function jsonFetch(url: string, options: RequestInit = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

function textSafe(value: string) {
  return value.replace(/[<>]/g, '');
}

async function init() {
  const page = document.body.dataset.page;
  if (page === 'register') initRegister();
  if (page === 'login') initLogin();
  if (page === 'home') initGuestUpload();
  if (page === 'dashboard') initDashboard();
  if (page === 'profile') initProfile();
}

function initRegister() { /* same as app.js */ }
function initLogin() { /* same as app.js */ }
function initGuestUpload() { /* same as app.js */ }
function initDashboard() { /* same as app.js */ }
function initProfile() { /* same as app.js */ }

document.addEventListener('DOMContentLoaded', init);
