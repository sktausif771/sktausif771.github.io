/* ==========================================================================
   MVX STORE V5.6 - CORE DATA ENGINE & ADVANCED UPLOAD PROTOCOL (FINAL LINK SYNC)
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
            if(typeof window.fetchMyUploadedApps === 'function') window.fetchMyUploadedApps();
            document.getElementById('myUploadsModal').classList.add('active'); 
        };
        myUpBtn.innerHTML = `
            <i class="fas fa-folder-open" style="color: var(--info);"></i>
            <span style="color: var(--info); font-weight: 700;">My Uploads</span>
            <i class="fas fa-chevron-right arrow"></i>
        `;
        menuList.insertBefore(myUpBtn, menuList.children[2] || menuList.firstChild);
    }

    window.openMyUploadsIfAdmin = function() { return false; };

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
        if(myUpBtn) myUpBtn.style.display = isAdmin ? 'flex' : 'none';

        let realName = userProfile.name || currentUser.displayName || "MVX User";
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
        let loadingMsg = activeLang === 'bn' ? "ডাটাবেজ কানেকশন চেক করা হচ্ছে..." : "Scanning Database Infrastructure...";

        grid.innerHTML = `
            <div style="text-align:center; padding: 50px; grid-column: 1/-1;">
                <i class="fas fa-spinner fa-spin" style="font-size:32px; color:var(--primary);"></i>
                <p style="margin-top:15px; color:var(--text-secondary); font-weight:500;">${loadingMsg}</p>
            </div>
        `;

        db.ref('store_apps').orderByChild('status').equalTo('approved').once('value').then((snapshot) => {
            if (!snapshot.exists()) {
                grid.innerHTML = `<div style="text-align:center; padding:50px; grid-column:1/-1; color:var(--text-secondary);">No applications live in database catalog.</div>`;
                return;
            }

            let html = '';
            let appsList = [];
            snapshot.forEach((child) => appsList.push({ id: child.key, ...child.val() }));
            appsList.reverse();

            appsList.forEach((app) => {
                let matchType = (app.appType === activeContentType);
                let matchFilter = false;

                if (activeFilterType === 'all') matchFilter = true;
                if (activeFilterType === 'premium' && app.category === 'paid') matchFilter = true;
                if (activeFilterType === 'trending' && app.isTrending === true) matchFilter = true;

                if (matchType && matchFilter) {
                    const priceLabel = app.category === 'paid' ? `${app.coinPrice || 0} Coins` : (app.category === 'locked' ? 'LOCKED' : 'FREE');
                    const badgeClass = app.category === 'paid' ? 'badge-paid' : (app.category === 'locked' ? 'badge-locked' : 'badge-free');

                    html += `
                        <div class="app-card" onclick="window.location.href='details.html?id=${app.id}'">
                            <span class="badge ${badgeClass}">${priceLabel}</span>
                            <img src="${app.logoUrl}" class="app-icon-large" loading="lazy" onerror="this.src='https://via.placeholder.com/75/121212/00e6b8?text=FILE'">
                            <div class="app-info-list" style="width: 100%; word-wrap: break-word; white-space: normal;">
                                <h3 class="app-title-list" style="white-space: normal; overflow: visible; text-overflow: unset; line-height: 1.3; font-size: 17px;">${app.appName} <i class="fas fa-check-circle verified-tick" style="color:var(--primary); font-size:13px; margin-left:4px;"></i></h3>
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

            grid.innerHTML = html || `<div style="text-align:center; padding:50px; grid-column:1/-1; color:var(--text-secondary);">No content found inside this layout card grid.</div>`;
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
        if(typeof window.loadStoreFeed === 'function') window.loadStoreFeed('all', 'mod_app');
    }, 200);

    // ==========================================================================
    // 6. SMART TAGS ENGINE
    // ==========================================================================
    let uploadedTagsList = [];
    
    window.initializeTagsInputEngine = function() {
        const input = document.getElementById('tagInputField');
        if(!input) return;

        input.addEventListener('keydown', (e) => {
            if (e.key === ',' || e.key === 'Enter') {
                e.preventDefault();
                let tag = input.value.trim().toLowerCase().replace(/,/g, '');
                if (tag && !uploadedTagsList.includes(tag)) {
                    uploadedTagsList.push(tag);
                    renderTagsChipsInsideInputBox();
                    if (typeof generateAutoTags === 'function') generateAutoTags(); 
                }
                input.value = '';
            }
        });
        renderTagsChipsInsideInputBox();
    }

    function renderTagsChipsInsideInputBox() {
        const container = document.getElementById('tagsInputContainer');
        const input = document.getElementById('tagInputField');
        if(!container || !input) return;

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
        generateAutoTags();
    };

    window.generateAutoTags = function() {
        const nameInput = document.getElementById('pName');
        const container = document.getElementById('suggestedTagsContainer');
        if(!container || !nameInput) return;
        
        const nameStr = nameInput.value.trim().toLowerCase();
        if(!nameStr) { container.innerHTML = ''; return; }
        
        let words = nameStr.split(' ').filter(w => w.length > 1);
        let suggestions = new Set([...words, nameStr.replace(/\s+/g, ''), 'mod', 'apk', 'premium', 'free']);
        
        let html = '<div style="font-size:11px; color:var(--text-secondary); width:100%; margin-bottom:5px;">Suggested Tags:</div>';
        let hasSuggestions = false;
        
        suggestions.forEach(tag => {
            if(!uploadedTagsList.includes(tag)) {
                hasSuggestions = true;
                html += `<span class="tag-chip" style="cursor:pointer; background:rgba(0,230,184,0.1); border:1px dashed var(--primary); margin-bottom:5px;" onclick="addSuggestedTag('${tag}')">${tag} <i class="fas fa-plus"></i></span>`;
            }
        });
        container.innerHTML = hasSuggestions ? html : '';
    };

    window.addSuggestedTag = function(tag) {
        if(!uploadedTagsList.includes(tag)) {
            uploadedTagsList.push(tag);
            renderTagsChipsInsideInputBox();
            generateAutoTags();
        }
    };

    // ==========================================================================
    // 7. UNIFIED APP FORM GENERATOR (UPLOAD & EDIT WITH CUSTOM UIs)
    // ==========================================================================
    let uploadedScreenshotsList = [];
    let currentEditingAppId = null;
    let currentEditingNode = null;

    window.openUploadModal = function() {
        if (!currentUser) { window.location.href = 'login.html'; return; }
        openAppFormModal('upload', {});
    };

    window.openUserAppEdit = function(appId, node) {
        db.ref(`${node}/${appId}`).once('value').then(snap => {
            if (!snap.exists()) return;
            const app = snap.val();
            app.id = appId;
            app.node = node;
            openAppFormModal('edit', app);
        });
    };

    function openAppFormModal(mode, appData = {}) {
        const oldModal = document.getElementById('dynamicAppFormModal');
        if(oldModal) oldModal.remove();

        const isMasterOwner = (userProfile && userProfile.role === 'owner');
        const isEdit = (mode === 'edit');

        // Initialize state arrays based on mode
        uploadedScreenshotsList = isEdit && appData.screenshots ? [...appData.screenshots] : [];
        uploadedTagsList = isEdit && appData.tags ? [...appData.tags] : [];
        currentEditingAppId = isEdit ? appData.id : null;
        currentEditingNode = isEdit ? appData.node : null;

        const aCat = appData.category || 'free';
        let categoryOptionsHTML = `<option value="free" ${aCat==='free'?'selected':''}>Free</option>`;
        if (isMasterOwner) {
            categoryOptionsHTML += `<option value="paid" ${aCat==='paid'?'selected':''}>Premium</option>`;
            categoryOptionsHTML += `<option value="locked" ${aCat==='locked'?'selected':''}>Locked</option>`;
        }

        let exLinksHTML = '';
        for(let i=0; i<3; i++) {
            let tTitle = '', tUrl = '';
            if(appData.extraLinks && appData.extraLinks[i]) {
                tTitle = appData.extraLinks[i].title || '';
                tUrl = appData.extraLinks[i].url || '';
            }
            exLinksHTML += `
                <div style="display:flex; gap:10px;">
                    <input type="text" class="play-input ex-link-title" placeholder="Title ${i+1}" value="${tTitle}" style="margin-bottom:0; flex:1;">
                    <input type="text" class="play-input ex-link-url" placeholder="URL ${i+1}" value="${tUrl}" style="margin-bottom:0; flex:2;">
                </div>
            `;
        }

        const modalHTML = `
            <div id="dynamicAppFormModal" class="modal-overlay active">
                <div class="play-modal" style="max-width: 550px;">
                    <div class="modal-header">
                        <h3><i class="${isEdit ? 'fas fa-edit' : 'fas fa-upload'}" style="color:var(--primary);"></i> ${isEdit ? 'Edit Application' : 'Upload New App'}</h3>
                        <i class="fas fa-times close-modal" onclick="document.getElementById('dynamicAppFormModal').remove()"></i>
                    </div>
                    <div class="modal-body">
                        
                        <label class="modal-label">App Name</label>
                        <input type="text" id="pName" class="play-input" placeholder="Enter app name" value="${appData.appName || ''}" onkeyup="generateAutoTags()">

                        <label class="modal-label">Developer Name</label>
                        <input type="text" id="pDevName" class="play-input" placeholder="e.g. Tausif Modz V3" value="${appData.developerName || ''}">

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                            <div>
                                <label class="modal-label">Version</label>
                                <input type="text" id="pVer" class="play-input" placeholder="e.g. 1.0" value="${appData.version || ''}">
                            </div>
                            <div>
                                <label class="modal-label">Size</label>
                                <input type="text" id="pSize" class="play-input" placeholder="e.g. 45 MB" value="${appData.size || ''}">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                            <div>
                                <label class="modal-label">Select Tab</label>
                                <select id="pType" class="play-input">
                                    <option value="mod_app" ${(appData.appType==='mod_app')?'selected':''}>Mod App Tab</option>
                                    <option value="files" ${(appData.appType==='files')?'selected':''}>Files Tab</option>
                                </select>
                            </div>
                            <div>
                                <label class="modal-label">Access Type</label>
                                <select id="pCat" class="play-input" onchange="toggleAccessTypeInputs(this.value)">
                                    ${categoryOptionsHTML}
                                </select>
                            </div>
                        </div>

                        <div id="coinPriceWrapper" style="display:${aCat==='paid'?'block':'none'};">
                            <label class="modal-label" style="color:var(--warning);">Coin Price</label>
                            <input type="number" id="pCoinPrice" class="play-input" placeholder="0" value="${appData.coinPrice || 0}">
                        </div>

                        <div id="videoLinkWrapper" style="display:${aCat==='locked'?'block':'none'}; margin-bottom: 15px;">
                            <label class="modal-label" style="color:var(--danger);">Unlock Video Link</label>
                            <input type="text" id="pVideoLink" class="play-input" placeholder="Paste YouTube/Tutorial link here" value="${appData.videoLink || ''}" style="margin-bottom: 0;">
                        </div>

                        <div style="display:flex; gap:20px; margin-bottom:20px; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 10px; border: 1px solid var(--border-color);">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="pTrendingCheck" style="width: 16px; height: 16px; cursor: pointer;" ${appData.isTrending?'checked':''}>
                                <span style="font-size: 13px; color: var(--text-primary);">Trending Status</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="pPushNotificationCheck" style="width: 16px; height: 16px; cursor: pointer;" ${appData.sendNotification?'checked':''}>
                                <span style="font-size: 13px; color: var(--success);">Send Notification</span>
                            </div>
                        </div>

                        <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

                        <div style="display:grid; grid-template-columns: 1fr; gap:15px;">
                            <div>
                                <label class="modal-label" style="color:var(--primary);">App Logo</label>
                                <div class="logo-upload-wrapper">
                                    <label id="logoUploadLabel" class="logo-plus-btn" for="logoFile"><i class="fas fa-plus"></i></label>
                                    <div id="logoPreviewBox" class="logo-preview-box">
                                        <img id="logoPreviewImg" src="">
                                        <label class="mini-change-btn" for="logoFile"><i class="fas fa-plus"></i></label>
                                    </div>
                                    <input type="file" id="logoFile" class="hidden-file-input" accept="image/*">
                                    <input type="hidden" id="logoUrlOutput">
                                </div>
                                <p id="logoProcessStatus" style="font-size:11px; color:var(--warning); margin-bottom:10px;"></p>
                            </div>
                            
                            <div>
                                <label class="modal-label" style="color:var(--primary);">Screenshots (Max 5)</label>
                                <div style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 10px; border: 1px solid var(--border-color);">
                                    <div class="screenshot-upload-wrapper" id="screenshotPreviewWrapper">
                                        <label id="scUploadLabel" class="sc-plus-btn" for="screenshotFileBtn"><i class="fas fa-plus"></i></label>
                                    </div>
                                    <input type="file" id="screenshotFileBtn" class="hidden-file-input" accept="image/*">
                                    <p id="screenshotProcessStatus" style="font-size:11px; color:var(--warning); margin-top:5px;"></p>
                                </div>
                            </div>
                        </div>

                        <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

                        <label class="modal-label">Main Download Link</label>
                        <input type="text" id="pMainLink" class="play-input" placeholder="Paste URL here" value="${appData.downloadUrl || ''}">

                        <label class="modal-label" style="color: var(--warning);">Extra Links (Up to 3)</label>
                        <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px;">
                            ${exLinksHTML}
                        </div>

                        <label class="modal-label">Search Tags (Comma separated)</label>
                        <div id="suggestedTagsContainer" style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px;"></div>
                        <div class="tags-container" id="tagsInputContainer" style="padding: 8px;">
                            <input type="text" id="tagInputField" class="tag-input-field" placeholder="Add tags..." style="padding: 5px;">
                        </div>

                        <label class="modal-label">Description</label>
                        <textarea id="pDescription" class="play-input" placeholder="App description & details..." style="min-height:80px; resize:vertical;">${appData.description || ''}</textarea>

                        <button class="play-btn" id="executePublishBtn" onclick="submitAppFormData('${mode}')">${isEdit ? 'SAVE CHANGES' : 'UPLOAD APP'}</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Pre-fill logo if exists
        if (appData.logoUrl && appData.logoUrl.trim() !== "" && !appData.logoUrl.includes('via.placeholder.com')) {
            document.getElementById('logoUrlOutput').value = appData.logoUrl;
            document.getElementById('logoUploadLabel').style.display = 'none';
            document.getElementById('logoPreviewBox').style.display = 'block';
            document.getElementById('logoPreviewImg').src = appData.logoUrl;
        }

        initializeTagsInputEngine();
        renderScreenshotsUI();

        // Image upload triggers
        document.getElementById('logoFile').addEventListener('change', (e) => processLogoUploadAction(e.target.files[0]));
        document.getElementById('screenshotFileBtn').addEventListener('change', (e) => processScreenshotUploadAction(e.target.files[0]));
    }

    window.toggleAccessTypeInputs = function(value) {
        const coinWrap = document.getElementById('coinPriceWrapper');
        const vidWrap = document.getElementById('videoLinkWrapper');
        if(coinWrap) coinWrap.style.display = (value === 'paid') ? 'block' : 'none';
        if(vidWrap) vidWrap.style.display = (value === 'locked') ? 'block' : 'none';
    };

    // ==========================================================================
    // 8. CUSTOM UI IMAGE UPLOAD HANDLERS (IMGBB API)
    // ==========================================================================
    window.processLogoUploadAction = function(file) {
        if(!file) return;
        const status = document.getElementById('logoProcessStatus');
        status.innerText = "Uploading Logo...";
        status.style.color = "var(--warning)";
        
        const formData = new FormData();
        formData.append("image", file);
        
        fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData })
        .then(res => res.json()).then(json => {
            if (json.success) {
                document.getElementById('logoUrlOutput').value = json.data.url;
                document.getElementById('logoUploadLabel').style.display = 'none';
                document.getElementById('logoPreviewBox').style.display = 'block';
                document.getElementById('logoPreviewImg').src = json.data.url;
                status.innerText = "Logo Added Successfully!";
                status.style.color = "var(--success)";
            } else { status.innerText = "Logo Upload failed."; status.style.color = "var(--danger)"; }
            document.getElementById('logoFile').value = '';
        }).catch(() => { status.innerText = "Network error."; status.style.color = "var(--danger)"; });
    };

    window.processScreenshotUploadAction = function(file) {
        if(!file) return;
        if (uploadedScreenshotsList.length >= 5) {
            alert("Maximum 5 screenshots allowed."); return;
        }
        
        const status = document.getElementById('screenshotProcessStatus');
        status.innerText = "Uploading Screenshot...";
        status.style.color = "var(--warning)";
        
        const formData = new FormData();
        formData.append("image", file);
        
        fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData })
        .then(res => res.json()).then(json => {
            if (json.success) {
                uploadedScreenshotsList.push(json.data.url);
                renderScreenshotsUI();
                status.innerText = "Screenshot Uploaded!";
                status.style.color = "var(--success)";
            } else { status.innerText = "Upload failed."; status.style.color = "var(--danger)"; }
            document.getElementById('screenshotFileBtn').value = '';
        }).catch(() => { status.innerText = "Network error."; status.style.color = "var(--danger)"; });
    };

    window.renderScreenshotsUI = function() {
        const wrapper = document.getElementById('screenshotPreviewWrapper');
        if (!wrapper) return;
        
        wrapper.querySelectorAll('.sc-preview-box').forEach(el => el.remove());
        const addLabel = document.getElementById('scUploadLabel');
        
        uploadedScreenshotsList.forEach((url, index) => {
            const box = document.createElement('div');
            box.className = 'sc-preview-box';
            box.innerHTML = `
                <img src="${url}">
                <div class="mini-delete-btn" onclick="removeScreenshotItem(${index})"><i class="fas fa-times"></i></div>
            `;
            wrapper.insertBefore(box, addLabel);
        });
        
        if (uploadedScreenshotsList.length >= 5) { addLabel.style.display = 'none'; } 
        else { addLabel.style.display = 'flex'; }
    };

    window.removeScreenshotItem = function(index) {
        uploadedScreenshotsList.splice(index, 1);
        renderScreenshotsUI();
    };

    // ==========================================================================
    // 9. DATABASE COMMIT (UPLOAD OR EDIT)
    // ==========================================================================
    window.submitAppFormData = function(mode) {
        const name = document.getElementById('pName').value.trim();
        const mainLink = document.getElementById('pMainLink').value.trim();

        if (!name || !mainLink) {
            alert("App Name and Download Link are required."); return;
        }

        let collectedExtraLinks = [];
        const titles = document.querySelectorAll('.ex-link-title');
        const urls = document.querySelectorAll('.ex-link-url');
        for(let i = 0; i < urls.length; i++) {
            if(urls[i].value.trim() !== "") {
                collectedExtraLinks.push({ title: titles[i].value.trim() || `Link ${i + 1}`, url: urls[i].value.trim() });
            }
        }

        const btn = document.getElementById('executePublishBtn');
        btn.innerText = "SAVING..."; btn.disabled = true;

        const transactionalPackagePayload = {
            appName: name,
            developerName: document.getElementById('pDevName').value.trim() || (userProfile?userProfile.name:"Unknown Developer"), 
            version: document.getElementById('pVer').value.trim() || "1.0",
            size: document.getElementById('pSize').value.trim() || "0 MB",
            appType: document.getElementById('pType').value,
            category: document.getElementById('pCat').value,
            coinPrice: parseInt(document.getElementById('pCoinPrice').value) || 0,
            videoLink: document.getElementById('pVideoLink') ? document.getElementById('pVideoLink').value.trim() : "",
            isTrending: document.getElementById('pTrendingCheck').checked,
            sendNotification: document.getElementById('pPushNotificationCheck').checked, 
            logoUrl: document.getElementById('logoUrlOutput').value.trim() || "https://via.placeholder.com/150/121212/00e6b8?text=APP",
            screenshots: uploadedScreenshotsList, 
            downloadUrl: mainLink,
            extraLinks: collectedExtraLinks, 
            tags: uploadedTagsList, 
            description: document.getElementById('pDescription').value.trim() || "No description provided."
        };

        if (mode === 'upload') {
            transactionalPackagePayload.uploaderUid = currentUser.uid;
            transactionalPackagePayload.uploaderName = userProfile.name;
            transactionalPackagePayload.timestamp = firebase.database.ServerValue.TIMESTAMP;
            transactionalPackagePayload.autoApproveTime = Date.now() + 60000; 
            transactionalPackagePayload.status = 'pending';
            transactionalPackagePayload.downloads = 0;
            transactionalPackagePayload.views = 0;
            transactionalPackagePayload.rating = 0;
            transactionalPackagePayload.totalRatingsCount = 0;
            transactionalPackagePayload.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

            db.ref('pending_apps').push(transactionalPackagePayload).then(() => {
                alert("App uploaded successfully! It will be live in 1 minute.");
                document.getElementById('dynamicAppFormModal').remove();
                if (typeof window.fetchMyUploadedApps === 'function') window.fetchMyUploadedApps();
            });
        } else if (mode === 'edit') {
            db.ref(`${currentEditingNode}/${currentEditingAppId}`).update(transactionalPackagePayload).then(() => {
                alert("Application Edited and Synchronized Successfully!");
                document.getElementById('dynamicAppFormModal').remove();
                if (typeof window.fetchMyUploadedApps === 'function') window.fetchMyUploadedApps();
                if (typeof window.loadStoreFeed === 'function') window.loadStoreFeed();
            });
        }
    };

    // ==========================================================================
    // 10. SYSTEM NOTIFICATIONS & BACKGROUND CONTROLLERS
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

            let html = '';
            let notices = [];
            snapshot.forEach(child => notices.push({id: child.key, ...child.val()}));
            notices.reverse();

            notices.forEach(note => {
                const alertClass = note.type === 'alert' ? 'system-alert' : '';
                let clickAction = "";
                let linkIndicator = "";
                
                if (note.link && note.link.trim() !== "") {
                    let safeUrl = note.link;
                    if (!/^https?:\/\//i.test(safeUrl) && !safeUrl.startsWith('details.html')) safeUrl = 'https://' + safeUrl;
                    clickAction = `onclick="window.open('${safeUrl}', '_blank')"`;
                    linkIndicator = `<i class="fas fa-external-link-alt" style="color:var(--primary); font-size:12px; float:right;"></i>`;
                }

                html += `
                    <div class="noti-card ${alertClass}" ${clickAction} style="cursor:pointer; border-color:var(--primary);">
                        <div class="noti-header">
                            <span class="noti-title"><i class="fas fa-bullhorn"></i> ${note.title} ${linkIndicator}</span>
                            <span class="noti-time">${note.timeString || "Recent"}</span>
                        </div>
                        <p class="noti-msg">${note.message}</p>
                    </div>
                `;
            });
            inbox.innerHTML = html;
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
                            db.ref(`store_apps/${child.key}`).set(appRecord).then(() => {
                                db.ref(`pending_apps/${child.key}`).remove();
                            });
                        }
                    });
                }
            });
        }, 15000); 
    }

    // ==========================================================================
    // 11. FETCH MY UPLOADS & DELETE LOGIC
    // ==========================================================================
    window.fetchMyUploadedApps = function() {
        const container = document.getElementById('myUploadsContainer');
        if (!currentUser || !container) return;

        container.innerHTML = `<div style="text-align:center; padding:30px;"><i class="fas fa-circle-notch fa-spin" style="color:var(--primary); font-size:24px;"></i><p style="margin-top:10px;">Scanning...</p></div>`;

        Promise.all([ db.ref('store_apps').once('value'), db.ref('pending_apps').once('value') ]).then(([storeSnap, pendingSnap]) => {
            let userApps = [];
            if (storeSnap.exists()) storeSnap.forEach(child => { if (child.val().uploaderUid === currentUser.uid) userApps.push({ id: child.key, node: 'store_apps', ...child.val() }); });
            if (pendingSnap.exists()) pendingSnap.forEach(child => { if (child.val().uploaderUid === currentUser.uid) userApps.push({ id: child.key, node: 'pending_apps', ...child.val() }); });

            if (userApps.length === 0) {
                container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-dim);"><i class="fas fa-box-open" style="font-size:35px; margin-bottom:10px; opacity:0.5;"></i><p>No uploads yet.</p></div>`;
                return;
            }

            let html = '';
            userApps.reverse().forEach(app => {
                const statusBadge = app.node === 'store_apps' ? `<span style="color:var(--success); font-size:10px; font-weight:bold; background:rgba(46,213,115,0.1); padding:2px 6px; border-radius:4px; border:1px solid rgba(46,213,115,0.2);">Live</span>` : `<span style="color:var(--warning); font-size:10px; font-weight:bold; background:rgba(255,165,0,0.1); padding:2px 6px; border-radius:4px; border:1px solid rgba(255,165,0,0.2);">Pending</span>`;
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

    window.deleteUserApp = function(appId, node) {
        if (confirm("Are you sure you want to permanently delete this app?")) {
            db.ref(`${node}/${appId}`).remove().then(() => {
                alert("App deleted successfully.");
                window.fetchMyUploadedApps();
                if (typeof window.loadStoreFeed === 'function') window.loadStoreFeed();
            });
        }
    };

    // ==========================================================================
    // 12. GLOBAL SEARCH (FIXED)
    // ==========================================================================
    function initializeGlobalSearch() {
        const searchInput = document.getElementById('storeSearchInput');
        if(!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            const grid = document.getElementById('searchResultGrid');
            if(!grid) return;

            if(query === '') {
                grid.innerHTML = `<div style="text-align: center; padding: 40px; grid-column: 1/-1; color: var(--text-secondary);"><i class="fas fa-search-plus" style="font-size: 40px; margin-bottom: 15px; color: var(--border-color);"></i><h3>Type any keyword to search</h3></div>`;
                return;
            }

            grid.innerHTML = `<div style="text-align:center; padding: 50px; grid-column: 1/-1;"><i class="fas fa-spinner fa-spin" style="font-size:32px; color:var(--primary);"></i><p style="margin-top:15px; color:var(--text-secondary); font-weight:500;">Searching...</p></div>`;

            db.ref('store_apps').orderByChild('status').equalTo('approved').once('value').then(snapshot => {
                if(!snapshot.exists()) { grid.innerHTML = `<div style="text-align:center; padding:50px; grid-column:1/-1; color:var(--text-secondary);">No apps found.</div>`; return; }

                let results = [];
                snapshot.forEach(child => {
                    let app = { id: child.key, ...child.val() };
                    let appName = (app.appName || "").toLowerCase();
                    let devName = (app.developerName || app.uploaderName || "").toLowerCase();
                    let tags = app.tags || [];
                    
                    let isMatch = false;
                    if(appName.includes(query) || devName.includes(query)) { isMatch = true; } 
                    else { for(let t of tags) { if(t.toLowerCase().includes(query)) { isMatch = true; break; } } }
                    if(isMatch) results.push(app);
                });

                if(results.length === 0) {
                    grid.innerHTML = `<div style="text-align:center; padding:50px; grid-column:1/-1; color:var(--text-secondary);"><i class="fas fa-box-open" style="font-size:40px; margin-bottom:15px; opacity:0.5;"></i><p>No results found for "${query}"</p></div>`;
                    return;
                }

                let html = '';
                results.forEach(app => {
                    const priceLabel = app.category === 'paid' ? `${app.coinPrice || 0} Coins` : (app.category === 'locked' ? 'LOCKED' : 'FREE');
                    const badgeClass = app.category === 'paid' ? 'badge-paid' : (app.category === 'locked' ? 'badge-locked' : 'badge-free');

                    html += `
                        <div class="app-card" onclick="window.location.href='details.html?id=${app.id}'">
                            <span class="badge ${badgeClass}">${priceLabel}</span>
                            <img src="${app.logoUrl}" class="app-icon-large" loading="lazy" onerror="this.src='https://via.placeholder.com/75/121212/00e6b8?text=FILE'">
                            <div class="app-info-list" style="width: 100%; word-wrap: break-word; white-space: normal;">
                                <h3 class="app-title-list" style="white-space: normal; overflow: visible; text-overflow: unset; line-height: 1.3; font-size: 17px;">${app.appName} <i class="fas fa-check-circle verified-tick" style="color:var(--primary); font-size:13px; margin-left:4px;"></i></h3>
                                <div class="app-dev-list">${app.developerName || app.uploaderName || "Developer"} • ${app.size || "0 MB"}</div>
                                <div class="app-meta-list">
                                    <span style="color:var(--primary); font-weight:700;"><i class="fas fa-arrow-alt-circle-down"></i> ${app.downloads || 0}</span>
                                    <span>v${app.version || "1.0"}</span>
                                </div>
                            </div>
                        </div>
                    `;
                });
                grid.innerHTML = html;
            });
        });
    }

    initializeGlobalSearch();
});
