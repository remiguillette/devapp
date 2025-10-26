const DEFAULT_BACKEND_URL = 'http://127.0.0.1:5000';

function resolveBackendBaseUrl() {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') {
    return DEFAULT_BACKEND_URL;
  }

  const { protocol, host } = window.location;

  if (protocol === 'http:' || protocol === 'https:') {
    return `${protocol}//${host}`;
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
