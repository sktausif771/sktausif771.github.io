/* ==========================================================================
   MVX SYSTEM V4.0 - CORE FIREBASE & AUTHENTICATION ENGINE
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
   রিডাইরেক্ট এরর চেকার (লগইন ফেইল হলে স্ক্রিনে দেখাবে)
   ========================================================================== */
auth.getRedirectResult().then((result) => {
    if (result && result.user) {
        processUserEntry(result.user);
    }
}).catch((error) => {
    const loader = document.getElementById('systemLoader');
    if(loader) loader.style.display = 'none';
    const statusMsg = document.getElementById('status-message');
    if(statusMsg) {
        if(error.code === 'auth/unauthorized-domain') {
            statusMsg.innerText = "Error: Firebase Authorized Domains-এ sktausif771.github.io অ্যাড করা নেই!";
        } else {
            statusMsg.innerText = "লগইন ফেইল: " + error.message;
        }
        statusMsg.className = "";
    }
});

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

const MASTER_OWNER = "sktausif771@gmail.com";
const SYSTEM_ADMINS = ["sktausif07ff@gmail.com", "sktausifhhh@gmail.com", "white2k177@gmail.com"];

function determineUserRole(email) {
    if (email === MASTER_OWNER) return 'owner';
    if (SYSTEM_ADMINS.includes(email)) return 'admin';
    return 'user';
}

/* ==========================================================================
   মেইন গুগল লগইন প্রোটোকল (মোবাইলের জন্য Redirect সিস্টেম)
   ========================================================================== */
window.startGoogleLogin = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const loader = document.getElementById('systemLoader');
    if(loader) loader.style.display = 'flex';

    // পপ-আপের বদলে রিডাইরেক্ট (মোবাইলে ১০০% কাজ করবে)
    auth.signInWithRedirect(provider).catch((error) => {
        if(loader) loader.style.display = 'none';
        const statusMsg = document.getElementById('status-message');
        if(statusMsg) statusMsg.innerText = "Redirect Error: " + error.message;
    });
};

function processUserEntry(user) {
    const userRef = db.ref('users/' + user.uid);
    const role = determineUserRole(user.email);

    userRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            userRef.set({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                role: role,
                coins: 0,
                uploadCount: 0,
                status: 'active',
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            }).then(() => redirectBasedOnRole(role));
        } else {
            userRef.update({ role: role, lastLogin: firebase.database.ServerValue.TIMESTAMP }).then(() => {
                if(snapshot.val().status === 'blocked') {
                    alert("⚠️ আপনার অ্যাকাউন্ট অ্যাডমিন দ্বারা ব্যান করা হয়েছে!");
                    auth.signOut();
                    window.location.reload();
                } else {
                    redirectBasedOnRole(role);
                }
            });
        }
    });
}

function redirectBasedOnRole(role) {
    sessionStorage.setItem('mvx_session', 'ACTIVE');
    sessionStorage.setItem('mvx_role', role);
    if (role === 'owner') window.location.replace('owner.html');
    else if (role === 'admin') window.location.replace('admin.html');
    else window.location.replace('index.html');
}
