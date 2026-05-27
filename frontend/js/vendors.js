import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, showToast, formatCurrency } from './config.js';
import { checkAuth, getCurrentUser, logout } from './auth.js';

let allVendors = [];
let selectedVendorId = localStorage.getItem('selectedVendorId');
let currentFilter = 'all';
let currentModalVendor = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    const user = getCurrentUser();
    const usernameSpan = document.getElementById('nav-username');
    if (usernameSpan) usernameSpan.textContent = user.username || 'User';

    await loadVendors();

    // Setup logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});

async function loadVendors() {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.VENDORS}`);
        allVendors = await response.json();
        renderVendors(allVendors);
    } catch (error) {
        console.error('Error loading vendors:', error);
        document.getElementById('vendor-grid').innerHTML = '<div class="loading">Could not load vendors.</div>';
    }
}

function renderVendors(vendors) {
    const grid = document.getElementById('vendor-grid');
    const emptyState = document.getElementById('empty-state');

    if (!vendors.length) {
        grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = vendors.map(vendor => `
    <div class="vendor-card" data-id="${vendor.id}" data-status="${vendor.status}">
      <div class="card-top">
        <div class="vendor-avatar">${escapeHtml(vendor.initials)}</div>
        <div class="vendor-status ${vendor.status}">
          <span class="status-dot"></span>
          ${vendor.status === 'open' ? 'Open Now' : 'Closed'}
        </div>
      </div>
      <div class="vendor-name">${escapeHtml(vendor.name)}</div>
      <div class="vendor-location">📍 ${escapeHtml(vendor.location)}</div>
      <div class="stars">${getStarsHTML(vendor.rating)}</div>
      <div class="rating-text">${vendor.rating} stars</div>
      <div class="info-rows">
        <div class="info-row"><span class="label">Hours</span> ${escapeHtml(vendor.hours)}</div>
        <div class="info-row"><span class="label">Phone</span> ${escapeHtml(vendor.phone)}</div>
        <div class="info-row"><span class="label">Email</span> ${escapeHtml(vendor.email)}</div>
      </div>
      <div class="card-actions">
        <button class="btn-select ${selectedVendorId == vendor.id ? 'selected' : ''}" 
          onclick="window.selectVendor(${vendor.id})">
          ${selectedVendorId == vendor.id ? '✓ Selected' : 'Select Vendor'}
        </button>
        <button class="btn-contact" onclick="window.openVendorModal(${vendor.id})">Details</button>
        <button class="btn-shop" onclick="window.shopWithVendor(${vendor.id}, '${escapeHtml(vendor.name)}', '${escapeHtml(vendor.initials)}', '${escapeHtml(vendor.location)}')">
          Shop
        </button>
      </div>
    </div>
  `).join('');

    // Update stats
    document.getElementById('total-count').textContent = allVendors.length;
    document.getElementById('open-count').textContent = allVendors.filter(v => v.status === 'open').length;
}

function getStarsHTML(rating) {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function filterVendors() {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || '';
    let filtered = allVendors.filter(v =>
        v.name.toLowerCase().includes(query) ||
        v.location.toLowerCase().includes(query)
    );
    if (currentFilter !== 'all') {
        filtered = filtered.filter(v => v.status === currentFilter);
    }
    renderVendors(filtered);
}

function filterByStatus(status, btn) {
    currentFilter = status;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterVendors();
}

function selectVendor(id) {
    selectedVendorId = id;
    localStorage.setItem('selectedVendorId', id);

    // Update all select buttons
    document.querySelectorAll('.btn-select').forEach(btn => {
        btn.classList.remove('selected');
        btn.textContent = 'Select Vendor';
    });

    const targetBtn = document.querySelector(`.vendor-card[data-id="${id}"] .btn-select`);
    if (targetBtn) {
        targetBtn.classList.add('selected');
        targetBtn.textContent = '✓ Selected';
    }

    const vendor = allVendors.find(v => v.id === id);
    showToast(`✓ ${vendor.name} selected!`, 'success');
}

function openVendorModal(id) {
    const vendor = allVendors.find(v => v.id === id);
    if (!vendor) return;

    currentModalVendor = vendor;

    document.getElementById('modal-name').textContent = vendor.name;
    document.getElementById('modal-info').innerHTML = `
    <div class="modal-row"><div><strong>Location</strong><br>${escapeHtml(vendor.location)}</div></div>
    <div class="modal-row"><div><strong>Available Hours</strong><br>${escapeHtml(vendor.hours)}</div></div>
    <div class="modal-row"><div><strong>Rating</strong><br>${getStarsHTML(vendor.rating)} (${vendor.rating} stars)</div></div>
    <div class="modal-row"><div><strong>Phone</strong><br>${escapeHtml(vendor.phone)}</div></div>
    <div class="modal-row"><div><strong>Email</strong><br>${escapeHtml(vendor.email)}</div></div>
    <div class="modal-row"><div><strong>Status</strong><br>${vendor.status === 'open' ? 'Open Now' : 'Currently Closed'}</div></div>
  `;

    const selectBtn = document.getElementById('modal-select-btn');
    if (selectedVendorId == vendor.id) {
        selectBtn.textContent = '✓ Already Selected';
        selectBtn.classList.add('selected');
    } else {
        selectBtn.textContent = '✓ Select Vendor';
        selectBtn.classList.remove('selected');
    }

    document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    currentModalVendor = null;
}

function closeModalOutside(e) {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function selectVendorFromModal() {
    if (currentModalVendor) {
        selectVendor(currentModalVendor.id);
        closeModal();
    }
}

function contactVendorFromModal() {
    if (currentModalVendor) {
        showToast(`Calling ${currentModalVendor.name}...`, 'info');
        setTimeout(() => {
            window.location.href = `tel:${currentModalVendor.phone}`;
        }, 500);
    }
}

function shopWithVendor(id, name, initials, location) {
    selectVendor(id);
    const params = new URLSearchParams({
        vendor_id: id,
        vendor_name: name,
        vendor_initials: initials,
        vendor_location: location
    });
    window.location.href = `checkout.html?${params.toString()}`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Make functions globally available
window.filterVendors = filterVendors;
window.filterByStatus = filterByStatus;
window.selectVendor = selectVendor;
window.openVendorModal = openVendorModal;
window.closeModal = closeModal;
window.closeModalOutside = closeModalOutside;
window.selectVendorFromModal = selectVendorFromModal;
window.contactVendorFromModal = contactVendorFromModal;
window.shopWithVendor = shopWithVendor;
window.logout = logout;