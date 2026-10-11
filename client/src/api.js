const BASE = "/api";
let onSessionExpired = () => {};

export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn;
};

export const getToken = () => sessionStorage.getItem("vk_token");
export const saveToken = (t) => sessionStorage.setItem("vk_token", t);
export const clearToken = () => sessionStorage.removeItem("vk_token");

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // BUG-11 FIX: abort after 10 s so the UI never hangs indefinitely
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Is the backend running?");
    }
    throw new Error("Cannot reach the server. Is the backend running?");
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.code === "SESSION_EXPIRED") onSessionExpired();
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

export const authApi = {
  status: () => request("/auth/status"),
  setup: (password, confirmPassword) =>
    request("/auth/setup", { method: "POST", body: { password, confirmPassword } }),
  unlock: (password) => request("/auth/unlock", { method: "POST", body: { password } }),
  verify: (password) => request("/auth/verify", { method: "POST", body: { password } }),
};

export const passwordApi = {
  list: () => request("/passwords"),
  reveal: (id) => request(`/passwords/${id}/reveal`),
  save: (entry) => request("/passwords", { method: "POST", body: entry }),
  // BUG-06 FIX: full edit-by-ID — allows source rename without duplicates
  update: (id, entry) => request(`/passwords/${id}`, { method: "PUT", body: entry }),
  remove: (id) => request(`/passwords/${id}`, { method: "DELETE" }),
};
