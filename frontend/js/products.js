import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, showToast, formatCurrency } from './config.js';
import { checkAuth, getCurrentUser, logout } from './auth.js';

let allProducts = [];
let currentView = 'table';

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    const user = getCurrentUser();
    const usernameSpan = document.getElementById('nav-username');
    if (usernameSpan) usernameSpan.textContent = user.username || 'User';

    await loadProducts();

    // Setup logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});

async function loadProducts() {
    const stateMsg = document.getElementById('state-msg');

    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}`, {
            headers: getAuthHeaders()
        });
        allProducts = await response.json();

        if (!allProducts.length) {
            stateMsg.innerHTML = '<div class="icon">📦</div><p>No products available yet.</p>';
            return;
        }

        // Update stats
        const prices = allProducts.map(p => p.price);
        document.getElementById('stat-count').textContent = allProducts.length;
        document.getElementById('stat-min').textContent = formatCurrency(Math.min(...prices));
        document.getElementById('stat-max').textContent = formatCurrency(Math.max(...prices));

        renderProducts(allProducts);

    } catch (error) {
        console.error('Error loading products:', error);
        stateMsg.innerHTML = '<div class="icon">⚠️</div><p>Could not load products.</p>';
    }
}

function renderProducts(products) {
    const stateMsg = document.getElementById('state-msg');
    const tableView = document.getElementById('table-view');
    const cardView = document.getElementById('card-view');

    if (!products.length) {
        stateMsg.style.display = 'block';
        tableView.style.display = 'none';
        cardView.style.display = 'none';
        return;
    }

    stateMsg.style.display = 'none';

    if (currentView === 'table') {
        tableView.style.display = 'block';
        cardView.style.display = 'none';
        document.getElementById('price-table-body').innerHTML = products.map((product, i) => `
      <tr>
        <td class="row-number">${i + 1}</td>
        <td class="product-name-cell">${escapeHtml(product.name)}</td>
        <td>${escapeHtml(product.description)}</td>
        <td class="price-cell">${formatCurrency(product.price)}</td>
      </tr>
    `).join('');
    } else {
        tableView.style.display = 'none';
        cardView.style.display = 'grid';
        cardView.innerHTML = products.map((product, i) => `
      <div class="product-card">
        <div class="card-number">ITEM ${String(i + 1).padStart(2, '0')}</div>
        <div class="card-name">${escapeHtml(product.name)}</div>
        <div class="card-desc">${escapeHtml(product.description)}</div>
        <div class="card-price">${formatCurrency(product.price)}</div>
        <div class="price-label">Current Price</div>
      </div>
    `).join('');
    }
}

function setView(view) {
    currentView = view;
    document.getElementById('btn-table').classList.toggle('active', view === 'table');
    document.getElementById('btn-cards').classList.toggle('active', view === 'cards');
    renderProducts(allProducts);
}

function filterProducts() {
    const query = document.getElementById('search-input')?.value.toLowerCase() || '';
    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
    renderProducts(filtered);
}

function downloadProductList() {
    // Create CSV content
    const headers = ['ID', 'Name', 'Description', 'Price'];
    const rows = allProducts.map(p => [p.id, p.name, p.description, p.price]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
    URL.revokeObjectURL(url);

    showToast('Products exported successfully!', 'success');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Make functions globally available
window.setView = setView;
window.filterProducts = filterProducts;
window.downloadProductList = downloadProductList;
window.logout = logout;