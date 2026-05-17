/* ==========================================================================
   MVX STORE V4.0 - MASTER UI & GLOBAL LOGIC ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // সিকিউরিটি কনসোল ওয়ার্নিং
    console.log('%c[MVX SYSTEM V4.0] Core Engine Initialized...', 'color: #00e6b8; font-size: 14px; font-weight: bold;');
    console.log('%cWARNING: Unauthorized modification is prohibited.', 'color: #ff003c; font-size: 12px;');

    // ==========================================================================
    // 1. GLOBAL TOAST NOTIFICATION SYSTEM (পপ-আপ মেসেজ)
    // ==========================================================================
    window.showGlobalToast = function(message, type = 'success') {
        let container = document.getElementById('toast-global-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-global-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast-msg ${type}`;
        
        // টাইপ অনুযায়ী আইকন সেট করা
        const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle" style="color: #ff003c;"></i>';
        
        toast.innerHTML = `${icon} <span>${message}</span>`;
        container.appendChild(toast);

        // ৩ সেকেন্ড পর অটোমেটিক গায়েব হয়ে যাবে
        setTimeout(() => {
            toast.style.animation = 'fadeOutToast 0.4s forwards';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    };

    // ==========================================================================
    // 2. GLOBAL CONFIRMATION MODAL (যেকোনো কিছু ডিলিট করার আগে ওয়ার্নিং বক্স)
    // ==========================================================================
    window.showConfirmModal = function(message, onConfirm) {
        let overlay = document.getElementById('globalConfirmOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'globalConfirmOverlay';
            overlay.className = 'global-confirm-overlay';
            overlay.innerHTML = `
                <div class="confirm-box">
                    <i class="fas fa-exclamation-triangle confirm-icon"></i>
                    <h3>SYSTEM WARNING</h3>
                    <p id="confirmMessageText">Are you sure you want to proceed?</p>
                    <div class="confirm-actions">
                        <button class="btn-outline" style="width: 100%; padding: 12px; border-radius: 8px; cursor: pointer;" id="btnCancelConfirm">CANCEL</button>
                        <button class="btn-danger" style="width: 100%; padding: 12px; border-radius: 8px; border: none; cursor: pointer;" id="btnYesConfirm">CONFIRM</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        document.getElementById('confirmMessageText').innerText = message;
        overlay.classList.add('active');

        // পুরোনো ইভেন্ট লিসেনার রিমুভ করার জন্য বাটন ক্লোন করা
        const oldYes = document.getElementById('btnYesConfirm');
        const newYes = oldYes.cloneNode(true);
        oldYes.parentNode.replaceChild(newYes, oldYes);

        const oldCancel = document.getElementById('btnCancelConfirm');
        const newCancel = oldCancel.cloneNode(true);
        oldCancel.parentNode.replaceChild(newCancel, oldCancel);

        newCancel.addEventListener('click', () => {
            overlay.classList.remove('active');
        });

        newYes.addEventListener('click', () => {
            overlay.classList.remove('active');
            if(typeof onConfirm === 'function') onConfirm();
        });
    };

    // ==========================================================================
    // 3. GLOBAL FULL-SCREEN LOADER (পেজ লোড বা প্রসেসিং এর সময়)
    // ==========================================================================
    window.toggleGlobalLoader = function(show, text = "PROCESSING...") {
        let loader = document.getElementById('globalScreenLoader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'globalScreenLoader';
            loader.className = 'global-screen-loader';
            loader.innerHTML = `
                <div class="cyber-spinner"></div>
                <div class="loader-text-glow" id="globalLoaderText">${text}</div>
            `;
            document.body.appendChild(loader);
        }

        if (show) {
            document.getElementById('globalLoaderText').innerText = text;
            loader.style.display = 'flex';
        } else {
            loader.style.display = 'none';
        }
    };

    // ==========================================================================
    // 4. NETWORK STATUS DETECTION (নেটওয়ার্ক চলে গেলে ওয়ার্নিং)
    // ==========================================================================
    window.addEventListener('offline', () => {
        showGlobalToast('NETWORK DISCONNECTED. Please check your internet.', 'error');
    });

    window.addEventListener('online', () => {
        showGlobalToast('NETWORK RESTORED. System back online.', 'success');
    });

    // ==========================================================================
    // 5. THEME SWITCHER LOGIC (ডার্ক এবং লাইট মোড)
    // ==========================================================================
    window.changeTheme = function(theme) {
        if(theme === 'light') {
            document.documentElement.style.setProperty('--bg-base', '#f1f5f9');
            document.documentElement.style.setProperty('--bg-panel', '#ffffff');
            document.documentElement.style.setProperty('--bg-panel-solid', '#e2e8f0');
            document.documentElement.style.setProperty('--bg-card', '#ffffff');
            document.documentElement.style.setProperty('--text-main', '#0f172a');
            document.documentElement.style.setProperty('--text-muted', '#475569');
            showGlobalToast('Light Theme Activated (Beta)');
        } else {
            // Reset to dark
            document.documentElement.style.setProperty('--bg-base', '#020617');
            document.documentElement.style.setProperty('--bg-panel', 'rgba(15, 23, 42, 0.7)');
            document.documentElement.style.setProperty('--bg-panel-solid', '#0f172a');
            document.documentElement.style.setProperty('--bg-card', 'rgba(30, 41, 59, 0.7)');
            document.documentElement.style.setProperty('--text-main', '#f8fafc');
            document.documentElement.style.setProperty('--text-muted', '#94a3b8');
            showGlobalToast('Dark Theme Activated');
        }
        localStorage.setItem('mvx_theme', theme);
    };

    // অটোমেটিক সেভ করা থিম লোড করা
    const savedTheme = localStorage.getItem('mvx_theme');
    if(savedTheme) {
        changeTheme(savedTheme);
    }

    // ==========================================================================
    // 6. LANGUAGE SWITCHER LOGIC (ভাষা পরিবর্তন)
    // ==========================================================================
    window.changeLanguage = function(lang) {
        localStorage.setItem('mvx_lang', lang);
        showGlobalToast(`Language changing to ${lang.toUpperCase()}...`);
        setTimeout(() => { window.location.reload(); }, 1500);
    };

    // ==========================================================================
    // 7. DYNAMIC TIME FORMATTER (সময়ের হিসেব: দিন, সপ্তাহ, মাস, বছর)
    // ==========================================================================
    window.formatTimeDynamic = function(timestamp) {
        if (!timestamp) return "Unknown Time";
        
        const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return interval + (interval === 1 ? " year ago" : " years ago");
        
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return interval + (interval === 1 ? " month ago" : " months ago");
        
        interval = Math.floor(seconds / 604800);
        if (interval >= 1) return interval + (interval === 1 ? " week ago" : " weeks ago");
        
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return interval + (interval === 1 ? " day ago" : " days ago");
        
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return interval + (interval === 1 ? " hr ago" : " hrs ago");
        
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return interval + (interval === 1 ? " min ago" : " mins ago");
        
        return "Just now";
    };
});
