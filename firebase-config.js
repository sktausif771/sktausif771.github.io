/* ==========================================================================
   MVX STORE V5.6 - FIREBASE CORE CONFIG & ADVANCED AUTONOMOUS AUTH INTERCEPTOR
   ========================================================================== */

// অরিজিনাল ফায়ারবেস এপিআই ক্রেডেনশিয়াল (আপনার দেওয়া ডেটা অনুযায়ী)
const firebaseConfig = {
    apiKey: "AIzaSyAS3UXXrio_-c9uPbHwpDuTVrP-p8d903w",
    authDomain: "white-2k-17-v4.firebaseapp.com",
    databaseURL: "https://white-2k-17-v4-default-rtdb.firebaseio.com",
    projectId: "white-2k-17-v4",
    storageBucket: "white-2k-17-v4.firebasestorage.app",
    messagingSenderId: "180909174928",
    appId: "1:180909174928:android:148861a87d66c6980ca815"
};

// Initialize Firebase Pipeline Safely
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();
const auth = firebase.auth();

/* ==========================================================================
   DYNAMIC SIGNUP BONUS & MAINTENANCE LOCK ACCESS CONTROL SYSTEM
   ========================================================================== */

// Helper to convert email into a secure Firebase database key format
function getSafeEmailKey(email) {
    return email ? email.toLowerCase().replace(/\./g, ',') : "";
}

auth.onAuthStateChanged((user) => {
    if (user) {
        const safeEmailKey = getSafeEmailKey(user.email);
        
        // Pull Global Configuration Node from Database
        database.ref('settings').once('value').then((snapshot) => {
            const settings = snapshot.val() || {};
            const isMaintenanceActive = settings.maintenanceMode || false;
            const masterAdminsList = settings.masterAdmins || {};
            
            // Check if the logging email exists within whitelisted master admin keys
            const isWhitelistedAdmin = masterAdminsList[safeEmailKey] ? true : false;

            database.ref(`users/${user.uid}`).once('value').then((userSnap) => {
                let userData = userSnap.val();

                // CONDITION A: New User Registration Loop (Signup Bonus Allocation)
                if (!userSnap.exists()) {
                    const assignedBonusCoins = parseInt(settings.signupBonus) || 0;
                    const systemDeterminedRole = isWhitelistedAdmin ? 'owner' : 'user';

                    userData = {
                        name: user.displayName || "MVX User",
                        email: user.email,
                        avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                        coins: assignedBonusCoins, // Automatically loads configured bonus from config panel
                        role: systemDeterminedRole,
                        joinedAt: firebase.database.ServerValue.TIMESTAMP,
                        lastLogin: firebase.database.ServerValue.TIMESTAMP
                    };

                    database.ref(`users/${user.uid}`).set(userData).then(() => {
                        executeAccessControlRoutingRules(user, userData, isMaintenanceActive);
                    });
                } 
                // CONDITION B: Existing User Connection Lifecycle Sync
                else {
                    let updates = { lastLogin: firebase.database.ServerValue.TIMESTAMP };
                    
                    // Automatically upgrade user role if added to the Master Admin List
                    if (isWhitelistedAdmin && userData.role !== 'owner') {
                        updates['role'] = 'owner';
                        userData.role = 'owner';
                    } 
                    // Automatically downgrade if removed from control list (Developer Safe Lockout)
                    else if (!isWhitelistedAdmin && userData.role === 'owner' && user.email !== "sktausifhhh@gmail.com") {
                        updates['role'] = 'user';
                        userData.role = 'user';
                    }

                    database.ref(`users/${user.uid}`).update(updates).then(() => {
                        executeAccessControlRoutingRules(user, userData, isMaintenanceActive);
                    });
                }
            });
        });
    }
});

function executeAccessControlRoutingRules(user, userData, isMaintenanceActive) {
    // Commit to synchronous memory mapping layers
    sessionStorage.setItem('mvx_role', userData.role);
    sessionStorage.setItem('mvx_session', 'ACTIVE');

    const currentPathName = window.location.pathname;
    const isLandingOnLogin = currentPathName.includes('login.html');

    // CRITICAL ENFORCEMENT: Maintenance Lockdown Gateway Interception
    if (isMaintenanceActive && userData.role !== 'owner') {
        sessionStorage.clear();
        auth.signOut().then(() => {
            if (!window.location.href.includes('login.html')) {
                window.location.replace('login.html?error=maintenance');
            }
        });
    } else {
        // Smooth bypass routing if standard operational parameters are verified
        if (isLandingOnLogin) {
            if (userData.role === 'owner') {
                window.location.replace('admin.html');
            } else {
                window.location.replace('index.html');
            }
        }
    }
}
