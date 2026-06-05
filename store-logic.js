/* ==========================================================================
   MVX STORE V5.6 - CORE DATA ENGINE & ADVANCED UPLOAD PROTOCOL
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') {
        console.error("Firebase Core SDK Critical Error: Architecture links dropped.");
        return;
    }

    const db = firebase.database();
    const auth = firebase.auth();
    
    let currentUser = null;
    let userProfile = null;
    let activeContentType = 'mod_app';
    let activeFilterType = 'all';    

    const IMGBB_API_KEY = "820eb9aa6a57f863045a52c1929efc9c"; 

    // ==========================================================================
    // 1. DYNAMIC UI INJECTION FOR "MY UPLOADS" (Only for Admins)
    // ==========================================================================
    const menuList = document.querySelector('.you-menu-list');
    if (menuList && !document.getElementById('menuMyUploadsItem')) {
        const myUpBtn = document.createElement('div');
        myUpBtn.className = 'you-menu-item';
        myUpBtn.id = 'menuMyUploadsItem';
        myUpBtn.style.display = 'none'; 
        myUpBtn.onclick = function() { 
            if(typeof openMyUploadsModal === 'function') openMyUploadsModal(); 
        };
        myUpBtn.innerHTML = `
            <i class="fas fa-folder-open" style="color: var(--info);"></i>
            <span style="color: var(--info); font-weight: 700;">My Uploads</span>
            <i class="fas fa-chevron-right arrow"></i>
        `;
        menuList.insertBefore(myUpBtn, menuList.children[2] || menuList.firstChild);
    }

    window.openMyUploadsIfAdmin = function() {
        return false;
    };

    // ==========================================================================
    // 2. GLOBAL STORE BRAND LOGO SYNCHRONIZER
    // ==========================================================================
    db.ref('settings/storeLogo').on('value', (snapshot) => {
        const logoImg = document.getElementById('mainStoreLogo');
        if (logoImg && snapshot.exists() && snapshot.val().trim() !== "") {
            logoImg.src = snapshot.val();
        }
    });

    // ==========================================================================
    // 3. AUTH STATE TRIGGER & BACKGROUND CONTROLLERS
    // ==========================================================================
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            db.ref('users/' + user.uid).on('value', (snapshot) => {
                if (snapshot.exists()) {
                    userProfile = snapshot.val();
                    executeSystemInterfacePipelineUpdates();
                }
            });
            runSystemAutoApproveEngine();
            listenForLiveSystemNotifications();
        } else {
            currentUser = null;
            userProfile = null;
            listenForLiveSystemNotifications();
            
            const myUpBtn = document.getElementById('menuMyUploadsItem');
            if(myUpBtn) myUpBtn.style.display = 'none';
        }
    });

    // ==========================================================================
    // 4. SYSTEM INTERFACE PIPELINE ELEMENTS MANAGER
    // ==========================================================================
    function executeSystemInterfacePipelineUpdates() {
        if (!userProfile || !currentUser) return;

        const isAdmin = (userProfile.role === 'owner' || sessionStorage.getItem('mvx_role') === 'owner');
        const myUpBtn = document.getElementById('menuMyUploadsItem');
        if(myUpBtn) {
            myUpBtn.style.display = isAdmin ? 'flex' : 'none';
        }

        let realName = userProfile.name;
        if (!realName || realName === "MVX User") {
            realName = currentUser.displayName || "MVX User";
        }

        let realAvatar = userProfile.avatarUrl;
        if (!realAvatar || realAvatar.includes("dicebear")) {
            realAvatar = currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${realName}`;
        }

        const tabName = document.getElementById('youTabName');
        const tabEmail = document.getElementById('youTabEmail');
        const tabAvatar = document.getElementById('youTabAvatar');
        const topProfilePic = document.getElementById('topProfileBtn');
        const coinDisplay = document.getElementById('navCoinDisplay');

        if (tabName) tabName.innerText = realName;
        if (tabEmail) tabEmail.innerText = userProfile.email || currentUser.email || "";
        if (coinDisplay) coinDisplay.innerText = userProfile.coins !== undefined ? userProfile.coins : 0;
        if (tabAvatar) tabAvatar.src = realAvatar;
        if (topProfilePic) topProfilePic.src = realAvatar;
    }

    // ==========================================================================
    // 5. PLAY STORE DATA RENDERING GRID
    // ==========================================================================
    window.loadStoreFeed = function(filter, contentType) {
        activeFilterType = filter || activeFilterType;
        activeContentType = contentType || activeContentType;

        const grid = document.getElementById('storeAppGrid');
        if (!grid) return;

        let activeLang = localStorage.getItem('mvx_lang') || 'en';
        let loadingMsg = "Loading Apps...";
        if(activeLang === 'bn') loadingMsg = "অ্যাপ লোড হচ্ছে...";

        grid.innerHTML = `
            <div style="text-align:center; padding: 50px; grid-column: 1/-1;">
                <i class="fas fa-spinner fa-spin" style="font-size:32px; color:var(--primary);"></i>
                <p style="margin-top:15px; color:var(--text-secondary); font-weight:500;">${loadingMsg}</p>
            </div>
        `;

        db.ref('store_apps').orderByChild('status').equalTo('approved').once('value').then((snapshot) => {
            if (!snapshot.exists()) {
                grid.innerHTML = `<div style="text-align:center; padding:50px; grid-column:1/-1; color:var(--text-secondary);">No apps found.</div>`;
                return;
            }

            let html = '';
            let appsList = [];
            
            snapshot.forEach((child) => {
                appsList.push({ id: child.key, ...child.val() });
            });
            
            appsList.reverse();

            appsList.forEach((app) => {
                let matchType = (app.appType === activeContentType);
                let matchFilter = false;

                if (activeFilterType === 'all') matchFilter = true;
                if (activeFilterType === 'premium' && app.category === 'paid') matchFilter = true;
                if (activeFilterType === 'trending' && app.isTrending === true) matchFilter = true;

                if (matchType && matchFilter) {
                    const priceLabel = app.category === 'paid' ? `${app.coinPrice || 0} Coins` : 'FREE';
                    const badgeClass = app.category === 'paid' ? 'badge-paid' : 'badge-free';

                    html += `
                        <div class="app-card" onclick="window.location.href='details.html?id=${app.id}'">
                            <span class="badge ${badgeClass}">${priceLabel}</span>
                            <img src="${app.logoUrl}" class="app-icon-large" loading="lazy" onerror="this.src='https://via.placeholder.com/75/121212/00e6b8?text=FILE'">
                            <div class="app-info-list" style="width: 100%; word-wrap: break-word; white-space: normal;">
                                <h3 class="app-title-list" style="white-space: normal; overflow: visible; text-overflow: unset; line-height: 1.3; font-size: 17px;">${app.appName}</h3>
                                <div class="app-dev-list">${app.developerName || app.uploaderName || "Developer"} • ${app.size || "0 MB"}</div>
                                <div class="app-meta-list">
                                    <span style="color:var(--primary); font-weight:700;"><i class="fas fa-arrow-alt-circle-down"></i> ${app.downloads || 0}</span>
                                    <span>v${app.version || "1.0"}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            grid.innerHTML = html || `<div style="text-align:center; padding:50px; grid-column:1/-1; color:var(--text-secondary);">No apps match your filter.</div>`;
        });
    };

    document.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            loadStoreFeed(e.target.getAttribute('data-filter'), activeContentType);
        });
    });

    setTimeout(() => {
        if(typeof window.loadStoreFeed === 'function') {
            window.loadStoreFeed('all', 'mod_app');
        }
    }, 200);

    // ==========================================================================
    // 6. SMART TAGS FIELD ARRAY CONTROLLER
    // ==========================================================================
    let uploadedTagsList = [];
    
    function initializeTagsInputEngine() {
        const input = document.getElementById('tagInputField');
        const container = document.getElementById('tagsInputContainer');
        if(!input || !container) return;

        uploadedTagsList = []; 

        input.addEventListener('keydown', (e) => {
            if (e.key === ',' || e.key === 'Enter') {
                e.preventDefault();
                let tag = input.value.trim().toLowerCase().replace(/,/g, '');
                if (tag && !uploadedTagsList.includes(tag)) {
                    uploadedTagsList.push(tag);
                    renderTagsChipsInsideInputBox();
                }
                input.value = '';
            }
        });
    }

    function renderTagsChipsInsideInputBox() {
        const container = document.getElementById('tagsInputContainer');
        const input = document.getElementById('tagInputField');
        if(!container) return;

        container.querySelectorAll('.tag-chip').forEach(chip => chip.remove());

        uploadedTagsList.forEach((tag, index) => {
            let chip = document.createElement('span');
            chip.className = 'tag-chip';
            chip.innerHTML = `${tag} <i class="fas fa-times" onclick="removeSelectedTagChip(${index})"></i>`;
            container.insertBefore(chip, input);
        });
    }

    window.removeSelectedTagChip = function(index) {
        uploadedTagsList.splice(index, 1);
        renderTagsChipsInsideInputBox();
    };

    let uploadedScreenshotsList = [];

    // ==========================================================================
    // 7. DYNAMIC LINKS LOGIC (MAX 5)
    // ==========================================================================
    window.addNewLinkRow = function() {
        const container = document.getElementById('dynamicLinksContainer');
        const rows = container.querySelectorAll('.dynamic-link-row').length;
        
        if (rows >= 5) {
            alert("Maximum 5 links allowed.");
            return;
        }
        
        const newRow = document.createElement('div');
        newRow.className = 'dynamic-link-row';
        newRow.style.cssText = 'display:flex; gap:10px; margin-top:12px;';
        newRow.innerHTML = `
            <input type="text" class="play-input ex-link-title" placeholder="Link Title" style="margin-bottom:0; flex:1;">
            <input type="text" class="play-input ex-link-url" placeholder="Download Link" style="margin-bottom:0; flex:2;">
        `;
        container.appendChild(newRow);
        
        if (rows + 1 >= 5) {
            document.getElementById('addMoreLinkBtn').style.display = 'none';
        }
    }

    window.toggleCoinPriceInputBoxField = function(value) {
        document.getElementById('coinPriceWrapper').style.display = (value === 'paid') ? 'block' : 'none';
    };

    // ==========================================================================
    // 8. MASTER PUBLISH MODAL FORM LAYOUT (CLEAN UI & BASIC ENGLISH)
    // ==========================================================================
    window.openUploadModal = function() {
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }

        const isMasterOwner = (userProfile && userProfile.role === 'owner');
        uploadedScreenshotsList = []; 

        let categoryOptionsHTML = `<option value="free">Free App</option>`;
        if (isMasterOwner) {
            categoryOptionsHTML += `<option value="paid">Premium (Coins)</option>`;
        }

        let uploadModal = document.createElement('div');
        uploadModal.id = 'dynamicUploadModal';
        uploadModal.className = 'modal-overlay active';
        uploadModal.innerHTML = `
            <div class="play-modal" style="max-width: 550px;">
                <div class="modal-header">
                    <h3><i class="fas fa-upload" style="color:var(--primary);"></i> Upload New App</h3>
                    <i class="fas fa-times close-modal" onclick="document.getElementById('dynamicUploadModal').remove()"></i>
                </div>
                <div class="modal-body">
                    
                    <label class="modal-label">App Title</label>
                    <input type="text" id="pName" class="play-input" placeholder="App name">

                    <label class="modal-label">Developer</label>
                    <input type="text" id="pDevName" class="play-input" placeholder="Developer name">

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div>
                            <label class="modal-label">Version</label>
                            <input type="text" id="pVer" class="play-input" placeholder="1.0">
                        </div>
                        <div>
                            <label class="modal-label">Size</label>
                            <input type="text" id="pSize" class="play-input" placeholder="50 MB">
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div>
                            <label class="modal-label">Section</label>
                            <select id="pType" class="play-input">
                                <option value="mod_app">Mods</option>
                                <option value="files">Files</option>
                            </select>
                        </div>
                        <div>
                            <label class="modal-label">App Type</label>
                            <select id="pCat" class="play-input" onchange="toggleCoinPriceInputBoxField(this.value)">
                                ${categoryOptionsHTML}
                            </select>
                        </div>
                    </div>

                    <div id="coinPriceWrapper" style="display:none;">
                        <label class="modal-label" style="color:var(--warning);">Coin Price</label>
                        <input type="number" id="pCoinPrice" class="play-input" placeholder="0" value="0">
                    </div>

                    <div style="display:flex; gap:20px; margin-bottom:20px; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 10px; border: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="pTrendingCheck" style="width: 16px; height: 16px; cursor: pointer;">
                            <span style="font-size: 13px; color: var(--text-primary);">Trending App</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="pPushNotificationCheck" style="width: 16px; height: 16px; cursor: pointer;">
                            <span style="font-size: 13px; color: var(--success);">Send Notification</span>
                        </div>
                    </div>

                    <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

                    <div style="margin-bottom: 15px; text-align: center; background:rgba(0,0,0,0.02); padding:15px; border-radius:8px; border:1px solid var(--border-color);">
                        <label class="modal-label" style="text-align:left; color:var(--primary);">App Logo</label>
                        <div style="position:relative; display:inline-block;">
                            <img id="logoPreviewImg" style="width:80px; height:80px; border-radius:12px; object-fit:cover; border:2px dashed var(--border-color); background:rgba(0,0,0,0.2); display:block;">
                            <label for="logoFile" style="position:absolute; bottom:-5px; right:-5px; background:var(--primary); width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#000; box-shadow:0 2px 10px rgba(0,0,0,0.5); transition:0.2s;">
                                <i class="fas fa-plus"></i>
                            </label>
                            <input type="file" id="logoFile" accept="image/*" style="display:none;">
                            <input type="hidden" id="logoUrlOutput">
                        </div>
                        <p id="logoProcessStatus" style="font-size:11px; color:var(--warning); margin-top:10px; font-family:monospace;"></p>
                    </div>

                    <div style="background: rgba(0,0,0,0.02); padding: 10px; border-radius: 10px; border: 1px solid var(--border-color); margin-bottom: 15px;">
                        <label class="modal-label" style="color:var(--primary);">Screenshots (Max 5)</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <label for="screenshotFileBtn" class="upload-plus-box" style="width: 60px; height: 100px; flex-shrink: 0; margin-bottom: 0;">
                                <i class="fas fa-plus"></i>
                            </label>
                            <input type="file" id="screenshotFileBtn" accept="image/*" style="display:none;">
                            <div class="screenshot-preview-container" id="screenshotPreviewWrapper" style="margin-bottom:0; display:flex; gap:10px; overflow-x:auto;"></div>
                        </div>
                        <p id="screenshotProcessStatus" style="font-size:11px; color:var(--warning); margin-top:5px;"></p>
                    </div>

                    <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

                    <label class="modal-label">Download Links (Max 5)</label>
                    <div id="dynamicLinksContainer" style="background: rgba(0,0,0,0.02); padding: 15px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 10px; display: flex; flex-direction: column;">
                        <div class="dynamic-link-row" style="display:flex; gap:10px;">
                            <input type="text" class="play-input ex-link-title" placeholder="Title (e.g. Server 1)" style="margin-bottom:0; flex:1;">
                            <input type="text" class="play-input ex-link-url" placeholder="Download Link" style="margin-bottom:0; flex:2;">
                        </div>
                    </div>
                    <button id="addMoreLinkBtn" class="add-link-btn" style="margin-bottom:20px;" onclick="addNewLinkRow()"><i class="fas fa-plus"></i> Add Link</button>

                    <label class="modal-label">Tags (Use comma to separate)</label>
                    <div class="tags-container" id="tagsInputContainer" style="padding: 8px;">
                        <input type="text" id="tagInputField" class="tag-input-field" placeholder="Add tags..." style="padding: 5px;">
                    </div>

                    <label class="modal-label">Description</label>
                    <textarea id="pDescription" class="play-input" placeholder="App description..." style="min-height:80px; resize:vertical;"></textarea>

                    <button class="play-btn" id="executePublishBtn" onclick="commitPackageToPendingDatabaseNode()">UPLOAD APP</button>
                </div>
            </div>
        `;
        document.body.appendChild(uploadModal);

        initializeTagsInputEngine();

        // AUTOMATIC LOGO UPLOAD LOGIC
        document.getElementById('logoFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(!file) return;
            const status = document.getElementById('logoProcessStatus');
            const preview = document.getElementById('logoPreviewImg');
            const output = document.getElementById('logoUrlOutput');
            
            status.innerText = "Uploading...";
            status.style.color = "var(--warning)";

            const formData = new FormData();
            formData.append("image", file);

            fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            }).then(res => res.json()).then(json => {
                if (json.success) {
                    output.value = json.data.url;
                    preview.src = json.data.url;
                    status.innerText = "Uploaded!";
                    status.style.color = "var(--success)";
                    setTimeout(() => status.innerText = "", 3000);
                } else {
                    status.innerText = "Upload failed.";
                    status.style.color = "var(--danger)";
                }
            }).catch(() => {
                status.innerText = "Network error.";
                status.style.color = "var(--danger)";
            });
        });

        // AUTOMATIC SCREENSHOT UPLOAD LOGIC
        document.getElementById('screenshotFileBtn').addEventListener('change', (e) => {
            if (uploadedScreenshotsList.length >= 5) {
                alert("Maximum 5 screenshots allowed.");
                e.target.value = '';
                return;
            }
            
            const file = e.target.files[0];
            if(!file) return;
            const status = document.getElementById('screenshotProcessStatus');
            const wrapper = document.getElementById('screenshotPreviewWrapper');

            status.innerText = "Uploading...";
            status.style.color = "var(--warning)";

            const formData = new FormData();
            formData.append("image", file);

            fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            }).then(res => res.json()).then(json => {
                if (json.success) {
                    const imgUrl = json.data.url;
                    uploadedScreenshotsList.push(imgUrl);

                    let thumb = document.createElement('img');
                    thumb.src = imgUrl;
                    thumb.className = 'sc-preview-thumb';
                    wrapper.appendChild(thumb);

                    status.innerText = `Screenshot ${uploadedScreenshotsList.length}/5 Uploaded!`;
                    status.style.color = "var(--success)";
                } else {
                    status.innerText = "Upload failed.";
                    status.style.color = "var(--danger)";
                }
                document.getElementById('screenshotFileBtn').value = '';
            }).catch(() => {
                status.innerText = "Network error.";
                status.style.color = "var(--danger)";
            });
        });
    };

    // ==========================================================================
    // 9. DATABASE COMMIT LOGIC
    // ==========================================================================
    window.commitPackageToPendingDatabaseNode = function() {
        const name = document.getElementById('pName').value.trim();
        const devName = document.getElementById('pDevName').value.trim(); 
        const logoData = document.getElementById('logoUrlOutput').value.trim();
        const isTrendingChecked = document.getElementById('pTrendingCheck').checked;
        const isPushNotificationChecked = document.getElementById('pPushNotificationCheck').checked;

        // Collect Dynamic Links
        let collectedLinks = [];
        const titles = document.querySelectorAll('.ex-link-title');
        const urls = document.querySelectorAll('.ex-link-url');
        let mainLink = "";

        for(let i = 0; i < urls.length; i++) {
            let tVal = titles[i].value.trim();
            let uVal = urls[i].value.trim();
            if(uVal !== "") {
                if(mainLink === "") mainLink = uVal; 
                collectedLinks.push({
                    title: tVal || `Link ${i + 1}`,
                    url: uVal
                });
            }
        }

        if (!name || mainLink === "") {
            alert("App Name and at least one Download Link are required.");
            return;
        }

        const btn = document.getElementById('executePublishBtn');
        btn.innerText = "UPLOADING...";
        btn.disabled = true;

        const transactionalPackagePayload = {
            appName: name,
            developerName: devName || userProfile.name || "Unknown Developer", 
            version: document.getElementById('pVer').value.trim() || "1.0",
            size: document.getElementById('pSize').value.trim() || "0 MB",
            appType: document.getElementById('pType').value,
            category: document.getElementById('pCat').value,
            coinPrice: parseInt(document.getElementById('pCoinPrice').value) || 0,
            isTrending: isTrendingChecked,
            sendNotification: isPushNotificationChecked, 
            logoUrl: logoData || "https://via.placeholder.com/150/121212/00e6b8?text=APP",
            screenshots: uploadedScreenshotsList, 
            downloadUrl: mainLink, // Fallback for backward compatibility
            zipPassword: "", // Kept empty to remove feature safely without DB crash
            getPasswordLink: "", 
            extraLinks: collectedLinks, 
            tags: uploadedTagsList, 
            description: document.getElementById('pDescription').value.trim() || "No description provided.",
            uploaderUid: currentUser.uid,
            uploaderName: userProfile.name,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            autoApproveTime: Date.now() + 60000, 
            status: 'pending',
            downloads: 0,
            views: 0,
            rating: 0,
            totalRatingsCount: 0,
            ratingDistribution: {
                1: 0, 2: 0, 3: 0, 4: 0, 5: 0
            }
        };

        db.ref('pending_apps').push(transactionalPackagePayload).then(() => {
            alert("App uploaded successfully! It will be live in 1 minute.");
            document.getElementById('dynamicUploadModal').remove();
        }).catch((err) => {
            alert("Error: " + err.message);
            btn.innerText = "UPLOAD APP";
            btn.disabled = false;
        });
    };

    // ==========================================================================
    // 10. SYSTEM AUTO APPROVAL & NOTIFICATIONS BOT
    // ==========================================================================
    function listenForLiveSystemNotifications() {
        const inbox = document.getElementById('notificationInboxDisplay');
        const badge = document.getElementById('notiAlert');
        
        db.ref('system_broadcasts').on('value', (snapshot) => {
            if(!inbox) return;
            if(!snapshot.exists()) {
                inbox.innerHTML = `<div class="empty-msg" style="text-align:center; color:var(--text-secondary); padding:40px;"><i class="fas fa-check-circle" style="font-size:30px; margin-bottom:10px; color:var(--success);"></i><br>No new notifications.</div>`;
                return;
            }

            if(badge) badge.style.display = 'block'; 
        });
    }

    function runSystemAutoApproveEngine() {
        setInterval(() => {
            db.ref('pending_apps').once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    const currentTimeStamp = Date.now();
                    snapshot.forEach((child) => {
                        let appRecord = child.val();
                        
                        if (currentTimeStamp >= appRecord.autoApproveTime) {
                            appRecord.status = 'approved';
                            appRecord.approvedBy = 'System-Auto-1Min';
                            appRecord.approvedAt = firebase.database.ServerValue.TIMESTAMP;

                            db.ref(`store_apps/${child.key}`).set(appRecord).then(() => {
                                if (appRecord.sendNotification === true) {
                                    const date = new Date();
                                    const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + " | " + date.toLocaleDateString();
                                    db.ref('system_broadcasts').push({
                                        title: "New App Uploaded!",
                                        message: `'${appRecord.appName}' (v${appRecord.version}) is now available.`,
                                        type: "normal",
                                        timeString: timeStr,
                                        sender: "System",
                                        link: `details.html?id=${child.key}`, 
                                        timestamp: firebase.database.ServerValue.TIMESTAMP
                                    });
                                }
                                db.ref(`pending_apps/${child.key}`).remove();
                            });
                        }
                    });
                }
            });
        }, 15000); 
    }

    // ==========================================================================
    // 11. MY UPLOADS & EDIT LOGIC (CLEAN ENGLISH)
    // ==========================================================================
    window.fetchMyUploadedApps = function() {
        const container = document.getElementById('myUploadsContainer');
        if (!currentUser) {
             if(container) container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-dim);">Please login to view your uploads.</div>`;
             return;
        }

        container.innerHTML = `<div style="text-align:center; padding:30px;"><i class="fas fa-circle-notch fa-spin" style="color:var(--primary); font-size:24px;"></i><p style="margin-top:10px;">Loading your apps...</p></div>`;

        let html = '';
        Promise.all([
            db.ref('store_apps').once('value'),
            db.ref('pending_apps').once('value')
        ]).then(([storeSnap, pendingSnap]) => {
            let userApps = [];

            if (storeSnap.exists()) {
                storeSnap.forEach(child => {
                    let app = child.val();
                    if (app.uploaderUid === currentUser.uid) {
                        userApps.push({ id: child.key, node: 'store_apps', ...app });
                    }
                });
            }

            if (pendingSnap.exists()) {
                pendingSnap.forEach(child => {
                    let app = child.val();
                    if (app.uploaderUid === currentUser.uid) {
                        userApps.push({ id: child.key, node: 'pending_apps', ...app });
                    }
                });
            }

            if (userApps.length === 0) {
                container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-dim);"><i class="fas fa-box-open" style="font-size:35px; margin-bottom:10px; opacity:0.5;"></i><p>You have no uploads yet.</p></div>`;
                return;
            }

            userApps.reverse().forEach(app => {
                const isLive = app.node === 'store_apps';
                const statusBadge = isLive ? `<span style="color:var(--success); font-size:10px; font-weight:bold; background:rgba(46,213,115,0.1); padding:2px 6px; border-radius:4px; border:1px solid rgba(46,213,115,0.2);">Live</span>` : `<span style="color:var(--warning); font-size:10px; font-weight:bold; background:rgba(255,165,0,0.1); padding:2px 6px; border-radius:4px; border:1px solid rgba(255,165,0,0.2);">Pending</span>`;
                
                html += `
                    <div style="display:flex; align-items:center; gap:12px; background:rgba(0,0,0,0.2); margin-bottom:12px; padding:12px; border-radius:12px; border:1px solid var(--border-glass);">
                        <img src="${app.logoUrl}" style="width:48px; height:48px; border-radius:10px; object-fit:cover; border:1px solid var(--border-glass);">
                        <div style="flex:1; overflow:hidden;">
                            <h4 style="font-size:14px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px;">${app.appName}</h4>
                            <p style="font-size:12px; color:var(--text-dim); display:flex; align-items:center; gap:8px;">v${app.version} • ${statusBadge}</p>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <button style="background:rgba(0,168,255,0.1); color:var(--info); border:none; width:35px; height:35px; border-radius:8px; cursor:pointer;" onclick="window.openUserAppEdit('${app.id}', '${app.node}')"><i class="fas fa-edit"></i></button>
                            <button style="background:rgba(255,71,87,0.1); color:var(--danger); border:none; width:35px; height:35px; border-radius:8px; cursor:pointer;" onclick="window.deleteUserApp('${app.id}', '${app.node}')"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        });
    };

    window.openUserAppEdit = function(appId, node) {
        db.ref(`${node}/${appId}`).once('value').then(snap => {
            if (!snap.exists()) return;
            const app = snap.val();
            
            document.getElementById('euAppId').value = appId;
            document.getElementById('euAppStatus').value = node;
            document.getElementById('euName').value = app.appName || "";
            document.getElementById('euVer').value = app.version || "";
            document.getElementById('euSize').value = app.size || "";
            document.getElementById('euMainLink').value = app.downloadUrl || "";
            document.getElementById('euDescription').value = app.description || "";
            
            document.getElementById('userAppEditModal').classList.add('active');
        });
    };

    window.submitUserAppUpdate = function() {
        const appId = document.getElementById('euAppId').value;
        const node = document.getElementById('euAppStatus').value;
        const name = document.getElementById('euName').value.trim();
        const ver = document.getElementById('euVer').value.trim();
        const size = document.getElementById('euSize').value.trim();
        const link = document.getElementById('euMainLink').value.trim();
        const desc = document.getElementById('euDescription').value.trim();

        if (!name || !link) {
            alert("App Name and Download Link are required.");
            return;
        }

        let updates = {
            appName: name,
            version: ver || "1.0",
            size: size || "0 MB",
            downloadUrl: link,
            description: desc || ""
        };

        db.ref(`${node}/${appId}`).update(updates).then(() => {
            alert("App Updated Successfully!");
            document.getElementById('userAppEditModal').classList.remove('active');
            window.fetchMyUploadedApps();
            if (typeof window.loadStoreFeed === 'function') window.loadStoreFeed();
        });
    };

    window.deleteUserApp = function(appId, node) {
        if (confirm("Are you sure you want to delete this app?")) {
            db.ref(`${node}/${appId}`).remove().then(() => {
                alert("App Deleted.");
                window.fetchMyUploadedApps();
                if (typeof window.loadStoreFeed === 'function') window.loadStoreFeed();
            });
        }
    };

});
