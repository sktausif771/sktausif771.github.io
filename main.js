/* ==========================================================================
   MVX STORE V5.5 - MAIN SYSTEM ARCHITECTURE, HIDDEN ENCRYPTED GATE & LOCALES
   ========================================================================== */

let userProfile = null; // Global User Cache Object Mappings

document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') {
        console.error("Critical Runtime Failure: Firebase Core SDK Missing inside main.js pipeline.");
        return;
    }

    const db = firebase.database();
    const auth = firebase.auth();

    // ==========================================================================
    // ১. ডাইনামিক রিয়েলটাইম ল্যাংগুয়েজ ডিকশনারি (A-Z Translation Engine)
    // ==========================================================================
    const languageDictionary = {
        en: {
            storeTitle: "MVX STORE",
            loadingStore: "Scanning Database Infrastructure...",
            catAll: "All Items",
            catTrending: "Trending Now",
            catPremium: "Premium Apps",
            searchTitle: "Smart Search Engine",
            searchPrompt: "Type any keyword or tag to fetch application data",
            searchInput: "Search apps, files, mods or tags...",
            notiTitle: "System Notifications",
            clearScreen: "Clear Screen",
            followers: "Followers: ",
            following: "Following: ",
            claimTitle: "Claim Premium Gift Code",
            claimInput: "Enter Redeem Voucher Code",
            btnClaim: "CLAIM",
            uploadApp: "Publish Package File",
            coinBalance: "MVX Coin Balance",
            signOut: "Secure Sign Out",
            navFiles: "Files",
            navModApp: "Mod App",
            navSearch: "Search",
            navYou: "You",
            passPrompt: "Enter Access Token Pin Key Sequence"
        },
        bn: {
            storeTitle: "এমভিএক্স স্টোর",
            loadingStore: "ডাটাবেজ কানেকশন চেক করা হচ্ছে...",
            catAll: "সব ফাইল",
            catTrending: "ট্রেন্ডিং ফাইল",
            catPremium: "প্রিমিয়াম অ্যাপস",
            searchTitle: "স্মার্টサーチ ইঞ্জিন",
            searchPrompt: "앱ের নাম অথবা ট্যাগ লিখে সার্চ করুন",
            searchInput: "অ্যাপস, ফাইল, মড বা ট্যাগ খুঁজুন...",
            notiTitle: "সিস্টেম নোটিফিকেশন",
            clearScreen: "স্ক্রিন ক্লিয়ার করুন",
            followers: "অনুসারী: ",
            following: "অনুগমন: ",
            claimTitle: "প্রিমিয়াম গিফট কোড ক্লেইম করুন",
            claimInput: "রিডিম ভাউচার কোড দিন",
            btnClaim: "ক্লেইম",
            uploadApp: "নতুন ফাইল আপলোড করুন",
            coinBalance: "এমভিএক্স কয়েন ব্যালেন্স",
            signOut: "নিরাপদ লগআউট",
            navFiles: "ফাইলস",
            navModApp: "মড অ্যাপ",
            navSearch: "সার্চ",
            navYou: "প্রোফাইল",
            passPrompt: "অ্যাডমিন প্যানেল সিকিউরিটি পিন কোড দিন"
        }
    };

    // System Language Localization Renderer
    window.applySystemLanguageLocalization = function(lang) {
        localStorage.setItem('mvx_lang', lang);
        const dict = languageDictionary[lang];

        // UI Text Element Mapping Dictionary Loops
        const mapping = {
            'lblStoreTitle': dict.storeTitle,
            'lblLoadingStore': dict.loadingStore,
            'btnCatAll': dict.catAll,
            'btnCatTrending': dict.catTrending,
            'btnCatPremium': dict.catPremium,
            'lblSearchTitle': dict.searchTitle,
            'lblSearchPrompt': `<h3>${dict.searchPrompt}</h3>`,
            'lblNotiTitle': `<i class="fas fa-envelope-open-text" style="color: var(--primary);"></i> ${dict.notiTitle}`,
            'btnClearScreen': dict.clearScreen,
            'lblClaimTitle': `<i class="fas fa-gift" style="color: var(--primary);"></i> ${dict.claimTitle}`,
            'btnClaimCode': dict.btnClaim,
            'lblUploadApp': dict.uploadApp,
            'lblCoinBalance': dict.coinBalance,
            'lblSignOut': dict.signOut,
            'navFiles': dict.navFiles,
            'navModApp': dict.navModApp,
            'navSearch': dict.navSearch,
            'navYou': dict.navYou,
            'lblPassPrompt': dict.passPrompt
        };

        for (const [id, value] of Object.entries(mapping)) {
            const el = document.getElementById(id);
            if (el) {
                if (id === 'lblSearchPrompt' || id === 'lblNotiTitle' || id === 'lblClaimTitle') {
                    el.innerHTML = value;
                } else {
                    el.innerText = value;
                }
            }
        }

        const sInput = document.getElementById('storeSearchInput');
        if(sInput) sInput.placeholder = dict.searchInput;
        const rInput = document.getElementById('redeemInputCode');
        if(rInput) rInput.placeholder = dict.claimInput;

        const langLabel = document.getElementById('currentLanguageLabel');
        if(langLabel) langLabel.innerText = (lang === 'en') ? "English" : "বাংলা";
    };

    window.toggleSystemLanguageConfig = function() {
        let currentLang = localStorage.getItem('mvx_lang') || 'en';
        let newLang = (currentLang === 'en') ? 'bn' : 'en';
        applySystemLanguageLocalization(newLang);
    };

    let savedLang = localStorage.getItem('mvx_lang') || 'en';
    applySystemLanguageLocalization(savedLang);

    /* ==========================================================================
       ২. সিকিউর হিডেন পাসওয়ার্ড গেটওয়ে সিস্টেম (Profile Picture Click Gate)
       ========================================================================== */
    const HIDDEN_MASTER_PASSKEY = "121345"; // Temporary Secret Master Access PIN Code

    window.triggerHiddenPasswordGate = function() {
        const gateModal = document.getElementById('hiddenGateModal');
        const passInput = document.getElementById('gatePasswordInput');
        if (gateModal) {
            if(passInput) passInput.value = ''; 
            gateModal.classList.add('active');
        }
    };

    window.verifyHiddenGatePasswordCredentials = function() {
        const passInput = document.getElementById('gatePasswordInput');
        if (!passInput) return;

        const inputKey = passInput.value.trim();

        if (inputKey === HIDDEN_MASTER_PASSKEY) {
            document.getElementById('hiddenGateModal').classList.remove('active');
            window.location.href = 'admin.html';
        } else {
            alert("❌ SECURITY VIOLATION: Unauthorized Key Sequence Intercepted.");
            passInput.value = '';
        }
    };

    /* ==========================================================================
       ৩. ডার্ক / লাইট থিম মোড সুইচ মডিউল
       ========================================================================== */
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeLabel = document.getElementById('currentThemeLabel');
    
    let savedTheme = localStorage.getItem('mvx_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeUIElements(savedTheme);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            let activeTheme = document.documentElement.getAttribute('data-theme');
            let newTheme = (activeTheme === 'dark') ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('mvx_theme', newTheme);
            updateThemeUIElements(newTheme);
        });
    }

    function updateThemeUIElements(theme) {
        if (!themeLabel) return;
        themeLabel.innerText = (theme === 'dark') ? "Dark Mode" : "Light Mode";
    }

    /* ==========================================================================
       ৪. ইউজার সেশন রিয়েলটাইম লিসেনার ও ইউআই সিঙ্ক (PERMANENT UPDATE)
       ========================================================================== */
    auth.onAuthStateChanged((user) => {
        if (user) {
            db.ref('users/' + user.uid).on('value', (snapshot) => {
                if (!snapshot.exists()) return;
                
                userProfile = snapshot.val();

                const topProfilePic = document.getElementById('topProfileBtn');
                const youTabAvatar = document.getElementById('youTabAvatar');
                
                if (topProfilePic) topProfilePic.src = userProfile.avatarUrl;
                if (youTabAvatar) youTabAvatar.src = userProfile.avatarUrl;

                if (document.getElementById('youTabName')) document.getElementById('youTabName').innerText = userProfile.name;
                if (document.getElementById('youTabEmail')) document.getElementById('youTabEmail').innerText = userProfile.email;
                if (document.getElementById('navCoinDisplay')) document.getElementById('navCoinDisplay').innerText = userProfile.coins || 0;
                if (document.getElementById('userFollowersCount')) document.getElementById('userFollowersCount').innerText = userProfile.followers || 0;
                if (document.getElementById('userFollowingCount')) document.getElementById('userFollowingCount').innerText = userProfile.following || 0;
            });
        }
    });

    /* ==========================================================================
       ৫. রিয়েলটাইম স্মার্ট সার্চ কোড লজিক
       ========================================================================== */
    const searchInput = document.getElementById('storeSearchInput');
    const searchGrid = document.getElementById('searchResultGrid');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            executeSmartSearchProtocol(query);
        });
    }

    function executeSmartSearchProtocol(query) {
        if (!searchGrid) return;
        let activeLang = localStorage.getItem('mvx_lang') || 'en';

        if (query.length === 0) {
            searchGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; grid-column: 1/-1; color: var(--text-secondary);">
                    <i class="fas fa-search-plus" style="font-size: 40px; margin-bottom: 15px; color: var(--border-color);"></i>
                    <h3>${languageDictionary[activeLang].searchPrompt}</h3>
                </div>
            `;
            return;
        }

        searchGrid.innerHTML = `<div style="text-align:center; padding: 30px; grid-column: 1/-1;"><i class="fas fa-spinner fa-spin" style="font-size:26px; color:var(--primary);"></i></div>`;

        db.ref('store_apps').orderByChild('status').equalTo('approved').once('value').then((snapshot) => {
            if (!snapshot.exists()) {
                searchGrid.innerHTML = `<div style="text-align:center; padding:30px; grid-column:1/-1; color:var(--text-secondary);">No items match query inside catalog nodes.</div>`;
                return;
            }

            let html = '';
            let matchCount = 0;

            snapshot.forEach((child) => {
                const app = child.val();
                const appTitle = app.appName.toLowerCase();
                const appDesc = (app.description || "").toLowerCase();
                const appTags = app.tags || [];

                let isMatch = appTitle.includes(query) || appDesc.includes(query);
                
                if (!isMatch) {
                    for (let i = 0; i < appTags.length; i++) {
                        if (appTags[i].toLowerCase().includes(query)) {
                            isMatch = true;
                            break;
                        }
                    }
                }

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

    /* ==========================================================================
       ৬. মাস্টার রিডিম কোড ইঞ্জিন ক্লেইম প্রসেস (MULTIPLE APP BYPASS INCLUDED)
       ========================================================================== */
    window.executeRedeemProtocol = function() {
        const codeInput = document.getElementById('redeemInputCode');
        const statusTxt = document.getElementById('redeemStatusMsg');
        
        if (!codeInput || !statusTxt) return;
        const rawCode = codeInput.value.trim().toUpperCase();

        if (rawCode.length === 0) {
            statusTxt.innerText = "Please input a valid coupon code sequence.";
            statusTxt.style.color = "var(--danger)";
            return;
        }

        statusTxt.innerText = "Connecting Gateway Authentication Banks...";
        statusTxt.style.color = "var(--warning)";

        const user = auth.currentUser;
        const redeemRef = db.ref('redeem_codes/' + rawCode);
        
        redeemRef.once('value').then((snapshot) => {
            if (!snapshot.exists()) {
                statusTxt.innerText = "❌ Invalid or Expired Redeem Token!";
                statusTxt.style.color = "var(--danger)";
                return;
            }

            const codeData = snapshot.val();
            
            if (codeData.currentClaims >= codeData.maxClaims) {
                statusTxt.innerText = "⚠️ Code has reached maximum claim saturation threshold.";
                statusTxt.style.color = "var(--danger)";
                return;
            }

            if (codeData.claimed_users && codeData.claimed_users[user.uid]) {
                statusTxt.innerText = "🚫 Token node usage redundancy constraint: Already claimed once!";
                statusTxt.style.color = "var(--danger)";
                return;
            }

            db.ref('users/' + user.uid).once('value').then((userSnap) => {
                if (!userSnap.exists()) return;
                const userData = userSnap.val();
                let rewardUpdate = {};

                if (codeData.rewardType === 'coins') {
                    // Coin balance injection allocation
                    const bonusCoins = parseInt(codeData.rewardValue) || 0;
                    const currentBalance = parseInt(userData.coins) || 0;
                    rewardUpdate['coins'] = currentBalance + bonusCoins;
                    statusTxt.innerText = `🎉 Wallet Successfully Allocated +${bonusCoins} MVX Coins!`;
                } 
                else if (codeData.rewardType === 'premium_bypass') {
                    // Advanced Multi-App Bypass Mapping Processor
                    const appTargetValue = codeData.rewardValue;

                    if (appTargetValue.toLowerCase() === 'all_apps') {
                        // Unlocks all applications live in catalog with a single trigger
                        db.ref('store_apps').once('value').then((allAppsSnap) => {
                            if (allAppsSnap.exists()) {
                                allAppsSnap.forEach((appChild) => {
                                    rewardUpdate[`unlocked_apps/${appChild.key}`] = true;
                                });
                                finishRedeemTransactionUpdatePipeline(user.uid, userData, redeemRef, codeData, rewardUpdate, "🚀 Universal Master Package Access Bypass Enabled!");
                            }
                        });
                        return; // Breaks the inline async execution to avoid race conditions
                    } else if (appTargetValue.includes(',')) {
                        // Splits comma-separated values to unlock explicitly targeted multiple items
                        const multipleAppsList = appTargetValue.split(',');
                        multipleAppsList.forEach((id) => {
                            let cleanId = id.trim();
                            if(cleanId) rewardUpdate[`unlocked_apps/${cleanId}`] = true;
                        });
                        finishRedeemTransactionUpdatePipeline(user.uid, userData, redeemRef, codeData, rewardUpdate, "🚀 Multiple Custom Premium Target Packages Unlocked!");
                        return;
                    } else {
                        // Standard Single Application Unlock Target
                        rewardUpdate[`unlocked_apps/${appTargetValue}`] = true;
                        finishRedeemTransactionUpdatePipeline(user.uid, userData, redeemRef, codeData, rewardUpdate, "🚀 Target Premium Application Unlocked Successfully.");
                        return;
                    }
                }

                // Fallback operational router for coins rewards
                finishRedeemTransactionUpdatePipeline(user.uid, userData, redeemRef, codeData, rewardUpdate, null);
            });
        }).catch((err) => {
            statusTxt.innerText = "Sync failure token mismatch: " + err.message;
            statusTxt.style.color = "var(--danger)";
        });
    };

    // Subroutine to process batch atomic voucher updates across ledger nodes
    function finishRedeemTransactionUpdatePipeline(uid, userData, redeemRef, codeData, rewardUpdate, successOverrideText) {
        const statusTxt = document.getElementById('redeemStatusMsg');
        const codeInput = document.getElementById('redeemInputCode');

        statusTxt.style.color = "var(--success)";
        if(successOverrideText) {
            statusTxt.innerText = successOverrideText;
        }

        // 1. Commit rewards updates to target profile node map
        db.ref('users/' + uid).update(rewardUpdate);

        // 2. Adjust voucher ledger allocation structures
        let codeUpdates = {};
        codeUpdates['currentClaims'] = (codeData.currentClaims || 0) + 1;
        codeUpdates[`claimed_users/${uid}`] = {
            name: userData.name,
            email: userData.email,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        redeemRef.update(codeUpdates);
        if(codeInput) codeInput.value = '';
    }

    // Account Profile Metadata Changes Synchronizer
    window.saveProfileChanges = function() {
        const user = auth.currentUser;
        if (!user || !userProfile) return;

        const editNameInput = document.getElementById('editNameInput');
        const editAvatarInput = document.getElementById('editAvatarInput');
        const newName = editNameInput ? editNameInput.value.trim() : "";
        const newAvatar = editAvatarInput ? editAvatarInput.value.trim() : "";

        if (!newName) {
            alert("⚠️ Display identity parameter missing.");
            return;
        }

        db.ref('users/' + user.uid).update({
            name: newName,
            avatarUrl: newAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newName}`
        }).then(() => {
            const modal = document.getElementById('profileEditModal');
            if (modal) modal.classList.remove('active');
            alert("Database synchronized profile changes complete!");
        });
    };

    // Secure Account Sign-out Routines
    window.secureLogout = function() {
        if (confirm("Clear local cache and close active storage network pipeline?")) {
            localStorage.clear(); // Changes to local persistent memory wipeouts
            auth.signOut().then(() => window.location.replace('login.html'));
        }
    };
});
