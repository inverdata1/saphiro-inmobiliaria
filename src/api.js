const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

let isRefreshing = false;
let failedQueue = [];

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

function redirectToLogin() {
  if (window.location.pathname !== "/") {
    window.location.href = "/";
  }
}

export class EmailNotVerifiedError extends Error {
  constructor(message) {
    super(message || "Correo no verificado");
    this.name = "EmailNotVerifiedError";
    this.isEmailNotVerified = true;
  }
}

async function doFetch(url, init) {
  const res = await fetch(url, init);

  if (res.status === 401 && !url.includes("/auth/refresh")) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => doFetch(url, init));
    }

    isRefreshing = true;
    try {
      const refreshRes = await fetch(API_BASE + "/auth/refresh", {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        credentials: "include",
      });

      if (!refreshRes.ok) {
        processQueue(new Error("Sesión expirada"));
        redirectToLogin();
        throw new Error("Sesión expirada");
      }

      processQueue(null);
      return doFetch(url, init);
    } catch (e) {
      processQueue(e);
      redirectToLogin();
      throw e;
    } finally {
      isRefreshing = false;
    }
  }

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

export async function apiUpload(path, formData) {
  return doFetch(API_BASE + path, {
    method: "POST",
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
