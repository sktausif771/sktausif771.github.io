/* ==========================================================================
   MVX STORE V5.5 - CORE RUNTIME INTERACTIONS, SMART SEARCH & REDEEM ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ফায়ারবেস ডিপেন্ডেন্সি ভেরিফিকেশন
    if (typeof firebase === 'undefined') {
        console.error("Critical Failure: Firebase SDK not found in main.js pipeline.");
        return;
    }

    const db = firebase.database();
    const auth = firebase.auth();

    // ==========================================================================
    // ১. ডার্ক / লাইট থিম কন্ট্রোল ইঞ্জিন (Theme Switcher Module)
    // ==========================================================================
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeLabel = document.getElementById('currentThemeLabel');
    
    // লোকাল স্টোরেজ থেকে আগের সেভ করা থিম লোড করা
    let savedTheme = localStorage.getItem('mvx_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeUIElements(savedTheme);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            let activeTheme = document.documentElement.getAttribute('data-theme');
            let newTheme = (activeTheme === 'dark') ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('mvx_theme', newTheme); // মেমোরিতে সেভ রাখা
            updateThemeUIElements(newTheme);
        });
    }

    function updateThemeUIElements(theme) {
        if (!themeLabel) return;
        if (theme === 'dark') {
            themeLabel.innerText = "Dark Mode";
            themeLabel.style.color = "var(--primary)";
        } else {
            themeLabel.innerText = "Light Mode";
            themeLabel.style.color = "#00c49a";
        }
    }

    // ==========================================================================
    // ২. এডভান্সড পাওয়ারফুল স্মার্ট সার্চ ইঞ্জিন (Fuzzy & Tag Matching Search)
    // ==========================================================================
    const searchInput = document.getElementById('storeSearchInput');
    const searchGrid = document.getElementById('searchResultGrid');

    if (searchInput) {
        // ইউজার টাইপ করার সাথে সাথে সার্চ ট্রিগার হবে (রিয়েলটাইম লিসেনার)
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            executeSmartSearchProtocol(query);
        });
    }

    function executeSmartSearchProtocol(query) {
        if (!searchGrid) return;

        // ইনপুট বক্স ফাঁকা থাকলে ডিফল্ট মেসেজ দেখাবে
        if (query.length === 0) {
            searchGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; grid-column: 1/-1; color: var(--text-secondary);">
                    <i class="fas fa-search-plus" style="font-size: 40px; margin-bottom: 15px; color: var(--border-color);"></i>
                    <h3>Type any keyword or tag to fetch application data</h3>
                </div>
            `;
            return;
        }

        // সার্চ লোডার অ্যানিমেশন
        searchGrid.innerHTML = `<div style="text-align:center; padding: 30px; grid-column: 1/-1;"><i class="fas fa-spinner fa-spin" style="font-size:26px; color:var(--primary);"></i></div>`;

        db.ref('store_apps').orderByChild('status').equalTo('approved').once('value').then((snapshot) => {
            if (!snapshot.exists()) {
                searchGrid.innerHTML = `<div style="text-align:center; padding:30px; grid-column:1/-1; color:var(--text-secondary);">No apps available in store database.</div>`;
                return;
            }

            let html = '';
            let matchCount = 0;

            snapshot.forEach((child) => {
                const app = child.val();
                const appTitle = app.appName.toLowerCase();
                const appDesc = (app.description || "").toLowerCase();
                const appTags = app.tags || []; // আপলোডের সময় দেওয়া ট্যাগের অ্যারে

                // স্মার্ট ম্যাচিং লজিক (টাইটেল, ডেসক্রিপশন বা ট্যাগের ভেতর কীওয়ার্ড আছে কি না চেক করা)
                let isMatch = appTitle.includes(query) || appDesc.includes(query);
                
                // যদি ডিরেক্ট ম্যাচ না হয়, তবে ট্যাগ লিস্টের প্রতিটি আইটেম চেক করবে
                if (!isMatch) {
                    for (let i = 0; i < appTags.length; i++) {
                        if (appTags[i].toLowerCase().includes(query) || query.includes(appTags[i].toLowerCase())) {
                            isMatch = true;
                            break;
                        }
                    }
                }

                // স্পেশাল স্পেস-রিমুভার ম্যাচিং (যেমন: cap cut কে capcut লিখে সার্চ করলেও ম্যাচ করবে)
                const flatTitle = appTitle.replace(/\s+/g, '');
                const flatQuery = query.replace(/\s+/g, '');
                if (!isMatch && flatTitle.includes(flatQuery)) {
                    isMatch = true;
                }

                if (isMatch) {
                    matchCount++;
                    const priceLabel = app.category === 'paid' ? `${app.coinPrice || 0} Coins` : 'FREE';
                    const badgeClass = app.category === 'paid' ? 'badge-paid' : 'badge-free';

                    html += `
                        <div class="app-card" onclick="window.location.href='details.html?id=${child.key}'">
                            <span class="badge ${badgeClass}">${priceLabel}</span>
                            <img src="${app.logoUrl}" class="app-icon-large" onerror="this.src='https://via.placeholder.com/75/121212/00e6b8?text=FILE'">
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

            if (matchCount > 0) {
                searchGrid.innerHTML = html;
            } else {
                searchGrid.innerHTML = `
                    <div style="text-align:center; padding:40px; grid-column:1/-1; color:var(--text-secondary);">
                        <i class="fas fa-frown" style="font-size:30px; margin-bottom:10px; color:var(--danger);"></i>
                        <p>No results found matching your key terms or tags.</p>
                    </div>
                `;
            }
        });
    }

    // ==========================================================================
    // ৩. মাস্টার রিডিম কোড ইঞ্জিন (Premium Gift Voucher Claim Protocol)
    // ==========================================================================
    window.executeRedeemProtocol = function() {
        const codeInput = document.getElementById('redeemInputCode');
        const statusTxt = document.getElementById('redeemStatusMsg');
        
        if (!codeInput || !statusTxt) return;
        
        const rawCode = codeInput.value.trim().toUpperCase(); // কোড সবসময় বড় হাতের হবে

        if (rawCode.length === 0) {
            statusTxt.innerText = "Please enter a voucher code first.";
            statusTxt.style.color = "var(--danger)";
            return;
        }

        statusTxt.innerText = "Connecting to Secure Bank Gateway...";
        statusTxt.style.color = "var(--warning)";

        const user = auth.currentUser;
        if (!user) {
            statusTxt.innerText = "Session Error. Re-login required.";
            statusTxt.style.color = "var(--danger)";
            return;
        }

        const redeemRef = db.ref('redeem_codes/' + rawCode);
        
        redeemRef.once('value').then((snapshot) => {
            if (!snapshot.exists()) {
                statusTxt.innerText = "❌ Invalid or Expired Redeem Code!";
                statusTxt.style.color = "var(--danger)";
                return;
            }

            const codeData = snapshot.val();
            
            // ক্লেইম লিমিট চেক করা (কোডটি অলরেডি ম্যাক্সিমাম ইউজার ইউজ করে ফেলেছে কি না)
            if (codeData.currentClaims >= codeData.maxClaims) {
                statusTxt.innerText = "⚠️ This voucher code has reached its usage limit.";
                statusTxt.style.color = "var(--danger)";
                return;
            }

            // এই নির্দিষ্ট ইউজার অলরেডি ক্লেইম করেছে কি না চেক করা (Duplicate Preventer)
            if (codeData.claimed_users && codeData.claimed_users[user.uid]) {
                statusTxt.innerText = "🚫 You have already claimed this voucher code once!";
                statusTxt.style.color = "var(--danger)";
                return;
            }

            // যদি কোড ভ্যালিড হয়, তবে রিওয়ার্ড প্রসেস করা হবে
            db.ref('users/' + user.uid).once('value').then((userSnap) => {
                if (!userSnap.exists()) return;
                
                const userData = userSnap.val();
                let rewardUpdate = {};

                if (codeData.rewardType === 'coins') {
                    // কয়েন রিওয়ার্ড প্রসেসিং
                    const bonusCoins = parseInt(codeData.rewardValue) || 0;
                    const currentBalance = parseInt(userData.coins) || 0;
                    rewardUpdate['coins'] = currentBalance + bonusCoins;
                    statusTxt.innerText = `🎉 Success! +${bonusCoins} MVX Coins added to your wallet!`;
                } else if (codeData.rewardType === 'premium_bypass') {
                    // স্পেসিফিক প্রিমিয়াম অ্যাপ ডিরেক্ট আনলক করার রিওয়ার্ড
                    const targetAppId = codeData.rewardValue;
                    rewardUpdate[`unlocked_apps/${targetAppId}`] = true;
                    statusTxt.innerText = "🚀 Access Granted! Premium Application unlocked for your account.";
                }

                statusTxt.style.color = "var(--success)";

                // ১. ইউজারের ওয়ালেটে রিওয়ার্ড আপডেট
                db.ref('users/' + user.uid).update(rewardUpdate);

                // ২. রিডিম কোডের ক্লেইম হিস্ট্রি এবং কাউন্টার আপডেট করা
                let codeUpdates = {};
                codeUpdates['currentClaims'] = (codeData.currentClaims || 0) + 1;
                codeUpdates[`claimed_users/${user.uid}`] = {
                    name: userData.name,
                    email: userData.email,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };
                redeemRef.update(codeUpdates);

                // ইনপুট বক্স ক্লিয়ার করা
                codeInput.value = '';
            });
        }).catch((err) => {
            statusTxt.innerText = "System error during validation: " + err.message;
            statusTxt.style.color = "var(--danger)";
        });
    };

    // ==========================================================================
    // ৪. প্রোফাইল এবং ওনার লোগো মেটাডাটা আপডেট সাবমিশন
    // ==========================================================================
    window.saveProfileChanges = function() {
        const user = auth.currentUser;
        if (!user || !userProfile) return;

        const editNameInput = document.getElementById('editNameInput');
        const editAvatarInput = document.getElementById('editAvatarInput');
        const ownerLogoInput = document.getElementById('ownerLogoInput');

        const newName = editNameInput ? editNameInput.value.trim() : "";
        const newAvatar = editAvatarInput ? editAvatarInput.value.trim() : "";

        if (!newName) {
            alert("⚠️ User display name is mandatory.");
            return;
        }

        const saveBtn = document.querySelector('#profileEditModal .play-btn');
        if (saveBtn) {
            saveBtn.innerText = "SYNCHRONIZING...";
            saveBtn.disabled = true;
        }

        let userUpdates = {
            name: newName,
            avatarUrl: newAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newName}`
        };

        // ডাটাবেজে প্রোফাইল রাইট করা
        db.ref('users/' + user.uid).update(userUpdates).then(() => {
            // যদি ইউজার ওনার হয় এবং লোগো ইনপুট চেঞ্জ করে, তবে গ্লোবাল লোগো আপডেট হবে
            if (userProfile.role === 'owner' && ownerLogoInput && ownerLogoInput.value.trim() !== "") {
                if (typeof window.processOwnerStoreLogoChange === 'function') {
                    window.processOwnerStoreLogoChange(ownerLogoInput.value.trim());
                }
            }

            if (saveBtn) {
                saveBtn.innerText = "COMMIT METADATA CHANGES";
                saveBtn.disabled = false;
            }
            
            // মডাল ক্লোজ করা
            const modal = document.getElementById('profileEditModal');
            if (modal) modal.classList.remove('active');
            
            alert("Database synchronized. Metadata update complete!");
        }).catch((err) => {
            if (saveBtn) {
                saveBtn.innerText = "COMMIT METADATA CHANGES";
                saveBtn.disabled = false;
            }
            alert("Sync Failed: " + err.message);
        });
    };

    // ==========================================================================
    // ৫. সিকিউর লগআউট ইঞ্জিন
    // ==========================================================================
    window.secureLogout = function() {
        if (confirm("Execute absolute sign-out protocol? All active local tokens will clear.")) {
            sessionStorage.clear();
            auth.signOut().then(() => {
                window.location.replace('login.html');
            }).catch(() => {
                window.location.replace('login.html');
            });
        }
    };
});
