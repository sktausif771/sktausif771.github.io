/* ==========================================================================
   MVX STORE V5.0 - MAIN STORE LOGIC & UPLOAD ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') {
        console.error("Firebase SDK missing.");
        return;
    }

    const db = firebase.database();
    const auth = firebase.auth();
    
    let currentUser = null;
    let userProfile = null;

    // ImgBB API Key (আপনার নিজের API Key এখানে বসান)
    const IMGBB_API_KEY = "YOUR_IMGBB_API_KEY_HERE"; 

    // Auth State Check
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadUserProfile(user.uid);
            runAutoApproveEngine(); // স্টার্ট অটো-অ্যাপ্রুভ চেকার
        }
    });

    // ==========================================================================
    // 1. LOAD USER PROFILE
    // ==========================================================================
    function loadUserProfile(uid) {
        db.ref('users/' + uid).on('value', (snapshot) => {
            if (snapshot.exists()) {
                userProfile = snapshot.val();
                
                // You Tab Data Update
                const tabName = document.getElementById('youTabName');
                const tabEmail = document.getElementById('youTabEmail');
                const tabCoin = document.getElementById('youCoinBalance');
                const tabAvatar = document.getElementById('youTabAvatar');

                if(tabName) tabName.innerText = userProfile.name;
                if(tabEmail) tabEmail.innerText = userProfile.email;
                if(tabCoin) tabCoin.innerText = userProfile.coins || 0;
                if(tabAvatar) tabAvatar.src = userProfile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.name}`;

                // Admin Menu Toggle
                if(userProfile.role === 'admin' || userProfile.role === 'owner') {
                    document.getElementById('adminMenuToggle').style.display = 'block';
                    document.getElementById('linkAdmin').style.display = 'flex';
                }
                if(userProfile.role === 'owner') {
                    document.getElementById('linkOwner').style.display = 'flex';
                }

                // Load Store Data after profile loads
                loadStoreFeed('for_you');
            }
        });
    }

    // ==========================================================================
    // 2. STORE FEED RENDER (Play Store Style)
    // ==========================================================================
    window.loadStoreFeed = function(filterType) {
        const grid = document.getElementById('storeAppGrid');
        if(!grid) return;

        grid.innerHTML = `<div style="text-align:center; padding: 40px; grid-column: 1/-1;"><i class="fas fa-spinner fa-spin" style="font-size:30px; color:#00e6b8;"></i></div>`;

        db.ref('store_apps').orderByChild('status').equalTo('approved').once('value').then((snapshot) => {
            if(!snapshot.exists()) {
                grid.innerHTML = `<div style="text-align:center; padding:40px; grid-column: 1/-1; color:#94a3b8;">No applications found.</div>`;
                return;
            }

            let html = '';
            let apps = [];
            snapshot.forEach(child => apps.push({ id: child.key, ...child.val() }));
            apps.reverse(); // Newest first

            apps.forEach(app => {
                let show = false;
                if(filterType === 'for_you') show = true;
                if(filterType === 'free' && app.category === 'free') show = true;
                if(filterType === 'premium' && app.category === 'paid') show = true;

                if(show) {
                    html += `
                        <div class="app-card" onclick="window.location.href='details.html?id=${app.id}'">
                            <img src="${app.logoUrl}" class="app-icon-large" loading="lazy">
                            <div class="app-info-list">
                                <h3 class="app-title-list">${app.appName}</h3>
                                <div class="app-dev-list">${app.uploaderName} • ${app.size}</div>
                                <div class="app-meta-list">
                                    <span class="rating">4.5 <i class="fas fa-star"></i></span>
                                    <span>${app.downloads || 0} Downloads</span>
                                    <span style="color:${app.category === 'paid' ? '#ffd700' : '#00ff88'}; font-weight:bold; text-transform:uppercase;">${app.category}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            grid.innerHTML = html || `<div style="text-align:center; padding:40px; grid-column: 1/-1; color:#94a3b8;">No apps in this category.</div>`;
        });
    };

    // Category Chip Clicks
    document.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            loadStoreFeed(e.target.getAttribute('data-filter'));
        });
    });

    // ==========================================================================
    // 3. ADVANCED UPLOAD MODAL (ImgBB, Password, Multi-Link)
    // ==========================================================================
    window.openUploadModal = function() {
        if(!userProfile) return;

        // Restriction Logic
        const isAdmin = (userProfile.role === 'admin' || userProfile.role === 'owner');
        const paidOptionHTML = isAdmin ? `<option value="paid">PREMIUM (Paid)</option>` : `<option value="free" disabled>PREMIUM (Admins Only)</option>`;

        let uploadUI = document.createElement('div');
        uploadUI.id = 'uploadEngineModal';
        uploadUI.className = 'modal-overlay active';
        uploadUI.innerHTML = `
            <div class="play-modal" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-cloud-upload-alt" style="color:var(--primary);"></i> Publish Application</h3>
                    <i class="fas fa-times close-modal" onclick="document.getElementById('uploadEngineModal').remove()"></i>
                </div>
                <div class="modal-body" style="padding-bottom: 30px;">
                    <p style="font-size:12px; color:var(--text-secondary); margin-bottom:15px;">
                        <i class="fas fa-info-circle"></i> Uploads will be checked by admins. If unchecked, it will Auto-Approve in 1 hour.
                    </p>

                    <label class="modal-label">Application Name</label>
                    <input type="text" id="upName" class="play-input" placeholder="Enter App Name">

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                        <div>
                            <label class="modal-label">Version</label>
                            <input type="text" id="upVer" class="play-input" placeholder="e.g. 1.0.0">
                        </div>
                        <div>
                            <label class="modal-label">Size</label>
                            <input type="text" id="upSize" class="play-input" placeholder="e.g. 50 MB">
                        </div>
                    </div>

                    <label class="modal-label">Category / Access</label>
                    <select id="upCat" class="play-input">
                        <option value="free">FREE (Public)</option>
                        ${paidOptionHTML}
                    </select>

                    <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

                    <label class="modal-label">App Logo (Upload via ImgBB)</label>
                    <input type="file" id="upLogoFile" class="play-input" accept="image/*" style="padding:10px;">
                    <input type="hidden" id="upLogoUrl">
                    <p id="logoStatus" style="font-size:11px; color:var(--primary); margin-top:-10px; margin-bottom:10px;"></p>

                    <label class="modal-label">App Banner (Upload via ImgBB)</label>
                    <input type="file" id="upBannerFile" class="play-input" accept="image/*" style="padding:10px;">
                    <input type="hidden" id="upBannerUrl">
                    <p id="bannerStatus" style="font-size:11px; color:var(--primary); margin-top:-10px; margin-bottom:10px;"></p>

                    <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

                    <label class="modal-label">Main Download Link</label>
                    <input type="text" id="upLinkMain" class="play-input" placeholder="https://...">

                    <label class="modal-label">Alternative / Key Link (Optional)</label>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="upLinkAltName" class="play-input" placeholder="Button Name (e.g. Get Key)" style="width:40%;">
                        <input type="text" id="upLinkAltUrl" class="play-input" placeholder="https://..." style="width:60%;">
                    </div>

                    <label class="modal-label">Unzip Password (Optional)</label>
                    <input type="text" id="upPass" class="play-input" placeholder="Leave blank if no password">

                    <label class="modal-label">Description & Changes</label>
                    <textarea id="upDesc" class="play-input" placeholder="What's new in this version?"></textarea>

                    <button class="play-btn" onclick="processUploadData()" id="finalUploadBtn">SUBMIT TO SYSTEM</button>
                </div>
            </div>
        `;
        document.body.appendChild(uploadUI);

        // ImgBB Auto-Upload Listeners
        document.getElementById('upLogoFile').addEventListener('change', (e) => uploadToImgBB(e.target.files[0], 'upLogoUrl', 'logoStatus'));
        document.getElementById('upBannerFile').addEventListener('change', (e) => uploadToImgBB(e.target.files[0], 'upBannerUrl', 'bannerStatus'));
    };

    // ImgBB Upload Function
    function uploadToImgBB(file, targetInputId, statusId) {
        if(!file) return;
        const statusTxt = document.getElementById(statusId);
        statusTxt.innerText = "Uploading to ImgBB...";
        statusTxt.style.color = "var(--warning)";

        const formData = new FormData();
        formData.append("image", file);

        fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                document.getElementById(targetInputId).value = data.data.url;
                statusTxt.innerText = "Upload Complete: " + data.data.url;
                statusTxt.style.color = "var(--primary)";
            } else {
                statusTxt.innerText = "ImgBB Error. Check API Key.";
                statusTxt.style.color = "var(--danger)";
            }
        })
        .catch(err => {
            statusTxt.innerText = "Upload failed.";
            statusTxt.style.color = "var(--danger)";
        });
    }

    // Submit Logic
    window.processUploadData = function() {
        const name = document.getElementById('upName').value.trim();
        const mainLink = document.getElementById('upLinkMain').value.trim();
        
        if(!name || !mainLink) {
            alert("App Name and Main Download Link are required.");
            return;
        }

        const btn = document.getElementById('finalUploadBtn');
        btn.innerText = "PROCESSING...";
        btn.disabled = true;

        const appData = {
            appName: name,
            version: document.getElementById('upVer').value || '1.0',
            size: document.getElementById('upSize').value || 'Unknown',
            category: document.getElementById('upCat').value,
            logoUrl: document.getElementById('upLogoUrl').value || 'https://via.placeholder.com/150/121212/00e6b8?text=APP',
            bannerUrl: document.getElementById('upBannerUrl').value || 'https://via.placeholder.com/500x250/121212/00e6b8?text=BANNER',
            downloadUrl: mainLink,
            altLinkName: document.getElementById('upLinkAltName').value.trim(),
            altLinkUrl: document.getElementById('upLinkAltUrl').value.trim(),
            zipPassword: document.getElementById('upPass').value.trim(),
            description: document.getElementById('upDesc').value.trim(),
            uploaderUid: currentUser.uid,
            uploaderName: userProfile.name,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            autoApproveTime: Date.now() + 3600000, // 1 Hour from now
            status: 'pending',
            downloads: 0,
            views: 0
        };

        db.ref('pending_apps').push(appData).then(() => {
            alert("Application submitted successfully! It will be Auto-Approved in 1 Hour if admins do not check it.");
            document.getElementById('uploadEngineModal').remove();
        });
    };

    // ==========================================================================
    // 4. 1-HOUR AUTO-APPROVE BACKGROUND ENGINE
    // ==========================================================================
    function runAutoApproveEngine() {
        // Runs every 5 minutes
        setInterval(() => {
            db.ref('pending_apps').once('value').then(snapshot => {
                if(snapshot.exists()) {
                    const now = Date.now();
                    snapshot.forEach(child => {
                        let app = child.val();
                        // Check if 1 hour has passed based on client time calculation
                        if (now >= app.autoApproveTime) {
                            app.status = 'approved';
                            app.approvedBy = 'Auto-System';
                            app.approvedAt = firebase.database.ServerValue.TIMESTAMP;
                            
                            // Move to store
                            db.ref(`store_apps/${child.key}`).set(app).then(() => {
                                // Delete from pending
                                db.ref(`pending_apps/${child.key}`).remove();
                                console.log(`Auto-Approved: ${app.appName}`);
                            });
                        }
                    });
                }
            });
        }, 300000); // 300,000 ms = 5 minutes
    }
});
