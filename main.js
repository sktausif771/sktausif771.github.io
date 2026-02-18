/* =========================================
   MVX STORE - CORE ENGINE (MAIN.JS)
   Version: 5.0.2
   Powered by: Firebase Realtime Database
   ========================================= */

// --- 1. FIREBASE CONFIGURATION (আপনার ডাটাবেস কানেকশন) ---
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
    firebase.app(); // if already initialized
}

const db = firebase.database();

// --- 2. GLOBAL VARIABLES & DOM ELEMENTS ---
const appGrid = document.getElementById('app-grid-container');
const preloader = document.getElementById('preloader-overlay');
const searchInput = document.getElementById('searchInput');
const noResults = document.getElementById('no-results');
const modal = document.getElementById('download-modal');

let allAppsData = []; // Store all apps locally for fast searching
let currentCategory = "All";

// --- 3. PRELOADER & INITIALIZATION ---
window.addEventListener('load', () => {
    // Hide preloader after connection is established
    setTimeout(() => {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }, 1500); // Minimum 1.5s showing brand logo
});

// --- 4. FETCH DATA FROM FIREBASE (REALTIME) ---
console.log("Connecting to Firebase Database...");

db.ref('apps').on('value', (snapshot) => {
    const data = snapshot.val();
    allAppsData = []; // Reset local data
    
    if (data) {
        // Convert Object to Array & Reverse (To show Newest Uploads First)
        Object.keys(data).forEach(key => {
            allAppsData.push({
                id: key,
                ...data[key]
            });
        });
        allAppsData.reverse(); // Newest first
        
        // Initial Render
        renderApps(allAppsData);
        showToast(`Database Synced: ${allAppsData.length} Apps Loaded`);
    } else {
        appGrid.innerHTML = '<p style="text-align:center; width:100%; color:#555;">No apps uploaded yet. Go to Admin Panel.</p>';
    }
}, (error) => {
    console.error("Firebase Error:", error);
    showToast("Error connecting to server!");
});

// --- 5. RENDER APPS TO HTML ---
function renderApps(appsToRender) {
    appGrid.innerHTML = ''; // Clear existing content

    if (appsToRender.length === 0) {
        noResults.style.display = 'flex'; // Show "No Results"
        return;
    } else {
        noResults.style.display = 'none';
    }

    appsToRender.forEach(app => {
        // Create Card Element
        const card = document.createElement('div');
        const isVip = app.category === 'VIP' || app.isPremium === 'true';
        
        // Conditional Classes for Styling
        card.className = `app-card ${isVip ? 'vip-card' : ''}`;
        
        // Inner HTML of the Card
        card.innerHTML = `
            ${isVip ? '<div style="position:absolute; top:5px; right:5px; color:gold; font-size:10px;"><i class="fas fa-crown"></i></div>' : ''}
            <img src="${app.iconUrl}" class="app-icon" alt="${app.appName}" loading="lazy" onerror="this.src='https://cdn-icons-png.flaticon.com/512/104/104663.png'">
            <div class="app-title">${app.appName}</div>
            <div class="app-meta">${app.size || 'N/A'} • ${app.version || 'v1.0'}</div>
            <button class="btn-get" onclick="openDownloadModal('${app.id}')">
                ${isVip ? 'UNLOCK NOW' : 'DOWNLOAD'}
            </button>
        `;
        
        // Add to Grid
        appGrid.appendChild(card);
    });
}

// --- 6. CATEGORY FILTER LOGIC ---
const categoryButtons = document.querySelectorAll('.cat-chip');

categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. Remove active class from all
        categoryButtons.forEach(b => b.classList.remove('active'));
        // 2. Add active to clicked
        btn.classList.add('active');
        
        // 3. Filter Data
        const category = btn.getAttribute('data-filter');
        currentCategory = category;
        
        if (category === 'All') {
            renderApps(allAppsData);
        } else {
            const filtered = allAppsData.filter(app => app.category === category);
            renderApps(filtered);
        }
    });
});

// --- 7. SEARCH FUNCTIONALITY ---
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    
    const filtered = allAppsData.filter(app => {
        return app.appName.toLowerCase().includes(term) || 
               (app.category && app.category.toLowerCase().includes(term));
    });
    
    renderApps(filtered);
});

// UI Logic for Search Bar Toggle
const searchToggle = document.getElementById('search-toggle');
const searchDrawer = document.getElementById('search-drawer');
const clearSearch = document.getElementById('clearSearch');

searchToggle.addEventListener('click', () => {
    searchDrawer.classList.toggle('open');
    if(searchDrawer.classList.contains('open')) {
        searchInput.focus();
    }
});

// Clear Search Button Logic
searchInput.addEventListener('keyup', () => {
    if(searchInput.value.length > 0) clearSearch.style.display = 'block';
    else clearSearch.style.display = 'none';
});

clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    renderApps(allAppsData); // Reset list
    clearSearch.style.display = 'none';
    searchInput.focus();
});


// --- 8. DOWNLOAD MODAL SYSTEM ---
function openDownloadModal(appId) {
    const app = allAppsData.find(a => a.id === appId);
    if (!app) return;

    // Populate Modal Data
    document.getElementById('modal-app-icon').src = app.iconUrl;
    document.getElementById('modal-app-name').innerText = app.appName;
    document.getElementById('modal-app-meta').innerText = `${app.version} • ${app.size}`;
    
    const downloadBtn = document.getElementById('final-download-btn');
    
    // Check if Password/Video Task is required (VIP Logic)
    if (app.password && app.password.length > 0) {
        downloadBtn.innerText = "LOCKED (Watch Video)";
        downloadBtn.style.background = "#ff9800"; // Orange color for lock
        downloadBtn.onclick = function() {
            alert("🔒 This file is password protected!\nPlease contact Admin to get access.");
        };
    } else {
        // Direct Download Logic
        downloadBtn.innerText = "START DOWNLOAD";
        downloadBtn.style.background = "#00e676";
        
        downloadBtn.onclick = function() {
            // Trigger Direct Download
            const link = document.createElement('a');
            link.href = app.downloadUrl;
            link.target = '_blank'; // Open in new tab/start download
            link.download = app.appName + '.apk';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast("Download Started...");
            closeModal();
        };
    }

    // Show Modal with Animation
    modal.classList.add('active');
}

// Close Modal Logic
document.getElementById('closeModalBtn').addEventListener('click', closeModal);
// Close if clicked outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

function closeModal() {
    modal.classList.remove('active');
}


// --- 9. HIDDEN ADMIN TRIGGER (SECRET ACCESS) ---
let tapCounter = 0;
const triggerBtn = document.getElementById('adminTrigger');

if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
        tapCounter++;
        
        if (tapCounter === 3) showToast("Admin Mode: 4 more taps...");
        if (tapCounter === 5) showToast("Admin Mode: 2 more taps...");
        
        if (tapCounter === 7) {
            showToast("Redirecting to Secure Login...");
            tapCounter = 0;
            // Delay slightly for effect
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);
        }
    });
}


// --- 10. TOAST NOTIFICATION SYSTEM ---
function showToast(message) {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    
    container.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideUpFade 0.4s reverse forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// --- END OF MAIN.JS ---
