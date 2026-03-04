const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const OrdersAPI = {
  list: () => request("/orders"),
  create: (payload) =>
    request("/orders", { method: "POST", body: JSON.stringify(payload) }),
  remove: (id) => request(`/orders/${id}`, { method: "DELETE" }),
};
