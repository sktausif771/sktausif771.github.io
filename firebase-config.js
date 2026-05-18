/* ==========================================================================
   MVX SYSTEM V5.5 - CORE FIREBASE & AUTHENTICATION ENGINE (REDIRECT FIX)
   ========================================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyAS3UXXrio_-c9uPbHwpDuTVrP-p8d903w",
    authDomain: "white-2k-17-v4.firebaseapp.com",
    databaseURL: "https://white-2k-17-v4-default-rtdb.firebaseio.com",
    projectId: "white-2k-17-v4",
    storageBucket: "white-2k-17-v4.firebasestorage.app",
    messagingSenderId: "180909174928",
    appId: "1:180909174928:android:148861a87d66c6980ca815"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();

/* ==========================================================================
   1. GLOBAL LOGIN CHECKER & REDIRECT
   ========================================================================== */
auth.onAuthStateChanged((user) => {
    const currentPage = window.location.pathname.split("/").pop();
    
    if (!user) {
        if (currentPage !== 'login.html' && currentPage !== '') {
            window.location.replace('login.html');
        }
    } else {
        if (currentPage === 'login.html' || currentPage === '') {
            processUserEntry(user);
        }
    }
});

/* ==========================================================================
   2. MASTER OWNER ROLE DEFINITION
   ========================================================================== */
const MASTER_OWNERS = [
    "sktausif771@gmail.com",
    "sktausif07ff@gmail.com",
    "sktausifhhh@gmail.com",
    "white2k177@gmail.com"
];

function determineUserRole(email) {
    if (MASTER_OWNERS.includes(email)) return 'owner';
    return 'user'; 
}

/* ==========================================================================
   3. GOOGLE LOGIN PROTOCOL (100% MOBILE FIX: REDIRECT METHOD)
   ========================================================================== */
window.startGoogleLogin = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const loader = document.getElementById('systemLoader');
    if(loader) loader.style.display = 'flex';

    // Popup এর বদলে Redirect ব্যবহার করা হলো যাতে সাদা স্ক্রিন হয়ে ব্যাক না করে
    auth.signInWithRedirect(provider);
};

// Redirect থেকে ফিরে আসার পর যদি কোনো এরর হয় সেটা ধরার জন্য
auth.getRedirectResult().catch((error) => {
    const loader = document.getElementById('systemLoader');
    if(loader) loader.style.display = 'none';
    alert("লগইন সমস্যা হয়েছে: " + error.message);
});

/* ==========================================================================
   4. USER DATABASE ENTRY & GMAIL AVATAR SYNC
   ========================================================================== */
function processUserEntry(user) {
    const userRef = db.ref('users/' + user.uid);
    const role = determineUserRole(user.email);
    
    let googlePhoto = user.photoURL;
    if (googlePhoto && googlePhoto.includes('=s96-c')) {
        googlePhoto = googlePhoto.replace('=s96-c', '=s400-c');
    }

    userRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            userRef.set({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                avatarUrl: googlePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`,
                role: role,
                coins: 0,
                followers: 0,
                following: 0,
                uploadCount: 0,
                status: 'active',
                language: 'en',
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            }).then(() => redirectBasedOnRole(role))
              .catch((err) => alert("Database Error: " + err.message)); // Data fail error handler
        } else {
            let updates = { 
                role: role, 
                lastLogin: firebase.database.ServerValue.TIMESTAMP 
            };
            
            if (!snapshot.val().avatarUrl && googlePhoto) {
                updates.avatarUrl = googlePhoto;
            }

            userRef.update(updates).then(() => {
                if(snapshot.val().status === 'blocked') {
                    alert("⚠️ Your account has been suspended by the Master Administrator.");
                    auth.signOut();
                    window.location.reload();
                } else {
                    redirectBasedOnRole(role);
                }
            }).catch((err) => alert("Database Update Error: " + err.message));
        }
    });
}

/* ==========================================================================
   5. SECURE ROUTING (LOCAL STORAGE REQUIRED FOR REDIRECT)
   ========================================================================== */
function redirectBasedOnRole(role) {
    // Redirect মেথডের জন্য localStorage বাধ্যতামূলক, কারণ পেজ চেঞ্জ হলে sessionStorage মুছে যায়
    localStorage.setItem('mvx_session', 'ACTIVE');
    localStorage.setItem('mvx_role', role);
    window.location.replace('index.html'); 
}
