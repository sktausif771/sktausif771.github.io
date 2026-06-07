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
   DIRECT GOOGLE LOGIN FUNCTION (PROFILE OVERWRITE BUG FIXED)
   ========================================================================== */
window.startGoogleLogin = function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    
    // Show loading text if loader exists
    var loader = document.getElementById('systemLoader');
    if(loader) loader.style.display = 'flex';
    
    window.auth.signInWithPopup(provider).then((result) => {
        var user = result.user;
        
        // Fetch current bonus amount from settings
        window.database.ref('settings').once('value').then((snap) => {
            let settings = snap.exists() ? snap.val() : {};
            let signupBonus = settings.signupBonus ? parseInt(settings.signupBonus) : 0; 
            
            window.database.ref(`users/${user.uid}`).once('value').then(userSnap => {
                // Check if user already exists to prevent overwriting custom avatar/name
                if (!userSnap.exists()) {
                    // Completely New User
                    let newProfile = {
                        name: user.displayName || "MVX User",
                        email: user.email || "No Email",
                        avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName || 'User'}`,
                        lastLogin: firebase.database.ServerValue.TIMESTAMP,
                        coins: signupBonus,
                        role: 'user',
                        joinedAt: firebase.database.ServerValue.TIMESTAMP,
                        followers: 0,
                        following: 0
                    };
                    window.database.ref(`users/${user.uid}`).set(newProfile);
                } else {
                    // Existing User: Update login time but DO NOT overwrite name and avatarUrl
                    let existingData = userSnap.val();
                    let profileUpdates = {
                        lastLogin: firebase.database.ServerValue.TIMESTAMP
                    };
                    
                    // Only add email if it was completely missing
                    if (!existingData.email || existingData.email === "No Email") {
                        profileUpdates.email = user.email || "No Email";
                    }
                    
                    // Fallback for coins
                    if (existingData.coins === undefined || existingData.coins === null) {
                        profileUpdates.coins = signupBonus;
                    }
                    
                    // Update only specific fields securely
                    window.database.ref(`users/${user.uid}`).update(profileUpdates);
                }
            });
        });
    }).catch((error) => {
        if(loader) loader.style.display = 'none';
        alert("Google Sign-In Failed: " + error.message);
    });
};

/* ==========================================================================
   AUTH STATE OBSERVER & REAL-TIME SYNC
   ========================================================================== */
window.auth.onAuthStateChanged((user) => {
    if (user) {
        window.database.ref('settings').once('value').then((configSnap) => {
            let masterAdmins = {};
            
            if (configSnap.exists()) {
                masterAdmins = configSnap.val().masterAdmins || {};
            }

            window.database.ref(`users/${user.uid}`).once('value').then((userSnap) => {
                if (!userSnap.exists()) return;
                let userData = userSnap.val();
                let updates = {};

                // Strictly sync missing details without touching user's customized data
                if (!userData.name || userData.name === "MVX User") {
                    if (user.displayName) updates['name'] = user.displayName;
                }
                if (!userData.email || userData.email === "No Email") {
                    if (user.email) updates['email'] = user.email;
                }
                if (!userData.avatarUrl || userData.avatarUrl.includes("dicebear")) {
                    if (user.photoURL) updates['avatarUrl'] = user.photoURL;
                }

                // Default Whitelisted Owner Emails
                const ownerEmails = [
                    "sktausif07ff@gmail.com", 
                    "sktausif771@gmail.com", 
                    "sktausifhhh@gmail.com", 
                    "white2k177@gmail.com"
                ];
                
                // Admin Security Clearance Check
                let isWhitelistedAdmin = ownerEmails.includes(user.email);
                if (!isWhitelistedAdmin) {
                    const safeEmail = user.email ? user.email.replace(/\./g, ',') : "";
                    if (safeEmail && masterAdmins[safeEmail]) {
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

                // Apply dynamic updates if necessary and route user
                if (Object.keys(updates).length > 0) {
                    window.database.ref(`users/${user.uid}`).update(updates).then(() => {
                        executeAccessControlRoutingRules(userData.role || 'user');
                    });
                } else {
                    executeAccessControlRoutingRules(userData.role);
                }
            });
        });
    } else {
        // User is logged out: Clear local session securely
        sessionStorage.removeItem('mvx_role');
        sessionStorage.removeItem('mvx_session');
    }
});

function executeAccessControlRoutingRules(role) {
    sessionStorage.setItem('mvx_role', role);
    sessionStorage.setItem('mvx_session', 'ACTIVE');

    const currentPathName = window.location.pathname;
    const isLandingOnLogin = currentPathName.includes('login.html');

    if (isLandingOnLogin) {
        if (role === 'owner') {
            window.location.replace('admin.html');
        } else {
            window.location.replace('index.html');
        }
    }
}
