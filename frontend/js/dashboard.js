import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, showToast, formatCurrency } from './config.js';
import { checkAuth, getCurrentUser, logout } from './auth.js';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    // Set username
    const user = getCurrentUser();
    const usernameSpan = document.getElementById('nav-username');
    if (usernameSpan) usernameSpan.textContent = user.username || 'User';

    // Load data
    await loadProducts();
    await loadStats();

    // Setup logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});

async function loadProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}`, {
            headers: getAuthHeaders()
        });
        const products = await response.json();

        if (!products.length) {
            grid.innerHTML = '<div class="loading">No products available yet.</div>';
            return;
        }

        // Update product count stat
        const statProducts = document.getElementById('stat-products');
        if (statProducts) statProducts.textContent = products.length;

        // Show first 8 products
        grid.innerHTML = products.slice(0, 8).map(product => `
      <div class="product-card">
        <div class="product-name">${escapeHtml(product.name)}</div>
        <div class="product-desc">${escapeHtml(product.description)}</div>
        <div class="product-price">${formatCurrency(product.price)}</div>
        <button class="btn btn-primary product-btn" onclick="window.location.href='vendors.html'">Buy Now</button>
      </div>
    `).join('');

    } catch (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = '<div class="loading">Could not load products.</div>';
    }
}

async function loadStats() {
    // Stats are mostly static for dashboard, products count is updated from products
    // Additional stats can be loaded from an endpoint if needed
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Make logout available globally for inline handlers
window.logout = logout;