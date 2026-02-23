// 🔥 FIREBASE CONFIGURATION 🔥
const firebaseConfig = {
    databaseURL: "https://white-2k-17-v4-default-rtdb.firebaseio.com",
    projectId: "white-2k-17-v4"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
let allUsers = {};

// --- INITIALIZE APP ---
function init() {
    // Load Users Realtime
    db.ref('users').on('value', (snap) => {
        allUsers = snap.val() || {};
        renderTable();
    });

    // Load Version
    db.ref('config/version').on('value', (snap) => {
        if(snap.val()) document.getElementById('appVer').value = snap.val();
    });
}

// --- RENDER TABLE ---
function renderTable() {
    const tbody = document.getElementById('userTable');
    const search = document.getElementById('searchBox').value.toLowerCase();
    tbody.innerHTML = '';

    if (!allUsers) return;

    Object.keys(allUsers).reverse().forEach(key => {
        const user = allUsers[key];
        
        // Device Info Logic
        let deviceText = '<span style="color:#555; font-size:12px;">No Device</span>';
        let deviceSearch = "";

        if (user.hwids) {
            const models = Object.values(user.hwids).map(d => d.model || "Unknown").join(", ");
            deviceSearch = models.toLowerCase();
            
            // Limit Check
            const used = Object.keys(user.hwids).length;
            const max = user.maxDevices || 1;
            const limitText = max == 999 ? "∞" : max;
            
            deviceText = `
                <div style="font-size:12px; color:#94a3b8;">
                    <i class="fas fa-mobile-alt" style="color:var(--yellow)"></i> ${models}
                    <br><span style="color:var(--green)">[${used} / ${limitText}]</span>
                </div>
            `;
        }

        // Search Filter
        if (key.toLowerCase().includes(search) || deviceSearch.includes(search)) {
            
            const statusBadge = user.status === 'banned' 
                ? '<span class="badge b-banned">BANNED</span>' 
                : '<span class="badge b-active">ACTIVE</span>';

            const row = `
                <tr>
                    <td style="font-weight:bold; color:var(--primary)">${key}</td>
                    <td>${statusBadge}</td>
                    <td>${user.expiry}</td>
                    <td>${deviceText}</td>
                    <td>
                        <div class="actions">
                            <button class="act-btn act-reset" onclick="resetDevice('${key}')" title="Reset Device"><i class="fas fa-sync"></i></button>
                            <button class="act-btn act-ban ${user.status === 'banned' ? 'is-banned' : ''}" onclick="toggleBan('${key}', '${user.status}')"><i class="fas fa-ban"></i></button>
                            <button class="act-btn act-del" onclick="deleteUser('${key}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        }
    });
}

// --- ACTIONS ---

// Create Key
function createKey() {
    const key = document.getElementById('newKey').value.trim();
    const days = parseInt(document.getElementById('duration').value);
    const limit = parseInt(document.getElementById('limit').value);

    if(!key) return alert("Enter Key Name!");

    const date = new Date();
    date.setDate(date.getDate() + days);
    const expiry = date.toISOString().split('T')[0];

    db.ref('users/' + key).set({
        expiry: expiry,
        maxDevices: limit,
        status: 'active',
        hwids: null
    });
    closeModal();
}

// Reset Device
function resetDevice(key) {
    if(confirm("Reset Device Lock for " + key + "?")) {
        db.ref('users/' + key + '/hwids').remove();
    }
}

// Ban/Unban
function toggleBan(key, status) {
    const newStatus = status === 'active' ? 'banned' : 'active';
    db.ref('users/' + key + '/status').set(newStatus);
}

// Delete
function deleteUser(key) {
    if(confirm("Delete " + key + "?")) {
        db.ref('users/' + key).remove();
    }
}

// Update Version
function updateVersion() {
    const ver = document.getElementById('appVer').value;
    db.ref('config/version').set(ver);
    alert("Version Updated!");
}

// --- UI FUNCTIONS ---

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.querySelector('.overlay').classList.toggle('active');
}

function showTab(tab) {
    // Hide all
    document.getElementById('tab-users').style.display = 'none';
    document.getElementById('tab-settings').style.display = 'none';
    
    // Show selected
    document.getElementById('tab-' + tab).style.display = 'block';
    
    // Update Title
    const title = tab === 'users' ? 'User Management' : 'Settings';
    document.getElementById('pageTitle').innerText = title;

    // Mobile: Close sidebar after click
    if(window.innerWidth <= 768) toggleSidebar();
}

function openModal() {
    const rnd = "MVX" + Math.floor(Math.random() * 10000);
    document.getElementById('newKey').value = rnd;
    document.getElementById('keyModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('keyModal').style.display = 'none';
}

// Start
init();