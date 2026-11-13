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

function apiUrl(path, params) {
  const base = (API_BASE || "").trim() || window.location.origin;
  const absolute = /^https?:\/\//i.test(base)
    ? base
    : new URL(base, window.location.origin).toString();
  const url = new URL(`${absolute.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url;
}

function refreshSessionOnce() {
  return fetch(apiUrl("/auth/refresh").toString(), {
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
  return doFetch(apiUrl(path, params).toString(), { headers: baseHeaders(), credentials: "include" });
}

/**
 * Descarga un archivo generado por la API (p. ej. /reportes/:tipo?format=pdf).
 * Resuelve el nombre desde Content-Disposition y dispara la descarga del blob.
 * Reintenta una vez tras refrescar la sesión si recibe 401.
 */
export async function apiDownload(path, params = {}) {
  const url = apiUrl(path, params);

  const init = {
    headers: { "X-Requested-With": "XMLHttpRequest" },
    credentials: "include",
  };

  let res = await fetch(url.toString(), init);
  if (res.status === 401) {
    await refreshSession();
    res = await fetch(url.toString(), init);
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") || "";
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)"?/i.exec(cd);
  const filename = decodeURIComponent(match[1]);

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function apiPost(path, body = {}, idempotencyKey) {
  const headers = baseHeaders();
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  return doFetch(apiUrl(path).toString(), {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });
}

export async function apiPatch(path, body = {}, idempotencyKey) {
  const headers = baseHeaders();
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  return doFetch(apiUrl(path).toString(), {
    method: "PATCH",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });
}

export async function apiPut(path, body = {}, idempotencyKey) {
  const headers = baseHeaders();
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  return doFetch(apiUrl(path).toString(), {
    method: "PUT",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });
}

export async function apiUpload(path, formData, method = "POST") {
  return doFetch(apiUrl(path).toString(), {
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
  return doFetch(apiUrl(path).toString(), init);
}
