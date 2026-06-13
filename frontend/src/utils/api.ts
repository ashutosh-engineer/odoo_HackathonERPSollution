/**
 * Universal API Client for Odoo Integration
 * Handles both standard REST (for our custom controllers) and native JSON-RPC
 */

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

// Generic REST fetch wrapper
export async function apiFetch(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error?.message || 'API Error');
  }
  return data;
}

// Odoo Native JSON-RPC wrapper for standard CRUD models
export async function odooCall(model: string, method: string, args: any[] = [], kwargs: any = {}) {
  const payload = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      model,
      method,
      args,
      kwargs,
    },
    id: Math.floor(Math.random() * 1000000000),
  };

  const res = await fetch('/web/dataset/call_kw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.data?.message || data.error.message || 'Odoo RPC Error');
  }
  return data.result;
}

// Helper for search_read (fetching list of records)
export async function odooSearchRead(model: string, domain: any[] = [], fields: string[] = [], limit = 80, offset = 0) {
  const payload = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      model,
      domain,
      fields,
      limit,
      offset,
      sort: ''
    },
    id: Math.floor(Math.random() * 1000000000),
  };

  const res = await fetch('/web/dataset/search_read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.data?.message || data.error.message || 'Odoo SearchRead Error');
  }
  return data.result.records;
}
