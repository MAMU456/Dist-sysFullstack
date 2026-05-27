import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, showToast, formatCurrency, formatDate } from './config.js';
import { checkAuth, getCurrentUser, logout } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    const user = getCurrentUser();
    const usernameSpan = document.getElementById('nav-username');
    if (usernameSpan) usernameSpan.textContent = user.username || 'User';

    await loadOrders();

    // Setup logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});

async function loadOrders() {
    const container = document.getElementById('orders-container');

    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MY_ORDERS}`, {
            headers: getAuthHeaders()
        });
        const orders = await response.json();

        if (!orders.length) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📦</div>
          <p>You haven't placed any orders yet.</p>
          <a href="vendors.html" class="btn btn-primary">Browse Vendors</a>
        </div>`;
            return;
        }

        container.innerHTML = orders.map((order, i) => `
      <div class="order-card" style="animation-delay: ${i * 0.07}s">
        <div class="order-header">
          <div>
            <div class="order-id">Order #${order.id}</div>
            <div class="order-date">${formatDate(order.created_at)}</div>
          </div>
          <span class="status-badge status-${order.status}">${capitalize(order.status)}</span>
        </div>
        <div class="order-meta">
          <div class="meta-item">
            <div class="label">Delivery Address</div>
            <div class="value">${escapeHtml(order.delivery_address)}</div>
          </div>
          <div class="meta-item">
            <div class="label">Phone</div>
            <div class="value">${escapeHtml(order.phone)}</div>
          </div>
          <div class="meta-item">
            <div class="label">Items</div>
            <div class="value">${order.items.length} product${order.items.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="order-items">
          ${order.items.map(item => `
            <div class="order-item-row">
              <span class="item-name-col">${escapeHtml(item.product_name)} × ${item.quantity}</span>
              <span class="item-price-col">${formatCurrency(item.subtotal)}</span>
            </div>
          `).join('')}
        </div>
        <div class="order-total">
          <span class="label">Total Paid</span>
          <span class="value">${formatCurrency(order.total_price)}</span>
        </div>
      </div>
    `).join('');

    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <p>Could not load orders.</p>
      </div>`;
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Make logout globally available
window.logout = logout;