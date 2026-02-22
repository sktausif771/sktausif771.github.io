/* ==========================================================================
   MVX SYSTEM - GLOBAL JAVASCRIPT ENGINE V4.0
   ==========================================================================
   - Global UI Controls (Toast, Modals)
   - Security Modules (Anti-Inspect)
   - Low-End Device Optimization (Smooth Mode)
   - Global Event Listeners
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Console Branding
    console.log('%c┌──────────────────────────────────────────────────┐', 'color: #00e6b8; font-size: 12px; font-family: monospace');
    console.log('%c│     MVX CYBER SYSTEM v4.0 - INITIALIZED...       │', 'color: #00e6b8; font-size: 12px; font-family: monospace; font-weight: bold');
    console.log('%c└──────────────────────────────────────────────────┘', 'color: #00e6b8; font-size: 12px; font-family: monospace');

    // ==========================================================================
    // 1. GLOBAL TOAST NOTIFICATION SYSTEM
    // ==========================================================================
    window.showGlobalToast = function(message, type = 'success') {
        // Check if toast container exists, if not create one
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-global-container';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast-global ${type}`;
        
        let icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-times-circle';
        if (type === 'warning') icon = 'fa-exclamation-triangle';

        toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // ==========================================================================
    // 2. SMOOTH MODE (LOW-END DEVICE OPTIMIZATION)
    // ==========================================================================
    const checkSmoothMode = () => {
        if (localStorage.getItem('smoothMode') === 'true') {
            document.body.classList.add('smooth-mode');
            // Disable heavy animations globally
            const overlays = document.querySelectorAll('.grid-overlay, .glow-orb, .scanline');
            overlays.forEach(el => el.style.animation = 'none');
        }
    };
    checkSmoothMode(); // Run on page load

    window.toggleGlobalSmoothMode = function(isChecked) {
        if (isChecked) {
            localStorage.setItem('smoothMode', 'true');
            document.body.classList.add('smooth-mode');
            showGlobalToast('Smooth Mode Enabled for low-end devices', 'success');
            setTimeout(() => location.reload(), 1000); // Reload to apply changes effectively
        } else {
            localStorage.setItem('smoothMode', 'false');
            document.body.classList.remove('smooth-mode');
            showGlobalToast('Smooth Mode Disabled', 'info');
            setTimeout(() => location.reload(), 1000);
        }
    };

    // ==========================================================================
    // 3. SECURITY MODULE (ANTI-INSPECT & COPY PROTECTION) - OPTIONAL
    // ==========================================================================
    const enableSecurity = true; // Change to false if you want to allow right-click
    
    if (enableSecurity && window.location.pathname.indexOf('admin.html') === -1) {
        // Disable Right Click
        document.addEventListener('contextmenu', event => event.preventDefault());

        // Disable specific keyboard shortcuts (F12, Ctrl+Shift+I, Ctrl+U)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || 
               (e.ctrlKey && e.shiftKey && e.key === 'I') || 
               (e.ctrlKey && e.key === 'u') || 
               (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
                showGlobalToast('Security protocol active: Action denied', 'error');
            }
        });
    }

    // ==========================================================================
    // 4. FLOATING ACTION BUTTON (SCROLL TO TOP)
    // ==========================================================================
    const createFAB = () => {
        const fab = document.createElement('div');
        fab.className = 'fab';
        fab.innerHTML = '<i class="fas fa-arrow-up"></i>';
        fab.style.display = 'none'; // Hidden by default
        fab.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
        document.body.appendChild(fab);

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                fab.style.display = 'flex';
            } else {
                fab.style.display = 'none';
            }
        });
    };
    
    // Create FAB only on non-admin pages
    if (window.location.pathname.indexOf('admin') === -1 && window.location.pathname.indexOf('login') === -1) {
        createFAB();
    }

    // ==========================================================================
    // 5. GLOBAL SEARCH SHORTCUT (Ctrl + K)
    // ==========================================================================
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            const searchContainer = document.getElementById('searchContainer');
            
            if (searchContainer && searchInput) {
                searchContainer.style.display = 'block';
                searchInput.focus();
            }
        }
        
        // Escape key to close modals/search
        if (e.key === 'Escape') {
            const searchContainer = document.getElementById('searchContainer');
            if (searchContainer) searchContainer.style.display = 'none';
            
            // Close sidebars if open
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('overlay');
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                if(overlay) overlay.classList.remove('active');
            }
        }
    });

    // ==========================================================================
    // 6. OFFLINE/ONLINE DETECTION
    // ==========================================================================
    window.addEventListener('offline', () => {
        showGlobalToast('You are currently offline. Check your connection.', 'error');
    });

    window.addEventListener('online', () => {
        showGlobalToast('Connection restored!', 'success');
    });
});
