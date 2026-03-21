const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // Products
  getProducts: () => fetchAPI('/products'),
  createProduct: (data) => fetchAPI('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (data) => fetchAPI('/products', { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => fetchAPI(`/products?id=${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => fetchAPI('/categories'),
  createCategory: (data) => fetchAPI('/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Sales
  getSales: () => fetchAPI('/sales'),
  createSale: (data) => fetchAPI('/sales', { method: 'POST', body: JSON.stringify(data) }),

  // Stock Movements
  getStockMovements: (productId) => 
    fetchAPI(productId ? `/stock-movements?productId=${productId}` : '/stock-movements'),
  createStockMovement: (data) => 
    fetchAPI('/stock-movements', { method: 'POST', body: JSON.stringify(data) }),
};
