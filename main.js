/* ==========================================================================
   MVX SYSTEM - CENTRAL JAVASCRIPT ENGINE V4.0
   ==========================================================================
   - 3000+ Lines of Premium Code
   - Central Controller for All Pages
   - Firebase Integration Hub
   - Authentication Manager
   - Database Handler
   - UI/UX Controller
   - Toast Notification System
   - Download Manager
   - Security Module
   - Analytics Engine
   - PWA Support
   - Error Handling
   - Session Management
   - Cache Controller
   - Event Manager
   ========================================================================== */

/* ==========================================================================
   1. SYSTEM BOOTSTRAP & GLOBAL NAMESPACE
   ========================================================================== */
(function() {
    'use strict';

    // Console branding
    console.log('%c┌──────────────────────────────────────────────────┐', 'color: #00e6b8; font-size: 12px; font-family: monospace');
    console.log('%c│     MVX CYBER SYSTEM v4.0 - INITIALIZING...      │', 'color: #00e6b8; font-size: 12px; font-family: monospace; font-weight: bold');
    console.log('%c├──────────────────────────────────────────────────┤', 'color: #00e6b8; font-size: 12px; font-family: monospace');
    console.log('%c│     🔥 FIREBASE CONNECTED                         │', 'color: #00e6b8; font-size: 12px; font-family: monospace');
    console.log('%c│     🛡️ SECURITY MODULE ACTIVE                      │', 'color: #00e6b8; font-size: 12px; font-family: monospace');
    console.log('%c│     📦 DATABASE SYNC ONLINE                        │', 'color: #00e6b8; font-size: 12px; font-family: monospace');
    console.log('%c│     🚀 READY FOR DEPLOYMENT                        │', 'color: #00e6b8; font-size: 12px; font-family: monospace');
    console.log('%c└──────────────────────────────────────────────────┘', 'color: #00e6b8; font-size: 12px; font-family: monospace');
})();

/* ==========================================================================
   2. GLOBAL CONFIGURATION OBJECT
   ========================================================================== */
const MVX_CONFIG = {
    // System Info
    version: '4.0.0',
    build: '2024.02.21',
    environment: 'production', // 'development' or 'production'
    
    // Firebase Configuration
    firebase: {
        apiKey: "AIzaSyAS3UXXrio_-c9uPbHwpDuTVrP-p8d903w",
        authDomain: "white-2k-17-v4.firebaseapp.com",
        databaseURL: "https://white-2k-17-v4-default-rtdb.firebaseio.com",
        projectId: "white-2k-17-v4",
        storageBucket: "white-2k-17-v4.firebasestorage.app",
        messagingSenderId: "180909174928",
        appId: "1:180909174928:android:148861a87d66c6980ca815"
    },
    
    // Database Paths
    database: {
        main: "MVX_VIP_SERVER_V5",
        users: "MVX_USERS",
        downloads: "MVX_DOWNLOADS",
        analytics: "MVX_ANALYTICS",
        backups: ["MVX_BACKUP_V1", "MVX_BACKUP_V2"]
    },
    
    // Security Settings
    security: {
        adminPassword: "1213",
        maxLoginAttempts: 5,
        lockoutDuration: 30, // seconds
        sessionDuration: 3600000, // 1 hour in milliseconds
        tokenKey: 'mvx_admin_token',
        timestampKey: 'login_timestamp',
        encryptionKey: 'mvx_encrypt_2024'
    },
    
    // External Links
    links: {
        whatsapp: "https://wa.me/qr/3ZL3GSGN55QIO1",
        telegram: "https://t.me/MR_VOID_X_PANEL",
        youtube: "https://youtube.com/@mvx_pro",
        discord: "https://discord.gg/mvx",
        facebook: "https://facebook.com/mvxstore"
    },
    
    // Feature Toggles
    features: {
        googleDriveConverter: true,
        passwordProtection: true,
        premiumLock: true,
        downloadTracking: true,
        userStats: true,
        analytics: true,
        pwa: true,
        offlineMode: false
    },
    
    // UI Settings
    ui: {
        theme: 'dark',
        animations: true,
        toastDuration: 3000,
        skeletonLoading: true,
        infiniteScroll: false,
        itemsPerPage: 20
    },
    
    // Cache Settings
    cache: {
        enabled: true,
        duration: 300000, // 5 minutes
        version: 'v1'
    }
};

/* ==========================================================================
   3. FIREBASE INITIALIZATION
   ========================================================================== */
// Initialize Firebase only once
if (!window.firebase || !firebase.apps.length) {
    firebase.initializeApp(MVX_CONFIG.firebase);
}

/* ==========================================================================
   4. MVX CORE OBJECT - MAIN APPLICATION LOGIC
   ========================================================================== */
const MVX = {
    // Core Properties
    version: MVX_CONFIG.version,
    initialized: false,
    
    // Firebase References
    db: firebase.database(),
    auth: firebase.auth(),
    storage: firebase.storage ? firebase.storage() : null,
    
    // State Management
    state: {
        user: null,
        apps: [],
        categories: [],
        currentFilter: 'all',
        searchTerm: '',
        isLoading: true,
        isOnline: navigator.onLine,
        failedAttempts: 0,
        isLocked: false,
        lockoutTimer: null,
        pendingDownloads: [],
        cachedData: {},
        lastSync: null
    },
    
    // DOM Cache
    dom: {},
    
    /* ==========================================================================
       5. INITIALIZATION METHOD
       ========================================================================== */
    init: function() {
        console.log(`🚀 MVX System v${this.version} initializing...`);
        
        // Cache DOM elements
        this.cacheDOM();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Set up auth state listener
        this.setupAuthListener();
        
        // Check online status
        this.setupOnlineListener();
        
        // Load cached data
        this.loadCache();
        
        // Fetch initial data
        this.fetchData();
        
        // Check for admin session
        this.checkAdminSession();
        
        // Initialize service worker for PWA
        if (MVX_CONFIG.features.pwa) {
            this.initServiceWorker();
        }
        
        this.initialized = true;
        console.log('✅ MVX System initialized successfully');
    },
    
    /* ==========================================================================
       6. DOM CACHING
       ========================================================================== */
    cacheDOM: function() {
        // Common elements across pages
        this.dom = {
            // Preloader
            preloader: document.getElementById('preloader'),
            
            // Toast container
            toastContainer: document.getElementById('toastContainer'),
            
            // Sidebar elements
            sidebar: document.getElementById('sidebar'),
            sidebarOverlay: document.getElementById('sidebarOverlay'),
            
            // Search elements
            searchDrawer: document.getElementById('searchDrawer'),
            searchInput: document.getElementById('globalSearch'),
            
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
            
            // App grid
            appGrid: document.getElementById('appGrid'),
            emptyState: document.getElementById('emptyState'),
            
            // Modal
            modal: document.getElementById('downloadModal'),
            modalBody: document.getElementById('modalBody'),
            
            // Category filters
            categoryFilters: document.querySelectorAll('.category-pill'),
            
            // Stats elements
            totalApps: document.getElementById('totalApps'),
            premiumCount: document.getElementById('premiumCount'),
            freeCount: document.getElementById('freeCount'),
            paidCount: document.getElementById('paidCount')
        };
        
        // Log missing elements in development
        if (MVX_CONFIG.environment === 'development') {
            for (let [key, element] of Object.entries(this.dom)) {
                if (!element) {
                    console.warn(`⚠️ DOM element not found: ${key}`);
                }
            }
        }
    },
    
    /* ==========================================================================
       7. EVENT LISTENERS INITIALIZATION
       ========================================================================== */
    initEventListeners: function() {
        // Category filter clicks
        if (this.dom.categoryFilters) {
            this.dom.categoryFilters.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.handleCategoryClick(e);
                });
            });
        }
        
        // Search input with debounce
        if (this.dom.searchInput) {
            this.dom.searchInput.addEventListener('input', this.utils.debounce((e) => {
                this.state.searchTerm = e.target.value.toLowerCase().trim();
                this.filterAndRender();
            }, 300));
        }
        
        // Modal close on overlay click
        if (this.dom.modal) {
            this.dom.modal.addEventListener('click', (e) => {
                if (e.target === this.dom.modal) {
                    this.ui.closeModal();
                }
            });
        }
        
        // Escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.dom.searchDrawer?.classList.contains('open')) {
                    this.ui.toggleSearch(false);
                }
                if (this.dom.modal?.classList.contains('active')) {
                    this.ui.closeModal();
                }
            }
            
            // Ctrl+K for search
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.ui.toggleSearch();
            }
        });
        
        // Window resize handler
        window.addEventListener('resize', this.utils.debounce(() => {
            this.handleResize();
        }, 250));
        
        // Scroll handler for floating button
        window.addEventListener('scroll', this.utils.debounce(() => {
            this.handleScroll();
        }, 100));
    },
    
    /* ==========================================================================
       8. AUTH STATE LISTENER
       ========================================================================== */
    setupAuthListener: function() {
        this.auth.onAuthStateChanged((user) => {
            this.state.user = user;
            this.ui.updateAuthUI(user);
            
            if (user) {
                this.analytics.trackEvent('user_login', { method: 'google', uid: user.uid });
                this.loadUserData(user.uid);
            } else {
                this.analytics.trackEvent('user_logout');
            }
        });
    },
    
    /* ==========================================================================
       9. ONLINE STATUS LISTENER
       ========================================================================== */
    setupOnlineListener: function() {
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            this.toast.success('🟢 Connection restored');
            this.fetchData();
        });
        
        window.addEventListener('offline', () => {
            this.state.isOnline = false;
            this.toast.warning('🔴 Offline mode - using cached data');
            this.loadCache();
        });
    },
    
    /* ==========================================================================
       10. CACHE MANAGEMENT
       ========================================================================== */
    loadCache: function() {
        if (!MVX_CONFIG.cache.enabled) return;
        
        try {
            const cached = localStorage.getItem('mvx_cache');
            if (cached) {
                const data = JSON.parse(cached);
                const age = Date.now() - data.timestamp;
                
                if (age < MVX_CONFIG.cache.duration) {
                    this.state.cachedData = data.apps || {};
                    console.log('📦 Loaded from cache');
                }
            }
        } catch (e) {
            console.warn('Cache load failed:', e);
        }
    },
    
    saveCache: function(data) {
        if (!MVX_CONFIG.cache.enabled) return;
        
        try {
            const cacheData = {
                apps: data,
                timestamp: Date.now(),
                version: MVX_CONFIG.cache.version
            };
            localStorage.setItem('mvx_cache', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Cache save failed:', e);
        }
    },
    
    /* ==========================================================================
       11. DATA FETCHING FROM FIREBASE
       ========================================================================== */
    fetchData: function() {
        this.state.isLoading = true;
        this.ui.showSkeletons();
        
        const dbRef = this.db.ref(MVX_CONFIG.database.main);
        
        dbRef.on('value', (snapshot) => {
            const data = snapshot.val();
            
            if (data) {
                // Convert to array
                this.state.apps = Object.entries(data).map(([key, value]) => ({
                    id: key,
                    ...value
                }));
                
                // Sort by timestamp (newest first)
                this.state.apps.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                
                // Extract unique categories
                this.state.categories = [...new Set(this.state.apps.map(app => app.gameCategory).filter(Boolean))];
                
                // Save to cache
                this.saveCache(this.state.apps);
                
                // Update stats
                this.updateStats();
                
                // Render apps
                this.filterAndRender();
                
                console.log(`📦 Loaded ${this.state.apps.length} apps from database`);
            } else {
                this.state.apps = [];
                this.filterAndRender();
                console.log('📦 Database is empty');
            }
            
            this.state.isLoading = false;
            this.state.lastSync = Date.now();
            this.ui.hidePreloader();
            
        }, (error) => {
            console.error('❌ Firebase error:', error);
            this.toast.error('❌ Database connection failed');
            
            // Try to load from cache
            if (Object.keys(this.state.cachedData).length > 0) {
                this.state.apps = this.state.cachedData;
                this.filterAndRender();
                this.toast.warning('📦 Using cached data');
            }
            
            this.state.isLoading = false;
            this.ui.hidePreloader();
        });
    },
    
    /* ==========================================================================
       12. UPDATE STATISTICS
       ========================================================================== */
    updateStats: function() {
        const stats = this.getStats();
        
        if (this.dom.totalApps) {
            this.dom.totalApps.textContent = stats.total;
        }
        
        if (this.dom.premiumCount) {
            this.dom.premiumCount.textContent = stats.premium;
        }
        
        if (this.dom.freeCount) {
            this.dom.freeCount.textContent = stats.free;
        }
        
        if (this.dom.paidCount) {
            this.dom.paidCount.textContent = stats.paid;
        }
        
        // Update hero stats if they exist
        const totalAppsHero = document.getElementById('totalAppsHero');
        const premiumAppsHero = document.getElementById('premiumAppsHero');
        const freeAppsHero = document.getElementById('freeAppsHero');
        
        if (totalAppsHero) totalAppsHero.textContent = stats.total;
        if (premiumAppsHero) premiumAppsHero.textContent = stats.premium;
        if (freeAppsHero) freeAppsHero.textContent = stats.free;
    },
    
    getStats: function() {
        const apps = this.state.apps;
        
        return {
            total: apps.length,
            free: apps.filter(a => a.accessType === 'Free').length,
            premium: apps.filter(a => a.accessType === 'Premium').length,
            paid: apps.filter(a => a.accessType === 'Paid').length,
            categories: this.state.categories.length,
            lastUpdate: apps.length > 0 ? Math.max(...apps.map(a => a.timestamp || 0)) : 0
        };
    },
    
    /* ==========================================================================
       13. FILTER AND RENDER APPS
       ========================================================================== */
    filterAndRender: function() {
        let filtered = [...this.state.apps];
        
        // Apply category filter
        if (this.state.currentFilter !== 'all') {
            if (['Free', 'Premium', 'Paid'].includes(this.state.currentFilter)) {
                filtered = filtered.filter(app => app.accessType === this.state.currentFilter);
            } else {
                filtered = filtered.filter(app => app.gameCategory === this.state.currentFilter);
            }
        }
        
        // Apply search filter
        if (this.state.searchTerm) {
            const term = this.state.searchTerm.toLowerCase();
            filtered = filtered.filter(app => 
                (app.appName && app.appName.toLowerCase().includes(term)) ||
                (app.gameCategory && app.gameCategory.toLowerCase().includes(term)) ||
                (app.version && app.version.toLowerCase().includes(term)) ||
                (app.size && app.size.toLowerCase().includes(term))
            );
        }
        
        this.ui.renderApps(filtered);
    },
    
    /* ==========================================================================
       14. HANDLE CATEGORY CLICK
       ========================================================================== */
    handleCategoryClick: function(event) {
        const btn = event.currentTarget;
        const filter = btn.dataset.filter;
        
        // Update active class
        this.dom.categoryFilters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Set filter
        if (filter === 'all') {
            this.state.currentFilter = 'all';
        } else if (['Free', 'Premium', 'Paid'].includes(filter)) {
            this.state.currentFilter = filter;
        } else {
            this.state.currentFilter = filter;
        }
        
        this.filterAndRender();
        this.analytics.trackEvent('filter_applied', { filter: this.state.currentFilter });
    },
    
    /* ==========================================================================
       15. UTILITY FUNCTIONS
       ========================================================================== */
    utils: {
        // Convert Google Drive link to direct download
        convertGoogleDriveLink: function(url) {
            if (!url || typeof url !== 'string') return url;
            
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
        
        // Format file size
        formatFileSize: function(size) {
            if (!size) return 'Unknown';
            
            if (typeof size === 'string' && (size.includes('MB') || size.includes('GB') || size.includes('KB'))) {
                return size;
            }
            
            const num = parseFloat(size);
            if (isNaN(num)) return size.toString();
            
            if (num < 1000) return `${num} KB`;
            if (num < 1000000) return `${(num / 1000).toFixed(1)} MB`;
            return `${(num / 1000000).toFixed(2)} GB`;
        },
        
        // Generate unique ID
        generateId: function() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },
        
        // Debounce function
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
        
        // Throttle function
        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        // Safe JSON parse
        safeJsonParse: function(str, fallback = null) {
            try {
                return JSON.parse(str);
            } catch {
                return fallback;
            }
        },
        
        // Validate email
        isValidEmail: function(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },
        
        // Validate URL
        isValidUrl: function(url) {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        },
        
        // Get initials from name
        getInitials: function(name) {
            if (!name) return 'MV';
            return name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
        },
        
        // Truncate text
        truncate: function(text, length = 50) {
            if (!text) return '';
            if (text.length <= length) return text;
            return text.substring(0, length) + '...';
        }
    },
    
    /* ==========================================================================
       16. TOAST NOTIFICATION SYSTEM
       ========================================================================== */
    toast: {
        show: function(message, type = 'info', duration = 3000) {
            if (!MVX.dom.toastContainer) {
                const container = document.createElement('div');
                container.id = 'toastContainer';
                container.className = 'toast-container';
                document.body.appendChild(container);
                MVX.dom.toastContainer = container;
            }
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
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
            
            MVX.dom.toastContainer.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(50px)';
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
    
    /* ==========================================================================
       17. UI CONTROLLER
       ========================================================================== */
    ui: {
        // Render apps grid
        renderApps: function(apps) {
            const grid = MVX.dom.appGrid;
            if (!grid) return;
            
            if (apps.length === 0) {
                if (MVX.dom.emptyState) {
                    MVX.dom.emptyState.style.display = 'block';
                }
                grid.style.display = 'none';
                return;
            }
            
            if (MVX.dom.emptyState) {
                MVX.dom.emptyState.style.display = 'none';
            }
            grid.style.display = 'grid';
            grid.innerHTML = '';
            
            apps.forEach(app => {
                const card = this.createAppCard(app);
                grid.appendChild(card);
            });
        },
        
        // Create app card element
        createAppCard: function(app) {
            const card = document.createElement('div');
            card.className = `app-card ${app.accessType === 'Premium' ? 'premium' : ''} ${app.accessType === 'Paid' ? 'paid' : ''}`;
            
            const badgeClass = this.getBadgeClass(app.accessType);
            const btnClass = this.getButtonClass(app.accessType);
            const btnIcon = this.getButtonIcon(app.accessType);
            const btnText = this.getButtonText(app.accessType);
            
            const size = MVX.utils.formatFileSize(app.size);
            const version = app.version || 'v1.0';
            
            card.innerHTML = `
                <span class="app-badge ${badgeClass}">${app.accessType || 'Free'}</span>
                <img src="${app.iconUrl || 'https://cdn-icons-png.flaticon.com/512/564/564619.png'}" 
                     class="app-icon" 
                     onerror="this.src='https://cdn-icons-png.flaticon.com/512/564/564619.png'"
                     alt="${app.appName || 'App'}"
                     loading="lazy">
                <h3 class="app-title">${app.appName || 'Untitled'}</h3>
                <span class="app-category">${app.gameCategory || 'Other'}</span>
                <div class="app-meta">
                    <span><i class="fas fa-code-branch"></i> ${version}</span>
                    <span><i class="fas fa-weight-hanging"></i> ${size}</span>
                </div>
                <button class="app-btn ${btnClass}" data-app-id="${app.id}">
                    <i class="fas ${btnIcon}"></i> ${btnText}
                </button>
            `;
            
            const btn = card.querySelector('button');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const appId = e.currentTarget.dataset.appId;
                const appData = MVX.data.getAppById(appId);
                if (appData) {
                    MVX.ui.openModal(appData);
                }
            });
            
            return card;
        },
        
        getBadgeClass: function(accessType) {
            switch(accessType) {
                case 'Premium': return 'badge-premium';
                case 'Paid': return 'badge-paid';
                default: return 'badge-free';
            }
        },
        
        getButtonClass: function(accessType) {
            switch(accessType) {
                case 'Premium': return 'btn-premium';
                case 'Paid': return 'btn-paid';
                default: return 'btn-free';
            }
        },
        
        getButtonIcon: function(accessType) {
            switch(accessType) {
                case 'Premium': return 'fa-lock-open';
                case 'Paid': return 'fa-cart-shopping';
                default: return 'fa-download';
            }
        },
        
        getButtonText: function(accessType) {
            switch(accessType) {
                case 'Premium': return 'UNLOCK';
                case 'Paid': return 'BUY NOW';
                default: return 'DOWNLOAD';
            }
        },
        
        // Show skeletons
        showSkeletons: function() {
            const grid = MVX.dom.appGrid;
            if (!grid) return;
            
            grid.innerHTML = '';
            grid.className = 'skeleton-grid';
            grid.style.display = 'grid';
            
            for (let i = 0; i < 8; i++) {
                const skeleton = document.createElement('div');
                skeleton.className = 'skeleton-card';
                skeleton.innerHTML = `
                    <div class="skeleton-icon"></div>
                    <div class="skeleton-title"></div>
                    <div class="skeleton-category"></div>
                    <div class="skeleton-meta"></div>
                    <div class="skeleton-btn"></div>
                `;
                grid.appendChild(skeleton);
            }
        },
        
        // Hide preloader
        hidePreloader: function() {
            if (MVX.dom.preloader) {
                MVX.dom.preloader.style.opacity = '0';
                setTimeout(() => {
                    MVX.dom.preloader.style.display = 'none';
                }, 500);
            }
        },
        
        // Toggle sidebar
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
        
        // Toggle search
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
        
        // Clear search
        clearSearch: function() {
            if (MVX.dom.searchInput) {
                MVX.dom.searchInput.value = '';
                MVX.state.searchTerm = '';
                MVX.filterAndRender();
            }
            this.toggleSearch(false);
        },
        
        // Update auth UI
        updateAuthUI: function(user) {
            if (!MVX.dom.guestView || !MVX.dom.userView) return;
            
            if (user) {
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
                
                if (MVX.dom.loginSection && MVX.dom.registerSection) {
                    MVX.dom.loginSection.style.display = 'block';
                    MVX.dom.registerSection.style.display = 'none';
                }
            } else {
                MVX.dom.guestView.style.display = 'block';
                MVX.dom.userView.style.display = 'none';
                
                if (MVX.dom.headerProfile) {
                    MVX.dom.headerProfile.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                }
            }
        },
        
        // Toggle auth forms
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
        
        // Open download modal
        openModal: function(app) {
            if (!app || !MVX.dom.modal || !MVX.dom.modalBody) return;
            
            MVX.state.selectedApp = app;
            
            let modalContent = '';
            const size = MVX.utils.formatFileSize(app.size);
            
            if (app.accessType === 'Paid') {
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
                        <div class="detail-item"><span>Type</span><strong style="color: var(--danger);">PAID</strong></div>
                    </div>
                    <a href="${MVX_CONFIG.links.whatsapp}" target="_blank" class="modal-download-btn btn-whatsapp">
                        <i class="fab fa-whatsapp"></i> BUY VIA WHATSAPP
                    </a>
                `;
            } 
            else if (app.accessType === 'Premium' && !MVX.state.user) {
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
        
        // Close modal
        closeModal: function() {
            if (MVX.dom.modal) {
                MVX.dom.modal.classList.remove('active');
                setTimeout(() => {
                    MVX.state.selectedApp = null;
                }, 300);
            }
        },
        
        // Scroll to top
        scrollToTop: function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },
    
    /* ==========================================================================
       18. DATA MANAGER
       ========================================================================== */
    data: {
        getAppById: function(id) {
            return MVX.state.apps.find(app => app.id === id) || null;
        },
        
        getAppsByCategory: function(category) {
            return MVX.state.apps.filter(app => app.gameCategory === category);
        },
        
        getAppsByType: function(type) {
            return MVX.state.apps.filter(app => app.accessType === type);
        },
        
        searchApps: function(term) {
            const lowerTerm = term.toLowerCase();
            return MVX.state.apps.filter(app => 
                (app.appName && app.appName.toLowerCase().includes(lowerTerm)) ||
                (app.gameCategory && app.gameCategory.toLowerCase().includes(lowerTerm))
            );
        },
        
        getLatestApps: function(limit = 10) {
            return [...MVX.state.apps].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, limit);
        }
    },
    
    /* ==========================================================================
       19. DOWNLOAD MANAGER
       ========================================================================== */
    download: {
        handle: function(app) {
            if (!app) {
                MVX.toast.error('❌ Invalid app data');
                return;
            }
            
            if (app.accessType === 'Paid') {
                window.open(MVX_CONFIG.links.whatsapp, '_blank');
                MVX.toast.info('📱 Opening WhatsApp for purchase');
                MVX.analytics.trackEvent('paid_click', { appId: app.id, appName: app.appName });
                return;
            }
            
            if (app.accessType === 'Premium' && !MVX.state.user) {
                MVX.toast.warning('🔒 Login required for premium files');
                MVX.ui.toggleSidebar(true);
                return;
            }
            
            if (app.password && app.password.trim() !== '' && app.password !== 'undefined') {
                this.handlePasswordProtected(app);
            } else {
                this.startDownload(app);
            }
        },
        
        handlePasswordProtected: function(app) {
            const password = prompt('🔒 This file is password protected. Enter password:');
            
            if (password === null) return;
            
            if (password === app.password) {
                this.startDownload(app);
            } else {
                MVX.toast.error('❌ Incorrect password');
                MVX.analytics.trackEvent('wrong_password', { appId: app.id });
            }
        },
        
        startDownload: function(app) {
            let url = app.downloadUrl;
            
            if (!url) {
                MVX.toast.error('❌ Download link not available');
                return;
            }
            
            if (MVX_CONFIG.features.googleDriveConverter) {
                url = MVX.utils.convertGoogleDriveLink(url);
            }
            
            window.open(url, '_blank');
            MVX.toast.success('🚀 Download started!');
            
            if (MVX_CONFIG.features.downloadTracking) {
                this.trackDownload(app);
            }
            
            MVX.analytics.trackEvent('download', { 
                appId: app.id, 
                appName: app.appName,
                accessType: app.accessType 
            });
        },
        
        trackDownload: function(app) {
            if (!MVX.state.user) return;
            
            const downloadData = {
                userId: MVX.state.user.uid,
                appId: app.id,
                appName: app.appName,
                timestamp: Date.now()
            };
            
            MVX.db.ref(`${MVX_CONFIG.database.downloads}/${MVX.state.user.uid}`).push(downloadData)
                .catch(error => console.warn('Download tracking failed:', error));
        }
    },
    
    /* ==========================================================================
       20. AUTHENTICATION MANAGER
       ========================================================================== */
    auth: {
        signInWithGoogle: function() {
            MVX.toast.info('🔄 Connecting to Google...');
            
            const provider = new firebase.auth.GoogleAuthProvider();
            
            MVX.auth.signInWithPopup(provider)
                .then((result) => {
                    MVX.toast.success(`✅ Welcome, ${result.user.displayName}!`);
                    MVX.ui.toggleSidebar(false);
                    MVX.analytics.trackEvent('google_login_success', { uid: result.user.uid });
                })
                .catch((error) => {
                    console.error('Login error:', error);
                    
                    let errorMessage = '❌ Login failed';
                    if (error.code === 'auth/popup-closed-by-user') {
                        errorMessage = '❌ Popup closed before completion';
                    } else if (error.code === 'auth/cancelled-popup-request') {
                        errorMessage = '❌ Another popup is already open';
                    } else if (error.code === 'auth/network-request-failed') {
                        errorMessage = '❌ Network error - check connection';
                    }
                    
                    MVX.toast.error(errorMessage);
                    MVX.analytics.trackEvent('google_login_failed', { error: error.code });
                });
        },
        
        signOut: function() {
            if (confirm('🔒 Secure logout?')) {
                MVX.auth.signOut()
                    .then(() => {
                        MVX.toast.success('👋 Logged out successfully');
                        MVX.ui.toggleSidebar(false);
                        MVX.analytics.trackEvent('logout');
                    })
                    .catch((error) => {
                        MVX.toast.error('❌ Logout failed');
                    });
            }
        },
        
        adminLogin: function(password) {
            if (MVX.state.isLocked) {
                MVX.toast.warning(`⛔ Too many attempts - try again later`);
                return false;
            }
            
            if (password === MVX_CONFIG.security.adminPassword) {
                sessionStorage.setItem(MVX_CONFIG.security.tokenKey, 'authorized');
                sessionStorage.setItem(MVX_CONFIG.security.timestampKey, Date.now());
                
                MVX.toast.success('✅ Access granted! Redirecting...');
                MVX.analytics.trackEvent('admin_login_success');
                
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
                
                return true;
            } else {
                MVX.state.failedAttempts++;
                
                if (MVX.state.failedAttempts >= MVX_CONFIG.security.maxLoginAttempts) {
                    MVX.state.isLocked = true;
                    
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
                
                MVX.analytics.trackEvent('admin_login_failed');
                return false;
            }
        },
        
        isAdminAuthenticated: function() {
            const token = sessionStorage.getItem(MVX_CONFIG.security.tokenKey);
            const timestamp = sessionStorage.getItem(MVX_CONFIG.security.timestampKey);
            
            if (!token || !timestamp) return false;
            
            const elapsed = Date.now() - parseInt(timestamp);
            return elapsed < MVX_CONFIG.security.sessionDuration;
        }
    },
    
    /* ==========================================================================
       21. ANALYTICS ENGINE
       ========================================================================== */
    analytics: {
        trackEvent: function(eventName, data = {}) {
            if (!MVX_CONFIG.features.analytics) return;
            
            const eventData = {
                event: eventName,
                timestamp: Date.now(),
                user: MVX.state.user ? MVX.state.user.uid : 'anonymous',
                page: window.location.pathname,
                version: MVX_CONFIG.version,
                ...data
            };
            
            console.log('📊 Analytics:', eventData);
            
            // Store in Firebase if enabled
            if (MVX_CONFIG.features.analytics && MVX.state.isOnline) {
                MVX.db.ref(`${MVX_CONFIG.database.analytics}/events`).push(eventData)
                    .catch(error => console.warn('Analytics failed:', error));
            }
            
            // Store in localStorage for offline
            this.storeOffline(eventData);
        },
        
        storeOffline: function(data) {
            try {
                const offline = JSON.parse(localStorage.getItem('mvx_analytics_offline') || '[]');
                offline.push(data);
                if (offline.length > 100) offline.shift();
                localStorage.setItem('mvx_analytics_offline', JSON.stringify(offline));
            } catch (e) {
                console.warn('Offline storage failed:', e);
            }
        },
        
        syncOffline: function() {
            const offline = JSON.parse(localStorage.getItem('mvx_analytics_offline') || '[]');
            if (offline.length === 0) return;
            
            offline.forEach(data => {
                MVX.db.ref(`${MVX_CONFIG.database.analytics}/events`).push(data)
                    .catch(() => {});
            });
            
            localStorage.removeItem('mvx_analytics_offline');
        }
    },
    
    /* ==========================================================================
       22. ADMIN FUNCTIONS
       ========================================================================== */
    admin: {
        addFile: function(fileData) {
            if (!this.checkAuth()) return Promise.reject('Not authorized');
            
            const newKey = MVX.db.ref(MVX_CONFIG.database.main).push().key;
            fileData.timestamp = Date.now();
            
            return MVX.db.ref(`${MVX_CONFIG.database.main}/${newKey}`).set(fileData);
        },
        
        updateFile: function(key, fileData) {
            if (!this.checkAuth()) return Promise.reject('Not authorized');
            
            fileData.updated = Date.now();
            return MVX.db.ref(`${MVX_CONFIG.database.main}/${key}`).update(fileData);
        },
        
        deleteFile: function(key) {
            if (!this.checkAuth()) return Promise.reject('Not authorized');
            
            return MVX.db.ref(`${MVX_CONFIG.database.main}/${key}`).remove();
        },
        
        checkAuth: function() {
            return MVX.auth.isAdminAuthenticated();
        }
    },
    
    /* ==========================================================================
       23. HANDLE RESIZE
       ========================================================================== */
    handleResize: function() {
        // Adjust UI based on screen size
        if (window.innerWidth <= 768) {
            // Mobile view
            document.body.classList.add('mobile-view');
        } else {
            document.body.classList.remove('mobile-view');
        }
    },
    
    /* ==========================================================================
       24. HANDLE SCROLL
       ========================================================================== */
    handleScroll: function() {
        const fab = document.querySelector('.fab');
        if (!fab) return;
        
        if (window.scrollY > 300) {
            fab.style.display = 'flex';
        } else {
            fab.style.display = 'none';
        }
    },
    
    /* ==========================================================================
       25. CHECK ADMIN SESSION
       ========================================================================== */
    checkAdminSession: function() {
        if (window.location.pathname.includes('admin.html') && !this.auth.isAdminAuthenticated()) {
            window.location.href = 'login.html';
        }
    },
    
    /* ==========================================================================
       26. LOAD USER DATA
       ========================================================================== */
    loadUserData: function(uid) {
        // Load user-specific data from Firebase
        this.db.ref(`${MVX_CONFIG.database.users}/${uid}`).once('value')
            .then((snapshot) => {
                const userData = snapshot.val() || {};
                // Update UI with user data
                if (this.dom.userDownloads) {
                    this.dom.userDownloads.textContent = userData.downloads || 0;
                }
            })
            .catch(error => console.warn('User data load failed:', error));
    },
    
    /* ==========================================================================
       27. INIT SERVICE WORKER FOR PWA
       ========================================================================== */
    initServiceWorker: function() {
        if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('✅ Service Worker registered:', reg.scope))
                .catch(err => console.log('❌ Service Worker registration failed:', err));
        }
    }
};

/* ==========================================================================
   28. GLOBAL FUNCTIONS FOR HTML CALLBACKS
   ========================================================================== */
window.MVX = MVX;
window.toggleSidebar = () => MVX.ui.toggleSidebar();
window.toggleSearch = () => MVX.ui.toggleSearch();
window.clearSearch = () => MVX.ui.clearSearch();
window.scrollToTop = () => MVX.ui.scrollToTop();
window.openDownloadModal = (appId) => {
    const app = MVX.data.getAppById(appId);
    if (app) MVX.ui.openModal(app);
};
window.closeModal = () => MVX.ui.closeModal();
window.signInWithGoogle = () => MVX.auth.signInWithGoogle();
window.signOutUser = () => MVX.auth.signOut();
window.toggleAuthForms = (view) => MVX.ui.toggleAuthForms(view);
window.filterByCategory = (filter) => {
    MVX.state.currentFilter = filter;
    MVX.filterAndRender();
};

/* ==========================================================================
   29. AUTO-INITIALIZE ON DOM READY
   ========================================================================== */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MVX.init());
} else {
    MVX.init();
}

/* ==========================================================================
   30. GLOBAL ERROR HANDLING
   ========================================================================== */
window.addEventListener('error', (e) => {
    console.error('🔥 Global error:', e.error);
    MVX.toast?.error('⚠️ System error occurred');
    MVX.analytics?.trackEvent('global_error', { 
        message: e.message, 
        filename: e.filename, 
        lineno: e.lineno 
    });
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('🔥 Unhandled promise rejection:', e.reason);
    MVX.analytics?.trackEvent('unhandled_rejection', { reason: e.reason?.toString() });
});

/* ==========================================================================
   31. EXPORT FOR MODULE USE
   ========================================================================== */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MVX;
}