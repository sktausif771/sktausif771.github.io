/* ==========================================================================
   MVX STORE - CORE ENGINE V3.0 (ULTIMATE PRODUCTION BUILD)
   ==========================================================================
   File: main.js
   Description: Complete JavaScript engine for MVX Store
   Features: Firebase Integration, Auth System, Real-time Updates,
             Download Manager, Toast Notifications, Search & Filter,
             Modal System, Password Protection, Analytics Ready
   Integration: Works with 404.html, admin.html, index.html, login.html
   Last Updated: 2024
   ========================================================================== */

/* ==========================================================================
   1. SYSTEM BOOT & CONSOLE HEADER
   ========================================================================== */
(function() {
    console.log("%c┌──────────────────────────────────────────────┐", "color: #00e676; font-family: monospace; font-weight: bold");
    console.log("%c│     MVX SYSTEM CORE ENGINE v3.0 LOADING...   │", "color: #00e676; font-family: monospace; font-weight: bold");
    console.log("%c├──────────────────────────────────────────────┤", "color: #00e676; font-family: monospace; font-weight: bold");
    console.log("%c│     🔥 FIREBASE CONNECTED                     │", "color: #00e676; font-family: monospace");
    console.log("%c│     🛡️ AUTH SYSTEM ACTIVE                      │", "color: #00e676; font-family: monospace");
    console.log("%c│     📦 REALTIME DATABASE SYNC                  │", "color: #00e676; font-family: monospace");
    console.log("%c│     🚀 READY FOR DEPLOYMENT                    │", "color: #00e676; font-family: monospace");
    console.log("%c└──────────────────────────────────────────────┘", "color: #00e676; font-family: monospace; font-weight: bold");
})();

/* ==========================================================================
   2. FIREBASE CONFIGURATION (SINGLE SOURCE OF TRUTH)
   ========================================================================== */
const MVX_CONFIG = {
    firebase: {
        apiKey: "AIzaSyAS3UXXrio_-c9uPbHwpDuTVrP-p8d903w",
        authDomain: "white-2k-17-v4.firebaseapp.com",
        databaseURL: "https://white-2k-17-v4-default-rtdb.firebaseio.com",
        projectId: "white-2k-17-v4",
        storageBucket: "white-2k-17-v4.firebasestorage.app",
        messagingSenderId: "180909174928",
        appId: "1:180909174928:android:148861a87d66c6980ca815"
    },
    database: {
        path: "MVX_VIP_SERVER_V5",        // Main database path (matches admin panel)
        backups: ["MVX_BACKUP_V1", "MVX_ARCHIVE"]
    },
    security: {
        adminPassword: "1213",             // Admin login password
        maxLoginAttempts: 5,                // Max failed attempts before lockout
        lockoutDuration: 30,                 // Lockout duration in seconds
        sessionDuration: 3600000             // Session timeout (1 hour)
    },
    links: {
        whatsapp: "https://wa.me/qr/3ZL3GSGN55QIO1",
        telegram: "https://t.me/MR_VOID_X_PANEL",
        youtube: "https://youtube.com/@mvx_pro"
    },
    features: {
        googleDriveConverter: true,
        passwordProtection: true,
        premiumLock: true,
        downloadTracking: false,             // Enable for analytics
        userStats: false                      // Enable for user download counts
    }
};

// Prevent duplicate Firebase initialization
if (!firebase.apps.length) {
    firebase.initializeApp(MVX_CONFIG.firebase);
} else {
    firebase.app();
}

/* ==========================================================================
   3. GLOBAL DATABASE REFERENCES
   ========================================================================== */
const MVX = {
    db: firebase.database(),
    auth: firebase.auth(),
    provider: new firebase.auth.GoogleAuthProvider(),
    
    // State Management
    state: {
        allApps: [],                         // All apps from database
        currentUser: null,                    // Current authenticated user
        currentFilter: 'all',                  // Active category filter
        searchTerm: '',                         // Live search term
        selectedApp: null,                      // Currently selected app for modal
        isLoading: true,                         // Loading state
        failedAttempts: 0,                       // Login failed attempts
        isLocked: false,                          // Lockout state
        lockoutTimer: null                         // Lockout timer reference
    },
    
    // DOM Cache (populated on init)
    dom: {},
    
    // Utility Functions
    utils: {
        /**
         * Converts Google Drive links to direct download links
         * @param {string} url - Original Google Drive URL
         * @returns {string} - Converted direct download URL
         */
        convertGoogleDriveLink: function(url) {
            if (!url || typeof url !== 'string') return url;
            
            // Handle various Google Drive formats
            const patterns = [
                /\/d\/([a-zA-Z0-9_-]+)/,
                /id=([a-zA-Z0-9_-]+)/,
                /\/file\/d\/([a-zA-Z0-9_-]+)/,
                /drive\.google\.com.*\/d\/([a-zA-Z0-9_-]+)/
            ];
            
            for (let pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) {
                    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
                }
            }
            
            return url;
        },
        
        /**
         * Formats file size for display
         * @param {string|number} size - Raw size value
         * @returns {string} - Formatted size
         */
        formatFileSize: function(size) {
            if (!size) return 'Unknown';
            
            // If it's already a string with MB/GB, return as is
            if (typeof size === 'string' && (size.includes('MB') || size.includes('GB') || size.includes('KB'))) {
                return size;
            }
            
            // Try to convert number to MB
            const num = parseFloat(size);
            if (isNaN(num)) return size.toString();
            
            if (num < 1000) return `${num} KB`;
            if (num < 1000000) return `${(num / 1000).toFixed(1)} MB`;
            return `${(num / 1000000).toFixed(2)} GB`;
        },
        
        /**
         * Generates unique ID
         * @returns {string} - Unique ID
         */
        generateId: function() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },
        
        /**
         * Debounce function for performance
         * @param {Function} func - Function to debounce
         * @param {number} wait - Wait time in ms
         * @returns {Function} - Debounced function
         */
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        /**
         * Safely parse JSON
         * @param {string} str - JSON string
         * @param {*} fallback - Fallback value
         * @returns {*} - Parsed object or fallback
         */
        safeJsonParse: function(str, fallback = null) {
            try {
                return JSON.parse(str);
            } catch {
                return fallback;
            }
        }
    },
    
    // Toast Notification System
    toast: {
        /**
         * Show toast message
         * @param {string} message - Message to display
         * @param {string} type - Type: success, error, warning, info
         * @param {number} duration - Duration in ms
         */
        show: function(message, type = 'info', duration = 3000) {
            const container = document.getElementById('toastContainer');
            if (!container) {
                // Create container if not exists
                const newContainer = document.createElement('div');
                newContainer.id = 'toastContainer';
                newContainer.className = 'toast-container';
                document.body.appendChild(newContainer);
            }
            
            const toastContainer = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            
            // Icon mapping
            const icons = {
                success: 'fa-check-circle',
                error: 'fa-times-circle',
                warning: 'fa-exclamation-triangle',
                info: 'fa-info-circle'
            };
            
            toast.innerHTML = `
                <i class="fas ${icons[type] || icons.info}"></i>
                <span>${message}</span>
            `;
            
            toastContainer.appendChild(toast);
            
            // Remove after duration
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(20px)';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        },
        
        success: function(message) {
            this.show(message, 'success');
        },
        
        error: function(message) {
            this.show(message, 'error');
        },
        
        warning: function(message) {
            this.show(message, 'warning');
        },
        
        info: function(message) {
            this.show(message, 'info');
        }
    },
    
    // Authentication System
    auth: {
        /**
         * Sign in with Google
         */
        signInWithGoogle: function() {
            MVX.toast.info('🔄 Connecting to Google...');
            
            MVX.auth.signInWithPopup(MVX.provider)
                .then((result) => {
                    MVX.toast.success(`✅ Welcome, ${result.user.displayName}!`);
                    MVX.ui.updateAuthUI(result.user);
                    MVX.ui.toggleSidebar(false); // Close sidebar after login
                    
                    // Log for analytics
                    console.log(`User logged in: ${result.user.email}`);
                })
                .catch((error) => {
                    console.error('Login error:', error);
                    
                    // Handle specific errors
                    let errorMessage = 'Login failed';
                    if (error.code === 'auth/popup-closed-by-user') {
                        errorMessage = '❌ Popup closed before completion';
                    } else if (error.code === 'auth/cancelled-popup-request') {
                        errorMessage = '❌ Another popup is already open';
                    } else if (error.code === 'auth/network-request-failed') {
                        errorMessage = '❌ Network error - check connection';
                    }
                    
                    MVX.toast.error(errorMessage);
                });
        },
        
        /**
         * Sign out user
         */
        signOut: function() {
            if (confirm('🔒 Secure logout?')) {
                MVX.auth.signOut()
                    .then(() => {
                        MVX.toast.success('👋 Logged out successfully');
                        MVX.ui.updateAuthUI(null);
                        MVX.ui.toggleSidebar(false);
                        
                        // Clear any user-specific cache
                        sessionStorage.removeItem('mvx_user_prefs');
                    })
                    .catch((error) => {
                        MVX.toast.error('❌ Logout failed');
                    });
            }
        },
        
        /**
         * Admin login with password
         * @param {string} password - Admin password
         */
        adminLogin: function(password) {
            // Check lockout
            if (MVX.state.isLocked) {
                MVX.toast.warning(`⛔ Too many attempts - try again later`);
                return false;
            }
            
            if (password === MVX_CONFIG.security.adminPassword) {
                // Success
                sessionStorage.setItem('mvx_admin_token', 'authorized');
                sessionStorage.setItem('login_timestamp', Date.now());
                
                MVX.toast.success('✅ Access granted! Redirecting...');
                
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
                
                return true;
            } else {
                // Failed attempt
                MVX.state.failedAttempts++;
                
                if (MVX.state.failedAttempts >= MVX_CONFIG.security.maxLoginAttempts) {
                    MVX.state.isLocked = true;
                    
                    // Lockout timer
                    setTimeout(() => {
                        MVX.state.isLocked = false;
                        MVX.state.failedAttempts = 0;
                        MVX.toast.info('🟢 Lockout expired - try again');
                    }, MVX_CONFIG.security.lockoutDuration * 1000);
                    
                    MVX.toast.error(`⛔ Maximum attempts exceeded - locked for ${MVX_CONFIG.security.lockoutDuration}s`);
                } else {
                    const attemptsLeft = MVX_CONFIG.security.maxLoginAttempts - MVX.state.failedAttempts;
                    MVX.toast.error(`❌ Invalid password - ${attemptsLeft} attempts left`);
                }
                
                return false;
            }
        },
        
        /**
         * Check if admin is authenticated
         * @returns {boolean} - True if authenticated
         */
        isAdminAuthenticated: function() {
            const token = sessionStorage.getItem('mvx_admin_token');
            const timestamp = sessionStorage.getItem('login_timestamp');
            
            if (!token || !timestamp) return false;
            
            // Check if session expired (1 hour)
            const elapsed = Date.now() - parseInt(timestamp);
            return elapsed < MVX_CONFIG.security.sessionDuration;
        }
    },
    
    // Data Management
    data: {
        /**
         * Fetch all apps from database
         * @returns {Promise} - Promise with apps data
         */
        fetchAllApps: function() {
            return new Promise((resolve, reject) => {
                MVX.db.ref(MVX_CONFIG.database.path).once('value')
                    .then((snapshot) => {
                        const data = snapshot.val();
                        const apps = [];
                        
                        if (data) {
                            Object.entries(data).forEach(([key, value]) => {
                                apps.push({
                                    id: key,
                                    ...value
                                });
                            });
                            
                            // Sort by timestamp (newest first)
                            apps.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                        }
                        
                        resolve(apps);
                    })
                    .catch((error) => {
                        console.error('Error fetching apps:', error);
                        reject(error);
                    });
            });
        },
        
        /**
         * Get app by ID
         * @param {string} id - App ID
         * @returns {Object|null} - App object or null
         */
        getAppById: function(id) {
            return MVX.state.allApps.find(app => app.id === id) || null;
        },
        
        /**
         * Filter apps by criteria
         * @param {string} filter - Filter type
         * @param {string} search - Search term
         * @returns {Array} - Filtered apps
         */
        filterApps: function(filter = 'all', search = '') {
            let filtered = [...MVX.state.allApps];
            
            // Apply category filter
            if (filter !== 'all') {
                if (['Free', 'Premium', 'Paid'].includes(filter)) {
                    filtered = filtered.filter(app => app.accessType === filter);
                } else {
                    filtered = filtered.filter(app => app.gameCategory === filter);
                }
            }
            
            // Apply search filter
            if (search) {
                const searchLower = search.toLowerCase();
                filtered = filtered.filter(app => 
                    (app.appName && app.appName.toLowerCase().includes(searchLower)) ||
                    (app.gameCategory && app.gameCategory.toLowerCase().includes(searchLower)) ||
                    (app.version && app.version.toLowerCase().includes(searchLower))
                );
            }
            
            return filtered;
        },
        
        /**
         * Get stats about database
         * @returns {Object} - Stats object
         */
        getStats: function() {
            const apps = MVX.state.allApps;
            
            return {
                total: apps.length,
                free: apps.filter(a => a.accessType === 'Free').length,
                premium: apps.filter(a => a.accessType === 'Premium').length,
                paid: apps.filter(a => a.accessType === 'Paid').length,
                categories: [...new Set(apps.map(a => a.gameCategory).filter(Boolean))],
                lastUpdate: apps.length > 0 ? Math.max(...apps.map(a => a.timestamp || 0)) : 0
            };
        }
    },
    
    // Download Manager
    download: {
        /**
         * Handle download with security checks
         * @param {Object} app - App object
         */
        handle: function(app) {
            if (!app) {
                MVX.toast.error('❌ Invalid app data');
                return;
            }
            
            // Check access type
            if (app.accessType === 'Paid') {
                // Paid - redirect to WhatsApp
                window.open(MVX_CONFIG.links.whatsapp, '_blank');
                MVX.toast.info('📱 Opening WhatsApp for purchase');
                return;
            }
            
            if (app.accessType === 'Premium' && !MVX.state.currentUser) {
                // Premium but not logged in
                MVX.toast.warning('🔒 Login required for premium files');
                MVX.ui.toggleSidebar(true); // Open sidebar for login
                return;
            }
            
            // Check password protection
            if (app.password && app.password.trim() !== '' && app.password !== 'undefined') {
                this.handlePasswordProtected(app);
            } else {
                // Direct download
                this.startDownload(app.downloadUrl);
            }
        },
        
        /**
         * Handle password protected file
         * @param {Object} app - App object
         */
        handlePasswordProtected: function(app) {
            const password = prompt('🔒 This file is password protected. Enter password:');
            
            if (password === null) {
                // User cancelled
                return;
            }
            
            if (password === app.password) {
                this.startDownload(app.downloadUrl);
            } else {
                MVX.toast.error('❌ Incorrect password');
            }
        },
        
        /**
         * Start actual download
         * @param {string} url - Download URL
         */
        startDownload: function(url) {
            if (!url) {
                MVX.toast.error('❌ Download link not available');
                return;
            }
            
            // Convert Google Drive links if enabled
            if (MVX_CONFIG.features.googleDriveConverter) {
                url = MVX.utils.convertGoogleDriveLink(url);
            }
            
            // Create temporary anchor element
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            MVX.toast.success('🚀 Download started!');
            
            // Track download if enabled
            if (MVX_CONFIG.features.downloadTracking) {
                this.trackDownload(url);
            }
        },
        
        /**
         * Track download for analytics (optional)
         * @param {string} url - Downloaded URL
         */
        trackDownload: function(url) {
            // Implement analytics tracking here
            console.log('Download tracked:', url);
        }
    },
    
    // UI Management
    ui: {
        /**
         * Initialize DOM cache
         */
        initDOM: function() {
            MVX.dom = {
                appGrid: document.getElementById('appGrid'),
                emptyState: document.getElementById('emptyState'),
                sidebar: document.getElementById('sidebar'),
                sidebarOverlay: document.getElementById('sidebarOverlay'),
                searchDrawer: document.getElementById('searchDrawer'),
                searchInput: document.getElementById('globalSearch'),
                modal: document.getElementById('downloadModal'),
                modalBody: document.getElementById('modalBody'),
                preloader: document.getElementById('preloader'),
                
                // Auth elements
                guestView: document.getElementById('guestView'),
                userView: document.getElementById('userView'),
                loginSection: document.getElementById('loginSection'),
                registerSection: document.getElementById('registerSection'),
                headerProfile: document.getElementById('headerProfileImg'),
                userAvatar: document.getElementById('userAvatar'),
                userName: document.getElementById('userName'),
                userEmail: document.getElementById('userEmail'),
                userDownloads: document.getElementById('userDownloads'),
                
                // Category filters
                categoryFilters: document.querySelectorAll('.category-pill')
            };
        },
        
        /**
         * Initialize event listeners
         */
        initEventListeners: function() {
            // Category filter clicks
            if (MVX.dom.categoryFilters) {
                MVX.dom.categoryFilters.forEach(btn => {
                    btn.addEventListener('click', () => {
                        MVX.dom.categoryFilters.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        
                        const filter = btn.dataset.filter;
                        if (filter === 'all') {
                            MVX.state.currentFilter = 'all';
                        } else if (['Free', 'Premium', 'Paid'].includes(filter)) {
                            MVX.state.currentFilter = filter;
                        } else {
                            MVX.state.currentFilter = filter;
                        }
                        
                        MVX.ui.renderApps();
                    });
                });
            }
            
            // Search input with debounce
            if (MVX.dom.searchInput) {
                MVX.dom.searchInput.addEventListener('input', MVX.utils.debounce(function() {
                    MVX.state.searchTerm = this.value.toLowerCase().trim();
                    MVX.ui.renderApps();
                }, 300));
            }
            
            // Close modal on overlay click
            if (MVX.dom.modal) {
                MVX.dom.modal.addEventListener('click', (e) => {
                    if (e.target === MVX.dom.modal) {
                        MVX.ui.closeModal();
                    }
                });
            }
            
            // Close search on escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (MVX.dom.searchDrawer && MVX.dom.searchDrawer.classList.contains('open')) {
                        MVX.ui.toggleSearch(false);
                    }
                    if (MVX.dom.modal && MVX.dom.modal.classList.contains('active')) {
                        MVX.ui.closeModal();
                    }
                }
            });
        },
        
        /**
         * Render apps grid
         * @param {Array} apps - Apps to render (optional, uses filtered if not provided)
         */
        renderApps: function(apps) {
            const grid = MVX.dom.appGrid;
            if (!grid) return;
            
            const appsToRender = apps || MVX.data.filterApps(MVX.state.currentFilter, MVX.state.searchTerm);
            
            // Clear grid
            grid.innerHTML = '';
            
            // Show empty state if no apps
            if (appsToRender.length === 0) {
                if (MVX.dom.emptyState) {
                    MVX.dom.emptyState.style.display = 'block';
                }
                grid.style.display = 'none';
                return;
            }
            
            // Hide empty state
            if (MVX.dom.emptyState) {
                MVX.dom.emptyState.style.display = 'none';
            }
            grid.style.display = 'grid';
            
            // Render each app
            appsToRender.forEach(app => {
                const card = document.createElement('div');
                card.className = `app-card ${app.accessType === 'Premium' ? 'vip-card' : ''}`;
                
                // Determine badge class
                let badgeClass = 'badge-free';
                let btnClass = 'btn-free';
                let btnIcon = 'fa-download';
                let btnText = 'DOWNLOAD';
                
                if (app.accessType === 'Premium') {
                    badgeClass = 'badge-premium';
                    btnClass = 'btn-premium';
                    btnIcon = 'fa-lock-open';
                    btnText = 'UNLOCK';
                } else if (app.accessType === 'Paid') {
                    badgeClass = 'badge-paid';
                    btnClass = 'btn-paid';
                    btnIcon = 'fa-cart-shopping';
                    btnText = 'BUY NOW';
                }
                
                // Format size
                const size = MVX.utils.formatFileSize(app.size);
                
                card.innerHTML = `
                    <span class="app-badge ${badgeClass}">${app.accessType || 'Free'}</span>
                    <img src="${app.iconUrl || 'https://cdn-icons-png.flaticon.com/512/564/564619.png'}" 
                         class="app-icon" 
                         onerror="this.src='https://cdn-icons-png.flaticon.com/512/564/564619.png'"
                         alt="${app.appName || 'App'}">
                    <h3 class="app-title">${app.appName || 'Untitled'}</h3>
                    <div class="app-meta">${app.gameCategory || 'Other'} • ${size}</div>
                    <button class="app-btn ${btnClass}" data-app-id="${app.id}">
                        <i class="fas ${btnIcon}"></i> ${btnText}
                    </button>
                `;
                
                // Add click handler for download
                const btn = card.querySelector('button');
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const appId = e.currentTarget.dataset.appId;
                    const appData = MVX.data.getAppById(appId);
                    if (appData) {
                        MVX.ui.openModal(appData);
                    }
                });
                
                grid.appendChild(card);
            });
        },
        
        /**
         * Open download modal
         * @param {Object} app - App data
         */
        openModal: function(app) {
            if (!app || !MVX.dom.modal || !MVX.dom.modalBody) return;
            
            MVX.state.selectedApp = app;
            
            let modalContent = '';
            const size = MVX.utils.formatFileSize(app.size);
            
            if (app.accessType === 'Paid') {
                // Paid content - WhatsApp
                modalContent = `
                    <div class="modal-app-preview">
                        <img src="${app.iconUrl}" class="modal-app-icon" onerror="this.src='https://cdn-icons-png.flaticon.com/512/564/564619.png'">
                        <div class="modal-app-info">
                            <h2>${app.appName}</h2>
                            <p>${app.version || 'v1.0'}</p>
                        </div>
                    </div>
                    <div class="modal-details">
                        <div class="detail-item"><span>Size</span><strong>${size}</strong></div>
                        <div class="detail-item"><span>Category</span><strong>${app.gameCategory || 'Other'}</strong></div>
                        <div class="detail-item"><span>Type</span><strong style="color: var(--paid);">PAID</strong></div>
                    </div>
                    <a href="${MVX_CONFIG.links.whatsapp}" target="_blank" class="modal-download-btn btn-whatsapp">
                        <i class="fab fa-whatsapp"></i> BUY VIA WHATSAPP
                    </a>
                `;
            } 
            else if (app.accessType === 'Premium' && !MVX.state.currentUser) {
                // Premium but not logged in
                modalContent = `
                    <div class="modal-app-preview">
                        <img src="${app.iconUrl}" class="modal-app-icon" onerror="this.src='https://cdn-icons-png.flaticon.com/512/564/564619.png'">
                        <div class="modal-app-info">
                            <h2>${app.appName}</h2>
                            <p>${app.version || 'v1.0'}</p>
                        </div>
                    </div>
                    <div class="modal-details">
                        <div class="detail-item"><span>Size</span><strong>${size}</strong></div>
                        <div class="detail-item"><span>Category</span><strong>${app.gameCategory || 'Other'}</strong></div>
                        <div class="detail-item"><span>Type</span><strong style="color: var(--gold);">PREMIUM</strong></div>
                    </div>
                    <div class="login-warning">
                        <i class="fas fa-lock"></i> Login required for premium files
                    </div>
                    <button class="modal-download-btn btn-premium" onclick="MVX.ui.toggleSidebar(true); MVX.ui.closeModal();" style="background: transparent; border: 1px solid var(--gold);">
                        <i class="fas fa-sign-in-alt"></i> LOGIN NOW
                    </button>
                `;
            }
            else {
                // Free or Premium (logged in)
                modalContent = `
                    <div class="modal-app-preview">
                        <img src="${app.iconUrl}" class="modal-app-icon" onerror="this.src='https://cdn-icons-png.flaticon.com/512/564/564619.png'">
                        <div class="modal-app-info">
                            <h2>${app.appName}</h2>
                            <p>${app.version || 'v1.0'}</p>
                        </div>
                    </div>
                    <div class="modal-details">
                        <div class="detail-item"><span>Size</span><strong>${size}</strong></div>
                        <div class="detail-item"><span>Category</span><strong>${app.gameCategory || 'Other'}</strong></div>
                        <div class="detail-item"><span>Type</span><strong style="color: var(--primary);">${app.accessType}</strong></div>
                    </div>
                    <button class="modal-download-btn btn-free" onclick="MVX.download.handle(MVX.state.selectedApp)">
                        <i class="fas fa-download"></i> START DOWNLOAD
                    </button>
                `;
            }
            
            MVX.dom.modalBody.innerHTML = modalContent;
            MVX.dom.modal.classList.add('active');
        },
        
        /**
         * Close modal
         */
        closeModal: function() {
            if (MVX.dom.modal) {
                MVX.dom.modal.classList.remove('active');
                setTimeout(() => {
                    MVX.state.selectedApp = null;
                }, 300);
            }
        },
        
        /**
         * Toggle sidebar
         * @param {boolean} force - Force state (optional)
         */
        toggleSidebar: function(force) {
            if (!MVX.dom.sidebar || !MVX.dom.sidebarOverlay) return;
            
            if (typeof force === 'boolean') {
                if (force) {
                    MVX.dom.sidebar.classList.add('active');
                    MVX.dom.sidebarOverlay.classList.add('active');
                } else {
                    MVX.dom.sidebar.classList.remove('active');
                    MVX.dom.sidebarOverlay.classList.remove('active');
                }
            } else {
                MVX.dom.sidebar.classList.toggle('active');
                MVX.dom.sidebarOverlay.classList.toggle('active');
            }
        },
        
        /**
         * Toggle search drawer
         * @param {boolean} force - Force state (optional)
         */
        toggleSearch: function(force) {
            if (!MVX.dom.searchDrawer) return;
            
            if (typeof force === 'boolean') {
                if (force) {
                    MVX.dom.searchDrawer.classList.add('open');
                    if (MVX.dom.searchInput) MVX.dom.searchInput.focus();
                } else {
                    MVX.dom.searchDrawer.classList.remove('open');
                }
            } else {
                MVX.dom.searchDrawer.classList.toggle('open');
                if (MVX.dom.searchDrawer.classList.contains('open') && MVX.dom.searchInput) {
                    MVX.dom.searchInput.focus();
                }
            }
        },
        
        /**
         * Clear search
         */
        clearSearch: function() {
            if (MVX.dom.searchInput) {
                MVX.dom.searchInput.value = '';
                MVX.state.searchTerm = '';
                MVX.ui.renderApps();
            }
            MVX.ui.toggleSearch(false);
        },
        
        /**
         * Update auth UI based on user state
         * @param {Object} user - Firebase user object
         */
        updateAuthUI: function(user) {
            if (!MVX.dom.guestView || !MVX.dom.userView) return;
            
            if (user) {
                // User logged in
                MVX.dom.guestView.style.display = 'none';
                MVX.dom.userView.style.display = 'block';
                
                if (MVX.dom.userAvatar) {
                    MVX.dom.userAvatar.src = user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                }
                if (MVX.dom.userName) {
                    MVX.dom.userName.textContent = user.displayName || 'MVX User';
                }
                if (MVX.dom.userEmail) {
                    MVX.dom.userEmail.textContent = user.email || '';
                }
                if (MVX.dom.headerProfile) {
                    MVX.dom.headerProfile.src = user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                }
                
                // Reset to login view in sidebar
                if (MVX.dom.loginSection && MVX.dom.registerSection) {
                    MVX.dom.loginSection.style.display = 'block';
                    MVX.dom.registerSection.style.display = 'none';
                }
            } else {
                // User logged out
                MVX.dom.guestView.style.display = 'block';
                MVX.dom.userView.style.display = 'none';
                
                if (MVX.dom.headerProfile) {
                    MVX.dom.headerProfile.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                }
            }
        },
        
        /**
         * Toggle between login and register forms
         * @param {string} view - 'login' or 'register'
         */
        toggleAuthForms: function(view) {
            if (!MVX.dom.loginSection || !MVX.dom.registerSection) return;
            
            if (view === 'login') {
                MVX.dom.loginSection.style.display = 'block';
                MVX.dom.registerSection.style.display = 'none';
            } else {
                MVX.dom.loginSection.style.display = 'none';
                MVX.dom.registerSection.style.display = 'block';
            }
        },
        
        /**
         * Show skeleton loaders
         */
        showSkeletons: function() {
            const grid = MVX.dom.appGrid;
            if (!grid) return;
            
            grid.innerHTML = '';
            grid.style.display = 'grid';
            
            for (let i = 0; i < 6; i++) {
                const skeleton = document.createElement('div');
                skeleton.className = 'skeleton-card';
                skeleton.innerHTML = `
                    <div class="skeleton-icon"></div>
                    <div class="skeleton-title"></div>
                    <div class="skeleton-meta"></div>
                    <div class="skeleton-btn"></div>
                `;
                grid.appendChild(skeleton);
            }
        },
        
        /**
         * Hide preloader
         */
        hidePreloader: function() {
            if (MVX.dom.preloader) {
                MVX.dom.preloader.style.opacity = '0';
                setTimeout(() => {
                    MVX.dom.preloader.style.display = 'none';
                }, 500);
            }
        }
    },
    
    // Initialization
    init: function() {
        console.log('🚀 MVX System initializing...');
        
        // Initialize DOM cache
        this.ui.initDOM();
        
        // Show skeletons while loading
        this.ui.showSkeletons();
        
        // Initialize event listeners
        this.ui.initEventListeners();
        
        // Set up auth state listener
        this.auth.onAuthStateChanged((user) => {
            this.state.currentUser = user;
            this.ui.updateAuthUI(user);
        });
        
        // Fetch data from Firebase
        this.db.ref(MVX_CONFIG.database.path).on('value', (snapshot) => {
            const data = snapshot.val();
            
            if (data) {
                // Convert to array
                this.state.allApps = Object.entries(data).map(([key, value]) => ({
                    id: key,
                    ...value
                }));
                
                // Sort by timestamp (newest first)
                this.state.allApps.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                
                console.log(`📦 Loaded ${this.state.allApps.length} apps from database`);
            } else {
                this.state.allApps = [];
                console.log('📦 Database is empty');
            }
            
            // Render apps
            this.ui.renderApps();
            
            // Hide preloader
            this.ui.hidePreloader();
            
            // Log stats
            console.log('📊 Stats:', this.data.getStats());
        }, (error) => {
            console.error('❌ Firebase error:', error);
            this.toast.error('❌ Database connection failed');
            this.ui.hidePreloader();
        });
        
        // Check for admin session timeout
        setInterval(() => {
            if (!this.auth.isAdminAuthenticated() && window.location.pathname.includes('admin.html')) {
                window.location.href = 'login.html';
            }
        }, 60000); // Check every minute
    }
};

// ==========================================================================
// 4. EXPOSE GLOBAL FUNCTIONS (for HTML onclick handlers)
// ==========================================================================
window.MVX = MVX;
window.toggleSidebar = () => MVX.ui.toggleSidebar();
window.toggleSearch = () => MVX.ui.toggleSearch();
window.clearSearch = () => MVX.ui.clearSearch();
window.signInWithGoogle = () => MVX.auth.signInWithGoogle();
window.signOutUser = () => MVX.auth.signOut();
window.toggleAuthForms = (view) => MVX.ui.toggleAuthForms(view);
window.openDownloadModal = (appId) => {
    const app = MVX.data.getAppById(appId);
    if (app) MVX.ui.openModal(app);
};
window.closeModal = () => MVX.ui.closeModal();
window.attemptAdminLogin = (password) => MVX.auth.adminLogin(password);

// ==========================================================================
// 5. AUTO-INITIALIZE ON PAGE LOAD
// ==========================================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MVX.init());
} else {
    MVX.init();
}

// ==========================================================================
// 6. ERROR HANDLING & GLOBAL CATCH
// ==========================================================================
window.addEventListener('error', (e) => {
    console.error('🔥 Global error:', e.error);
    MVX.toast?.error('⚠️ System error occurred');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('🔥 Unhandled promise rejection:', e.reason);
});

// ==========================================================================
// 7. SERVICE WORKER (Optional - for PWA)
// ==========================================================================
if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('ServiceWorker registration failed:', err);
        });
    });
}

// ==========================================================================
// 8. EXPORT FOR MODULE USE (if needed)
// ==========================================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MVX;
}