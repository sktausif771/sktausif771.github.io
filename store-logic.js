/* ==========================================================================
   MVX STORE V5.5 - CORE DATA ENGINE & ADVANCED UPLOAD PROTOCOL (ENGLISH ONLY)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Firebase Security Verification Check
    if (typeof firebase === 'undefined') {
        console.error("Firebase Core SDK Critical Error: Architecture links dropped.");
        return;
    }

    const db = firebase.database();
    const auth = firebase.auth();
    
    // Global Engine Scope Variables
    let currentUser = null;
    let userProfile = null;
    let activeContentType = 'files'; // Defaults window route
    let activeFilterType = 'all';    // Defaults catalog grid

    // Your Explicit ImgBB API Cloud Authentication Token Key
    const IMGBB_API_KEY = "820eb9aa6a57f863045a52c1929efc9c"; 

    // ==========================================================================
    // 1. GLOBAL STORE BRAND LOGO SYNCHRONIZER
    // ==========================================================================
    db.ref('settings/storeLogo').on('value', (snapshot) => {
        const logoImg = document.getElementById('mainStoreLogo');
        if (logoImg && snapshot.exists() && snapshot.val().trim() !== "") {
            logoImg.src = snapshot.val();
        }
    });

    // ==========================================================================
    // 2. AUTH STATE TRIGGER & BACKGROUND CONTROLLERS
    // ==========================================================================
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            
            // Realtime user account profile tracking sync channel
            db.ref('users/' + user.uid).on('value', (snapshot) => {
                if (snapshot.exists()) {
                    userProfile = snapshot.val();
                    executeSystemInterfacePipelineUpdates();
                }
            });

            // Launch backend structural cron simulators
            runSystemAutoApproveEngine();
            listenForLiveSystemNotifications();
        }
    });

    // ==========================================================================
    // 3. SYSTEM INTERFACE PIPELINE ELEMENTS MANAGER
    // ==========================================================================
    function executeSystemInterfacePipelineUpdates() {
        if (!userProfile) return;

        // Populate elements inside user dashboard tab
        const tabName = document.getElementById('youTabName');
        const tabEmail = document.getElementById('youTabEmail');
        const tabAvatar = document.getElementById('youTabAvatar');
        const coinDisplay = document.getElementById('navCoinDisplay');
        const followersCount = document.getElementById('userFollowersCount');
        const followingCount = document.getElementById('userFollowingCount');

        if (tabName) tabName.innerText = userProfile.name || "MVX User";
        if (tabEmail) tabEmail.innerText = userProfile.email || "";
        if (coinDisplay) coinDisplay.innerText = userProfile.coins || 0;
        if (followersCount) followersCount.innerText = userProfile.followers || 0;
        if (followingCount) followingCount.innerText = userProfile.following || 0;
        
        if (tabAvatar) {
            tabAvatar.src = userProfile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.name}`;
        }

        // Role-Based Hidden System Element Control (Strict Master Owner Override)
        const ownerLogoSection = document.getElementById('ownerLogoEditSection');
        if (userProfile.role === 'owner') {
            if (ownerLogoSection) ownerLogoSection.style.display = 'block';
        }

        // Initialize primary live stream rendering feed fetch data
        loadStoreFeed(activeFilterType, activeContentType);
    }

    // ==========================================================================
    // 4. PLAY STORE DATA RENDERING GRID (MULTILINGUAL AND FILTER ALIGNED)
    // ==========================================================================
    window.loadStoreFeed = function(filter, contentType) {
        activeFilterType = filter || activeFilterType;
        activeContentType = contentType || activeContentType;

        const grid = document.getElementById('storeAppGrid');
        if (!grid) return;

        let activeLang = localStorage.getItem('mvx_lang') || 'en';
        let loadingMsg = (activeLang === 'en') ? "Scanning Database Infrastructure..." : "ডাটাবেজ কানেকশন চেক করা হচ্ছে...";

        grid.innerHTML = `
            <div style="text-align:center; padding: 50px; grid-column: 1/-1;">
                <i class="fas fa-spinner fa-spin" style="font-size:32px; color:var(--primary);"></i>
                <p style="margin-top:15px; color:var(--text-secondary); font-weight:500;">${loadingMsg}</p>
            </div>
        `;

        db.ref('store_apps').orderByChild('status').equalTo('approved').once('value').then((snapshot) => {
            if (!snapshot.exists()) {
                grid.innerHTML = `<div style="text-align:center; padding:50px; grid-column:1/-1; color:var(--text-secondary);">No applications live in database database.</div>`;
                return;
            }

            let html = '';
            let appsList = [];
            
            snapshot.forEach((child) => {
                appsList.push({ id: child.key, ...child.val() });
            });
            
            // Sort database nodes by timestamp descending order
            appsList.reverse();

            appsList.forEach((app) => {
                let matchType = (app.appType === activeContentType);
                let matchFilter = false;

                if (activeFilterType === 'all') matchFilter = true;
                if (activeFilterType === 'premium' && app.category === 'paid') matchFilter = true;
                if (activeFilterType === 'trending' && (app.views || 0) >= 100) matchFilter = true;

                if (matchType && matchFilter) {
                    const priceLabel = app.category === 'paid' ? `${app.coinPrice || 0} Coins` : 'FREE';
                    const badgeClass = app.category === 'paid' ? 'badge-paid' : 'badge-free';

                    html += `
                        <div class="app-card" onclick="window.location.href='details.html?id=${app.id}'">
                            <span class="badge ${badgeClass}">${priceLabel}</span>
                            <img src="${app.logoUrl}" class="app-icon-large" loading="lazy" onerror="this.src='https://via.placeholder.com/75/121212/00e6b8?text=FILE'">
                            <div class="app-info-list">
                                <h3 class="app-title-list">${app.appName}</h3>
                                <div class="app-dev-list">${app.uploaderName || "Developer"} • ${app.size || "0 MB"}</div>
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

    // Category Chip OnClick Event Iterations
    document.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            loadStoreFeed(e.target.getAttribute('data-filter'), activeContentType);
        });
    });

    // ==========================================================================
    // 5. SMART TAGS FIELD ARRAY CONTROLLER CONTEXT
    // ==========================================================================
    let uploadedTagsList = [];
    
    function initializeTagsInputEngine() {
        const input = document.getElementById('tagInputField');
        const container = document.getElementById('tagsInputContainer');
        if(!input || !container) return;

        uploadedTagsList = []; // Clean instance array allocations

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

    // ==========================================================================
    // 6. MASTER PLAY STORE APPLICATION PUBLISH MODAL FORM LAYOUT
    // ==========================================================================
    window.openUploadModal = function() {
        if (!userProfile) return;

        const isMasterOwner = (userProfile.role === 'owner');
        const paidOptionHTML = isMasterOwner ? `<option value="paid">PREMIUM COIN ACCESS (Owner Verified)</option>` : `<option value="free" disabled>PREMIUM ACCESS (Master Owner Clearance Required)</option>`;

        let uploadModal = document.createElement('div');
        uploadModal.id = 'dynamicUploadModal';
        uploadModal.className = 'modal-overlay active';
        uploadModal.innerHTML = `
            <div class="play-modal" style="max-width: 580px;">
                <div class="modal-header">
                    <h3><i class="fas fa-upload" style="color:var(--primary);"></i> Core Package Publisher</h3>
                    <i class="fas fa-times close-modal" onclick="document.getElementById('dynamicUploadModal').remove()"></i>
                </div>
                <div class="modal-body">
                    <p style="font-size:12px; color:var(--text-secondary); margin-bottom:15px; background:rgba(255,255,255,0.02); padding:10px; border-radius:6px; border:1px solid var(--border-color);">
                        <i class="fas fa-history"></i> NOTICE: Submissions default to queue logic. Unchecked payloads auto-deploy to store maps after exactly 1 hour.
                    </p>

                    <label class="modal-label">Application Title / File Name</label>
                    <input type="text" id="pName" class="play-input" placeholder="e.g. Free Fire Hack Menu">

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div>
                            <label class="modal-label">Version</label>
                            <input type="text" id="pVer" class="play-input" placeholder="e.g. v1.99.X">
                        </div>
                        <div>
                            <label class="modal-label">File Size</label>
                            <input type="text" id="pSize" class="play-input" placeholder="e.g. 85 MB">
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div>
                            <label class="modal-label">Target Layout Tab</label>
                            <select id="pType" class="play-input">
                                <option value="files">FILES (Bottom Tab 1)</option>
                                <option value="mod_app">MOD APP (Bottom Tab 2)</option>
                            </select>
                        </div>
                        <div>
                            <label class="modal-label">Access Model</label>
                            <select id="pCat" class="play-input" onchange="toggleCoinPriceInputBoxField(this.value)">
                                <option value="free">FREE ACCESS MODEL</option>
                                ${paidOptionHTML}
                            </select>
                        </div>
                    </div>

                    <div id="coinPriceWrapper" style="display:none;">
                        <label class="modal-label" style="color:var(--warning);">Unlock Charge Pricing (In MVX Coins)</label>
                        <input type="number" id="pCoinPrice" class="play-input" placeholder="e.g. 150" value="0">
                    </div>

                    <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

                    <label class="modal-label" style="color:var(--primary);">Logo Image Encoding Method</label>
                    <select id="logoMethod" class="play-input" onchange="toggleUploadMethodInputsStructure('logo', this.value)">
                        <option value="imgbb">ImgBB Cloud API Method (Standard High Speed)</option>
                        <option value="base64">Base64 Direct Raw Byte Hex String Method</option>
                    </select>

                    <div id="logoFileBox">
                        <input type="file" id="logoFile" class="play-input" accept="image/*" style="padding:10px;">
                    </div>
                    <input type="text" id="logoUrlOutput" class="play-input" placeholder="Cloud Storage Token Asset Path Address" readonly>
                    <p id="logoProcessStatus" style="font-size:11px; color:var(--warning); margin-top:-15px; margin-bottom:15px;"></p>

                    <label class="modal-label" style="color:var(--primary);">Banner Display Image Encoding Method</label>
                    <select id="bannerMethod" class="play-input" onchange="toggleUploadMethodInputsStructure('banner', this.value)">
                        <option value="imgbb">ImgBB Cloud API Method (Standard High Speed)</option>
                        <option value="base64">Base64 Direct Raw Byte Hex String Method</option>
                    </select>

                    <div id="bannerFileBox">
                        <input type="file" id="bannerFile" class="play-input" accept="image/*" style="padding:10px;">
                    </div>
                    <input type="text" id="bannerUrlOutput" class="play-input" placeholder="Cloud Storage Token Asset Path Address" readonly>
                    <p id="bannerProcessStatus" style="font-size:11px; color:var(--warning); margin-top:-15px; margin-bottom:15px;"></p>

                    <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

                    <label class="modal-label">Main Secure Download Endpoint URL Link</label>
                    <input type="text" id="pMainLink" class="play-input" placeholder="https://mediafire.com/file/download_hash">

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div>
                            <label class="modal-label">Custom Action Label Name</label>
                            <input type="text" id="pAltName" class="play-input" placeholder="e.g. Get Verification Key">
                        </div>
                        <div>
                            <label class="modal-label">Action Redirection URL Link</label>
                            <input type="text" id="pAltUrl" class="play-input" placeholder="https://linkvertise.com/bypass_route">
                        </div>
                    </div>

                    <label class="modal-label">Archive Unzip Cryptographic Password</label>
                    <input type="text" id="pPassword" class="play-input" placeholder="Leave parameter blank if package has no unzip password">

                    <label class="modal-label">Fuzzy Search Target Keywords (Type Comma ',' to link item tag)</label>
                    <div class="tags-container" id="tagsInputContainer">
                        <input type="text" id="tagInputField" class="tag-input-field" placeholder="Add keywords...">
                    </div>

                    <label class="modal-label">Application Description Documentation & Changeglog</label>
                    <textarea id="pDescription" class="play-input" placeholder="Document feature releases, setup steps, or injector anti-ban safety parameters..." style="min-height:100px; resize:vertical;"></textarea>

                    <button class="play-btn" id="executePublishBtn" onclick="commitPackageToPendingDatabaseNode()">SUBMIT FOR PROCESSING AND DEPLOYMENT</button>
                </div>
            </div>
        `;
        document.body.appendChild(uploadModal);

        // Bind core tags script interface listeners
        initializeTagsInputEngine();

        // Establish operational change streams listeners
        document.getElementById('logoFile').addEventListener('change', (e) => executeBinaryAssetProcessingStream(e.target.files[0], 'logoMethod', 'logoUrlOutput', 'logoProcessStatus'));
        document.getElementById('bannerFile').addEventListener('change', (e) => executeBinaryAssetProcessingStream(e.target.files[0], 'bannerMethod', 'bannerUrlOutput', 'bannerProcessStatus'));
    };

    window.toggleCoinPriceInputBoxField = function(value) {
        document.getElementById('coinPriceWrapper').style.display = (value === 'paid') ? 'block' : 'none';
    };

    window.toggleUploadMethodInputsStructure = function(type, method) {
        const output = document.getElementById(`${type}UrlOutput`);
        if (method === 'base64') {
            output.removeAttribute('readonly');
            output.placeholder = "Inject direct Base64 stream data text sequence raw character block here...";
        } else {
            output.setAttribute('readonly', 'true');
            output.placeholder = "Link will generate automatically via ImgBB...";
        }
        output.value = '';
    };

    // ==========================================================================
    // 7. CORE BINARY CONVERTER & CLOUD API ENGINE (DUAL METHOD INTEGRITY)
    // ==========================================================================
    function executeBinaryAssetProcessingStream(file, methodSelectId, outputInputId, statusParaId) {
        if (!file) return;

        const method = document.getElementById(methodSelectId).value;
        const output = document.getElementById(outputInputId);
        const status = document.getElementById(statusParaId);

        status.innerText = "Processing system binary streams. Awaiting buffer data allocation...";
        status.style.color = "var(--warning)";

        if (method === 'base64') {
            const reader = new FileReader();
            reader.onload = function(e) {
                output.value = e.target.result;
                status.innerText = "Base64 Byte String Character Hex Stream Processing Success!";
                status.style.color = "var(--success)";
            };
            reader.onerror = () => { 
                status.innerText = "Fatal stream reader fault. Encoding failed."; 
                status.style.color = "var(--danger)"; 
            };
            reader.readAsDataURL(file);
        } else {
            const formData = new FormData();
            formData.append("image", file);

            fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            })
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    output.value = json.data.url;
                    status.innerText = "Cloud Platform Asset Sync Complete: URL Created.";
                    status.style.color = "var(--success)";
                } else {
                    status.innerText = "Cloud upload request rejected. Server drop error token.";
                    status.style.color = "var(--danger)";
                }
            })
            .catch(() => {
                status.innerText = "Network transmission interrupt pipeline dropped. Upload halted.";
                status.style.color = "var(--danger)";
            });
        }
    }

    // ==========================================================================
    // 8. DATABASE COMMIT PACKAGES CONTROLLER
    // ==========================================================================
    window.commitPackageToPendingDatabaseNode = function() {
        const name = document.getElementById('pName').value.trim();
        const mainLink = document.getElementById('pMainLink').value.trim();
        const logoData = document.getElementById('logoUrlOutput').value.trim();
        const bannerData = document.getElementById('bannerUrlOutput').value.trim();

        if (!name || !mainLink) {
            alert("Upload Terminated: Packagename and main endpoint link path strings are non-negotiable parameters.");
            return;
        }

        const btn = document.getElementById('executePublishBtn');
        btn.innerText = "WRITING TRANSACTION TO NETWORKS...";
        btn.disabled = true;

        const transactionalPackagePayload = {
            appName: name,
            version: document.getElementById('pVer').value.trim() || "1.0.0",
            size: document.getElementById('pSize').value.trim() || "0 MB",
            appType: document.getElementById('pType').value,
            category: document.getElementById('pCat').value,
            coinPrice: parseInt(document.getElementById('pCoinPrice').value) || 0,
            logoUrl: logoData || "https://via.placeholder.com/150/121212/00e6b8?text=APP",
            bannerUrl: bannerData || "https://via.placeholder.com/500x250/121212/00e6b8?text=BANNER",
            downloadUrl: mainLink,
            altLinkName: document.getElementById('pAltName').value.trim(),
            altLinkUrl: document.getElementById('pAltUrl').value.trim(),
            zipPassword: document.getElementById('pPassword').value.trim(),
            tags: uploadedTagsList, 
            description: document.getElementById('pDescription').value.trim() || "System Description Data Block Uninitialized.",
            uploaderUid: currentUser.uid,
            uploaderName: userProfile.name,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            autoApproveTime: Date.now() + 3600000, // Exactly 1 hour safety offset window block 
            status: 'pending',
            downloads: 0,
            views: 0
        };

        db.ref('pending_apps').push(transactionalPackagePayload).then(() => {
            alert("Package transaction committed to holding staging queues successfully. If no validation actions occur from administrators, the system will auto-deploy the payload in exactly 1 hour.");
            document.getElementById('dynamicUploadModal').remove();
        }).catch((err) => {
            alert("Database interface fault exception: " + err.message);
            btn.innerText = "SUBMIT FOR PROCESSING AND DEPLOYMENT";
            btn.disabled = false;
        });
    };

    // ==========================================================================
    // 9. LIVE BROADCAST INBOX CHANNEL SYNCHRONIZER
    // ==========================================================================
    function listenForLiveSystemNotifications() {
        const inbox = document.getElementById('notificationInboxDisplay');
        const badge = document.getElementById('notiAlert');
        
        db.ref('system_broadcasts').on('value', (snapshot) => {
            if(!inbox) return;
            if(!snapshot.exists()) {
                inbox.innerHTML = `<div class="empty-msg">No structural notices live inside system channel nodes.</div>`;
                return;
            }

            if(badge) badge.style.display = 'block'; 

            let html = '';
            let notices = [];
            snapshot.forEach(child => notices.push({id: child.key, ...child.val()}));
            notices.reverse();

            notices.forEach(note => {
                const alertClass = note.type === 'alert' ? 'system-alert' : '';
                html += `
                    <div class="noti-card ${alertClass}">
                        <div class="noti-header">
                            <span class="noti-title"><i class="fas fa-bullhorn"></i> ${note.title}</span>
                            <span class="noti-time">${note.timeString || "Recent"}</span>
                        </div>
                        <p class="noti-msg">${note.message}</p>
                    </div>
                `;
            });
            inbox.innerHTML = html;
        });
    }

    // ==========================================================================
    // 10. SYSTEM NOTIFICATION ADMIN BROADCAST INTERFACE DISPATCHER
    // ==========================================================================
    window.executeNotificationBroadcast = function() {
        const title = document.getElementById('notiPushTitle').value.trim();
        const msg = document.getElementById('notiPushMessage').value.trim();
        const type = document.getElementById('notiPushType').value;

        if(!title || !msg) {
            alert("Notice broadcast content bounds violation. Execution dropped.");
            return;
        }

        const date = new Date();
        const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + " | " + date.toLocaleDateString();

        db.ref('system_broadcasts').push({
            title: title,
            message: msg,
            type: type,
            timeString: timeStr,
            sender: userProfile.name,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            alert("Broadcast signal successfully dispatched across global framework hooks.");
            document.getElementById('adminNotiModal').classList.remove('active');
            document.getElementById('notiPushTitle').value = '';
            document.getElementById('notiPushMessage').value = '';
        });
    };

    // ==========================================================================
    // 11. CRON TIMEOUT CRITICAL SIMULATOR ENGINE (1-HOUR RESOLUTION LOOKUP)
    // ==========================================================================
    function runSystemAutoApproveEngine() {
        setInterval(() => {
            db.ref('pending_apps').once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    const currentTimeStamp = Date.now();
                    snapshot.forEach((child) => {
                        let appRecord = child.val();
                        
                        if (currentTimeStamp >= appRecord.autoApproveTime) {
                            appRecord.status = 'approved';
                            appRecord.approvedBy = 'System-Auto';
                            appRecord.approvedAt = firebase.database.ServerValue.TIMESTAMP;

                            db.ref(`store_apps/${child.key}`).set(appRecord).then(() => {
                                db.ref(`pending_apps/${child.key}`).remove();
                                console.log(`[STAGING CONTROL LOG]: Target threshold saturated. Automated layout deployment successful for node: ${appRecord.appName}`);
                            });
                        }
                    });
                }
            });
        }, 180000); // Evaluates structural state map loops every 3 minutes
    }

    window.processOwnerStoreLogoChange = function(logoUrl) {
        if(userProfile && userProfile.role === 'owner' && logoUrl.trim() !== "") {
            db.ref('settings').update({ storeLogo: logoUrl.trim() });
        }
    };
});
