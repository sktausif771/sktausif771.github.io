/* ==========================================================================
   MVX STORE V5.5 - CORE DATA CORE ENGINE & ADVANCED UPLOAD PROTOCOL
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ফায়ারবেস চেক করা
    if (typeof firebase === 'undefined') {
        console.error("Firebase Core SDK Error: Systems cannot link.");
        return;
    }

    const db = firebase.database();
    const auth = firebase.auth();
    
    // গ্লোবাল ভেরিয়েবল
    let currentUser = null;
    let userProfile = null;
    let activeContentType = 'files'; // default tab
    let activeFilterType = 'all';    // default filter

    // আপনার দেওয়া অরিজিনাল ImgBB API Key (১০০% ওয়ার্কিং)
    const IMGBB_API_KEY = "820eb9aa6a57f863045a52c1929efc9c"; 

    // ১. গ্লোবাল লোগো সিঙ্ক ইঞ্জিন (ডাটাবেজ থেকে মেইন লোগো লোড করা)
    db.ref('settings/storeLogo').on('value', (snapshot) => {
        const logoImg = document.getElementById('mainStoreLogo');
        if (logoImg && snapshot.exists() && snapshot.val().trim() !== "") {
            logoImg.src = snapshot.val();
        }
    });

    // ২. লগইন স্টেট এবং প্রোফাইল ডাটা লোডার সিঙ্ক
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            
            // রিয়েলটাইম ইউজার ডাটা ট্র্যাকার
            db.ref('users/' + user.uid).on('value', (snapshot) => {
                if (snapshot.exists()) {
                    userProfile = snapshot.val();
                    updateUserInterfaceElements();
                }
            });

            // ব্যাকগ্রাউন্ডে ১ ঘণ্টার অটো-অ্যাপ্রুভ ইঞ্জিন চালু করা
            runSystemAutoApproveEngine();
            // নোটিফিকেশন লিসেনার চালু করা
            listenForLiveSystemNotifications();
        }
    });

    // ৩. ইউজার ইন্টারফেস ডাটা আপডেট ইঞ্জিন
    function updateUserInterfaceElements() {
        if (!userProfile) return;

        // 'You' ট্যাব এলিমেন্ট আপডেট
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

        // রোল অনুযায়ী হিডেন বাটন কন্ট্রোল (অ্যাডমিন/ওনার হাইড লজিক)
        const menuToggle = document.getElementById('adminMenuToggle');
        const linkAdmin = document.getElementById('linkAdmin');
        const linkOwner = document.getElementById('linkOwner');
        const ownerLogoSection = document.getElementById('ownerLogoEditSection');

        if (userProfile.role === 'admin' || userProfile.role === 'owner') {
            if (menuToggle) menuToggle.style.display = 'block';
            if (linkAdmin) linkAdmin.style.display = 'flex';
        }
        
        if (userProfile.role === 'owner') {
            if (linkOwner) linkOwner.style.display = 'flex';
            if (ownerLogoSection) ownerLogoSection.style.display = 'block';
        }

        // প্রথমবার ডাটাবেজ থেকে অ্যাপ লোড করা
        loadStoreFeed(activeFilterType, activeContentType);
    }

    // ৪. প্লে স্টোর ফিড রেন্ডারার (স্মার্ট ট্যাগ ও টাইপ ফিল্টার সহ)
    window.loadStoreFeed = function(filter, contentType) {
        activeFilterType = filter || activeFilterType;
        activeContentType = contentType || activeContentType;

        const grid = document.getElementById('storeAppGrid');
        if (!grid) return;

        grid.innerHTML = `
            <div style="text-align:center; padding: 50px; grid-column: 1/-1;">
                <i class="fas fa-spinner fa-spin" style="font-size:32px; color:var(--primary);"></i>
            </div>
        `;

        db.ref('store_apps').orderByChild('status').equalTo('approved').once('value').then((snapshot) => {
            if (!snapshot.exists()) {
                grid.innerHTML = `<div style="text-align:center; padding:50px; grid-column:1/-1; color:var(--text-secondary);">No applications live in database.</div>`;
                return;
            }

            let html = '';
            let appsList = [];
            
            snapshot.forEach((child) => {
                appsList.push({ id: child.key, ...child.val() });
            });
            
            // নতুন আপলোড আগে দেখানোর জন্য রিভার্স করা
            appsList.reverse();

            appsList.forEach((app) => {
                let matchType = (app.appType === activeContentType);
                let matchFilter = false;

                if (activeFilterType === 'all') matchFilter = true;
                if (activeFilterType === 'premium' && app.category === 'paid') matchFilter = true;
                
                // ট্রেন্ডিং লজিক (১০০ এর বেশি ভিউ হলে ট্রেন্ডিংয়ে দেখাবে)
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

            grid.innerHTML = html || `<div style="text-align:center; padding:50px; grid-column:1/-1; color:var(--text-secondary);">No content found inside this layout.</div>`;
        });
    };

    // ফিড ফিল্টার চিপস লিসেনারস
    document.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            loadStoreFeed(e.target.getAttribute('data-filter'), activeContentType);
        });
    });

    // ৫. কাস্টম স্মার্ট ট্যাগ ইনপুট ইঞ্জিন (Tags Manager UI)
    let uploadedTagsList = [];
    function initializeTagsInputEngine() {
        const input = document.getElementById('tagInputField');
        const container = document.getElementById('tagsInputContainer');
        if(!input || !container) return;

        uploadedTagsList = []; // reset

        input.addEventListener('keydown', (e) => {
            if (e.key === ',' || e.key === 'Enter') {
                e.preventDefault();
                let tag = input.value.trim().toLowerCase().replace(/,/g, '');
                if (tag && !uploadedTagsList.includes(tag)) {
                    uploadedTagsList.push(tag);
                    renderTagsChips();
                }
                input.value = '';
            }
        });
    }

    function renderTagsChips() {
        const container = document.getElementById('tagsInputContainer');
        const input = document.getElementById('tagInputField');
        if(!container) return;

        // পুরোনো চিপস ফেলে দিয়ে নতুন করে সাজানো
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
        renderTagsChips();
    };

    // ৬. অ্যাডভান্সড প্লে স্টোর আপলোড মডাল জেনারেটর (ImgBB + Base64 + Tags + Pricing)
    window.openUploadModal = function() {
        if (!userProfile) return;

        const isAdmin = (userProfile.role === 'admin' || userProfile.role === 'owner');
        
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
                        <i class="fas fa-history"></i> ইউজার আপলোড করার ১ ঘণ্টার মধ্যে অ্যাডমিন চেক না করলে ফাইল অটোমেটিক মেইন স্টোরে লাইভ হয়ে যাবে।
                    </p>

                    <label class="modal-label">Application Title / File Name</label>
                    <input type="text" id="pName" class="play-input" placeholder="e.g. CapCut Premium Mod">

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div>
                            <label class="modal-label">Version</label>
                            <input type="text" id="pVer" class="play-input" placeholder="e.g. v5.4.2">
                        </div>
                        <div>
                            <label class="modal-label">File Size</label>
                            <input type="text" id="pSize" class="play-input" placeholder="e.g. 120 MB">
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
                            <select id="pCat" class="play-input" onchange="toggleCoinPriceInput(this.value)">
                                <option value="free">FREE ACCESS</option>
                                <option value="paid" ${isAdmin ? "" : "disabled"}>PREMIUM COIN ACCESS (${isAdmin ? 'Allowed' : 'Admins Only'})</option>
                            </select>
                        </div>
                    </div>

                    <div id="coinPriceWrapper" style="display:none;">
                        <label class="modal-label" style="color:var(--warning);">Unlock Price (In Coins)</label>
                        <input type="number" id="pCoinPrice" class="play-input" placeholder="e.g. 50" value="0">
                    </div>

                    <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

                    <label class="modal-label" style="color:var(--primary);">Logo Upload Engine Method</label>
                    <select id="logoMethod" class="play-input" onchange="toggleUploadMethodInputs('logo', this.value)">
                        <option value="imgbb">ImgBB Cloud API Method (Recommended)</option>
                        <option value="base64">Base64 Direct Hex Encoding Method</option>
                    </select>

                    <div id="logoFileBox">
                        <input type="file" id="logoFile" class="play-input" accept="image/*" style="padding:10px;">
                    </div>
                    <input type="text" id="logoUrlOutput" class="play-input" placeholder="Logo Link/String Output Result" readonly>
                    <p id="logoProcessStatus" style="font-size:11px; color:var(--warning); margin-top:-15px; margin-bottom:15px;"></p>

                    <label class="modal-label" style="color:var(--primary);">Banner Upload Engine Method</label>
                    <select id="bannerMethod" class="play-input" onchange="toggleUploadMethodInputs('banner', this.value)">
                        <option value="imgbb">ImgBB Cloud API Method</option>
                        <option value="base64">Base64 Direct Hex Encoding Method</option>
                    </select>

                    <div id="bannerFileBox">
                        <input type="file" id="bannerFile" class="play-input" accept="image/*" style="padding:10px;">
                    </div>
                    <input type="text" id="bannerUrlOutput" class="play-input" placeholder="Banner Link/String Output Result" readonly>
                    <p id="bannerProcessStatus" style="font-size:11px; color:var(--warning); margin-top:-15px; margin-bottom:15px;"></p>

                    <hr style="border:0; border-top:1px solid var(--border-color); margin:15px 0;">

                    <label class="modal-label">Main Secure Download Link</label>
                    <input type="text" id="pMainLink" class="play-input" placeholder="https://secure-link.com/download">

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div>
                            <label class="modal-label">Custom Action Button (Optional)</label>
                            <input type="text" id="pAltName" class="play-input" placeholder="e.g. Get Key">
                        </div>
                        <div>
                            <label class="modal-label">Action URL Link</label>
                            <input type="text" id="pAltUrl" class="play-input" placeholder="https://get-key-link.com">
                        </div>
                    </div>

                    <label class="modal-label">Unzip Archive Password (Optional)</label>
                    <input type="text" id="pPassword" class="play-input" placeholder="Leave empty if file has no password lock">

                    <label class="modal-label">Search Keywords & Tags (Press Comma ',' to add)</label>
                    <div class="tags-container" id="tagsInputContainer">
                        <input type="text" id="tagInputField" class="tag-input-field" placeholder="Add keywords...">
                    </div>

                    <label class="modal-label">Description & Release logs</label>
                    <textarea id="pDescription" class="play-input" placeholder="Write features or instruction guidelines..." style="min-height:100px; resize:vertical;"></textarea>

                    <button class="play-btn" id="executePublishBtn" onclick="commitPackageToPendingDatabase()">PUBLISH APPLICATION</button>
                </div>
            </div>
        `;
        document.body.appendChild(uploadModal);

        // ট্যাগ সিস্টেম ইনিশিয়েলাইজ করা
        initializeTagsInputEngine();

        // রিয়েলটাইম লিসেনারস ইমেজ প্রসেসিং এর জন্য
        document.getElementById('logoFile').addEventListener('change', (e) => processSelectedImageFile(e.target.files[0], 'logoMethod', 'logoUrlOutput', 'logoProcessStatus'));
        document.getElementById('bannerFile').addEventListener('change', (e) => processSelectedImageFile(e.target.files[0], 'bannerMethod', 'bannerUrlOutput', 'bannerProcessStatus'));
    };

    // ৭. কয়েন প্রাইস বক্স হাইড/শো করার মেকানিজম
    window.toggleCoinPriceInput = function(val) {
        document.getElementById('coinPriceWrapper').style.display = (val === 'paid') ? 'block' : 'none';
    };

    // ৮. আপলোড মেথড সিলেকশন টগল
    window.toggleUploadMethodInputs = function(type, method) {
        const fileBox = document.getElementById(`${type}FileBox`);
        const output = document.getElementById(`${type}UrlOutput`);
        
        if (method === 'base64') {
            output.removeAttribute('readonly');
            output.placeholder = "Paste Base64 Image String Code Data Here...";
        } else {
            output.setAttribute('readonly', 'true');
            output.placeholder = "Link will generate automatically via ImgBB...";
        }
        output.value = '';
    };

    // ৯. ইমেজ কনভার্টার ও আপলোডার কোর ফাংশন (ImgBB & Base64 Dual Mode)
    function processSelectedImageFile(file, methodSelectId, outputInputId, statusParaId) {
        if (!file) return;

        const method = document.getElementById(methodSelectId).value;
        const output = document.getElementById(outputInputId);
        const status = document.getElementById(statusParaId);

        status.innerText = "Processing Image Engine Data...";
        status.style.color = "var(--warning)";

        if (method === 'base64') {
            // Base64 কনভার্সন মেথড
            const reader = new FileReader();
            reader.onload = function(e) {
                output.value = e.target.result;
                status.innerText = "Base64 Byte String Encoding Success!";
                status.style.color = "var(--success)";
            };
            reader.onerror = () => { status.innerText = "Failed encoding Base64."; status.style.color = "var(--danger)"; };
            reader.readAsDataURL(file);
        } else {
            // অরিজিনাল ImgBB ক্লাউড এপিআই মেথড (১০০% ফিক্সড)
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
                    status.innerText = "Cloud API Sync Complete: " + json.data.url;
                    status.style.color = "var(--success)";
                } else {
                    status.innerText = "ImgBB rejected token or error occurred.";
                    status.style.color = "var(--danger)";
                }
            })
            .catch(() => {
                status.innerText = "Network pipeline drop. Upload failed.";
                status.style.color = "var(--danger)";
            });
        }
    }

    // ১০. ডাটাবেজ কমিট প্রোটোকল (Pending Area তে ডাটা পাঠানো)
    window.commitPackageToPendingDatabase = function() {
        const name = document.getElementById('pName').value.trim();
        const mainLink = document.getElementById('pMainLink').value.trim();
        const logoData = document.getElementById('logoUrlOutput').value.trim();
        const bannerData = document.getElementById('bannerUrlOutput').value.trim();

        if (!name || !mainLink) {
            alert("⚠️ Critical Fields Missing: Title and Download Link required.");
            return;
        }

        const btn = document.getElementById('executePublishBtn');
        btn.innerText = "COMMITTING PACKAGE...";
        btn.disabled = true;

        const finalPackageData = {
            appName: name,
            version: document.getElementById('pVer').value.trim() || "1.0",
            size: document.getElementById('pSize').value.trim() || "Unknown Size",
            appType: document.getElementById('pType').value,
            category: document.getElementById('pCat').value,
            coinPrice: parseInt(document.getElementById('pCoinPrice').value) || 0,
            logoUrl: logoData || "https://via.placeholder.com/150/121212/00e6b8?text=APP",
            bannerUrl: bannerData || "https://via.placeholder.com/500x250/121212/00e6b8?text=BANNER",
            downloadUrl: mainLink,
            altLinkName: document.getElementById('pAltName').value.trim(),
            altLinkUrl: document.getElementById('pAltUrl').value.trim(),
            zipPassword: document.getElementById('pPassword').value.trim(),
            tags: uploadedTagsList, // স্মার্ট ট্যাগ অ্যারে এন্ট্রি
            description: document.getElementById('pDescription').value.trim() || "No description provided.",
            uploaderUid: currentUser.uid,
            uploaderName: userProfile.name,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            autoApproveTime: Date.now() + 3600000, // ১ ঘণ্টা পরের টাইম ক্যালকুলেশন
            status: 'pending',
            downloads: 0,
            views: 0
        };

        db.ref('pending_apps').push(finalPackageData).then(() => {
            alert("🚀 আলহামদুলিল্লাহ, আপনার ফাইল সাবমিট হয়েছে! ১ ঘণ্টার মধ্যে কোনো অ্যাডমিন ফাইলটি চেক না করলে সিস্টেম এটি অটোমেটিক লাইভ করে দেবে।");
            document.getElementById('dynamicUploadModal').remove();
        }).catch((err) => {
            alert("Database drop error: " + err.message);
            btn.innerText = "PUBLISH APPLICATION";
            btn.disabled = false;
        });
    };

    // ১১. গ্লোবাল নোটিফিকেশন রিয়েলটাইম লিসেনার (ইনবক্স ডাটা লোডার)
    function listenForLiveSystemNotifications() {
        const inbox = document.getElementById('notificationInboxDisplay');
        const badge = document.getElementById('notiAlert');
        
        db.ref('system_broadcasts').on('value', (snapshot) => {
            if(!inbox) return;
            if(!snapshot.exists()) {
                inbox.innerHTML = `<div class="empty-msg">No structural notices live.</div>`;
                return;
            }

            if(badge) badge.style.display = 'block'; // নতুন নোটিফিকেশন আসলে রেড ডট শো করবে

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

    // ১২. অ্যাডমিন নোটিফিকেশন ব্রডকাস্টার মেকানিজম (অ্যাডমিন প্যানেল পুশ লজিক)
    window.executeNotificationBroadcast = function() {
        const title = document.getElementById('notiPushTitle').value.trim();
        const msg = document.getElementById('notiPushMessage').value.trim();
        const type = document.getElementById('notiPushType').value;

        if(!title || !msg) {
            alert("Notice text cannot be empty.");
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
            alert("Broadcast sent globally to all connected channels!");
            document.getElementById('adminNotiModal').classList.remove('active');
            document.getElementById('notiPushTitle').value = '';
            document.getElementById('notiPushMessage').value = '';
        });
    };

    // ১৩. ১ ঘণ্টার অটো-অ্যাপ্রুভ ব্যাকগ্রাউন্ড সিমুলেটর ইঞ্জিন (ক্লিন লুপ ট্র্যাকার)
    function runSystemAutoApproveEngine() {
        // প্রতি ৩ মিনিটে চেক করবে
        setInterval(() => {
            db.ref('pending_apps').once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    const currentTimeStamp = Date.now();
                    snapshot.forEach((child) => {
                        let appRecord = child.val();
                        
                        // টাইম ওভার হয়ে গেলে অটোমেটিক মেইন স্টোরে ট্রান্সফার হবে
                        if (currentTimeStamp >= appRecord.autoApproveTime) {
                            appRecord.status = 'approved';
                            appRecord.approvedBy = 'System-Auto';
                            appRecord.approvedAt = firebase.database.ServerValue.TIMESTAMP;

                            db.ref(`store_apps/${child.key}`).set(appRecord).then(() => {
                                db.ref(`pending_apps/${child.key}`).remove();
                                console.log(`[ENGINE LOG]: Auto-Approved package data for ${appRecord.appName}`);
                            });
                        }
                    });
                }
            });
        }, 180000); 
    }

    // ১৪. ওনার কর্তৃক গ্লোবাল লোগো চেঞ্জ কমপ্লিট সাবমিশন ইঞ্জিন
    // এই প্রো-ফাংশনটি সেভ প্রোফাইল মেথডের সাথে ইন্টিগ্রেট হবে
    window.processOwnerStoreLogoChange = function(logoUrl) {
        if(userProfile && userProfile.role === 'owner' && logoUrl.trim() !== "") {
            db.ref('settings').update({ storeLogo: logoUrl.trim() });
        }
    };
});
