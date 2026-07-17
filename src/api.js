const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

function getToken() {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function apiGet(path, params = {}) {
  const url = new URL(API_BASE + path);

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), { headers: authHeaders() });
  return handleResponse(res);
}

export async function apiPost(path, body = {}) {
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiPatch(path, body = {}) {
  const res = await fetch(API_BASE + path, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiPut(path, body = {}) {
  const res = await fetch(API_BASE + path, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiUpload(path, formData) {
  const token = getToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers,
    body: formData,
  });
  return handleResponse(res);
}

export async function apiDelete(path, body = null) {
  const opts = {
    method: "DELETE",
    headers: authHeaders(),
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  return handleResponse(res);
}
