import { API_BASE_URL, API_ENDPOINTS, showToast } from './config.js';

// Check if user is logged in
export function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Check if admin is logged in
export function checkAdminAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}

// Login user
export async function loginUser(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOGIN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('username', username);
            showToast('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
            return true;
        } else {
            showToast(data.detail || 'Login failed', 'error');
            return false;
        }
    } catch (error) {
        showToast('Cannot connect to server', 'error');
        return false;
    }
}

// Register user
export async function registerUser(username, email, password, confirmPassword) {
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REGISTER}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Account created! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return true;
        } else {
            showToast(data.detail || 'Registration failed', 'error');
            return false;
        }
    } catch (error) {
        showToast('Cannot connect to server', 'error');
        return false;
    }
}

// Admin login
export async function adminLogin(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_LOGIN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('admin_token', data.access_token);
            localStorage.setItem('admin_username', username);
            showToast('Admin access granted', 'success');
            setTimeout(() => {
                window.location.href = 'admin-panel.html';
            }, 500);
            return true;
        } else {
            showToast(data.detail || 'Invalid admin credentials', 'error');
            return false;
        }
    } catch (error) {
        showToast('Cannot connect to server', 'error');
        return false;
    }
}

// Logout user
export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('selectedVendorId');
    window.location.href = 'index.html';
}

// Admin logout
export function adminLogout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    window.location.href = 'admin-login.html';
}

// Get current user
export function getCurrentUser() {
    return {
        username: localStorage.getItem('username'),
        token: localStorage.getItem('token')
    };
}

// Get current admin
export function getCurrentAdmin() {
    return {
        username: localStorage.getItem('admin_username'),
        token: localStorage.getItem('admin_token')
    };
}