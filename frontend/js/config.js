// API Configuration
export const API_BASE_URL = 'http://127.0.0.1:8000';

// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',

    // Products
    PRODUCTS: '/products',

    // Vendors
    VENDORS: '/vendors',

    // Orders
    ORDERS: '/orders',
    MY_ORDERS: '/orders/my',

    // Admin
    ADMIN_LOGIN: '/admin/login',
    ADMIN_STATS: '/admin/stats',
    ADMIN_USERS: '/admin/users',
    ADMIN_PRODUCTS: '/admin/products',
    ADMIN_VENDORS: '/admin/vendors',
    ADMIN_ORDERS: '/admin/orders',
};

// Helper function to get auth headers
export function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

export function getAdminHeaders() {
    const token = localStorage.getItem('admin_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Toast notification helper
export function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Loading state helper
export function showLoading(container) {
    container.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  `;
}

export function hideLoading(container) {
    // Implementation depends on usage
}

// Format currency
export function formatCurrency(amount) {
    return `Ksh ${amount.toLocaleString()}`;
}

// Format date
export function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}