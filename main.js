/* ==========================================================================
   MVX STORE V5.6 - MAIN SYSTEM ARCHITECTURE
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
            searchTitle: "স্মার্ট সার্চ ইঞ্জিন",
            searchPrompt: "অ্যাপের নাম অথবা ট্যাগ লিখে সার্চ করুন",
            searchInput: "অ্যাপস, ফাইল, মড বা ট্যাগ খুঁজুন...",
            notiTitle: "সিস্টেম নোটিফিকেশন",
            clearScreen: "স্ক্রিন ক্লিয়ার করুন",
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
        },
        es: {
            storeTitle: "TIENDA MVX",
            loadingStore: "Escaneando la infraestructura de la base de datos...",
            catAll: "Todos los artículos",
            catTrending: "Tendencias ahora",
            catPremium: "Aplicaciones Premium",
            searchTitle: "Motor de búsqueda inteligente",
            searchPrompt: "Escriba cualquier palabra clave para obtener datos",
            searchInput: "Buscar aplicaciones, archivos o etiquetas...",
            notiTitle: "Notificaciones del sistema",
            clearScreen: "Limpiar pantalla",
            claimTitle: "Reclamar código de regalo premium",
            claimInput: "Ingrese el código del cupón",
            btnClaim: "RECLAMAR",
            uploadApp: "Publicar archivo de paquete",
            coinBalance: "Saldo de monedas MVX",
            signOut: "Cierre de sesión seguro",
            navFiles: "Archivos",
            navModApp: "Aplicación Mod",
            navSearch: "Buscar",
            navYou: "Tú",
            passPrompt: "Ingrese la secuencia de la clave pin de acceso"
        },
        hi: {
            storeTitle: "एमवीएक्स स्टोर",
            loadingStore: "डेटाबेस इन्फ्रास्ट्रक्चर स्कैन किया जा रहा है...",
            catAll: "सभी आइटम",
            catTrending: "अभी ट्रेंडिंग",
            catPremium: "प्रीमियम ऐप्स",
            searchTitle: "स्मार्ट सर्च थैंक्स",
            searchPrompt: "एप्लिकेशन डेटा लाने के लिए कोई भी कीवर्ड टाइप करें",
            searchInput: "ऐप्स, फ़ाइलें, मॉड या टैग खोजें...",
            notiTitle: "सिस्टम सूचनाएं",
            clearScreen: "स्क्रीन साफ़ करें",
            claimTitle: "प्रीमियम उपहार कोड का दावा करें",
            claimInput: "रिडीम वाउचर कोड दर्ज करें",
            btnClaim: "दावा करें",
            uploadApp: "पैकेज फ़ाइल प्रकाशित करें",
            coinBalance: "एमवीएक्स सिक्का शेष",
            signOut: "सुरक्षित साइन आउट",
            navFiles: "फ़ाइलें",
            navModApp: "मोड ऐप",
            navSearch: "खोजें",
            navYou: "आप",
            passPrompt: "एक्सेस टोकन पिन कुंजी अनुक्रम दर्ज करें"
        },
        ar: {
            storeTitle: "متجر MVX",
            loadingStore: "جاري فحص بنية قاعدة البيانات...",
            catAll: "جميع المواد",
            catTrending: "الشائع الآن",
            catPremium: "التطبيقات المميزة",
            searchTitle: "محرك البحث الذكي",
            searchPrompt: "اكتب أي كلمة رئيسية لجلب البيانات",
            searchInput: "ابحث عن التطبيقات أو الملفات أو العلامات...",
            notiTitle: "إشعارات النظام",
            clearScreen: "مسح الشاشة",
            claimTitle: "مطالبة برمز هدية مميز",
            claimInput: "أدخل رمز قسيمة الرديم",
            btnClaim: "مطالبة",
            uploadApp: "نشر ملف الحزمة",
            coinBalance: "رصيد عملات MVX",
            signOut: "تسجيل خروج آمن",
            navFiles: "الملفات",
            navModApp: "تطبيق مود",
            navSearch: "بحث",
            navYou: "أنت",
            passPrompt: "أدخل تسلسل مفتاح رمز الوصول"
        }
    };

    window.applySystemLanguageLocalization = function(lang) {
        localStorage.setItem('mvx_lang', lang);
        const dict = languageDictionary[lang] || languageDictionary['en'];

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

    const HIDDEN_MASTER_PASSKEY = "121345";

    window.startMasterLockTimer = function() {
        window.isMasterTimerActive = false;
        masterPressTimer = setTimeout(() => {
            window.isMasterTimerActive = true;
            triggerHiddenPasswordGate();
        }, 5000); 
    };

    window.clearMasterLockTimer = function() {
        if (masterPressTimer) {
            clearTimeout(masterPressTimer);
        }
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

    const themeBtn = document.getElementById('themeToggleBtn');
    const themeLabel = document.getElementById('currentThemeLabel');
    
    let savedTheme = localStorage.getItem('mvx_theme') || 'dark';
    
    db.ref('settings/defaultTheme').once('value').then(snap => {
        if(snap.exists() && !localStorage.getItem('mvx_theme')) {
            savedTheme = snap.val();
        }
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

    auth.onAuthStateChanged((user) => {
        const topLoginBtn = document.getElementById('topLoginBtn');
        const topProfilePic = document.getElementById('topProfileBtn');
        const menuPublishItem = document.getElementById('menuPublishItem');
        const menuCoinItem = document.getElementById('menuCoinItem');
        const menuSignOutItem = document.getElementById('menuSignOutItem');
        const redeemBoxSection = document.getElementById('redeemBoxSection');
        const youTabAvatar = document.getElementById('youTabAvatar');
        const youTabName = document.getElementById('youTabName');
        const youTabEmail = document.getElementById('youTabEmail');

        if (user) {
            // UI elements for logged in user
            if(topLoginBtn) topLoginBtn.style.display = 'none';
            if(topProfilePic) topProfilePic.style.display = 'block';
            if(menuPublishItem) menuPublishItem.style.display = 'flex';
            if(menuCoinItem) menuCoinItem.style.display = 'flex';
            if(menuSignOutItem) menuSignOutItem.style.display = 'flex';
            if(redeemBoxSection) redeemBoxSection.style.display = 'block';

            db.ref('users/' + user.uid).on('value', (snapshot) => {
                if (!snapshot.exists()) return;
                
                userProfile = snapshot.val();
                
                if (user.email === "sktausif771@gmail.com") {
                    userProfile.role = "owner";
                    sessionStorage.setItem('mvx_role', 'owner');
                    db.ref('users/' + user.uid + '/role').set('owner');
                } else {
                    sessionStorage.setItem('mvx_role', userProfile.role || 'user');
                }

                if (topProfilePic) topProfilePic.src = userProfile.avatarUrl;
                if (youTabAvatar) youTabAvatar.src = userProfile.avatarUrl;

                if (youTabName) youTabName.innerText = userProfile.name;
                if (youTabEmail) youTabEmail.innerText = userProfile.email;
                if (document.getElementById('navCoinDisplay')) document.getElementById('navCoinDisplay').innerText = userProfile.coins || 0;
            });
        } else {
            // UI elements for logged out user (Guest mode)
            sessionStorage.removeItem('mvx_role');
            sessionStorage.removeItem('mvx_session');
            userProfile = null;

            if(topLoginBtn) topLoginBtn.style.display = 'block';
            if(topProfilePic) topProfilePic.style.display = 'none';
            if(menuPublishItem) menuPublishItem.style.display = 'none';
            if(menuCoinItem) menuCoinItem.style.display = 'none';
            if(menuSignOutItem) menuSignOutItem.style.display = 'none';
            if(redeemBoxSection) redeemBoxSection.style.display = 'none';

            if (youTabAvatar) youTabAvatar.src = "https://via.placeholder.com/70/121212/00e6b8?text=GUEST";
            if (youTabName) youTabName.innerText = "Guest User";
            if (youTabEmail) youTabEmail.innerText = "Please login to access profile";
        }
    });

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
                    <h3>${(languageDictionary[activeLang] || languageDictionary['en']).searchPrompt}</h3>
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
                    const bonusCoins = parseInt(codeData.rewardValue) || 0;
                    const currentBalance = parseInt(userData.coins) || 0;
                    rewardUpdate['coins'] = currentBalance + bonusCoins;
                    statusTxt.innerText = `🎉 Wallet Successfully Allocated +${bonusCoins} MVX Coins!`;
                } 
                else if (codeData.rewardType === 'premium_bypass') {
                    const appTargetValue = codeData.rewardValue;

                    if (appTargetValue.toLowerCase() === 'all_apps') {
                        db.ref('store_apps').once('value').then((allAppsSnap) => {
                            if (allAppsSnap.exists()) {
                                allAppsSnap.forEach((appChild) => {
                                    rewardUpdate[`unlocked_apps/${appChild.key}`] = true;
                                    rewardUpdate[`unlocked_passwords/${appChild.key}`] = true;
                                });
                                finishRedeemTransactionUpdatePipeline(user.uid, userData, redeemRef, codeData, rewardUpdate, "🚀 Universal Master Package Access Bypass Enabled!");
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
                        finishRedeemTransactionUpdatePipeline(user.uid, userData, redeemRef, codeData, rewardUpdate, "🚀 Multiple Custom Premium Target Packages Unlocked!");
                        return;
                    } else {
                        rewardUpdate[`unlocked_apps/${appTargetValue}`] = true;
                        rewardUpdate[`unlocked_passwords/${appTargetValue}`] = true;
                        finishRedeemTransactionUpdatePipeline(user.uid, userData, redeemRef, codeData, rewardUpdate, "🚀 Target Premium Application Unlocked Successfully.");
                        return;
                    }
                }

                finishRedeemTransactionUpdatePipeline(user.uid, userData, redeemRef, codeData, rewardUpdate, null);
            });
        }).catch((err) => {
            statusTxt.innerText = "Sync failure token mismatch: " + err.message;
            statusTxt.style.color = "var(--danger)";
        });
    };

    function finishRedeemTransactionUpdatePipeline(uid, userData, redeemRef, codeData, rewardUpdate, successOverrideText) {
        const statusTxt = document.getElementById('redeemStatusMsg');
        const codeInput = document.getElementById('redeemInputCode');

        statusTxt.style.color = "var(--success)";
        if(successOverrideText) {
            statusTxt.innerText = successOverrideText;
        }

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

    window.safeOpenURLInNewTab = function(url) {
        if (!url || url.trim() === "" || url === "#") return;
        let targetUrl = url.trim();
        
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'https://' + targetUrl;
        }
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

    window.secureLogout = function() {
        if (confirm("Clear local cache and close active storage network pipeline?")) {
            sessionStorage.clear(); 
            auth.signOut().then(() => window.location.replace('login.html'));
        }
    };
});
