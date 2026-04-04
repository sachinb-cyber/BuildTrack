const getToken = () => {
  if (typeof window === 'undefined') return null;
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user?.token || null;
};

const request = async (method, path, body, params) => {
  let url = `/api${path}`;
  if (params) {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null)));
    if ([...qs].length) url += '?' + qs.toString();
  }
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401) { localStorage.removeItem('user'); window.location.href = '/login'; }
  const data = await res.json();
  if (!res.ok) throw { response: { data } };
  return { data };
};

const api = {
  get: (path, config) => request('GET', path, null, config?.params),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};

export default api;
