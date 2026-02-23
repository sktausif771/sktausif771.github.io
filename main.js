/* ==========================================================================
   MVX SYSTEM - GLOBAL JAVASCRIPT ENGINE V4.0
   ==========================================================================
   - Global UI Controls (Toast, Modals)
   - Security Modules (Anti-Inspect)
   - Low-End Device Optimization (Smooth Mode)
   - Global Event Listeners & Network Detection
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Console Branding (হ্যাকার থিম কনসোল লগ)
    console.log('%c┌──────────────────────────────────────────────────┐', 'color: #00e6b8; font-size: 12px; font-family: monospace');
    console.log('%c│     MVX CYBER SYSTEM v4.0 - INITIALIZED...       │', 'color: #00e6b8; font-size: 12px; font-family: monospace; font-weight: bold');
    console.log('%c└──────────────────────────────────────────────────┘', 'color: #00e6b8; font-size: 12px; font-family: monospace');

    // ==========================================================================
    // 2. GLOBAL TOAST NOTIFICATION SYSTEM
    // ==========================================================================
    window.showGlobalToast = function(message, type = 'success') {
        let toastContainer = document.getElementById('toast-global-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-global-container';
            toastContainer.className = 'toast-global-container';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast-global ${type}`;
        
        let icon = 'fa-check-circle';
        if(type === 'error') icon = 'fa-times-circle';
        if(type === 'warning') icon = 'fa-exclamation-triangle';

        toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = '0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // ==========================================================================
    // 3. SECURITY MODULE (Anti-Inspect & Anti-Copy)
    // ==========================================================================
    // Disable Right Click
    document.addEventListener('contextmenu', event => {
        event.preventDefault();
        showGlobalToast('Right-click is disabled for security reasons.', 'warning');
    });

    // Disable Inspect Element Keyboard Shortcuts
    document.onkeydown = function(e) {
        if(e.keyCode == 123) { // F12
            showGlobalToast('Developer tools are blocked!', 'error');
            return false; 
        }
        if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false; // Ctrl+Shift+I
        if(e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) return false; // Ctrl+Shift+C
        if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false; // Ctrl+Shift+J
        if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) { // Ctrl+U
            showGlobalToast('Source code viewing is disabled.', 'error');
            return false; 
        }
    };

    // ==========================================================================
    // 4. LOW-END DEVICE OPTIMIZATION (Smooth Mode Auto-Applier)
    // ==========================================================================
    if(localStorage.getItem('smoothMode') === 'true') {
        document.body.classList.add('smooth-mode');
    }

    // ==========================================================================
    // 5. GLOBAL KEYBOARD SHORTCUTS
    // ==========================================================================
    document.addEventListener('keydown', (e) => {
        // Ctrl + K for Search
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            const searchContainer = document.getElementById('searchContainer');
            
            if (searchContainer && searchInput) {
                searchContainer.style.display = 'block';
                searchInput.focus();
            }
        }
        
        // Escape key to close search, modals, or sidebars
        if (e.key === 'Escape') {
            const searchContainer = document.getElementById('searchContainer');
            if (searchContainer) searchContainer.style.display = 'none';
            
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('overlay');
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                if(overlay) overlay.classList.remove('active');
            }
        }
    });

    // ==========================================================================
    // 6. OFFLINE/ONLINE NETWORK DETECTION
    // ==========================================================================
    window.addEventListener('offline', () => {
        showGlobalToast('You are offline! Check your internet connection.', 'error');
    });

    window.addEventListener('online', () => {
        showGlobalToast('Connection restored! You are back online.', 'success');
    });
});
