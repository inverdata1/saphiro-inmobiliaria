const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

let isRefreshing = false;
let failedQueue = [];
let refreshPromise = null;

const AUTO_REFRESH_INTERVAL = 14 * 60 * 1000;

function processQueue(error) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
}

function baseHeaders() {
  return { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" };
}

let onSessionExpired = null;

export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn;
}

function redirectToLogin() {
  try {
    localStorage.removeItem("user");
  } catch {
    // fallo de almacenamiento: ignorar
  }
  onSessionExpired?.();
}

export class EmailNotVerifiedError extends Error {
  constructor(message) {
    super(message || "Correo no verificado");
    this.name = "EmailNotVerifiedError";
    this.isEmailNotVerified = true;
  }
}

export class SessionExpiredError extends Error {
  constructor(message) {
    super(message || "Sesión expirada");
    this.name = "SessionExpiredError";
    this.isSessionExpired = true;
  }
}

function refreshSessionOnce() {
  return fetch(API_BASE + "/auth/refresh", {
    method: "POST",
    headers: { "X-Requested-With": "XMLHttpRequest" },
    credentials: "include",
  }).then(async (res) => {
    if (res.status === 401 || res.status === 403) {
      throw new SessionExpiredError();
    }
    if (!res.ok) {
      throw new Error(`No se pudo renovar la sesión (HTTP ${res.status})`);
    }
    await res.json().catch(() => null);
    return true;
  });
}

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = refreshSessionOnce().finally(
      () => { refreshPromise = null; }
    );
  }
  return refreshPromise;
}

async function parseResponse(res) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 403 && (data?.code || data?.error) === "EMAIL_NOT_VERIFIED") {
      throw new EmailNotVerifiedError(data?.message);
    }
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function doFetch(url, init, isRetry = false) {
  const res = await fetch(url, init);

  if (
    res.status === 401 &&
    !url.includes("/auth/refresh") &&
    !url.includes("/auth/login") &&
    !url.includes("/auth/registro-token/")
  ) {
    if (isRetry) return parseResponse(res);

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => doFetch(url, init, true));
    }

    isRefreshing = true;
    try {
      await refreshSession();
      // 401/403 en refresh = token realmente expirado/inválido → sesión muerta
      processQueue(null);
      return doFetch(url, init, true);
    } catch (e) {
      processQueue(e);
      if (e instanceof SessionExpiredError && !url.includes("/auth/me")) {
        redirectToLogin();
      }
      throw e;
    } finally {
      isRefreshing = false;
    }
  }

  return parseResponse(res);
}

export async function apiGet(path, params = {}) {
  const url = new URL(API_BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, v);
  });
  return doFetch(url.toString(), { headers: baseHeaders(), credentials: "include" });
}

export async function apiPost(path, body = {}, idempotencyKey) {
  const headers = baseHeaders();
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  return doFetch(API_BASE + path, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });
}

export async function apiPatch(path, body = {}, idempotencyKey) {
  const headers = baseHeaders();
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  return doFetch(API_BASE + path, {
    method: "PATCH",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });
}

export async function apiPut(path, body = {}, idempotencyKey) {
  const headers = baseHeaders();
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  return doFetch(API_BASE + path, {
    method: "PUT",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });
}

export async function apiUpload(path, formData, method = "POST") {
  return doFetch(API_BASE + path, {
    method,
    headers: { "X-Requested-With": "XMLHttpRequest" },
    credentials: "include",
    body: formData,
  });
}

export async function apiDelete(path, body = null, idempotencyKey) {
  const headers = baseHeaders();
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const init = {
    method: "DELETE",
    headers,
    credentials: "include",
  };
  if (body) init.body = JSON.stringify(body);
  return doFetch(API_BASE + path, init);
}
