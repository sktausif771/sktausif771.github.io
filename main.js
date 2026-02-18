/* ==========================================================================
   MVX STORE - CORE ENGINE (MAIN.JS)
   Version: 5.5.0 (Ultra Stable)
   Server: Firebase Realtime Database
   Auth: Google Identity Platform
   ========================================================================== */

console.log("Initializing MVX Store System...");

// --- 1. FIREBASE CONFIGURATION (YOUR SPECIFIC DATA) ---
const firebaseConfig = {
    apiKey: "AIzaSyAS3UXXrio_-c9uPbHwpDuTVrP-p8d903w",
    authDomain: "white-2k-17-v4.firebaseapp.com",
    databaseURL: "https://white-2k-17-v4-default-rtdb.firebaseio.com",
    projectId: "white-2k-17-v4",
    storageBucket: "white-2k-17-v4.firebasestorage.app",
    messagingSenderId: "180909174928",
    appId: "1:180909174928:android:148861a87d66c6980ca815"
};

// --- Initialize Firebase ---
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

// --- Initialize Services ---
const db = firebase.database();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// --- 2. GLOBAL VARIABLES & DOM ELEMENTS ---
const appGrid = document.getElementById('app-grid-container');
const preloader = document.getElementById('app-preloader');
const searchInput = document.getElementById('searchInput');
const noResults = document.getElementById('no-results-view');
const modal = document.getElementById('download-modal');

// Data Storage
let allAppsData = []; 
let currentUser = null;
const SERVER_PATH = "MVX_VIP_SERVER_V5"; // **NEW PATH** (Fix #3: No Data Mix)

// --- 3. SYSTEM STARTUP & PRELOADER ---
window.addEventListener('load', () => {
    // Check Server Connection
    const connectedRef = db.ref(".info/connected");
    connectedRef.on("value", (snap) => {
        if (snap.val() === true) {
            console.log("✅ Connected to MVX V5 Server");
            hidePreloader();
        } else {
            console.log("⚠️ Connecting...");
        }
    });

    // Fallback to hide preloader if connection is slow
    setTimeout(hidePreloader, 3000);
});

function hidePreloader() {
    if(preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => { preloader.style.display = 'none'; }, 500);
    }
}

// --- 4. AUTHENTICATION SYSTEM (GOOGLE LOGIN - FIX #1) ---
function signInWithGoogle() {
    showToast("Connecting to Google...");
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
    });
}

// Auth State Observer
auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateUI(user);
});

// Update Sidebar UI based on Login Status
function updateUI(user) {
    const guestView = document.getElementById('guest-view');
    const userView = document.getElementById('user-view');
    const headerProfile = document.getElementById('header-profile-img');

    if (user) {
        // User is Logged In
        guestView.style.display = 'none';
        userView.style.display = 'block';
        
        document.getElementById('user-avatar-img').src = user.photoURL;
        document.getElementById('user-display-name').innerText = user.displayName;
        document.getElementById('user-email-addr').innerText = user.email;
        headerProfile.src = user.photoURL;
        
        // Save to Session for Admin check
        sessionStorage.setItem("user_email", user.email);
    } else {
        // User is Guest
        guestView.style.display = 'block';
        userView.style.display = 'none';
        headerProfile.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    }
}

// --- 5. DATA FETCHING (REALTIME) ---
console.log(`Fetching Apps from: ${SERVER_PATH}`);

db.ref(SERVER_PATH).on('value', (snapshot) => {
    const data = snapshot.val();
    allAppsData = []; // Clear local list
    
    if (data) {
        // Convert Object to Array & Reverse (Newest First)
        Object.keys(data).forEach(key => {
            allAppsData.push({
                id: key,
                ...data[key]
            });
        });
        allAppsData.reverse(); 
        
        // Render to Screen
        renderApps(allAppsData);
        showToast(`Server Synced: ${allAppsData.length} New Mods Loaded`);
    } else {
        appGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-server" style="font-size: 40px; margin-bottom: 10px;"></i>
                <p>New Server V5 is Ready & Online!</p>
                <p style="font-size: 12px; margin-top:5px;">Waiting for Admin to upload content...</p>
            </div>
        `;
    }
}, (error) => {
    showToast("Database Error: " + error.message);
});

// --- 6. RENDER FUNCTION (HTML GENERATOR) ---
function renderApps(apps) {
    appGrid.innerHTML = ''; // Clear skeleton

    if (apps.length === 0) {
        noResults.style.display = 'block';
        return;
    } else {
        noResults.style.display = 'none';
    }

    apps.forEach(app => {
        const card = document.createElement('div');
        const isVip = app.category === 'VIP' || app.isPremium === 'true';
        
        card.className = `app-card ${isVip ? 'vip-item' : ''}`;
        
        // Dynamic HTML Card
        card.innerHTML = `
            ${isVip ? '<div style="position:absolute; top:5px; right:5px; color:#FFD700; font-size:12px; z-index:2;"><i class="fas fa-crown"></i></div>' : ''}
            
            <img src="${app.iconUrl}" class="app-icon-img" loading="lazy" 
                 onerror="this.src='https://cdn-icons-png.flaticon.com/512/564/564619.png'">
            
            <div class="app-name-text" style="${isVip ? 'color:#FFD700' : ''}">${app.appName}</div>
            
            <div class="app-meta-text">
                ${app.version || 'vLatest'} • ${app.size || 'Unknown'}
            </div>
            
            <button class="btn-card-action ${isVip ? 'vip-btn' : ''}" onclick="openDownloadModal('${app.id}')">
                ${isVip ? '<i class="fas fa-lock"></i> UNLOCK' : 'DOWNLOAD'}
            </button>
        `;
        
        appGrid.appendChild(card);
    });
}

// --- 7. CATEGORY FILTER SYSTEM ---
const catButtons = document.querySelectorAll('.cat-pill');

catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Active State Logic
        catButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        
        if (filter === 'All') {
            renderApps(allAppsData);
        } else {
            const filtered = allAppsData.filter(app => app.category === filter);
            renderApps(filtered);
        }
    });
});

// --- 8. SEARCH SYSTEM ---
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allAppsData.filter(app => 
        app.appName.toLowerCase().includes(term) || 
        (app.category && app.category.toLowerCase().includes(term))
    );
    renderApps(filtered);
});

// Clear Search
document.getElementById('clearSearchBtn').addEventListener('click', () => {
    searchInput.value = '';
    renderApps(allAppsData);
    document.getElementById('search-bar-container').classList.remove('open');
});

// --- 9. DOWNLOAD MODAL LOGIC (SECURE) ---
function openDownloadModal(appId) {
    const app = allAppsData.find(a => a.id === appId);
    if (!app) return;

    // Set Data
    document.getElementById('modal-icon').src = app.iconUrl;
    document.getElementById('modal-title').innerText = app.appName;
    document.getElementById('modal-version').innerText = app.version || 'v1.0';
    document.getElementById('modal-size').innerText = app.size || 'N/A';
    document.getElementById('modal-type').innerText = app.category || 'APK';

    const dlBtn = document.getElementById('start-download-btn');
    const loginMsg = document.getElementById('login-required-msg');

    // VIP Logic (Optional: Require Login for VIP)
    if (app.category === 'VIP' && !currentUser) {
        dlBtn.style.opacity = '0.5';
        dlBtn.style.pointerEvents = 'none';
        dlBtn.innerHTML = '<i class="fas fa-lock"></i> Login Required';
        loginMsg.style.display = 'block';
    } else {
        dlBtn.style.opacity = '1';
        dlBtn.style.pointerEvents = 'auto';
        dlBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> START DOWNLOAD';
        loginMsg.style.display = 'none';
        
        // Handle Password Protection
        if(app.password && app.password.trim() !== "") {
             dlBtn.onclick = () => {
                 const userPass = prompt("🔒 Enter Password to Download:");
                 if(userPass === app.password) {
                     initiateDownload(app.downloadUrl);
                 } else {
                     showToast("❌ Wrong Password!");
                 }
             };
        } else {
             dlBtn.onclick = () => initiateDownload(app.downloadUrl);
        }
    }

    modal.classList.add('active');
}

function initiateDownload(url) {
    showToast("🚀 Download Started...");
    
    // Direct Download Trigger
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Close Modal after 1s
    setTimeout(() => {
        modal.classList.remove('active');
    }, 1000);
}

// Close Modal Events
document.getElementById('closeModal').addEventListener('click', () => {
    modal.classList.remove('active');
});
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
});

// --- 10. TOAST NOTIFICATION SYSTEM ---
function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-info-circle"></i> <span>${msg}</span>`;
    
    container.appendChild(toast);
    
    // Animate Out
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- 11. ADMIN REDIRECT FIX (FIX #2) ---
// This function is called from the HTML Sidebar
function accessAdminPanel() {
    window.location.href = "login.html";
}
