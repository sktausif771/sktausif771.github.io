/* ==========================================================================
   MVX STORE V5.6 - FIREBASE CORE CONFIG & ADVANCED AUTONOMOUS AUTH INTERCEPTOR
   ========================================================================== */

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
   DIRECT GOOGLE LOGIN FUNCTION FOR LOGIN.HTML (No Notifications check)
   ========================================================================== */
window.startGoogleLogin = function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    
    // Show loading text if loader exists
    var loader = document.getElementById('systemLoader');
    if(loader) loader.style.display = 'flex';
    
    window.auth.signInWithPopup(provider).then((result) => {
        var user = result.user;
        var isNewUser = result.additionalUserInfo.isNewUser;
        
        window.database.ref('settings').once('value').then((snap) => {
            let settings = snap.exists() ? snap.val() : {};
            let signupBonus = settings.signupBonus || 0;
            
            if (isNewUser) {
                window.database.ref(`users/${user.uid}`).set({
                    name: user.displayName || "MVX User",
                    email: user.email,
                    avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`,
                    coins: signupBonus,
                    role: 'user',
                    joinedAt: firebase.database.ServerValue.TIMESTAMP,
                    lastLogin: firebase.database.ServerValue.TIMESTAMP,
                    followers: 0,
                    following: 0
                });
            } else {
                window.database.ref(`users/${user.uid}/lastLogin`).set(firebase.database.ServerValue.TIMESTAMP);
            }
        });
    }).catch((error) => {
        if(loader) loader.style.display = 'none';
        alert("Google Sign-In Failed: " + error.message);
    });
};

/* ==========================================================================
   AUTH STATE OBSERVER (Allows Non-Logged in Users to browse)
   ========================================================================== */
window.auth.onAuthStateChanged((user) => {
    if (user) {
        window.database.ref('settings').once('value').then((configSnap) => {
            let isMaintenanceActive = false;
            let masterAdmins = {};
            
            if (configSnap.exists()) {
                isMaintenanceActive = configSnap.val().maintenanceMode || false;
                masterAdmins = configSnap.val().masterAdmins || {};
            }

            window.database.ref(`users/${user.uid}`).once('value').then((userSnap) => {
                if (!userSnap.exists()) return;
                let userData = userSnap.val();
                let updates = {};

                // Default Whitelisted Owner Emails
                const ownerEmails = [
                    "sktausif07ff@gmail.com", 
                    "sktausif771@gmail.com", 
                    "sktausifhhh@gmail.com", 
                    "white2k177@gmail.com"
                ];
                
                let isWhitelistedAdmin = ownerEmails.includes(user.email);
                if (!isWhitelistedAdmin) {
                    const safeEmail = user.email.replace(/\./g, ',');
                    if (masterAdmins[safeEmail]) {
                        isWhitelistedAdmin = true;
                    }
                }

                if (isWhitelistedAdmin && userData.role !== 'owner') {
                    updates['role'] = 'owner';
                    userData.role = 'owner';
                } 
                else if (!isWhitelistedAdmin && userData.role === 'owner') {
                    updates['role'] = 'user';
                    userData.role = 'user';
                }

                if (Object.keys(updates).length > 0) {
                    window.database.ref(`users/${user.uid}`).update(updates).then(() => {
                        executeAccessControlRoutingRules(user, userData, isMaintenanceActive);
                    });
                } else {
                    executeAccessControlRoutingRules(user, userData, isMaintenanceActive);
                }
            });
        });
    } else {
        // User is logged out: We just clear session, but DO NOT redirect them to login page.
        sessionStorage.removeItem('mvx_role');
        sessionStorage.removeItem('mvx_session');
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
