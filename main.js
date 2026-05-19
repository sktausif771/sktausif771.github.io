/* ==========================================================================
   MVX STORE V5.6 - MAIN SYSTEM ARCHITECTURE, FIVE-SEC HOLD GATE & MULTI-LANG
   ========================================================================== */

let userProfile = null;
let masterPressTimer = null;
window.isMasterTimerActive = false;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') {
        console.error("Critical Runtime Failure: Firebase Core SDK Missing inside main.js pipeline.");
        return;
    }

    const db = firebase.database();
    const auth = firebase.auth();

    // ==========================================================================
    // REAL-TIME MAINTENANCE MODE TRACKER
    // ==========================================================================
    db.ref('settings/maintenanceMode').on('value', (snapshot) => {
        const isMaintenanceActive = snapshot.val();
        if (isMaintenanceActive === true) {
            const currentRole = sessionStorage.getItem('mvx_role');
            if (currentRole !== 'owner') {
                alert("🛠 System Update: Server is undergoing maintenance. You are being securely logged out.");
                sessionStorage.clear();
                auth.signOut().then(() => {
                    window.location.replace('login.html?error=maintenance');
                });
            }
        }
    });

    // ==========================================================================
    // MULTI-LANGUAGE DICTIONARY
    // ==========================================================================
    const languageDictionary = {
        en: {
            storeTitle: "MVX STORE", loadingStore: "Scanning Database Infrastructure...",
            catAll: "All Items", catTrending: "Trending Now", catPremium: "Premium Apps",
            searchTitle: "Smart Search Engine", searchPrompt: "Type any keyword or tag to fetch application data",
            searchInput: "Search apps, files, mods or tags...", notiTitle: "System Notifications",
            clearScreen: "Clear Screen", claimTitle: "Claim Premium Gift Code",
            claimInput: "Enter Redeem Voucher Code", btnClaim: "CLAIM", uploadApp: "Publish Package File",
            coinBalance: "MVX Coin Balance", signOut: "Secure Sign Out", navFiles: "Files",
            navModApp: "Mod App", navSearch: "Search", navYou: "You", passPrompt: "Enter Access Token Pin Key Sequence",
            editProfile: "Edit Profile", myUploads: "My Uploads", coinHistory: "Coin History", logout: "Logout"
        },
        bn: {
            storeTitle: "এমভিএক্স স্টোর", loadingStore: "ডাটাবেজ কানেকশন চেক করা হচ্ছে...",
            catAll: "সব ফাইল", catTrending: "ট্রেন্ডিং ফাইল", catPremium: "প্রিমিয়াম অ্যাপস",
            searchTitle: "স্মার্ট সার্চ ইঞ্জিন", searchPrompt: "অ্যাপের নাম অথবা ট্যাগ লিখে সার্চ করুন",
            searchInput: "অ্যাপস, ফাইল, মড বা ট্যাগ খুঁজুন...", notiTitle: "সিস্টেম নোটিফিকেশন",
            clearScreen: "স্ক্রিন ক্লিয়ার করুন", claimTitle: "প্রিমিয়াম গিফট কোড ক্লেইম করুন",
            claimInput: "রিডিম ভাউচার কোড দিন", btnClaim: "ক্লেইম", uploadApp: "নতুন ফাইল আপলোড করুন",
            coinBalance: "এমভিএক্স কয়েন ব্যালেন্স", signOut: "নিরাপদ লগআউট", navFiles: "ফাইলস",
            navModApp: "মড অ্যাপ", navSearch: "সার্চ", navYou: "প্রোফাইল", passPrompt: "অ্যাডমিন প্যানেল সিকিউরিটি পিন কোড দিন",
            editProfile: "প্রোফাইল এডিট", myUploads: "আমার আপলোড", coinHistory: "কয়েন হিস্টোরি", logout: "লগআউট"
        },
        es: {
            storeTitle: "TIENDA MVX", loadingStore: "Escaneando la infraestructura...",
            catAll: "Todos", catTrending: "Tendencias", catPremium: "Premium",
            searchTitle: "Búsqueda", searchPrompt: "Escriba cualquier palabra clave",
            searchInput: "Buscar apps...", notiTitle: "Notificaciones",
            clearScreen: "Limpiar", claimTitle: "Reclamar código",
            claimInput: "Ingrese el código", btnClaim: "RECLAMAR", uploadApp: "Publicar archivo",
            coinBalance: "Saldo MVX", signOut: "Salir", navFiles: "Archivos",
            navModApp: "Mod App", navSearch: "Buscar", navYou: "Tú", passPrompt: "Ingrese la clave pin",
            editProfile: "Editar Perfil", myUploads: "Mis Subidas", coinHistory: "Historial", logout: "Salir"
        },
        hi: {
            storeTitle: "एमवीएक्स स्टोर", loadingStore: "डेटाबेस स्कैन किया जा रहा...",
            catAll: "सभी", catTrending: "ट्रेंडिंग", catPremium: "प्रीमियम",
            searchTitle: "स्मार्ट सर्च", searchPrompt: "कीवर्ड टाइप करें",
            searchInput: "ऐप्स खोजें...", notiTitle: "सूचनाएं",
            clearScreen: "साफ़ करें", claimTitle: "कोड क्लेम करें",
            claimInput: "कोड दर्ज करें", btnClaim: "क्लेम", uploadApp: "अपलोड करें",
            coinBalance: "कॉइन बैलेंस", signOut: "लॉगआउट", navFiles: "फ़ाइलें",
            navModApp: "मॉड ऐप", navSearch: "खोजें", navYou: "आप", passPrompt: "पिन कोड दर्ज करें",
            editProfile: "प्रोफ़ाइल एडिट", myUploads: "मेरे अपलोड", coinHistory: "कॉइन हिस्ट्री", logout: "लॉगआउट"
        },
        ar: {
            storeTitle: "متجر MVX", loadingStore: "جاري فحص البنية...",
            catAll: "الكل", catTrending: "الأكثر شيوعاً", catPremium: "المميزة",
            searchTitle: "بحث ذكي", searchPrompt: "اكتب أي كلمة رئيسية",
            searchInput: "ابحث عن تطبيقات...", notiTitle: "الإشعارات",
            clearScreen: "مسح", claimTitle: "استرداد رمز",
            claimInput: "أدخل الرمز", btnClaim: "استرداد", uploadApp: "نشر ملف",
            coinBalance: "رصيد العملات", signOut: "خروج", navFiles: "الملفات",
            navModApp: "تطبيق مود", navSearch: "بحث", navYou: "أنت", passPrompt: "أدخل رمز الوصول",
            editProfile: "تعديل الملف", myUploads: "تحميلاتي", coinHistory: "سجل العملات", logout: "خروج"
        }
    };

    window.applySystemLanguageLocalization = function(lang) {
        localStorage.setItem('mvx_lang', lang);
        const dict = languageDictionary[lang] || languageDictionary['en'];

        const mapping = {
            'lblStoreTitle': dict.storeTitle, 'lblLoadingStore': dict.loadingStore,
            'btnCatAll': dict.catAll, 'btnCatTrending': dict.catTrending, 'btnCatPremium': dict.catPremium,
            'lblSearchTitle': dict.searchTitle, 'lblSearchPrompt': `<h3>${dict.searchPrompt}</h3>`,
            'lblNotiTitle': `<i class="fas fa-envelope-open-text" style="color: var(--primary);"></i> ${dict.notiTitle}`,
            'btnClearScreen': dict.clearScreen, 'lblClaimTitle': `<i class="fas fa-gift" style="color: var(--primary);"></i> ${dict.claimTitle}`,
            'btnClaimCode': dict.btnClaim, 'lblUploadApp': dict.uploadApp, 'lblCoinBalance': dict.coinBalance,
            'lblSignOut': dict.signOut, 'navFiles': dict.navFiles, 'navModApp': dict.navModApp,
            'navSearch': dict.navSearch, 'navYou': dict.navYou, 'lblPassPrompt': dict.passPrompt,
            'lblEditProfile': dict.editProfile, 'lblMyUploads': dict.myUploads,
            'lblCoinHistory': dict.coinHistory, 'lblLogout': dict.logout
        };

        for (const [id, value] of Object.entries(mapping)) {
            const el = document.getElementById(id);
            if (el) {
                if (id === 'lblSearchPrompt' || id === 'lblNotiTitle' || id === 'lblClaimTitle') el.innerHTML = value;
                else el.innerText = value;
            }
        }

        const sInput = document.getElementById('storeSearchInput');
        if(sInput) sInput.placeholder = dict.searchInput;
        const rInput = document.getElementById('redeemInputCode');
        if(rInput) rInput.placeholder = dict.claimInput;

        const langLabel = document.getElementById('currentLanguageLabel');
        if(langLabel) {
            const labels = { en: "English", bn: "বাংলা", es: "Español", hi: "हिन्दी", ar: "العربية" };
            langLabel.innerText = labels[lang] || "English";
        }
    };

    window.changeSystemLanguage = function(lang) {
        applySystemLanguageLocalization(lang);
        document.getElementById('languageSelectModal').classList.remove('active');
    };

    let savedLang = localStorage.getItem('mvx_lang') || 'en';
    applySystemLanguageLocalization(savedLang);
    const langSelectorEl = document.getElementById('sysLanguageSelector');
    if(langSelectorEl) langSelectorEl.value = savedLang;

    // ==========================================================================
    // 5 SECOND HOLD MASTER GATE
    // ==========================================================================
    const HIDDEN_MASTER_PASSKEY = "121345";

    window.startMasterLockTimer = function() {
        window.isMasterTimerActive = false;
        masterPressTimer = setTimeout(() => {
            window.isMasterTimerActive = true;
            triggerHiddenPasswordGate();
        }, 5000);
    };

    window.clearMasterLockTimer = function() {
        if (masterPressTimer) clearTimeout(masterPressTimer);
    };

    function triggerHiddenPasswordGate() {
        if (!userProfile) {
            const gateModal = document.getElementById('hiddenGateModal');
            const passInput = document.getElementById('gatePasswordInput');
            if (gateModal) {
                if(passInput) passInput.value = '';
                gateModal.classList.add('active');
            }
            return;
        }
        
        if (userProfile.role === 'owner') {
            window.location.href = 'admin.html';
            return;
        }

        const gateModal = document.getElementById('hiddenGateModal');
        const passInput = document.getElementById('gatePasswordInput');
        if (gateModal) {
            if(passInput) passInput.value = '';
            gateModal.classList.add('active');
        }
    }

    window.verifyHiddenGatePasswordCredentials = function() {
        const passInput = document.getElementById('gatePasswordInput');
        if (!passInput) return;

        const inputKey = passInput.value.trim();

        if (inputKey === HIDDEN_MASTER_PASSKEY) {
            document.getElementById('hiddenGateModal').classList.remove('active');
            sessionStorage.setItem('mvx_role', 'owner');
            
            const currentUser = firebase.auth().currentUser;
            if (currentUser && userProfile) {
                if (currentUser.email === "sktausif771@gmail.com") {
                    firebase.database().ref(`users/${currentUser.uid}/role`).set('owner');
                }
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'admin.html';
            }
        } else {
            alert("❌ SECURITY VIOLATION: Unauthorized Key Sequence Intercepted.");
            passInput.value = '';
        }
    };

    // ==========================================================================
    // THEME SWITCH
    // ==========================================================================
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeLabel = document.getElementById('currentThemeLabel');
    
    let savedTheme = localStorage.getItem('mvx_theme') || 'dark';
    
    db.ref('settings/defaultTheme').once('value').then(snap => {
        if(snap.exists() && !localStorage.getItem('mvx_theme')) savedTheme = snap.val();
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeUIElements(savedTheme);
    });

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

    // ==========================================================================
    // USER SESSION LISTENER
    // ==========================================================================
    auth.onAuthStateChanged((user) => {
        if (user) {
            db.ref('users/' + user.uid).on('value', (snapshot) => {
                if (!snapshot.exists()) return;
                
                userProfile = snapshot.val();
                
                // Force owner role for specific email
                if (user.email === "sktausif771@gmail.com") {
                    userProfile.role = "owner";
                    sessionStorage.setItem('mvx_role', 'owner');
                    db.ref('users/' + user.uid + '/role').set('owner');
                } else {
                    sessionStorage.setItem('mvx_role', userProfile.role || 'user');
                }

                const topProfilePic = document.getElementById('topProfileBtn');
                const youTabAvatar = document.getElementById('youTabAvatar');
                const dropdownAvatar = document.getElementById('dropdownAvatar');
                const dropdownName = document.getElementById('dropdownName');
                const dropdownEmail = document.getElementById('dropdownEmail');
                
                if (topProfilePic) topProfilePic.src = userProfile.avatarUrl;
                if (youTabAvatar) youTabAvatar.src = userProfile.avatarUrl;
                if (dropdownAvatar) dropdownAvatar.src = userProfile.avatarUrl;
                if (dropdownName) dropdownName.innerText = userProfile.name;
                if (dropdownEmail) dropdownEmail.innerText = userProfile.email;

                if (document.getElementById('youTabName')) document.getElementById('youTabName').innerText = userProfile.name;
                if (document.getElementById('youTabEmail')) document.getElementById('youTabEmail').innerText = userProfile.email;
                if (document.getElementById('navCoinDisplay')) document.getElementById('navCoinDisplay').innerText = userProfile.coins || 0;
                if (document.getElementById('userFollowersCount')) document.getElementById('userFollowersCount').innerText = userProfile.followers || 0;
                if (document.getElementById('userFollowingCount')) document.getElementById('userFollowingCount').innerText = userProfile.following || 0;
            });
        } else {
            sessionStorage.removeItem('mvx_role');
            sessionStorage.removeItem('mvx_session');
            userProfile = null;
        }
    });

    // ==========================================================================
    // SMART SEARCH
    // ==========================================================================
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
            searchGrid.innerHTML = `<div style="text-align: center; padding: 40px; grid-column: 1/-1; color: var(--text-secondary);">
                <i class="fas fa-search-plus" style="font-size: 40px; margin-bottom: 15px; color: var(--border-color);"></i>
                <h3>${(languageDictionary[activeLang] || languageDictionary['en']).searchPrompt}</h3></div>`;
            return;
        }

        searchGrid.innerHTML = `<div style="text-align:center; padding: 30px; grid-column: 1/-1;"><i class="fas fa-spinner fa-spin" style="font-size:26px; color:var(--primary);"></i></div>`;

        db.ref('store_apps').orderByChild('status').equalTo('approved').once('value').then((snapshot) => {
            if (!snapshot.exists()) {
                searchGrid.innerHTML = `<div style="text-align:center; padding:30px; grid-column:1/-1; color:var(--text-secondary);">No items match query.</div>`;
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
                        if (appTags[i].toLowerCase().includes(query)) { isMatch = true; break; }
                    }
                }
                if (!isMatch && appTitle.replace(/\s+/g, '').includes(query.replace(/\s+/g, ''))) isMatch = true;

                if (isMatch) {
                    matchCount++;
                    const priceLabel = app.category === 'paid' ? `${app.coinPrice || 0} Coins` : 'FREE';
                    const badgeClass = app.category === 'paid' ? 'badge-paid' : 'badge-free';
                    html += `<div class="app-card" onclick="window.location.href='details.html?id=${child.key}'">
                        <span class="badge ${badgeClass}">${priceLabel}</span>
                        <img src="${app.logoUrl}" class="app-icon-large" onerror="this.src='https://via.placeholder.com/75/121212/00e6b8?text=FILE'">
                        <div class="app-info-list">
                            <h3 class="app-title-list">${app.appName}</h3>
                            <div class="app-dev-list">${app.uploaderName || "Developer"} • ${app.size || "0 MB"}</div>
                            <div class="app-meta-list"><span style="color:var(--primary); font-weight:700;"><i class="fas fa-arrow-alt-circle-down"></i> ${app.downloads || 0}</span><span>v${app.version || "1.0"}</span></div>
                        </div>
                    </div>`;
                }
            });

            if (matchCount > 0) searchGrid.innerHTML = html;
            else searchGrid.innerHTML = `<div style="text-align:center; padding:40px; grid-column:1/-1; color:var(--text-secondary);">
                <i class="fas fa-frown" style="font-size:30px; margin-bottom:10px; color:var(--danger);"></i><p>No results found.</p></div>`;
        });
    }

    // ==========================================================================
    // REDEEM CODE ENGINE
    // ==========================================================================
    window.executeRedeemProtocol = function() {
        const codeInput = document.getElementById('redeemInputCode');
        const statusTxt = document.getElementById('redeemStatusMsg');
        if (!codeInput || !statusTxt) return;
        const rawCode = codeInput.value.trim().toUpperCase();

        if (rawCode.length === 0) {
            statusTxt.innerText = "Please input a valid coupon code.";
            statusTxt.style.color = "var(--danger)";
            return;
        }

        statusTxt.innerText = "Connecting...";
        statusTxt.style.color = "var(--warning)";

        const user = auth.currentUser;
        const redeemRef = db.ref('redeem_codes/' + rawCode);
        
        redeemRef.once('value').then((snapshot) => {
            if (!snapshot.exists()) {
                statusTxt.innerText = "❌ Invalid or Expired Code!";
                statusTxt.style.color = "var(--danger)";
                return;
            }

            const codeData = snapshot.val();
            if (codeData.currentClaims >= codeData.maxClaims) {
                statusTxt.innerText = "⚠️ Code has reached maximum claims.";
                statusTxt.style.color = "var(--danger)";
                return;
            }
            if (codeData.claimed_users && codeData.claimed_users[user.uid]) {
                statusTxt.innerText = "🚫 Already claimed once!";
                statusTxt.style.color = "var(--danger)";
                return;
            }

            db.ref('users/' + user.uid).once('value').then((userSnap) => {
                if (!userSnap.exists()) return;
                const userData = userSnap.val();
                let rewardUpdate = {};

                if (codeData.rewardType === 'coins') {
                    const bonusCoins = parseInt(codeData.rewardValue) || 0;
                    const currentBalance = parseInt(userData.coins) || 0;
                    rewardUpdate['coins'] = currentBalance + bonusCoins;
                    statusTxt.innerText = `🎉 +${bonusCoins} MVX Coins Added!`;
                } else if (codeData.rewardType === 'premium_bypass') {
                    const appTargetValue = codeData.rewardValue;
                    if (appTargetValue.toLowerCase() === 'all_apps') {
                        db.ref('store_apps').once('value').then((allAppsSnap) => {
                            if (allAppsSnap.exists()) {
                                allAppsSnap.forEach((appChild) => {
                                    rewardUpdate[`unlocked_apps/${appChild.key}`] = true;
                                    rewardUpdate[`unlocked_passwords/${appChild.key}`] = true;
                                });
                                finishRedeemTransaction(user.uid, userData, redeemRef, codeData, rewardUpdate, "🚀 All Apps Unlocked!");
                            }
                        });
                        return;
                    } else if (appTargetValue.includes(',')) {
                        const multipleAppsList = appTargetValue.split(',');
                        multipleAppsList.forEach((id) => {
                            let cleanId = id.trim();
                            if(cleanId) {
                                rewardUpdate[`unlocked_apps/${cleanId}`] = true;
                                rewardUpdate[`unlocked_passwords/${cleanId}`] = true;
                            }
                        });
                        finishRedeemTransaction(user.uid, userData, redeemRef, codeData, rewardUpdate, "🚀 Multiple Apps Unlocked!");
                        return;
                    } else {
                        rewardUpdate[`unlocked_apps/${appTargetValue}`] = true;
                        rewardUpdate[`unlocked_passwords/${appTargetValue}`] = true;
                        finishRedeemTransaction(user.uid, userData, redeemRef, codeData, rewardUpdate, "🚀 Premium App Unlocked!");
                        return;
                    }
                }
                finishRedeemTransaction(user.uid, userData, redeemRef, codeData, rewardUpdate, null);
            });
        }).catch((err) => {
            statusTxt.innerText = "Error: " + err.message;
            statusTxt.style.color = "var(--danger)";
        });
    };

    function finishRedeemTransaction(uid, userData, redeemRef, codeData, rewardUpdate, successText) {
        const statusTxt = document.getElementById('redeemStatusMsg');
        const codeInput = document.getElementById('redeemInputCode');

        statusTxt.style.color = "var(--success)";
        if(successText) statusTxt.innerText = successText;

        db.ref('users/' + uid).update(rewardUpdate);

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

    // ==========================================================================
    // UTILITIES
    // ==========================================================================
    window.safeOpenURLInNewTab = function(url) {
        if (!url || url.trim() === "" || url === "#") return;
        let targetUrl = url.trim();
        if (!/^https?:\/\//i.test(targetUrl)) targetUrl = 'https://' + targetUrl;
        window.open(targetUrl, '_blank');
    };

    window.saveProfileChanges = function() {
        const user = auth.currentUser;
        if (!user || !userProfile) return;

        const editNameInput = document.getElementById('editNameInput');
        const editAvatarInput = document.getElementById('editAvatarInput');
        const newName = editNameInput ? editNameInput.value.trim() : "";
        const newAvatar = editAvatarInput ? editAvatarInput.value.trim() : "";

        if (!newName) {
            alert("⚠️ Name is required.");
            return;
        }

        db.ref('users/' + user.uid).update({
            name: newName,
            avatarUrl: newAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newName}`
        }).then(() => {
            const modal = document.getElementById('profileEditModal');
            if (modal) modal.classList.remove('active');
            alert("Profile updated!");
        });
    };

    window.saveProfileChangesWithImage = function() {
        const user = auth.currentUser;
        if (!user || !userProfile) return;

        const editNameInput = document.getElementById('editNameInput');
        const newName = editNameInput ? editNameInput.value.trim() : "";
        
        if (!newName) {
            alert("⚠️ Name is required.");
            return;
        }

        const fileInput = document.getElementById('editAvatarFile');
        const status = document.getElementById('avatarUploadStatus');
        
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            status.innerText = "Uploading to ImgBB...";
            status.style.color = "var(--warning)";
            
            const formData = new FormData();
            formData.append("image", file);
            
            fetch(`https://api.imgbb.com/1/upload?key=820eb9aa6a57f863045a52c1929efc9c`, {
                method: "POST",
                body: formData
            }).then(res => res.json()).then(json => {
                if (json.success) {
                    const avatarUrl = json.data.url;
                    db.ref('users/' + user.uid).update({
                        name: newName,
                        avatarUrl: avatarUrl
                    }).then(() => {
                        status.innerText = "Upload Complete!";
                        status.style.color = "var(--success)";
                        setTimeout(() => {
                            const modal = document.getElementById('profileEditModal');
                            if (modal) modal.classList.remove('active');
                            alert("Profile updated with new image!");
                        }, 1000);
                    });
                } else {
                    status.innerText = "Upload failed. Using default avatar.";
                    status.style.color = "var(--danger)";
                    saveProfileChanges();
                }
            }).catch(() => {
                status.innerText = "Network error. Using default avatar.";
                status.style.color = "var(--danger)";
                saveProfileChanges();
            });
        } else {
            saveProfileChanges();
        }
    };

    window.secureLogout = function() {
        if (confirm("Clear local cache and logout?")) {
            sessionStorage.clear();
            auth.signOut().then(() => window.location.replace('login.html'));
        }
    };
});