// Thin API client. All business logic lives on the server; this only moves data.
const BASE = import.meta.env.VITE_API_BASE ?? '';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const toQuery = (params = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
};

async function request(path, { method = 'GET', json, body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE}/api${path}`, {
      method,
      signal,
      headers: json ? { 'content-type': 'application/json' } : undefined,
      body: json ? JSON.stringify(json) : body,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK', 'Cannot reach the EcoVisarjan server. Check your connection and try again.');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // non-JSON body
  }
  if (!response.ok) {
    const err = payload?.error;
    throw new ApiError(response.status, err?.code ?? 'ERROR', err?.message ?? 'Something went wrong.', err?.details);
  }
  return payload;
}

export const api = {
  health: (signal) => request('/health', { signal }),
  classify: (formData, signal) => request('/idol/classify', { method: 'POST', body: formData, signal }),
  options: (json, signal) => request('/idol/options', { method: 'POST', json, signal }),
  immersionPoints: (params, signal) => request(`/immersion-points${toQuery(params)}`, { signal }),
  flowerPoints: (params, signal) => request(`/flower-points${toQuery(params)}`, { signal }),
  waterBodies: (signal) => request('/water-bodies', { signal }),
  recommend: (json, signal) => request('/recommendation', { method: 'POST', json, signal }),
  route: (params, signal) => request(`/route${toQuery(params)}`, { signal }),
  predict: (json, signal) => request('/pollution/predict', { method: 'POST', json, signal }),
  recordActivity: (json, signal) => request('/activity', { method: 'POST', json, signal }),
  dashboard: (signal) => request('/dashboard', { signal }),
};
