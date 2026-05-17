/* ==========================================================================
   MVX SYSTEM V5.5 - CORE FIREBASE & AUTHENTICATION ENGINE
   ========================================================================== */

// ১. ফায়ারবেস কনফিগারেশন (আপনার আসল API Key সহ)
const firebaseConfig = {
    apiKey: "AIzaSyAS3UXXrio_-c9uPbHwpDuTVrP-p8d903w",
    authDomain: "white-2k-17-v4.firebaseapp.com",
    databaseURL: "https://white-2k-17-v4-default-rtdb.firebaseio.com",
    projectId: "white-2k-17-v4",
    storageBucket: "white-2k-17-v4.firebasestorage.app",
    messagingSenderId: "180909174928",
    appId: "1:180909174928:android:148861a87d66c6980ca815"
};

// ফায়ারবেস ইনিশিয়ালাইজেশন
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();

/* ==========================================================================
   ২. গ্লোবাল লগইন চেকার ও অটো-রিডাইরেক্ট
   ========================================================================== */
auth.onAuthStateChanged((user) => {
    const currentPage = window.location.pathname.split("/").pop();
    
    if (!user) {
        // লগইন না থাকলে লগইন পেজে পাঠাবে
        if (currentPage !== 'login.html' && currentPage !== '') {
            window.location.replace('login.html');
        }
    } else {
        // লগইন থাকলে মেইন স্টোরে পাঠাবে
        if (currentPage === 'login.html' || currentPage === '') {
            processUserEntry(user);
        }
    }
});

/* ==========================================================================
   ৩. রোল বাইপাস সিস্টেম (অ্যাডমিন এবং মাস্টার ওনার এক্সেস)
   ========================================================================== */
const MASTER_OWNER = "sktausif771@gmail.com";

const SYSTEM_ADMINS = [
    "sktausif07ff@gmail.com",
    "sktausifhhh@gmail.com",
    "white2k177@gmail.com"
];

function determineUserRole(email) {
    if (email === MASTER_OWNER) return 'owner';
    if (SYSTEM_ADMINS.includes(email)) return 'admin';
    return 'user';
}

/* ==========================================================================
   ৪. মেইন গুগল লগইন প্রোটোকল (পপ-আপ মেথড)
   ========================================================================== */
window.startGoogleLogin = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const loader = document.getElementById('systemLoader');
    if(loader) loader.style.display = 'flex';

    auth.signInWithPopup(provider).then((result) => {
        processUserEntry(result.user);
    }).catch((error) => {
        if(loader) loader.style.display = 'none';
        const statusMsg = document.getElementById('status-message');
        if(statusMsg) {
            statusMsg.innerText = "লগইন বাতিল বা এরর: " + error.message;
            statusMsg.className = "";
        }
        console.error("Login Error Details: ", error);
    });
};

/* ==========================================================================
   ৫. ইউজার ডাটাবেস এন্ট্রি ও জিমেইল ছবি সিঙ্ক (Gmail Profile Pic Fetch)
   ========================================================================== */
function processUserEntry(user) {
    const userRef = db.ref('users/' + user.uid);
    const role = determineUserRole(user.email);
    
    // গুগল থেকে অরিজিনাল এইচডি ছবি বের করার ট্রিক (s96-c কে s400-c তে কনভার্ট করা)
    let googlePhoto = user.photoURL;
    if (googlePhoto && googlePhoto.includes('=s96-c')) {
        googlePhoto = googlePhoto.replace('=s96-c', '=s400-c');
    }

    userRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            // নতুন ইউজার এন্ট্রি
            userRef.set({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                avatarUrl: googlePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`,
                role: role,
                coins: 0,
                followers: 0,       // নতুন ফলোয়ার সিস্টেম
                following: 0,
                uploadCount: 0,
                status: 'active',
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            }).then(() => redirectBasedOnRole(role));
        } else {
            // পুরোনো ইউজার হলে শুধু টাইম এবং রোল আপডেট করবে
            let updates = { 
                role: role, 
                lastLogin: firebase.database.ServerValue.TIMESTAMP 
            };
            
            // যদি ইউজারের কোনো ছবি সেভ না থাকে, তাহলে গুগলের ছবিটা বসিয়ে দেবে
            if (!snapshot.val().avatarUrl && googlePhoto) {
                updates.avatarUrl = googlePhoto;
            }

            userRef.update(updates).then(() => {
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

/* ==========================================================================
   ৬. সিকিউর রাউটিং (সবাই সরাসরি হোমপেজে যাবে)
   ========================================================================== */
function redirectBasedOnRole(role) {
    sessionStorage.setItem('mvx_session', 'ACTIVE');
    sessionStorage.setItem('mvx_role', role);
    window.location.replace('index.html'); 
}
