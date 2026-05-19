/* ==========================================================================
   MVX STORE V5.6 - FIREBASE CORE CONFIG & ADVANCED AUTONOMOUS AUTH INTERCEPTOR
   ========================================================================== */

// ফিক্স: var এবং window. ব্যবহার করা হয়েছে যাতে login.html ফাইল একে সহজেই খুঁজে পায়
var firebaseConfig = {
    apiKey: "AIzaSyAS3UXXrio_-c9uPbHwpDuTVrP-p8d903w",
    authDomain: "white-2k-17-v4.firebaseapp.com",
    databaseURL: "https://white-2k-17-v4-default-rtdb.firebaseio.com",
    projectId: "white-2k-17-v4",
    storageBucket: "white-2k-17-v4.firebasestorage.app",
    messagingSenderId: "180909174928",
    appId: "1:180909174928:android:148861a87d66c6980ca815"
};

window.firebaseConfig = firebaseConfig; 

// Initialize Firebase Pipeline Safely
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

window.database = firebase.database();
window.auth = firebase.auth();

/* ==========================================================================
   DYNAMIC SIGNUP BONUS & MAINTENANCE LOCK ACCESS CONTROL SYSTEM
   ========================================================================== */

function getSafeEmailKey(email) {
    return email ? email.toLowerCase().replace(/\./g, ',') : "";
}

window.auth.onAuthStateChanged((user) => {
    if (user) {
        const safeEmailKey = getSafeEmailKey(user.email);
        
        window.database.ref('settings').once('value').then((snapshot) => {
            const settings = snapshot.val() || {};
            const isMaintenanceActive = settings.maintenanceMode || false;
            const masterAdminsList = settings.masterAdmins || {};
            
            const isWhitelistedAdmin = masterAdminsList[safeEmailKey] ? true : false;

            window.database.ref(`users/${user.uid}`).once('value').then((userSnap) => {
                let userData = userSnap.val();

                if (!userSnap.exists()) {
                    const assignedBonusCoins = parseInt(settings.signupBonus) || 0;
                    const systemDeterminedRole = isWhitelistedAdmin ? 'owner' : 'user';

                    userData = {
                        name: user.displayName || "MVX User",
                        email: user.email,
                        avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                        coins: assignedBonusCoins, 
                        role: systemDeterminedRole,
                        joinedAt: firebase.database.ServerValue.TIMESTAMP,
                        lastLogin: firebase.database.ServerValue.TIMESTAMP
                    };

                    window.database.ref(`users/${user.uid}`).set(userData).then(() => {
                        executeAccessControlRoutingRules(user, userData, isMaintenanceActive);
                    });
                } 
                else {
                    let updates = { lastLogin: firebase.database.ServerValue.TIMESTAMP };
                    
                    if (isWhitelistedAdmin && userData.role !== 'owner') {
                        updates['role'] = 'owner';
                        userData.role = 'owner';
                    } 
                    else if (!isWhitelistedAdmin && userData.role === 'owner' && user.email !== "sktausifhhh@gmail.com") {
                        updates['role'] = 'user';
                        userData.role = 'user';
                    }

                    window.database.ref(`users/${user.uid}`).update(updates).then(() => {
                        executeAccessControlRoutingRules(user, userData, isMaintenanceActive);
                    });
                }
            });
        });
    }
});

function executeAccessControlRoutingRules(user, userData, isMaintenanceActive) {
    sessionStorage.setItem('mvx_role', userData.role);
    sessionStorage.setItem('mvx_session', 'ACTIVE');

    const currentPathName = window.location.pathname;
    const isLandingOnLogin = currentPathName.includes('login.html');

    if (isMaintenanceActive && userData.role !== 'owner') {
        sessionStorage.clear();
        window.auth.signOut().then(() => {
            if (!window.location.href.includes('login.html')) {
                window.location.replace('login.html?error=maintenance');
            }
        });
    } else {
        if (isLandingOnLogin) {
            if (userData.role === 'owner') {
                window.location.replace('admin.html');
            } else {
                window.location.replace('index.html');
            }
        }
    }
}
