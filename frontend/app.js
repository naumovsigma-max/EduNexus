const API_BASE = '/api';
const tokenKey = 'edunexus_token';
const userKey = 'edunexus_user';

const token = () => localStorage.getItem(tokenKey) || '';
const setSession = (t, u) => {
  localStorage.setItem(tokenKey, t);
  localStorage.setItem(userKey, JSON.stringify(u));
};
const getUser = () => {
  const raw = localStorage.getItem(userKey);
  return raw ? JSON.parse(raw) : null;
};
const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

function textSafe(value) {
  return String(value || '').replace(/[<>]/g, '');
}

function initRegister() {
  const form = document.getElementById('register-form');
  const msg = document.getElementById('register-msg');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(form);
      await jsonFetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fd.get('email'), password: fd.get('password'), role: fd.get('role') }),
      });
      msg.textContent = 'Успешно. Теперь войдите.';
    } catch (err) { msg.textContent = err.message; }
  });
}

function initLogin() {
  const form = document.getElementById('login-form');
  const msg = document.getElementById('login-msg');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(form);
      const data = await jsonFetch(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
      });
      setSession(data.token, data.user);
      window.location.href = '/dashboard.html';
    } catch (err) { msg.textContent = err.message; }
  });
}

function initGuestUpload() {
  const form = document.getElementById('guest-material-form');
  const msg = document.getElementById('guest-material-msg');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(form);
      await fetch(`${API_BASE}/materials/guest-upload`, { method: 'POST', body: fd }).then(async (r) => {
        const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Ошибка');
      });
      msg.textContent = 'Материал отправлен на модерацию.';
      form.reset();
    } catch (err) { msg.textContent = err.message; }
  });
}

async function loadMaterials() {
  const list = document.getElementById('materials-list');
  if (!list) return;
  const rows = await jsonFetch(`${API_BASE}/materials`);
  list.innerHTML = rows.map((m) => `<div class="item"><div class="row"><b>${textSafe(m.title)}</b><span class="badge">${textSafe(m.category || 'без категории')}</span></div><p class="small">${textSafe(m.description)}</p><a class="button secondary" href="/uploads/${textSafe(m.file_path)}" target="_blank">Скачать</a></div>`).join('') || '<p class="small">Материалов пока нет.</p>';
}

async function loadTests() {
  const list = document.getElementById('tests-list');
  if (!list) return;
  const tests = await jsonFetch(`${API_BASE}/tests`, { headers: authHeaders() });
  list.innerHTML = tests.map((t) => `<div class="item row"><span>${textSafe(t.title)}</span><button data-pass="${t.id}">Пройти (1-й вариант)</button></div>`).join('') || '<p class="small">Тестов пока нет.</p>';
  list.querySelectorAll('[data-pass]').forEach((btn) => btn.addEventListener('click', async () => {
    try {
      const id = btn.getAttribute('data-pass');
      const result = await jsonFetch(`${API_BASE}/tests/${id}/attempt`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: [0,0,0,0] })
      });
      alert(`Результат: ${result.score}/${result.maxScore}, +${result.xpGain} XP`);
    } catch (e) { alert(e.message); }
  }));
}

async function loadLeaderboard() {
  const list = document.getElementById('leaderboard');
  if (!list) return;
  const rows = await jsonFetch(`${API_BASE}/users/leaderboard`, { headers: authHeaders() });
  list.innerHTML = rows.map((u, i) => `<div class="item row"><span>#${i + 1} ${textSafe(u.email)}</span><span class="accent">XP ${u.xp} • LVL ${u.level}</span></div>`).join('') || '<p class="small">Нет данных.</p>';
}

async function loadModeration() {
  const panel = document.getElementById('admin-panel');
  const list = document.getElementById('moderation-list');
  const user = getUser();
  if (user?.role !== 'admin') return;
  panel.classList.remove('hidden');
  const rows = await jsonFetch(`${API_BASE}/materials?status=pending`);
  list.innerHTML = rows.map((m) => `<div class="item"><b>${textSafe(m.title)}</b><div class="row"><button data-mod="approved:${m.id}">Одобрить</button><button class="secondary" data-mod="rejected:${m.id}">Отклонить</button></div></div>`).join('') || '<p class="small">На модерации пусто.</p>';
  list.querySelectorAll('[data-mod]').forEach((btn) => btn.addEventListener('click', async () => {
    const [action, id] = btn.getAttribute('data-mod').split(':');
    await jsonFetch(`${API_BASE}/materials/${id}/moderate`, {
      method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ action })
    });
    await loadModeration();
    await loadMaterials();
  }));
}

function initDashboard() {
  const user = getUser();
  if (!user || !token()) {
    window.location.href = '/login.html';
    return;
  }
  const who = document.getElementById('whoami');
  who.textContent = `Вы вошли как ${user.email} (${user.role})`;

  document.getElementById('logout')?.addEventListener('click', () => {
    localStorage.removeItem(tokenKey); localStorage.removeItem(userKey);
    window.location.href = '/login.html';
  });

  document.getElementById('material-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const msg = document.getElementById('material-msg');
    try {
      const fd = new FormData(form);
      const r = await fetch(`${API_BASE}/materials/upload`, { method: 'POST', headers: authHeaders(), body: fd });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Ошибка');
      msg.textContent = 'Отправлено на модерацию.';
      form.reset();
    } catch (err) { msg.textContent = err.message; }
  });

  document.getElementById('test-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const form = e.currentTarget;
      const fd = new FormData(form);
      const questions = JSON.parse(String(fd.get('questions') || '[]'));
      await jsonFetch(`${API_BASE}/tests`, {
        method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: fd.get('title'), questions }),
      });
      form.reset();
      await loadTests();
    } catch { alert('Неверный JSON вопросов.'); }
  });

  loadMaterials();
  loadTests();
  loadLeaderboard();
  loadModeration();
}

async function initProfile() {
  if (!token()) {
    window.location.href = '/login.html';
    return;
  }

  const profile = await jsonFetch(`${API_BASE}/users/me`, { headers: authHeaders() });
  document.getElementById('profile-data').textContent = `Email: ${profile.email} | Роль: ${profile.role} | XP: ${profile.xp} | Уровень: ${profile.level}`;
  const img = document.getElementById('avatar');
  img.src = profile.avatar_path ? `/uploads/${profile.avatar_path}` : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96"%3E%3Crect width="96" height="96" fill="%23dbeafe"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%231d4ed8" font-size="14"%3EAvatar%3C/text%3E%3C/svg%3E';

  document.getElementById('avatar-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const msg = document.getElementById('avatar-msg');
    try {
      const fd = new FormData(form);
      const r = await fetch(`${API_BASE}/users/avatar`, { method: 'POST', headers: authHeaders(), body: fd });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Ошибка');
      img.src = `/uploads/${d.avatar}`;
      msg.textContent = 'Аватар обновлён.';
    } catch (err) { msg.textContent = err.message; }
  });
}

async function init() {
  const page = document.body.dataset.page;
  if (page === 'register') initRegister();
  if (page === 'login') initLogin();
  if (page === 'home') initGuestUpload();
  if (page === 'dashboard') initDashboard();
  if (page === 'profile') initProfile();
}

document.addEventListener('DOMContentLoaded', init);
