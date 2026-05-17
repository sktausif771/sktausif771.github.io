/* ==========================================================================
   MVX SYSTEM V4.0 - CORE FIREBASE & AUTHENTICATION ENGINE (UPDATED)
   ========================================================================== */

// ১. ফায়ারবেস কনফিগারেশন (আপনার আগের প্রজেক্টের রিয়েল API Key গুলো এখানে বসাতে হবে)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// ফায়ারবেস ইনিশিয়ালাইজেশন
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();

/* ==========================================================================
   ২. গ্লোবাল অটো-লক সিকিউরিটি (লগইন ছাড়া অন্য পেজে ঢোকা বন্ধ করবে)
   ========================================================================== */
auth.onAuthStateChanged((user) => {
    // বর্তমান পেজের নাম বের করা
    const currentPage = window.location.pathname.split("/").pop();
    
    if (!user) {
        // ইউজার যদি লগইন করা না থাকে এবং লগইন পেজে না থাকে, তাহলে লগইন পেজে পাঠাবে
        if (currentPage !== 'login.html' && currentPage !== '') {
            window.location.replace('login.html');
        }
    } else {
        // ইউজার যদি লগইন করা থাকে এবং লগইন পেজে থাকে, তাহলে তার রোল চেক করে স্টোরে পাঠাবে
        if (currentPage === 'login.html' || currentPage === '') {
            processUserEntry(user);
        }
    }
});

/* ==========================================================================
   ৩. রোল বাইপাস সিস্টেম (অটো-অ্যাডমিন এবং মাস্টার ওনার এক্সেস)
   ========================================================================== */
const MASTER_OWNER = "sktausif771@gmail.com";

const SYSTEM_ADMINS = [
    "sktausif07ff@gmail.com",
    "sktausifhhh@gmail.com",
    "white2k177@gmail.com"
];

// ইউজারের ইমেইল অনুযায়ী তার পাওয়ার/রোল চেক করা
function determineUserRole(email) {
    if (email === MASTER_OWNER) return 'owner';
    if (SYSTEM_ADMINS.includes(email)) return 'admin';
    return 'user';
}

/* ==========================================================================
   ৪. মেইন গুগল লগইন প্রোটোকল (Account Selector ফিক্স করা হয়েছে)
   ========================================================================== */
window.startGoogleLogin = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // প্রতিবার নতুন করে ইমেইল সিলেক্ট করার অপশন ফোর্স করবে (যাতে পপ-আপ ক্র্যাশ না করে)
    provider.setCustomParameters({
        prompt: 'select_account'
    });
    
    // লোডার দেখানো
    const loader = document.getElementById('systemLoader');
    if(loader) loader.style.display = 'flex';

    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            processUserEntry(user);
        })
        .catch((error) => {
            if(loader) loader.style.display = 'none';
            const statusMsg = document.getElementById('status-message');
            if(statusMsg) {
                statusMsg.innerText = "লগইন বাতিল হয়েছে বা কনফিগারেশন সেট করা নেই।";
                statusMsg.className = "";
            }
            console.error("Auth Error Details: ", error);
        });
};

/* ==========================================================================
   ৫. ইউজার ডাটাবেস এন্ট্রি এবং রিডাইরেক্ট লজিক
   ========================================================================== */
function processUserEntry(user) {
    const userRef = db.ref('users/' + user.uid);
    const role = determineUserRole(user.email);

    userRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            // নতুন ইউজার এন্ট্রি
            userRef.set({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                role: role,
                coins: 0,
                uploadCount: 0,
                status: 'active',
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                redirectBasedOnRole(role);
            });
        } else {
            // পুরোনো ইউজার এন্ট্রি আপডেট
            userRef.update({ 
                role: role, 
                lastLogin: firebase.database.ServerValue.TIMESTAMP 
            }).then(() => {
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
   ৬. সিকিউর রাউটিং (রোল অনুযায়ী নির্দিষ্ট পেজে পাঠানো)
   ========================================================================== */
function redirectBasedOnRole(role) {
    sessionStorage.setItem('mvx_session', 'ACTIVE');
    sessionStorage.setItem('mvx_role', role);

    if (role === 'owner') {
        window.location.replace('owner.html');
    } else if (role === 'admin') {
        window.location.replace('admin.html');
    } else {
        window.location.replace('index.html');
    }
}
