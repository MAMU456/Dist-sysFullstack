import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, showToast, formatCurrency } from './config.js';
import { checkAuth, getCurrentUser, logout } from './auth.js';

let allProducts = [];
let quantities = {};
let selectedVendor = null;
let currentRating = 0;

const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    const user = getCurrentUser();
    const usernameSpan = document.getElementById('nav-username');
    if (usernameSpan) usernameSpan.textContent = user.username || 'User';

    // Get vendor from URL
    const params = new URLSearchParams(window.location.search);
    const vendorId = params.get('vendor_id');
    const vendorName = params.get('vendor_name');
    const vendorInitials = params.get('vendor_initials');
    const vendorLocation = params.get('vendor_location');

    if (!vendorId) {
        window.location.href = 'vendors.html';
        return;
    }

    selectedVendor = { id: vendorId, name: vendorName, initials: vendorInitials, location: vendorLocation };

    // Set vendor info
    document.getElementById('vendor-name').textContent = vendorName || 'Selected Vendor';
    document.getElementById('vendor-initials').textContent = vendorInitials || 'VN';
    document.getElementById('vendor-detail').textContent = vendorLocation || '';

    await loadProducts();

    // Setup logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});

async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PRODUCTS}`, {
            headers: getAuthHeaders()
        });
        allProducts = await response.json();

        if (!allProducts.length) {
            document.getElementById('products-list').innerHTML = '<div class="loading">No products available.</div>';
            return;
        }

        allProducts.forEach(p => quantities[p.id] = 0);
        renderProductList();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-list').innerHTML = '<div class="loading">Could not load products.</div>';
    }
}

function renderProductList() {
    const container = document.getElementById('products-list');
    container.innerHTML = allProducts.map(product => `
    <div class="product-row">
      <div class="product-info">
        <div class="name">${escapeHtml(product.name)}</div>
        <div class="price">${formatCurrency(product.price)}</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="window.changeQty(${product.id}, -1)">−</button>
        <div class="qty-num" id="qty-${product.id}">0</div>
        <button class="qty-btn" onclick="window.changeQty(${product.id}, 1)">+</button>
      </div>
      <div class="item-subtotal" id="sub-${product.id}">${formatCurrency(0)}</div>
    </div>
  `).join('');
}

function changeQty(productId, delta) {
    quantities[productId] = Math.max(0, (quantities[productId] || 0) + delta);
    const qty = quantities[productId];

    const qtyEl = document.getElementById(`qty-${productId}`);
    if (qtyEl) qtyEl.textContent = qty;

    const product = allProducts.find(p => p.id === productId);
    const subtotal = product.price * qty;
    const subEl = document.getElementById(`sub-${productId}`);
    if (subEl) {
        subEl.textContent = formatCurrency(subtotal);
        subEl.className = 'item-subtotal' + (qty > 0 ? ' active' : '');
    }

    updateSummary();
}

function updateSummary() {
    const selected = allProducts.filter(p => quantities[p.id] > 0);
    const summaryEl = document.getElementById('summary-items');
    let total = 0;

    if (!selected.length) {
        summaryEl.innerHTML = '<div class="summary-empty">No items selected yet</div>';
        document.getElementById('total-price').textContent = formatCurrency(0);
        return;
    }

    summaryEl.innerHTML = selected.map(p => {
        const subtotal = p.price * quantities[p.id];
        total += subtotal;
        return `
      <div class="summary-item">
        <span class="item-name">${escapeHtml(p.name)} x${quantities[p.id]}</span>
        <span class="item-price">${formatCurrency(subtotal)}</span>
      </div>
    `;
    }).join('');

    document.getElementById('total-price').textContent = formatCurrency(total);
}

async function placeOrder() {
    const address = document.getElementById('delivery-address')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();

    if (!address || !phone) {
        showToast('Please fill in delivery address and phone number', 'error');
        return;
    }

    const items = allProducts
        .filter(p => quantities[p.id] > 0)
        .map(p => ({ product_id: p.id, quantity: quantities[p.id] }));

    if (!items.length) {
        showToast('Please select at least one product', 'error');
        return;
    }

    const btn = document.getElementById('place-btn');
    btn.disabled = true;
    btn.textContent = 'Placing order...';

    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ORDERS}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                vendor_id: parseInt(selectedVendor.id),
                delivery_address: address,
                phone: phone,
                items: items
            })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('success-order-id').textContent = `Order #${data.id}`;
            document.getElementById('rate-vendor-name').textContent = selectedVendor.name;
            document.getElementById('success-overlay').classList.add('show');
        } else {
            showToast(data.detail || 'Failed to place order', 'error');
            btn.disabled = false;
            btn.textContent = 'Place Order';
        }
    } catch (error) {
        console.error('Error placing order:', error);
        showToast('Could not connect to server', 'error');
        btn.disabled = false;
        btn.textContent = 'Place Order';
    }
}

function setRating(val) {
    currentRating = val;
    const stars = document.querySelectorAll('.star-btn');
    stars.forEach((s, i) => {
        if (i < val) s.classList.add('active');
        else s.classList.remove('active');
    });
    document.getElementById('rating-feedback').textContent = ratingLabels[val];
    document.getElementById('rate-btn').disabled = false;
}

async function submitRating() {
    if (!currentRating) return;

    const btn = document.getElementById('rate-btn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
        const response = await fetch(`${API_BASE_URL}/vendors/${selectedVendor.id}/rate`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ rating: currentRating })
        });

        if (response.ok) {
            document.getElementById('rate-btn').style.display = 'none';
            document.querySelector('.stars-input').style.pointerEvents = 'none';
            document.getElementById('rating-done').style.display = 'block';
            document.getElementById('rating-feedback').textContent = `You rated ${ratingLabels[currentRating]}`;
        } else {
            btn.disabled = false;
            btn.textContent = 'Submit Rating';
            showToast('Could not submit rating', 'error');
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        btn.disabled = false;
        btn.textContent = 'Submit Rating';
        showToast('Could not connect to server', 'error');
    }
}

function closeSuccessOverlay() {
    document.getElementById('success-overlay').classList.remove('show');
    window.location.href = 'orders.html';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Make functions globally available
window.changeQty = changeQty;
window.placeOrder = placeOrder;
window.setRating = setRating;
window.submitRating = submitRating;
window.closeSuccessOverlay = closeSuccessOverlay;
window.logout = logout;