const DEFAULT_BACKEND_URL = 'http://127.0.0.1:5000';
const DEFAULT_BACKEND_PORT = '5000';
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);

function resolveBackendBaseUrl() {
  const configuredUrl =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL;

  if (typeof configuredUrl === 'string' && configuredUrl.trim().length > 0) {
    return configuredUrl.trim();
  }

  if (typeof window === 'undefined' || typeof window.location === 'undefined') {
    return DEFAULT_BACKEND_URL;
  }

  const { protocol, hostname, host, port } = window.location;

  if (protocol === 'http:' || protocol === 'https:') {
    if (!hostname) {
      return DEFAULT_BACKEND_URL;
    }

    if (port === DEFAULT_BACKEND_PORT) {
      return `${protocol}//${host}`;
    }

    if (LOCAL_HOSTS.has(hostname)) {
      return `${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
    }

    if (port) {
      return `${protocol}//${hostname}:${port}`;
    }

    return `${protocol}//${hostname}`;
  }

  return DEFAULT_BACKEND_URL;
}

export async function fetchMenu() {
  const baseUrl = resolveBackendBaseUrl();
  const response = await fetch(`${baseUrl}/api/menu`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Backend responded with ${response.status}`);
  }

  return response.json();
}
