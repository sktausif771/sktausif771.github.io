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
        
        if (coinDisplay) {
            coinDisplay.innerText = userProfile.coins !== undefined ? userProfile.coins : 0;
        }

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
        let loadingMsg = "Scanning Database Infrastructure...";
        if(activeLang === 'bn') loadingMsg = "ডাটাবেজ কানেকশন চেক করা হচ্ছে...";

        grid.innerHTML = `
            <div style="text-align:center; padding: 50px; grid-column: 1/-1;">
                <i class="fas fa-spinner fa-spin" style="font-size:32px; color:var(--primary);"></i>
                <p style="margin-top:15px; color:var(--text-secondary); font-weight:500;">${loadingMsg}</p>
            </div>
        `;

        db.ref('store_apps').once('value').then((snapshot) => {
            if (!snapshot.exists()) {
                grid.innerHTML = `<div style="text-align:center; padding:50px; grid-column:1/-1; color:var(--text-secondary);">No applications live in database catalog.</div>`;
                return;
            }

            let html = '';
            let appsList = [];
            
            snapshot.forEach((child) => {
                appsList.push({ id: child.key, ...child.val() });
            });
            
            appsList.reverse();

            appsList.forEach((app) => {
                let appType = app.appType || 'mod_app';
                let appCategory = app.category || 'free';
                
                let matchType = (appType === activeContentType);
                let matchFilter = false;

                if (activeFilterType === 'all') matchFilter = true;
                if (activeFilterType === 'premium' && appCategory === 'paid') matchFilter = true;
                if (activeFilterType === 'trending' && app.isTrending === true) matchFilter = true;

                if (matchType && matchFilter) {
                    const priceLabel = appCategory === 'paid' ? `${app.coinPrice || 0} Coins` : (appCategory === 'locked' ? 'LOCKED' : 'FREE');
                    const badgeClass = appCategory === 'paid' ? 'badge-paid' : (appCategory === 'locked' ? 'badge-locked' : 'badge-free');

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
        if(typeof window.loadStoreFeed === 'function') {
            window.loadStoreFeed('all', 'mod_app');
        }
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
        if (typeof generateAutoTags === 'function') generateAutoTags(); 
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
                html += `<span style="cursor:pointer; background:rgba(0,230,184,0.1); border:1px dashed var(--primary); margin-bottom:5px; padding:4px 10px; border-radius:6px; font-size:11px; color:var(--primary); display:inline-flex; align-items:center; gap:5px;" onclick="addSuggestedTag('${tag}')">${tag} <i class="fas fa-plus"></i></span>&nbsp;`;
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
    // 7. UNIFIED ADMIN-STYLE APP FORM GENERATOR (UPLOAD & EDIT) 
    //    100% IDENTICAL TO ADMIN PANEL DESIGN WITH DEDICATED MAIN LINK
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

        uploadedScreenshotsList = isEdit && appData.screenshots ? [...appData.screenshots] : [];
        uploadedTagsList = isEdit && appData.tags ? [...appData.tags] : [];
        currentEditingAppId = isEdit ? appData.id : null;
        currentEditingNode = isEdit ? appData.node : null;

        const aCat = appData.category || 'free';
        let categoryOptionsHTML = `<option value="free" ${aCat==='free'?'selected':''}>Free App</option>`;
        if (isMasterOwner) {
            categoryOptionsHTML += `<option value="paid" ${aCat==='paid'?'selected':''}>Premium</option>`;
            categoryOptionsHTML += `<option value="locked" ${aCat==='locked'?'selected':''}>Locked</option>`;
        }

        const modalHTML = `
            <div class="modal-overlay active" id="dynamicAppFormModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 2000;">
                <div class="play-modal" style="max-width: 650px; width: 95%; background: var(--bg-surface); border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 20px 50px rgba(0,0,0,0.7); max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;">
                    
                    <div class="modal-header" style="padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                        <h3 style="font-family: 'Orbitron', sans-serif; font-size: 16px; color: #fff; display:flex; align-items:center; gap:8px;">
                            <i class="${isEdit ? 'fas fa-edit' : 'fas fa-upload'}" style="color:var(--warning);"></i> ${isEdit ? 'Edit App' : 'Upload App'}
                        </h3>
                        <i class="fas fa-times close-modal" onclick="document.getElementById('dynamicAppFormModal').remove()" style="font-size: 20px; color: var(--text-secondary); cursor: pointer; transition: 0.3s;" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-secondary)'"></i>
                    </div>
                    
                    <div class="modal-body" style="padding: 20px; overflow-y: auto;">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                            <div>
                                <label class="input-label">App Title</label>
                                <input type="text" id="pName" class="glass-input" value="${appData.appName || ''}" onkeyup="generateAutoTags()" style="margin-bottom: 10px;">
                            </div>
                            <div>
                                <label class="input-label" style="color:var(--info);">Developer</label>
                                <input type="text" id="pDevName" class="glass-input" value="${appData.developerName || appData.uploaderName || ''}" style="margin-bottom: 10px;">
                            </div>
                        </div>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom: 10px;">
                            <div>
                                <label class="input-label">Version</label>
                                <input type="text" id="pVer" class="glass-input" value="${appData.version || ''}" style="margin-bottom: 0;">
                            </div>
                            <div>
                                <label class="input-label">Size</label>
                                <input type="text" id="pSize" class="glass-input" value="${appData.size || ''}" style="margin-bottom: 0;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom: 10px;">
                            <div>
                                <label class="input-label">App Tab</label>
                                <select id="pType" class="glass-input" style="margin-bottom: 0;">
                                    <option value="mod_app" ${(appData.appType==='mod_app'||!appData.appType)?'selected':''}>Mod App Tab</option>
                                    <option value="files" ${(appData.appType==='files')?'selected':''}>Files Tab</option>
                                </select>
                            </div>
                            <div>
                                <label class="input-label">Access Type</label>
                                <select id="pCat" class="glass-input" style="margin-bottom: 0;" onchange="toggleAccessTypeInputs(this.value)">
                                    ${categoryOptionsHTML}
                                </select>
                            </div>
                        </div>

                        <div id="coinPriceWrapper" style="display:${aCat==='paid'?'block':'none'}; margin-bottom: 10px;">
                            <label class="input-label" style="color:var(--warning);">Coin Price</label>
                            <input type="number" id="pCoinPrice" class="glass-input" placeholder="0" value="${appData.coinPrice || 0}" style="margin-bottom: 0;">
                        </div>
                        
                        <div id="videoLinkWrapper" style="display:${aCat==='locked'?'block':'none'}; margin-bottom: 10px;">
                            <label class="input-label" style="color:var(--danger);">Video Link</label>
                            <input type="text" id="pVideoLink" class="glass-input" placeholder="YouTube/Video URL" value="${appData.videoLink || ''}" style="margin-bottom: 0;">
                        </div>

                        <div style="display:flex; align-items: center; gap: 10px; margin-bottom: 15px; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; border: 1px dashed var(--border-color);">
                            <input type="checkbox" id="pTrendingCheck" style="width: 16px; height: 16px; accent-color: var(--primary);" ${appData.isTrending?'checked':''}>
                            <label for="pTrendingCheck" style="color: #fff; font-size: 13px; cursor: pointer;">Trending App</label>
                            
                            <input type="checkbox" id="pPushNotificationCheck" style="width: 16px; height: 16px; accent-color: var(--primary); margin-left: 15px;" ${appData.sendNotification?'checked':''}>
                            <label for="pPushNotificationCheck" style="color: var(--success); font-size: 13px; cursor: pointer;">Send Notification</label>
                        </div>

                        <div style="margin-bottom: 15px; text-align: center; background:rgba(0,0,0,0.2); padding:15px; border-radius:8px; border:1px solid var(--border-color);">
                            <label class="input-label" style="color:var(--primary); text-align:left;">App Logo</label>
                            <div style="position:relative; display:inline-block;">
                                <img id="logoPreviewImg" src="${appData.logoUrl || ''}" style="width:80px; height:80px; border-radius:12px; object-fit:cover; border:2px solid var(--border-color); background:rgba(0,0,0,0.5); display: ${appData.logoUrl ? 'block' : 'none'};">
                                
                                <div id="logoPlaceholder" style="width:80px; height:80px; border-radius:12px; border:2px dashed var(--primary); background:rgba(0,230,184,0.05); display:${appData.logoUrl ? 'none' : 'flex'}; align-items:center; justify-content:center; color:var(--primary); font-size:24px; cursor:pointer; transition:0.3s;"><i class="fas fa-plus"></i></div>

                                <label for="logoFile" style="position:absolute; bottom:-5px; right:-5px; background:var(--primary); width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#000; box-shadow:0 2px 10px rgba(0,0,0,0.5); transition:0.2s;">
                                    <i class="fas fa-plus"></i>
                                </label>
                                <input type="file" id="logoFile" accept="image/*" style="display:none;">
                                <input type="hidden" id="logoUrlOutput" value="${appData.logoUrl || ''}">
                            </div>
                            <p id="logoProcessStatus" style="font-size:11px; color:var(--warning); margin-top:10px; font-family:monospace;"></p>
                        </div>

                        <label class="input-label" style="color:var(--primary);">Screenshots (Max 5)</label>
                        <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom:15px;">
                            <div class="screenshot-upload-wrapper" id="screenshotPreviewWrapper">
                                <label id="scUploadLabel" class="sc-plus-btn" for="screenshotFileBtn"><i class="fas fa-plus"></i></label>
                            </div>
                            <input type="file" id="screenshotFileBtn" accept="image/*" style="display:none;">
                            <p id="screenshotProcessStatus" style="font-size:11px; color:var(--warning); margin-top:5px; font-family:monospace;"></p>
                        </div>

                        <label class="input-label">Search Tags (Comma separated)</label>
                        <div id="suggestedTagsContainer" style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:10px;"></div>
                        <div class="tags-container" id="tagsInputContainer">
                            <input type="text" id="tagInputField" class="tag-input-field" placeholder="Add tags...">
                        </div>

                        <label class="input-label" style="color:var(--primary);">Main Download Link</label>
                        <input type="text" id="pMainLink" class="glass-input" placeholder="Direct Download URL" value="${appData.downloadUrl || ''}" style="margin-bottom: 15px;">

                        <label class="input-label" style="color:var(--info);">Extra Links (Max 5)</label>
                        <div id="dynamicLinksContainer" style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 10px; display: flex; flex-direction: column;">
                        </div>
                        <button id="addMoreLinkBtn" class="btn-primary" style="background:transparent; border:1px dashed var(--info); color:var(--info); margin-bottom:15px;" onclick="addNewLinkRow()"><i class="fas fa-plus"></i> Add Extra Link</button>

                        <label class="input-label">App Description</label>
                        <textarea id="pDescription" class="glass-input" style="min-height:90px; resize:vertical; line-height: 1.5; font-size: 13px;">${appData.description || ''}</textarea>
                        
                        <button id="executePublishBtn" class="btn-primary" style="background:linear-gradient(135deg, var(--warning), #FF8F00); color:#000; margin-top: 5px;" onclick="submitAppFormData('${mode}')">
                            <i class="${isEdit ? 'fas fa-save' : 'fas fa-cloud-upload-alt'}"></i> ${isEdit ? 'SAVE CHANGES' : 'UPLOAD APP'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        initializeTagsInputEngine();
        renderScreenshotsUI();

        const linkContainer = document.getElementById('dynamicLinksContainer');
        linkContainer.innerHTML = '';
        
        // Populate Extra Links Only
        if (appData.extraLinks && Array.isArray(appData.extraLinks)) {
            appData.extraLinks.forEach(link => { 
                addNewLinkRow(link.title, link.url); 
            });
        }

        document.getElementById('logoFile').addEventListener('change', (e) => processLogoUploadAction(e.target.files[0]));
        document.getElementById('screenshotFileBtn').addEventListener('change', (e) => processScreenshotUploadAction(e.target.files[0]));
        
        const placeholder = document.getElementById('logoPlaceholder');
        if(placeholder) {
            placeholder.addEventListener('click', () => {
                document.getElementById('logoFile').click();
            });
        }
    }

    window.toggleAccessTypeInputs = function(value) {
        const coinWrap = document.getElementById('coinPriceWrapper');
        const vidWrap = document.getElementById('videoLinkWrapper');
        if(coinWrap) coinWrap.style.display = (value === 'paid') ? 'block' : 'none';
        if(vidWrap) vidWrap.style.display = (value === 'locked') ? 'block' : 'none';
    };

    // Modified to handle only Extra Links
    window.addNewLinkRow = function(title = '', url = '') {
        const container = document.getElementById('dynamicLinksContainer');
        const rows = container.querySelectorAll('.dynamic-link-row').length;
        if (rows >= 5) { alert("Maximum 5 extra links allowed."); return; }
        
        const newRow = document.createElement('div');
        newRow.className = 'dynamic-link-row';
        newRow.style.cssText = 'display:flex; gap:10px; margin-top:12px;';
        newRow.innerHTML = `
            <input type="text" class="glass-input ex-link-title" placeholder="Title (e.g. Server 1)" value="${title}" style="margin-bottom:0; flex:1;">
            <input type="text" class="glass-input ex-link-url" placeholder="Extra Link URL" value="${url}" style="margin-bottom:0; flex:2;">
        `;
        container.appendChild(newRow);
        if (rows + 1 >= 5) { document.getElementById('addMoreLinkBtn').style.display = 'none'; }
    };

    // ==========================================================================
    // 8. CUSTOM UI IMAGE UPLOAD HANDLERS
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
                document.getElementById('logoPlaceholder').style.display = 'none';
                const previewImg = document.getElementById('logoPreviewImg');
                previewImg.src = json.data.url;
                previewImg.style.display = 'block';
                status.innerText = "Logo Added Successfully!";
                status.style.color = "var(--success)";
                setTimeout(()=> status.innerText='', 3000);
            } else { status.innerText = "Logo Upload failed."; status.style.color = "var(--danger)"; }
            document.getElementById('logoFile').value = '';
        }).catch(() => { status.innerText = "Network error."; status.style.color = "var(--danger)"; });
    };

    window.processScreenshotUploadAction = function(file) {
        if(!file) return;
        if (uploadedScreenshotsList.length >= 5) { alert("Maximum 5 screenshots allowed."); return; }
        
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
                setTimeout(()=> status.innerText='', 3000);
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
            box.style.cssText = 'position:relative; width:70px; height:110px; flex-shrink:0;';
            box.innerHTML = `
                <img src="${url}" style="width:100%; height:100%; border-radius:12px; object-fit:cover; border:1px solid var(--border-color);">
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
        
        let collectedLinks = [];
        const container = document.getElementById('dynamicLinksContainer');
        const titles = container.querySelectorAll('.ex-link-title');
        const urls = container.querySelectorAll('.ex-link-url');

        // Loop for extra links ONLY
        for(let i = 0; i < urls.length; i++) {
            let tVal = titles[i].value.trim();
            let uVal = urls[i].value.trim();
            if(uVal !== "") {
                collectedLinks.push({ title: tVal || `Extra Link ${i + 1}`, url: uVal });
            }
        }

        if (!name || mainLink === "") {
            alert("App Name and Main Download Link are required."); return;
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
            downloadUrl: mainLink, // Assigned from dedicated input
            extraLinks: collectedLinks, // Assigned from extra links dynamic array
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
                    <div style="display:flex; align-items:center; gap:12px; background:rgba(0,0,0,0.2); margin-bottom:12px; padding:12px; border-radius:12px; border:1px solid var(--border-color);">
                        <img src="${app.logoUrl}" style="width:48px; height:48px; border-radius:10px; object-fit:cover; border:1px solid var(--border-color);">
                        <div style="flex:1; overflow:hidden;">
                            <h4 style="font-size:14px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px;">${app.appName}</h4>
                            <p style="font-size:12px; color:var(--text-secondary); display:flex; align-items:center; gap:8px;">v${app.version} • ${statusBadge}</p>
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
    // 12. GLOBAL SEARCH
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

            db.ref('store_apps').once('value').then(snapshot => {
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
