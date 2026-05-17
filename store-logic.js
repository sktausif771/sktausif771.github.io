/* ==========================================================================
   MVX STORE V4.0 - ADVANCED STORE LOGIC & ECONOMY ENGINE
   ==========================================================================
   - Real-time Store Feed Rendering
   - Dynamic Upload System with Limit Checking
   - Coin & Economy Rewards Engine
   - App Details Fetching & Deep Linking
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // Safety check for Firebase Initialization
    if (typeof firebase === 'undefined') {
        console.error("Firebase SDK not loaded. Store Logic halted.");
        return;
    }

    const db = firebase.database();
    const auth = firebase.auth();
    
    // Global State
    let currentUser = null;
    let userProfile = null;

    // Listen for Auth State
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            fetchUserProfile(user.uid);
        }
    });

    // ==========================================================================
    // 1. USER PROFILE & ECONOMY FETCHING
    // ==========================================================================
    function fetchUserProfile(uid) {
        db.ref('users/' + uid).on('value', (snapshot) => {
            if (snapshot.exists()) {
                userProfile = snapshot.val();
                
                // Update UI elements if they exist
                const coinDisplay = document.getElementById('navCoinDisplay');
                if(coinDisplay) coinDisplay.innerText = userProfile.coins || 0;

                const sidebarName = document.getElementById('sidebarName');
                if(sidebarName) sidebarName.innerText = userProfile.name || 'MVX User';

                const sidebarUID = document.getElementById('sidebarUID');
                if(sidebarUID) sidebarUID.innerText = `UID: ${uid.substring(0, 8).toUpperCase()}`;

                // Verified Badge Logic
                const sidebarBadge = document.getElementById('sidebarBadge');
                if(sidebarBadge) {
                    if(userProfile.verified) {
                        sidebarBadge.style.display = 'inline-flex';
                    } else {
                        sidebarBadge.style.display = 'none';
                    }
                }
            }
        });
    }

    // ==========================================================================
    // 2. STORE FEED & FILTERING LOGIC (HOME PAGE)
    // ==========================================================================
    window.filterStoreData = function(type) {
        const feedGrid = document.getElementById('mainFeedGrid');
        if(!feedGrid) return;

        feedGrid.innerHTML = `
            <div style="text-align:center; padding: 40px; width: 100%; grid-column: 1/-1;">
                <div class="spinner" style="margin: 0 auto;"></div>
                <p style="color:#00e6b8; margin-top:15px; font-family:'Orbitron', sans-serif;">SCANNING DATABASE...</p>
            </div>
        `;

        // Fetch Approved Apps Only
        db.ref('store_apps').orderByChild('status').equalTo('approved').once('value')
        .then((snapshot) => {
            if(!snapshot.exists()) {
                feedGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3>No ${type.toUpperCase()} Applications Found</h3>
                    </div>`;
                return;
            }

            let appsHTML = '';
            let count = 0;

            // Reverse for newest first
            const appsList = [];
            snapshot.forEach(child => { appsList.push({ id: child.key, ...child.val() }); });
            appsList.reverse();

            appsList.forEach(app => {
                if(app.category.toLowerCase() === type.toLowerCase()) {
                    count++;
                    const isNew = (Date.now() - app.timestamp) < (3 * 24 * 60 * 60 * 1000); // Under 3 days
                    const badgeHTML = isNew ? `<span class="badge" style="position:absolute; top:10px; right:10px; background:#ff003c; color:#fff;">NEW</span>` : '';
                    
                    appsHTML += `
                        <div class="yt-card" onclick="window.location.href='details.html?id=${app.id}'" style="background: rgba(15,23,42,0.8); border: 1px solid rgba(0,230,184,0.2); border-radius: 15px; overflow:hidden; cursor:pointer; transition:0.3s;">
                            <div style="position:relative; height: 160px; background:#000;">
                                ${badgeHTML}
                                <span style="position:absolute; bottom:10px; left:10px; background:rgba(0,0,0,0.7); color:#00e6b8; padding:3px 10px; border-radius:5px; font-family:'Orbitron', sans-serif; font-size:10px; font-weight:bold;"><i class="fas fa-star"></i> ${app.accessType.toUpperCase()}</span>
                                <img src="${app.bannerUrl}" style="width:100%; height:100%; object-fit:cover; opacity:0.8; transition:0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            </div>
                            <div style="padding: 15px; display:flex; gap:15px; align-items:center;">
                                <img src="${app.logoUrl}" style="width:50px; height:50px; border-radius:12px; border:2px solid #334155;">
                                <div style="flex:1; overflow:hidden;">
                                    <h3 style="color:#fff; font-size:16px; font-family:'Orbitron', sans-serif; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${app.appName}</h3>
                                    <p style="color:#94a3b8; font-size:12px; font-weight:600;">v${app.version} • ${app.size} • <i class="fas fa-download"></i> ${app.downloads || 0}</p>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            if(count === 0) {
                feedGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-ghost" style="font-size:40px; color:#334155; margin-bottom:15px;"></i>
                        <h3>No ${type.toUpperCase()} Applications Yet</h3>
                    </div>`;
            } else {
                feedGrid.innerHTML = appsHTML;
            }
        });
    };

    // Auto-load FREE apps if on home page
    if(document.getElementById('mainFeedGrid')) {
        setTimeout(() => window.filterStoreData('free'), 1000);
    }

    // ==========================================================================
    // 3. UPLOAD SYSTEM (DYNAMIC MODAL & LIMIT CHECK)
    // ==========================================================================
    window.openUploadDashboard = function() {
        if(!currentUser || !userProfile) {
            alert("⚠️ SYSTEM ERROR: User profile not loaded. Please login again.");
            return;
        }

        // Limit Check Logic
        const maxLimit = userProfile.uploadLimit || 5; 
        const currentUploads = userProfile.uploadCount || 0;

        if(currentUploads >= maxLimit && userProfile.role !== 'owner' && userProfile.role !== 'admin') {
            alert(`⚠️ UPLOAD LIMIT REACHED: You have reached your limit of ${maxLimit} uploads. Please wait for an admin to upgrade your quota.`);
            return;
        }

        // Create Full-Screen Upload Modal
        let uploadModal = document.getElementById('uploadEngineModal');
        if(!uploadModal) {
            uploadModal = document.createElement('div');
            uploadModal.id = 'uploadEngineModal';
            uploadModal.style.cssText = `position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(2,6,23,0.95); backdrop-filter:blur(10px); z-index:9999; display:flex; justify-content:center; align-items:center; opacity:0; transition:0.3s;`;
            
            uploadModal.innerHTML = `
                <div style="background:#0f172a; width:95%; max-width:600px; height:85vh; border-radius:20px; border:1px solid #00e6b8; box-shadow:0 0 30px rgba(0,230,184,0.2); display:flex; flex-direction:column; overflow:hidden; transform:scale(0.9); transition:0.3s;" id="uploadBoxScale">
                    
                    <div style="padding:20px; background:rgba(0,0,0,0.3); border-bottom:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
                        <h2 style="color:#00e6b8; font-family:'Orbitron', sans-serif; font-size:18px;"><i class="fas fa-cloud-upload-alt"></i> PUBLISH APPLICATION</h2>
                        <i class="fas fa-times" style="color:#ff003c; font-size:24px; cursor:pointer;" onclick="closeUploadModal()"></i>
                    </div>

                    <div style="padding:25px; overflow-y:auto; flex:1;">
                        <div style="background:rgba(0,230,184,0.1); border:1px solid rgba(0,230,184,0.3); color:#fff; padding:15px; border-radius:10px; margin-bottom:20px; font-size:13px;">
                            <i class="fas fa-info-circle" style="color:#00e6b8;"></i> You have <b>${maxLimit - currentUploads}</b> uploads remaining in your quota. All uploads require admin approval before publishing.
                        </div>

                        <label style="color:#94a3b8; font-size:12px; font-weight:bold; letter-spacing:1px; margin-bottom:5px; display:block;">APPLICATION NAME</label>
                        <input type="text" id="upAppName" placeholder="Enter app title..." style="width:100%; background:#020617; border:1px solid #334155; padding:15px; border-radius:8px; color:#fff; margin-bottom:15px; outline:none; font-family:'Space Grotesk', sans-serif;">

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div>
                                <label style="color:#94a3b8; font-size:12px; font-weight:bold; letter-spacing:1px; margin-bottom:5px; display:block;">VERSION</label>
                                <input type="text" id="upAppVer" placeholder="e.g. 1.0.4" style="width:100%; background:#020617; border:1px solid #334155; padding:15px; border-radius:8px; color:#fff; outline:none; font-family:'Space Grotesk', sans-serif;">
                            </div>
                            <div>
                                <label style="color:#94a3b8; font-size:12px; font-weight:bold; letter-spacing:1px; margin-bottom:5px; display:block;">FILE SIZE</label>
                                <input type="text" id="upAppSize" placeholder="e.g. 45 MB" style="width:100%; background:#020617; border:1px solid #334155; padding:15px; border-radius:8px; color:#fff; outline:none; font-family:'Space Grotesk', sans-serif;">
                            </div>
                        </div>

                        <label style="color:#94a3b8; font-size:12px; font-weight:bold; letter-spacing:1px; margin-bottom:5px; display:block;">CATEGORY</label>
                        <select id="upAppCat" style="width:100%; background:#020617; border:1px solid #334155; padding:15px; border-radius:8px; color:#fff; margin-bottom:15px; outline:none; font-family:'Space Grotesk', sans-serif; cursor:pointer;">
                            <option value="free">FREE APP</option>
                            <option value="paid">PAID APP</option>
                        </select>

                        <label style="color:#94a3b8; font-size:12px; font-weight:bold; letter-spacing:1px; margin-bottom:5px; display:block;">DOWNLOAD LINK</label>
                        <input type="text" id="upAppLink" placeholder="Direct or Drive link..." style="width:100%; background:#020617; border:1px solid #334155; padding:15px; border-radius:8px; color:#fff; margin-bottom:15px; outline:none; font-family:'Space Grotesk', sans-serif;">

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                            <div>
                                <label style="color:#94a3b8; font-size:12px; font-weight:bold; letter-spacing:1px; margin-bottom:5px; display:block;">LOGO URL</label>
                                <input type="text" id="upLogoUrl" placeholder="Image link..." style="width:100%; background:#020617; border:1px solid #334155; padding:15px; border-radius:8px; color:#fff; outline:none; font-family:'Space Grotesk', sans-serif;">
                            </div>
                            <div>
                                <label style="color:#94a3b8; font-size:12px; font-weight:bold; letter-spacing:1px; margin-bottom:5px; display:block;">BANNER URL</label>
                                <input type="text" id="upBannerUrl" placeholder="Wide image link..." style="width:100%; background:#020617; border:1px solid #334155; padding:15px; border-radius:8px; color:#fff; outline:none; font-family:'Space Grotesk', sans-serif;">
                            </div>
                        </div>

                        <label style="color:#94a3b8; font-size:12px; font-weight:bold; letter-spacing:1px; margin-bottom:5px; display:block;">FULL DESCRIPTION</label>
                        <textarea id="upAppDesc" placeholder="Describe the features, changes, etc..." style="width:100%; background:#020617; border:1px solid #334155; padding:15px; border-radius:8px; color:#fff; margin-bottom:15px; outline:none; font-family:'Space Grotesk', sans-serif; resize:vertical; min-height:100px;"></textarea>

                        <button onclick="submitAppToPending()" style="width:100%; background:#00e6b8; color:#020617; border:none; padding:18px; border-radius:10px; font-family:'Orbitron', sans-serif; font-size:16px; font-weight:bold; cursor:pointer; box-shadow:0 10px 20px rgba(0,230,184,0.3); transition:0.3s;" onmouseover="this.style.background='#fff'" onmouseout="this.style.background='#00e6b8'"><i class="fas fa-paper-plane"></i> SUBMIT FOR REVIEW</button>
                    </div>
                </div>
            `;
            document.body.appendChild(uploadModal);
        }

        document.getElementById('uploadEngineModal').style.opacity = '1';
        document.getElementById('uploadBoxScale').style.transform = 'scale(1)';
    };

    window.closeUploadModal = function() {
        const modal = document.getElementById('uploadEngineModal');
        if(modal) {
            document.getElementById('uploadBoxScale').style.transform = 'scale(0.9)';
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        }
    };

    window.submitAppToPending = function() {
        const title = document.getElementById('upAppName').value.trim();
        const link = document.getElementById('upAppLink').value.trim();
        
        if(!title || !link) {
            alert("⚠️ Missing Fields: Title and Download Link are mandatory.");
            return;
        }

        // Show Processing
        if(typeof toggleGlobalLoader === 'function') toggleGlobalLoader(true, "ENCRYPTING DATA...");

        const appData = {
            appName: title,
            version: document.getElementById('upAppVer').value.trim() || '1.0',
            size: document.getElementById('upAppSize').value.trim() || 'Unknown',
            category: document.getElementById('upAppCat').value,
            accessType: document.getElementById('upAppCat').value,
            downloadUrl: link,
            logoUrl: document.getElementById('upLogoUrl').value.trim() || 'https://via.placeholder.com/150/020617/00e6b8?text=APP',
            bannerUrl: document.getElementById('upBannerUrl').value.trim() || 'https://via.placeholder.com/600x300/020617/00e6b8?text=MVX+STORE',
            description: document.getElementById('upAppDesc').value.trim() || 'No description provided.',
            uploaderUid: currentUser.uid,
            uploaderName: userProfile.name,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            status: 'pending', // Requires admin approval
            views: 0,
            downloads: 0
        };

        const newAppRef = db.ref('pending_apps').push();
        newAppRef.set(appData).then(() => {
            // Update User Upload Count
            db.ref(`users/${currentUser.uid}/uploadCount`).set((userProfile.uploadCount || 0) + 1);
            
            if(typeof toggleGlobalLoader === 'function') toggleGlobalLoader(false);
            if(typeof showGlobalToast === 'function') showGlobalToast('Application Submitted for Review!');
            closeUploadModal();
        }).catch(err => {
            if(typeof toggleGlobalLoader === 'function') toggleGlobalLoader(false);
            alert("Error: " + err.message);
        });
    };

    // ==========================================================================
    // 4. DETAILS PAGE ENGINE & DOWNLOAD REWARDS
    // ==========================================================================
    window.fetchAppDetails = function(appId) {
        db.ref('store_apps/' + appId).once('value').then((snapshot) => {
            if(!snapshot.exists()) {
                alert("Application not found or removed by admin.");
                window.location.replace("index.html");
                return;
            }

            const app = snapshot.val();

            // Populate UI Elements
            document.getElementById('appName').innerText = app.appName;
            document.getElementById('uploaderName').innerText = app.uploaderName;
            document.getElementById('appBanner').src = app.bannerUrl;
            document.getElementById('appLogo').src = app.logoUrl;
            document.getElementById('appDesc').innerText = app.description;
            
            document.getElementById('viewCount').innerText = app.views || 0;
            document.getElementById('downloadCount').innerText = app.downloads || 0;
            document.getElementById('appSize').innerText = app.size;
            document.getElementById('appVersion').innerText = "v" + app.version;

            // Increment Views natively
            db.ref(`store_apps/${appId}/views`).set((app.views || 0) + 1);

            // Verified Badge logic
            db.ref('users/' + app.uploaderUid).once('value').then(usrSnap => {
                if(usrSnap.exists() && usrSnap.val().verified) {
                    document.getElementById('verifiedIcon').style.display = 'inline-block';
                }
            });

            // Download Button Logic with Coin Economy
            const dlBtn = document.getElementById('downloadBtn');
            dlBtn.addEventListener('click', () => {
                
                // Increase Download Count
                db.ref(`store_apps/${appId}/downloads`).set((app.downloads || 0) + 1);

                // Give Uploader a Coin Reward (e.g., 1 coin per 10 downloads can be set, here we do 1 per dl for demo)
                db.ref(`users/${app.uploaderUid}/coins`).set((usrSnap.val().coins || 0) + 1);

                // Start Download securely
                let finalUrl = app.downloadUrl;
                if(finalUrl.includes('drive.google.com/file/d/')) {
                    const match = finalUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (match) finalUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
                }
                
                showGlobalToast("Download Initiated!", "success");
                setTimeout(() => window.open(finalUrl, '_blank'), 1500);
            });

            // Hide Loader
            const loader = document.getElementById('detailsLoader');
            if(loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 500);
            }
        });
    };

    // ==========================================================================
    // 5. REPORT SYSTEM (SEND TO ADMIN)
    // ==========================================================================
    window.submitAppReport = function(appId, reason) {
        if(!currentUser) {
            alert("You must be logged in to report.");
            return;
        }

        const reportData = {
            appId: appId,
            reporterUid: currentUser.uid,
            reporterEmail: currentUser.email,
            reason: reason,
            status: 'unresolved',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        db.ref('reports').push(reportData).then(() => {
            if(typeof showGlobalToast === 'function') showGlobalToast('Report Sent to Admins.', 'success');
        }).catch(err => alert("Error submitting report: " + err.message));
    };
});
