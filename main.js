/* ==========================================================================
   MVX STORE - CORE ENGINE (MAIN.JS)
   Version: 11.0.0 (Ultimate Production Grade)
   Features: Realtime DB, Secure Auth, Dynamic Rendering, Cyber-UI Logic
   ========================================================================== */

// --- SYSTEM BOOT LOG (Hacker Console Effect) ---
console.log("%c[MVX SYSTEM] Booting Core Engine v11...", "color: #00e676; font-weight: bold; font-family: monospace;");
console.log("%c[MVX SYSTEM] Establishing secure connection to Firebase...", "color: #00e676; font-family: monospace;");

// ==========================================================================
// 1. FIREBASE SECURE CONFIGURATION
// ==========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyAS3UXXrio_-c9uPbHwpDuTVrP-p8d903w",
    authDomain: "white-2k-17-v4.firebaseapp.com",
    databaseURL: "https://white-2k-17-v4-default-rtdb.firebaseio.com",
    projectId: "white-2k-17-v4",
    storageBucket: "white-2k-17-v4.firebasestorage.app",
    messagingSenderId: "180909174928",
    appId: "1:180909174928:android:148861a87d66c6980ca815"
};

// Initialize Firebase safely to prevent duplicate initialization errors
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

const db = firebase.database();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// ==========================================================================
// 2. GLOBAL VARIABLES & CONSTANTS
// ==========================================================================
const SERVER_PATH = "MVX_VIP_SERVER_V5"; 
const WA_PAID_LINK = "https://wa.me/qr/3ZL3GSGN55QIO1"; // Replace with actual WhatsApp Number

// DOM Elements Caching (For Performance)
const appGrid = document.getElementById('app-grid-container');
const preloader = document.getElementById('app-preloader');
const searchInput = document.getElementById('searchInput');
const noResultsView = document.getElementById('no-results-view');
const modal = document.getElementById('download-modal');

// State Management
let allAppsData = []; // Stores all fetched data locally for fast search
let currentUser = null; // Tracks login state

// ==========================================================================
// 3. SYSTEM STARTUP & PRELOADER LOGIC
// ==========================================================================
window.addEventListener('load', () => {
    // Artificial delay for boot sequence effect (1.5 seconds)
    setTimeout(() => {
        if(preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => { 
                preloader.style.display = 'none'; 
                console.log("%c[MVX SYSTEM] UI Loaded Successfully.", "color: #00e676; font-family: monospace;");
            }, 500);
        }
    }, 1500);
});

// ==========================================================================
// 4. GOOGLE AUTHENTICATION SYSTEM (LOGIN/LOGOUT)
// ==========================================================================
function signInWithGoogle() {
    showToast("🔄 Connecting to Google Secure Servers...");
    auth.signInWithPopup(provider)
        .then((result) => {
            showToast(`✅ Welcome back, ${result.user.displayName}!`);
            updateUserInterface(result.user);
        }).catch((error) => {
            console.error("Login Error:", error);
            showToast("❌ Authentication Failed. Try again.");
        });
}

function signOutUser() {
    if(confirm("⚠️ Are you sure you want to securely logout? You will lose access to Premium files.")) {
        auth.signOut().then(() => {
            showToast("👋 Session Terminated. Logged out.");
            updateUserInterface(null);
            setTimeout(() => location.reload(), 1500); // Reload to clear memory
        });
    }
}

// Real-time Auth State Listener
auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateUserInterface(user);
});

// Update UI based on Login State
function updateUserInterface(user) {
    const guestView = document.getElementById('guest-view');
    const userView = document.getElementById('user-view');
    const headerProfile = document.getElementById('header-profile-img');

    if (user) {
        // User is Logged In
        if(guestView) guestView.style.display = 'none';
        if(userView) userView.style.display = 'block';
        
        if(document.getElementById('user-avatar-img')) 
            document.getElementById('user-avatar-img').src = user.photoURL;
        
        if(document.getElementById('user-display-name')) 
            document.getElementById('user-display-name').innerText = user.displayName;
        
        if(document.getElementById('user-email-addr')) 
            document.getElementById('user-email-addr').innerText = user.email;
        
        if(headerProfile) headerProfile.src = user.photoURL;
    } else {
        // User is NOT Logged In
        if(guestView) guestView.style.display = 'block';
        if(userView) userView.style.display = 'none';
        if(headerProfile) headerProfile.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; // Default Avatar
    }
}

// ==========================================================================
// 5. DATA FETCHING ENGINE (REALTIME DATABASE)
// ==========================================================================
db.ref(SERVER_PATH).on('value', (snapshot) => {
    const data = snapshot.val();
    allAppsData = []; 
    
    if (data) {
        // Convert Firebase object to array
        Object.keys(data).forEach(key => {
            allAppsData.push({ id: key, ...data[key] });
        });
        
        // Reverse array to show newest uploads first
        allAppsData.reverse(); 
        
        // Render UI
        renderAppGrid(allAppsData);
        console.log(`%c[MVX SERVER] ${allAppsData.length} files synced successfully.`, "color: #0ff; font-family: monospace;");
    } else {
        // Database is empty
        if(appGrid) appGrid.innerHTML = '';
        if(noResultsView) {
            noResultsView.style.display = 'flex';
            noResultsView.innerHTML = `
                <i class="fas fa-server" style="font-size: 50px; margin-bottom: 15px; color:#444;"></i>
                <h3>Server is Online</h3>
                <p>Waiting for Administrator to upload files...</p>
            `;
        }
    }
}, (error) => {
    console.error("Firebase Error:", error);
    showToast("⚠️ Critical Error: Lost connection to MVX Server!");
});

// ==========================================================================
// 6. DYNAMIC RENDERING ENGINE (HTML GENERATOR)
// ==========================================================================
function renderAppGrid(appsArray) {
    if(!appGrid) return;
    
    appGrid.innerHTML = ''; // Clear previous content (removes skeletons)

    // Handle Empty Search/Filter Results
    if (appsArray.length === 0) {
        if(noResultsView) noResultsView.style.display = 'flex';
        return;
    } else {
        if(noResultsView) noResultsView.style.display = 'none';
    }

    // Build Cards
    appsArray.forEach(app => {
        const card = document.createElement('div');
        
        // Default Styles (Free)
        let cardClass = 'app-card';
        let badgeHTML = '';
        let btnClass = 'btn-card-action';
        let btnText = 'DOWNLOAD';
        let btnIcon = '<i class="fas fa-download"></i>';

        // Style Overrides for PREMIUM
        if (app.accessType === 'Premium') {
            cardClass += ' vip-item'; 
            badgeHTML = '<div style="position:absolute; top:8px; right:8px; color:#00e676; font-size:9px; background:rgba(0,0,0,0.8); padding:3px 8px; border-radius:6px; border:1px solid #00e676; font-weight:bold; letter-spacing:1px; z-index:2;">PREMIUM</div>';
            btnClass += ' vip-btn'; 
            btnText = 'UNLOCK';
            btnIcon = '<i class="fas fa-lock"></i>';
        } 
        // Style Overrides for PAID
        else if (app.accessType === 'Paid') {
            cardClass += ' vip-item'; 
            badgeHTML = '<div style="position:absolute; top:8px; right:8px; color:#FFD700; font-size:9px; background:rgba(0,0,0,0.8); padding:3px 8px; border-radius:6px; border:1px solid #FFD700; font-weight:bold; letter-spacing:1px; z-index:2;">PAID</div>';
            btnClass += ' vip-btn'; 
            btnText = 'BUY NOW';
            btnIcon = '<i class="fas fa-shopping-cart"></i>';
        }

        // Safe Fallback Image
        const safeIcon = app.iconUrl || 'https://cdn-icons-png.flaticon.com/512/564/564619.png';

        card.className = cardClass;
        card.innerHTML = `
            ${badgeHTML}
            <img src="${safeIcon}" class="app-icon-img" loading="lazy" onerror="this.src='https://cdn-icons-png.flaticon.com/512/564/564619.png'" alt="${app.appName}">
            
            <div class="app-name-text" style="${app.accessType === 'Paid' ? 'color:#FFD700' : ''}">
                ${app.appName}
            </div>
            
            <div class="app-meta-text">
                ${app.gameCategory} • ${app.size}
            </div>
            
            <button class="${btnClass}" onclick="openDownloadModal('${app.id}')">
                ${btnIcon} ${btnText}
            </button>
        `;
        
        appGrid.appendChild(card);
    });
}

// ==========================================================================
// 7. ADVANCED FILTER & SEARCH SYSTEM
// ==========================================================================
const catButtons = document.querySelectorAll('.cat-pill');
catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update Active Visuals
        catButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        
        // Apply Filter Logic
        if (filter === 'All') {
            renderAppGrid(allAppsData);
        } else if (['Free', 'Premium', 'Paid'].includes(filter)) {
            const filtered = allAppsData.filter(app => app.accessType === filter);
            renderAppGrid(filtered);
        } else {
            const filtered = allAppsData.filter(app => app.gameCategory === filter);
            renderAppGrid(filtered);
        }
    });
});

// Live Search Input Logic
if(searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = allAppsData.filter(app => 
            app.appName.toLowerCase().includes(term) || 
            app.gameCategory.toLowerCase().includes(term)
        );
        renderAppGrid(filtered);
    });
}

// Clear Search logic
const clearBtn = document.getElementById('clearSearchBtn');
if(clearBtn) {
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        renderAppGrid(allAppsData);
        document.getElementById('search-bar-container').classList.remove('open');
    });
}

// ==========================================================================
// 8. DOWNLOAD MODAL & SECURITY CHECK ENGINE
// ==========================================================================
function openDownloadModal(appId) {
    const app = allAppsData.find(a => a.id === appId);
    if (!app) return;

    // Populate Modal Details
    document.getElementById('modal-icon').src = app.iconUrl;
    document.getElementById('modal-title').innerText = app.appName;
    document.getElementById('modal-version').innerText = app.version || 'v1.0.0';
    document.getElementById('modal-size').innerText = app.size || 'Unknown';
    document.getElementById('modal-category').innerText = app.gameCategory;
    
    const typeElem = document.getElementById('modal-type');
    typeElem.innerText = app.accessType;
    
    const dlBtn = document.getElementById('start-download-btn');
    const loginMsg = document.getElementById('login-required-msg');

    // Reset button event listener safely
    dlBtn.replaceWith(dlBtn.cloneNode(true));
    const newDlBtn = document.getElementById('start-download-btn');

    // --- LOGIC 1: PAID CONTENT ---
    if (app.accessType === 'Paid') {
        typeElem.style.color = 'var(--gold)';
        newDlBtn.style.opacity = '1';
        newDlBtn.style.pointerEvents = 'auto';
        newDlBtn.style.background = 'linear-gradient(45deg, #25D366, #128C7E)'; // WhatsApp Colors
        newDlBtn.innerHTML = '<i class="fab fa-whatsapp" style="font-size:20px;"></i> BUY VIA WHATSAPP';
        newDlBtn.style.boxShadow = '0 5px 20px rgba(37, 211, 102, 0.4)';
        loginMsg.style.display = 'none';
        
        newDlBtn.addEventListener('click', () => {
            window.open(WA_PAID_LINK, '_blank');
        });
    }
    // --- LOGIC 2: PREMIUM CONTENT (LOGIN REQUIRED) ---
    else if (app.accessType === 'Premium') {
        typeElem.style.color = 'var(--primary)';
        
        if (!currentUser) {
            // User NOT Logged In (Deny Access)
            newDlBtn.style.opacity = '0.4';
            newDlBtn.style.pointerEvents = 'none';
            newDlBtn.style.background = '#333';
            newDlBtn.innerHTML = '<i class="fas fa-lock"></i> LOGIN REQUIRED';
            newDlBtn.style.boxShadow = 'none';
            loginMsg.style.display = 'block';
        } else {
            // User Logged In (Grant Access)
            newDlBtn.style.opacity = '1';
            newDlBtn.style.pointerEvents = 'auto';
            newDlBtn.style.background = 'var(--primary)';
            newDlBtn.innerHTML = '<i class="fas fa-unlock-alt"></i> PREMIUM DOWNLOAD';
            newDlBtn.style.boxShadow = '0 5px 20px rgba(0, 230, 118, 0.4)';
            loginMsg.style.display = 'none';
            setupSecureDownload(newDlBtn, app);
        }
    } 
    // --- LOGIC 3: FREE CONTENT ---
    else {
        typeElem.style.color = '#fff';
        newDlBtn.style.opacity = '1';
        newDlBtn.style.pointerEvents = 'auto';
        newDlBtn.style.background = 'var(--primary)';
        newDlBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> START DOWNLOAD';
        newDlBtn.style.boxShadow = '0 5px 20px rgba(0, 230, 118, 0.4)';
        loginMsg.style.display = 'none';
        setupSecureDownload(newDlBtn, app);
    }

    // Show Modal with Animation
    if(modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    }
}

// Handles Password Protection & Direct Linking
function setupSecureDownload(buttonElement, appData) {
    buttonElement.addEventListener('click', () => {
        // Check if file has a password set by Admin
        if(appData.password && appData.password.trim().length > 0 && appData.password !== "undefined") {
            const userPass = prompt("🔒 SECURE FILE DETECTED\nThis file is encrypted. Enter the password to unlock:");
            if(userPass === appData.password) {
                executeDownload(appData.downloadUrl);
            } else if (userPass !== null) {
                showToast("❌ Access Denied: Incorrect Password!");
            }
        } else {
            // No password, direct download
            executeDownload(appData.downloadUrl);
        }
    });
}

// Executes the actual download process
function executeDownload(url) {
    if(!url || url === "") {
        showToast("⚠️ Error: Download link is broken or empty.");
        return;
    }
    
    showToast("🚀 Handshake complete. Starting download...");
    
    // Create invisible anchor to trigger browser download behavior
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Auto-close modal after initiating download
    closeModal();
}

// ==========================================================================
// 9. MODAL CLOSING LOGIC
// ==========================================================================
function closeModal() {
    if(modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 300); // Wait for transition
    }
}

if(document.getElementById('closeModal')) {
    document.getElementById('closeModal').addEventListener('click', closeModal);
}

// Close when clicking outside the modal window
if(modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// ==========================================================================
// 10. CUSTOM TOAST NOTIFICATION SYSTEM
// ==========================================================================
function showToast(message) {
    const container = document.getElementById('toast-container');
    if(!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Add appropriate icon based on message content
    let icon = "fa-bell";
    if(message.includes("✅")) icon = "fa-check-circle";
    if(message.includes("❌")) icon = "fa-times-circle";
    if(message.includes("⚠️")) icon = "fa-exclamation-triangle";
    if(message.includes("🚀")) icon = "fa-rocket";
    if(message.includes("🔄")) icon = "fa-sync fa-spin";

    // Clean up emojis from actual text since we use icons
    const cleanMsg = message.replace(/[✅❌⚠️🚀🔄]/g, '').trim();

    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${cleanMsg}</span>`;
    container.appendChild(toast);
    
    // Destroy toast after 3.5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}
