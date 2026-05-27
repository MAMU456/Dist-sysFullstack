// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';

// ========== HELPER FUNCTIONS ==========

function getAdminToken() {
    return localStorage.getItem('admin_token');
}

function getAdminHeaders() {
    const token = getAdminToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        z-index: 9999;
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
        background-color: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatCurrency(amount) {
    return `Ksh ${amount.toLocaleString()}`;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function checkAdminAuth() {
    const token = getAdminToken();
    const username = localStorage.getItem('admin_username');
    
    if (!token || !username) {
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}

// ========== VARIABLES ==========
let editingProductId = null;
let editingVendorId = null;
let loadedProducts = [];
let loadedVendors = [];
let loadedUsers = [];
let loadedOrders = [];

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAdminAuth()) return;

    const adminUsername = localStorage.getItem('admin_username');
    document.getElementById('admin-name').textContent = adminUsername || 'Admin';
    document.getElementById('admin-initial').textContent = (adminUsername || 'A')[0].toUpperCase();
    document.getElementById('dash-admin-name').textContent = adminUsername || 'Admin';

    // Load all data
    await loadStats();
    await loadProducts();
    await loadVendors();
    await loadUsers();
    await loadOrders();

    // Setup logout button
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', adminLogout);
    }
});

// ========== TAB NAVIGATION ==========
window.showTab = async function(tabName) {
    // Update tab active states
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');

    const tabs = ['dashboard', 'products', 'vendors', 'orders', 'users'];
    const index = tabs.indexOf(tabName);
    if (index !== -1) {
        const navItems = document.querySelectorAll('.nav-item');
        if (navItems[index]) navItems[index].classList.add('active');
    }

    // Load data based on tab
    if (tabName === 'dashboard') await loadStats();
    if (tabName === 'products') await loadProducts();
    if (tabName === 'vendors') await loadVendors();
    if (tabName === 'orders') await loadOrders();
    if (tabName === 'users') await loadUsers();
};

// ========== DASHBOARD / STATS ==========
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: getAdminHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        document.getElementById('stat-total-users').textContent = data.total_users || 0;
        document.getElementById('stat-active-users').textContent = data.active_users || 0;
        document.getElementById('stat-revoked-users').textContent = data.revoked_users || 0;
        document.getElementById('stat-products').textContent = data.total_products || 0;
        
    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Could not load stats: ' + error.message, 'error');
    }
}

// ========== PRODUCT MANAGEMENT ==========
async function loadProducts() {
    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state">Loading products...</div></td></tr>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/products/`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const products = await response.json();
        loadedProducts = products || [];
        
        if (!loadedProducts.length) {
            tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state">No products yet. Create your first product above.</div></td></tr>';
            return;
        }
        
        tbody.innerHTML = loadedProducts.map(p => `
            <tr>
                <td style="color: #64748b">#${p.id}</td>
                <td style="font-weight: 600; color: #f1f5f9">${escapeHtml(p.name)}</td>
                <td style="color: #94a3b8">${escapeHtml(p.description)}</td>
                <td style="color: #22c55e; font-weight: 600">${formatCurrency(p.price)}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-outline" onclick="editProduct(${p.id})" style="padding: 6px 12px; font-size: 12px;">Edit</button>
                        <button class="btn btn-danger" onclick="deleteProduct(${p.id})" style="padding: 6px 12px; font-size: 12px;">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading products:', error);
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">Error loading products: ${error.message}</div></td></tr>`;
        showToast('Could not load products', 'error');
    }
}

window.saveProduct = async function() {
    const name = document.getElementById('p-name')?.value.trim();
    const description = document.getElementById('p-desc')?.value.trim();
    const price = parseFloat(document.getElementById('p-price')?.value);
    
    if (!name || !description || isNaN(price)) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    if (price <= 0) {
        showToast('Price must be greater than 0', 'error');
        return;
    }
    
    const btn = document.getElementById('save-product-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Saving...';
    
    const isEdit = editingProductId !== null;
    const url = isEdit 
        ? `${API_BASE_URL}/admin/products/${editingProductId}`
        : `${API_BASE_URL}/admin/products`;
    const method = isEdit ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: getAdminHeaders(),
            body: JSON.stringify({ name, description, price })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to save product');
        }
        
        showToast(isEdit ? 'Product updated successfully!' : 'Product added successfully!');
        cancelProductEdit();
        await loadProducts();
        await loadStats();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showToast(error.message, 'error');
    }
    
    btn.disabled = false;
    btn.textContent = originalText;
};

window.editProduct = function(id) {
    const product = loadedProducts.find(p => p.id === id);
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }

    editingProductId = id;
    document.getElementById('p-name').value = product.name;
    document.getElementById('p-desc').value = product.description;
    document.getElementById('p-price').value = product.price;
    document.getElementById('form-title').textContent = `✏️ Edit Product #${id}`;
    document.getElementById('save-product-btn').textContent = 'Update Product';
    document.getElementById('cancel-edit-btn').style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.cancelProductEdit = function() {
    editingProductId = null;
    document.getElementById('p-name').value = '';
    document.getElementById('p-desc').value = '';
    document.getElementById('p-price').value = '';
    document.getElementById('form-title').textContent = '➕ Add New Product';
    document.getElementById('save-product-btn').textContent = 'Save Product';
    document.getElementById('cancel-edit-btn').style.display = 'none';
};

window.deleteProduct = async function(id) {
    const product = loadedProducts.find(p => p.id === id);
    const name = product ? product.name : `#${id}`;
    if (!confirm(`⚠️ Delete "${name}"?\n\nThis action cannot be undone.`)) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
            method: 'DELETE',
            headers: getAdminHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete product');
        }
        
        showToast(`"${name}" deleted successfully`);
        await loadProducts();
        await loadStats();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast(error.message, 'error');
    }
};

// ========== VENDOR MANAGEMENT ==========
async function loadVendors() {
    const tbody = document.getElementById('vendors-tbody');
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state">Loading vendors...</div></td></tr>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/vendors`, {
            headers: getAdminHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const vendors = await response.json();
        loadedVendors = vendors || [];
        
        if (!loadedVendors.length) {
            tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state">No vendors yet. Create your first vendor above.</div></td></tr>';
            return;
        }
        
        tbody.innerHTML = loadedVendors.map(v => `
            <tr>
                <td style="color: #64748b">#${v.id}</td>
                <td style="font-weight: 600; color: #f1f5f9">${escapeHtml(v.name)}</td>
                <td style="color: #94a3b8">📍 ${escapeHtml(v.location)}</td>
                <td style="color: #94a3b8">🕐 ${escapeHtml(v.hours)}</td>
                <td style="color: #facc15">${v.rating} ★ (${v.rating_count || 0} reviews)</td>
                <td><span class="${v.status === 'open' ? 'badge-active' : 'badge-revoked'}">${v.status === 'open' ? '🟢 Open' : '🔴 Closed'}</span></td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-outline" onclick="editVendor(${v.id})" style="padding: 6px 12px; font-size: 12px;">Edit</button>
                        <button class="btn btn-danger" onclick="deleteVendor(${v.id})" style="padding: 6px 12px; font-size: 12px;">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading vendors:', error);
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">Error loading vendors: ${error.message}</div></td></tr>`;
        showToast('Could not load vendors', 'error');
    }
}

window.saveVendor = async function() {
    const name = document.getElementById('v-name')?.value.trim();
    const location = document.getElementById('v-location')?.value.trim();
    const hours = document.getElementById('v-hours')?.value.trim();
    const phone = document.getElementById('v-phone')?.value.trim();
    const email = document.getElementById('v-email')?.value.trim();
    const rating = parseFloat(document.getElementById('v-rating')?.value);
    const status = document.getElementById('v-status')?.value;
    const initials = document.getElementById('v-initials')?.value.trim().toUpperCase();
    
    // Validation
    if (!name) { showToast('Vendor name is required', 'error'); return; }
    if (!location) { showToast('Location is required', 'error'); return; }
    if (!hours) { showToast('Business hours are required', 'error'); return; }
    if (!phone) { showToast('Phone number is required', 'error'); return; }
    if (!email) { showToast('Email is required', 'error'); return; }
    if (isNaN(rating) || rating < 1 || rating > 5) { showToast('Rating must be between 1 and 5', 'error'); return; }
    if (!initials) { showToast('Initials are required (2-10 characters)', 'error'); return; }
    
    const btn = document.getElementById('save-vendor-btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Saving...';
    
    const isEdit = editingVendorId !== null;
    const url = isEdit 
        ? `${API_BASE_URL}/admin/vendors/${editingVendorId}`
        : `${API_BASE_URL}/admin/vendors`;
    const method = isEdit ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: getAdminHeaders(),
            body: JSON.stringify({ name, location, hours, phone, email, rating, status, initials })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to save vendor');
        }
        
        showToast(isEdit ? 'Vendor updated successfully!' : 'Vendor added successfully!');
        cancelVendorEdit();
        await loadVendors();
        await loadStats();
        
    } catch (error) {
        console.error('Error saving vendor:', error);
        showToast(error.message, 'error');
    }
    
    btn.disabled = false;
    btn.textContent = originalText;
};

window.editVendor = function(id) {
    const vendor = loadedVendors.find(v => v.id === id);
    if (!vendor) {
        showToast('Vendor not found', 'error');
        return;
    }

    editingVendorId = id;
    document.getElementById('v-name').value = vendor.name;
    document.getElementById('v-location').value = vendor.location;
    document.getElementById('v-hours').value = vendor.hours;
    document.getElementById('v-phone').value = vendor.phone;
    document.getElementById('v-email').value = vendor.email;
    document.getElementById('v-rating').value = vendor.rating;
    document.getElementById('v-status').value = vendor.status;
    document.getElementById('v-initials').value = vendor.initials;
    document.getElementById('vendor-form-title').textContent = `✏️ Edit Vendor #${id}`;
    document.getElementById('save-vendor-btn').textContent = 'Update Vendor';
    document.getElementById('cancel-vendor-btn').style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.cancelVendorEdit = function() {
    editingVendorId = null;
    const fields = ['v-name', 'v-location', 'v-hours', 'v-phone', 'v-email', 'v-rating', 'v-initials'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const statusSelect = document.getElementById('v-status');
    if (statusSelect) statusSelect.value = 'open';
    document.getElementById('vendor-form-title').textContent = '➕ Add New Vendor';
    document.getElementById('save-vendor-btn').textContent = 'Save Vendor';
    document.getElementById('cancel-vendor-btn').style.display = 'none';
};

window.deleteVendor = async function(id) {
    const vendor = loadedVendors.find(v => v.id === id);
    const name = vendor ? vendor.name : `#${id}`;
    if (!confirm(`⚠️ Delete vendor "${name}"?\n\nThis will also delete all orders and ratings associated with this vendor.\n\nThis action cannot be undone.`)) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/vendors/${id}`, {
            method: 'DELETE',
            headers: getAdminHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete vendor');
        }
        
        showToast(`"${name}" deleted successfully`);
        await loadVendors();
        await loadStats();
        
    } catch (error) {
        console.error('Error deleting vendor:', error);
        showToast(error.message, 'error');
    }
};

// ========== USER MANAGEMENT ==========
async function loadUsers() {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state">Loading users...</div></td></tr>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: getAdminHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const users = await response.json();
        loadedUsers = users || [];
        
        if (!loadedUsers.length) {
            tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state">No users yet.</div></td></tr>';
            return;
        }
        
        tbody.innerHTML = loadedUsers.map(u => `
            <tr>
                <td style="color: #64748b">#${u.id}</td>
                <td style="font-weight: 600; color: #f1f5f9">${escapeHtml(u.username)}</td>
                <td style="color: #94a3b8">${escapeHtml(u.email)}</td>
                <td><span class="${u.is_active ? 'badge-active' : 'badge-revoked'}">${u.is_active ? '🟢 Active' : '🔴 Revoked'}</span></td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        ${u.is_active 
                            ? `<button class="btn btn-danger" onclick="revokeUser(${u.id})" style="padding: 6px 12px; font-size: 12px;">Revoke Access</button>`
                            : `<button class="btn btn-success" onclick="restoreUser(${u.id})" style="padding: 6px 12px; font-size: 12px;">Restore Access</button>`
                        }
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">Error loading users: ${error.message}</div></td></tr>`;
        showToast('Could not load users', 'error');
    }
}

window.revokeUser = async function(id) {
    const user = loadedUsers.find(u => u.id === id);
    const username = user ? user.username : `#${id}`;
    if (!confirm(`⚠️ Revoke access for "${username}"?\n\nThis user will no longer be able to log in.`)) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${id}/revoke`, {
            method: 'PATCH',
            headers: getAdminHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to revoke user');
        }
        
        showToast(`"${username}" has been revoked`);
        await loadUsers();
        await loadStats();
        
    } catch (error) {
        console.error('Error revoking user:', error);
        showToast(error.message, 'error');
    }
};

window.restoreUser = async function(id) {
    const user = loadedUsers.find(u => u.id === id);
    const username = user ? user.username : `#${id}`;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${id}/restore`, {
            method: 'PATCH',
            headers: getAdminHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to restore user');
        }
        
        showToast(`"${username}" has been restored`);
        await loadUsers();
        await loadStats();
        
    } catch (error) {
        console.error('Error restoring user:', error);
        showToast(error.message, 'error');
    }
};

async function loadOrders() {
    const tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state">Loading orders...</div></td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders`, {
            headers: getAdminHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const orders = await response.json();
        loadedOrders = orders || [];

        if (!loadedOrders.length) {
            tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state">No orders found.</div></td></tr>';
            return;
        }

        tbody.innerHTML = loadedOrders.map(order => {
            const statusBadge = order.status === 'cancelled'
                ? 'badge-revoked'
                : 'badge-active';

            let actionButtons = '';
            if (order.status === 'pending') {
                actionButtons = `
                    <button class="btn btn-primary" onclick="updateOrderStatus(${order.id}, 'confirmed')" style="padding: 6px 10px; font-size: 12px;">Confirm</button>
                    <button class="btn btn-danger" onclick="updateOrderStatus(${order.id}, 'cancelled')" style="padding: 6px 10px; font-size: 12px;">Cancel</button>
                `;
            } else if (order.status === 'confirmed') {
                actionButtons = `
                    <button class="btn btn-success" onclick="updateOrderStatus(${order.id}, 'delivered')" style="padding: 6px 10px; font-size: 12px;">Deliver</button>
                    <button class="btn btn-danger" onclick="updateOrderStatus(${order.id}, 'cancelled')" style="padding: 6px 10px; font-size: 12px;">Cancel</button>
                `;
            } else {
                actionButtons = `<span style="color: #94a3b8; font-size: 12px;">No actions available</span>`;
            }

            return `
                <tr>
                    <td style="color: #64748b">#${order.id}</td>
                    <td style="font-weight: 600; color: #f1f5f9">${escapeHtml(order.username)}</td>
                    <td style="color: #94a3b8">${escapeHtml(order.vendor_name)}</td>
                    <td style="color: #94a3b8">${escapeHtml(order.delivery_address)}</td>
                    <td style="color: #94a3b8">${escapeHtml(order.phone)}</td>
                    <td style="color: #22c55e; font-weight: 600">${formatCurrency(order.total_price)}</td>
                    <td><span class="${statusBadge}">${escapeHtml(order.status)}</span></td>
                    <td style="color: #94a3b8">${escapeHtml(order.created_at)}</td>
                    <td style="display: flex; gap: 6px; flex-wrap: wrap;">${actionButtons}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading orders:', error);
        tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state">Error loading orders: ${error.message}</div></td></tr>`;
        showToast('Could not load orders', 'error');
    }
}

window.updateOrderStatus = async function(orderId, newStatus) {
    const order = loadedOrders.find(o => o.id === orderId);
    const currentStatus = order ? order.status : 'unknown';
    if (!confirm(`Update order #${orderId} from ${currentStatus} to ${newStatus}?`)) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status?status=${encodeURIComponent(newStatus)}`, {
            method: 'PATCH',
            headers: getAdminHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to update order status');
        }

        showToast(`Order #${orderId} updated to ${newStatus}`);
        await loadOrders();
        await loadStats();
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast(error.message, 'error');
    }
};

// ========== LOGOUT ==========
window.adminLogout = function() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    showToast('Logged out successfully', 'info');
    setTimeout(() => {
        window.location.href = 'admin-login.html';
    }, 500);
};