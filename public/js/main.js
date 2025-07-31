// MediRemind - Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏥 MediRemind - Client-side JavaScript loaded');
    
    // Initialize all components
    initializeAlerts();
    initializeTooltips();
    initializeForms();
    initializeModals();
    initializeTimeUpdates();
    
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Initialize dismissible alerts
function initializeAlerts() {
    // Auto-dismiss success alerts after 5 seconds
    document.querySelectorAll('.alert-success').forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
}

// Initialize Bootstrap tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Form enhancements
function initializeForms() {
    // Add loading state to form submissions
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.classList.contains('loading')) {
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
                
                // Remove loading state after 5 seconds as fallback
                setTimeout(() => {
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                }, 5000);
            }
        });
    });

    // Real-time form validation
    document.querySelectorAll('input[type="email"]').forEach(input => {
        input.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value && !emailRegex.test(this.value)) {
                this.classList.add('is-invalid');
                showFieldError(this, 'Please enter a valid email address');
            } else {
                this.classList.remove('is-invalid');
                hideFieldError(this);
            }
        });
    });

    // Password strength indicator
    document.querySelectorAll('input[type="password"]').forEach(input => {
        if (input.name === 'password') {
            input.addEventListener('input', function() {
                const strength = getPasswordStrength(this.value);
                showPasswordStrength(this, strength);
            });
        }
    });

    // Time input formatting
    document.querySelectorAll('input[placeholder*="HH:MM"], input[placeholder*="time"]').forEach(input => {
        input.addEventListener('input', function() {
            // Auto-format time input
            let value = this.value.replace(/[^0-9]/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + ':' + value.substring(2, 4);
            }
            this.value = value;
        });
    });
}

// Initialize modals
function initializeModals() {
    // Clear form data when modal is closed
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('hidden.bs.modal', function() {
            const form = this.querySelector('form');
            if (form) {
                form.reset();
                form.querySelectorAll('.is-invalid').forEach(input => {
                    input.classList.remove('is-invalid');
                });
                form.querySelectorAll('.invalid-feedback').forEach(feedback => {
                    feedback.remove();
                });
            }
        });
    });
}

// Initialize time updates for relative timestamps
function initializeTimeUpdates() {
    updateRelativeTimes();
    // Update every minute
    setInterval(updateRelativeTimes, 60000);
}

// Update relative time displays
function updateRelativeTimes() {
    document.querySelectorAll('[data-time]').forEach(element => {
        const timestamp = new Date(element.dataset.time);
        const now = new Date();
        const diff = now - timestamp;
        
        let relativeTime;
        if (diff < 60000) { // Less than 1 minute
            relativeTime = 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            relativeTime = Math.floor(diff / 60000) + ' minutes ago';
        } else if (diff < 86400000) { // Less than 1 day
            relativeTime = Math.floor(diff / 3600000) + ' hours ago';
        } else {
            relativeTime = Math.floor(diff / 86400000) + ' days ago';
        }
        
        element.textContent = relativeTime;
    });
}

// Utility functions
function showFieldError(input, message) {
    hideFieldError(input); // Remove existing error first
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    input.parentNode.appendChild(errorDiv);
}

function hideFieldError(input) {
    const existingError = input.parentNode.querySelector('.invalid-feedback');
    if (existingError) {
        existingError.remove();
    }
}

function getPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    return strength;
}

function showPasswordStrength(input, strength) {
    let existingIndicator = input.parentNode.querySelector('.password-strength');
    
    if (!existingIndicator) {
        existingIndicator = document.createElement('div');
        existingIndicator.className = 'password-strength mt-1';
        input.parentNode.appendChild(existingIndicator);
    }
    
    const strengthTexts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['danger', 'warning', 'info', 'primary', 'success'];
    
    if (input.value.length === 0) {
        existingIndicator.innerHTML = '';
        return;
    }
    
    const strengthText = strengthTexts[strength - 1] || 'Very Weak';
    const strengthColor = strengthColors[strength - 1] || 'danger';
    
    existingIndicator.innerHTML = `
        <div class="progress" style="height: 4px;">
            <div class="progress-bar bg-${strengthColor}" style="width: ${(strength / 5) * 100}%"></div>
        </div>
        <small class="text-${strengthColor}">Password strength: ${strengthText}</small>
    `;
}

// Copy to clipboard utility
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showToast('Copied to clipboard!', 'success');
    }).catch(function() {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Copied to clipboard!', 'success');
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = getOrCreateToastContainer();
    
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast element after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

function getOrCreateToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
    }
    return container;
}

// API utility functions
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const config = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        showToast('An error occurred. Please try again.', 'danger');
        throw error;
    }
}

// Export functions for use in other scripts
window.MediRemind = {
    showToast,
    copyToClipboard,
    apiRequest
};