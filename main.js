/* ==========================================================================
   MVX STORE - CORE ENGINE (MAIN.JS)
   Version: 6.0.0 (Final Logic Update)
   Features: Multi-Filter, Paid Redirect, Premium Lock
   ========================================================================== */

console.log("Initializing MVX V6 Engine...");

// --- 1. FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyAS3UXXrio_-c9uPbHwpDuTVrP-p8d903w",
    authDomain: "white-2k-17-v4.firebaseapp.com",
    databaseURL: "https://white-2k-17-v4-default-rtdb.firebaseio.com",
    projectId: "white-2k-17-v4",
    storageBucket: "white-2k-17-v4.firebasestorage.app",
    messagingSenderId: "180909174928",
    appId: "1:180909174928:android:148861a87d66c6980ca815"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

const db = firebase.database();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// --- 2. GLOBAL VARIABLES ---
const appGrid = document.getElementById('app-grid-container');
const preloader = document.getElementById('app-preloader');
const searchInput = document.getElementById('searchInput');
const noResults = document.getElementById('no-results-view');
const modal = document.getElementById('download-modal');

// Data Storage
let allAppsData = []; 
let currentUser = null;
const SERVER_PATH = "MVX_VIP_SERVER_V5"; // Updated Server Path
const WA_PAID_LINK = "https://wa.me/qr/3ZL3GSGN55QIO1"; // Your WhatsApp Link

// --- 3. STARTUP & PRELOADER ---
window.addEventListener('load', () => {
    setTimeout(() => {
        if(preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => { preloader.style.display = 'none'; }, 500);
        }
    }, 2000);
});

// --- 4. GOOGLE AUTHENTICATION (LOGIN SYSTEM) ---
function signInWithGoogle() {
    showToast("Connecting to Google Secure Server...");
    auth.signInWithPopup(provider)
        .then((result) => {
            showToast("Login Successful! Welcome " + result.user.displayName);
            updateUI(result.user);
        }).catch((error) => {
            console.error(error);
            showToast("Login Failed: " + error.message);
        });
}

function signOutUser() {
    auth.signOut().then(() => {
        showToast("Logged out successfully");
        updateUI(null);
        window.location.reload(); // Reload to reset premium access
    });
}

auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateUI(user);
});

function updateUI(user) {
    const guestView = document.getElementById('guest-view');
    const userView = document.getElementById('user-view');
    const headerProfile = document.getElementById('header-profile-img');

    if (user) {
        guestView.style.display = 'none';
        userView.style.display = 'block';
        
        document.getElementById('user-avatar-img').src = user.photoURL;
        document.getElementById('user-display-name').innerText = user.displayName;
        document.getElementById('user-email-addr').innerText = user.email;
        headerProfile.src = user.photoURL;
    } else {
        guestView.style.display = 'block';
        userView.style.display = 'none';
        headerProfile.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    }
}

// --- 5. DATA FETCHING (REALTIME) ---
db.ref(SERVER_PATH).on('value', (snapshot) => {
    const data = snapshot.val();
    allAppsData = []; 
    
    if (data) {
        Object.keys(data).forEach(key => {
            allAppsData.push({
                id: key,
                ...data[key]
            });
        });
        allAppsData.reverse(); // Newest Uploads First
        
        renderApps(allAppsData);
        showToast(`Synced: ${allAppsData.length} Files Loaded`);
    } else {
        appGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-server" style="font-size: 40px; margin-bottom: 10px;"></i>
                <p>Server V5 Connected. Waiting for Admin Uploads...</p>
            </div>
        `;
    }
}, (error) => {
    showToast("Server Error: " + error.message);
});

// --- 6. RENDER APPS (HTML GENERATOR) ---
function renderApps(apps) {
    appGrid.innerHTML = ''; 

    if (apps.length === 0) {
        noResults.style.display = 'block';
        return;
    } else {
        noResults.style.display = 'none';
    }

    apps.forEach(app => {
        const card = document.createElement('div');
        
        // Determine Styling Class based on Access Type
        let cardClass = 'app-card';
        let badgeHTML = '';
        let btnClass = 'btn-card-action';
        let btnText = 'DOWNLOAD';
        let btnIcon = '<i class="fas fa-download"></i>';

        if (app.accessType === 'Premium') {
            cardClass += ' vip-item'; // Gold Border
            badgeHTML = '<div style="position:absolute; top:5px; right:5px; color:#FFD700; font-size:10px; background:rgba(0,0,0,0.5); padding:2px 5px; border-radius:4px;">PREMIUM</div>';
            btnClass += ' vip-btn';
            btnText = 'UNLOCK';
            btnIcon = '<i class="fas fa-lock"></i>';
        } else if (app.accessType === 'Paid') {
            cardClass += ' vip-item'; 
            badgeHTML = '<div style="position:absolute; top:5px; right:5px; color:#00e676; font-size:10px; background:rgba(0,0,0,0.5); padding:2px 5px; border-radius:4px;">PAID</div>';
            btnClass += ' vip-btn'; // Use VIP style for paid too
            btnText = 'BUY NOW';
            btnIcon = '<i class="fas fa-shopping-cart"></i>';
        }

        card.className = cardClass;
        
        card.innerHTML = `
            ${badgeHTML}
            <img src="${app.iconUrl}" class="app-icon-img" loading="lazy" onerror="this.src='https://cdn-icons-png.flaticon.com/512/564/564619.png'">
            
            <div class="app-name-text" style="${app.accessType !== 'Free' ? 'color:#FFD700' : ''}">
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

// --- 7. ADVANCED FILTER SYSTEM (GAME & TYPE) ---
const catButtons = document.querySelectorAll('.cat-pill');

catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // UI Active State
        catButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        
        if (filter === 'All') {
            // Show Everything
            renderApps(allAppsData);
        } else if (['Free', 'Premium', 'Paid'].includes(filter)) {
            // Filter by Access Type (Paid/Free/Premium)
            const filtered = allAppsData.filter(app => app.accessType === filter);
            renderApps(filtered);
        } else {
            // Filter by Game Category (Free Fire, PUBG, etc.)
            const filtered = allAppsData.filter(app => app.gameCategory === filter);
            renderApps(filtered);
        }
        
        showToast(`Showing: ${filter}`);
    });
});

// --- 8. SEARCH LOGIC ---
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allAppsData.filter(app => 
        app.appName.toLowerCase().includes(term) || 
        app.gameCategory.toLowerCase().includes(term)
    );
    renderApps(filtered);
});

// Clear Search
document.getElementById('clearSearchBtn').addEventListener('click', () => {
    searchInput.value = '';
    renderApps(allAppsData);
    document.getElementById('search-bar-container').classList.remove('open');
});

// --- 9. DOWNLOAD MODAL & REDIRECT LOGIC ---
function openDownloadModal(appId) {
    const app = allAppsData.find(a => a.id === appId);
    if (!app) return;

    // Populate Modal Info
    document.getElementById('modal-icon').src = app.iconUrl;
    document.getElementById('modal-title').innerText = app.appName;
    document.getElementById('modal-version').innerText = app.version || 'v1.0';
    document.getElementById('modal-size').innerText = app.size || 'N/A';
    document.getElementById('modal-category').innerText = app.gameCategory || 'Game';
    
    // Set Type Color
    const typeElem = document.getElementById('modal-type');
    typeElem.innerText = app.accessType;
    if(app.accessType === 'Paid') typeElem.style.color = '#FFD700';
    else if(app.accessType === 'Premium') typeElem.style.color = '#00e676';
    else typeElem.style.color = '#fff';

    const dlBtn = document.getElementById('start-download-btn');
    const loginMsg = document.getElementById('login-required-msg');

    // --- LOGIC 1: PAID APPS (WHATSAPP REDIRECT) ---
    if (app.accessType === 'Paid') {
        dlBtn.style.opacity = '1';
        dlBtn.style.pointerEvents = 'auto';
        dlBtn.style.background = 'linear-gradient(45deg, #25D366, #128C7E)'; // WhatsApp Color
        dlBtn.innerHTML = '<i class="fab fa-whatsapp"></i> BUY VIA WHATSAPP';
        loginMsg.style.display = 'none';
        
        dlBtn.onclick = function() {
            window.open(WA_PAID_LINK, '_blank');
        };
    }
    // --- LOGIC 2: PREMIUM APPS (LOGIN CHECK) ---
    else if (app.accessType === 'Premium') {
        if (!currentUser) {
            // User NOT logged in
            dlBtn.style.opacity = '0.5';
            dlBtn.style.pointerEvents = 'none';
            dlBtn.style.background = '#333';
            dlBtn.innerHTML = '<i class="fas fa-lock"></i> LOGIN REQUIRED';
            loginMsg.style.display = 'block';
        } else {
            // User IS logged in
            dlBtn.style.opacity = '1';
            dlBtn.style.pointerEvents = 'auto';
            dlBtn.style.background = '#00e676';
            dlBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> PREMIUM DOWNLOAD';
            loginMsg.style.display = 'none';
            setupDirectDownload(dlBtn, app);
        }
    } 
    // --- LOGIC 3: FREE APPS (DIRECT) ---
    else {
        dlBtn.style.opacity = '1';
        dlBtn.style.pointerEvents = 'auto';
        dlBtn.style.background = '#00e676';
        dlBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> START DOWNLOAD';
        loginMsg.style.display = 'none';
        setupDirectDownload(dlBtn, app);
    }

    modal.classList.add('active');
}

// Helper for Direct Download
function setupDirectDownload(btn, app) {
    // Password Logic
    if(app.password && app.password.trim() !== "") {
        btn.onclick = function() {
            const userPass = prompt("🔒 This file is password protected. Enter Password:");
            if(userPass === app.password) {
                triggerDownload(app.downloadUrl);
            } else {
                showToast("❌ Incorrect Password!");
            }
        };
    } else {
        btn.onclick = function() {
            triggerDownload(app.downloadUrl);
        };
    }
}

function triggerDownload(url) {
    showToast("🚀 Download Started...");
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank'; // Opens in new tab/starts download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => { modal.classList.remove('active'); }, 1500);
}

// Modal Close Events
document.getElementById('closeModal').addEventListener('click', () => {
    modal.classList.remove('active');
});
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
});

// --- 10. TOAST NOTIFICATION ---
function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-bell"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
