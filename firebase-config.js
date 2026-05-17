/* ==========================================================================
   MVX SYSTEM V4.0 - CORE FIREBASE & AUTHENTICATION ENGINE
   ========================================================================== */

// ১. ফায়ারবেস কনফিগারেশন (আপনার আসল ফায়ারবেস ডিটেইলস এখানে বসাবেন)
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
   ২. রোল বাইপাস সিস্টেম (অটো-অ্যাডমিন এবং মাস্টার ওনার এক্সেস)
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
    return 'user'; // বাকি সবাই সাধারণ ইউজার
}

/* ==========================================================================
   ৩. মেইন গুগল লগইন প্রোটোকল (login.html থেকে কল হবে)
   ========================================================================== */
window.startGoogleLogin = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // লোডার দেখানো (যদি login.html এ থাকে)
    const loader = document.getElementById('systemLoader');
    if(loader) loader.style.display = 'flex';

    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            processUserEntry(user);
        })
        .catch((error) => {
            if(loader) loader.style.display = 'none';
            document.getElementById('status-message').innerText = "লগইন বাতিল হয়েছে বা ইন্টারনেট সমস্যা। আবার চেষ্টা করুন।";
            document.getElementById('status-message').className = "";
            console.error("Auth Error: ", error.message);
        });
};

/* ==========================================================================
   ৪. ইউজার ডাটাবেস এন্ট্রি এবং রিডাইরেক্ট লজিক
   ========================================================================== */
function processUserEntry(user) {
    const userRef = db.ref('users/' + user.uid);
    const role = determineUserRole(user.email);

    userRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            // নতুন ইউজার হলে ডাটাবেজে তার প্রোফাইল তৈরি করা হবে
            userRef.set({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                role: role,
                coins: 0,              // নতুন ইউজারের জিরো কয়েন থাকবে
                uploadCount: 0,        // অ্যাপ আপলোড লিমিট ট্র্যাকিং
                status: 'active',      // Owner চাইলে পরে 'blocked' করতে পারবে
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                redirectBasedOnRole(role);
            });
        } else {
            // পুরোনো ইউজার হলে সরাসরি রিডাইরেক্ট
            // সিকিউরিটি: যদি ইমেইল মিলে যায়, কিন্তু রোল আপডেট না থাকে, তবে অটো আপডেট করবে
            userRef.update({ role: role, lastLogin: firebase.database.ServerValue.TIMESTAMP }).then(() => {
                // ইউজারের স্ট্যাটাস চেক (ব্যান করা থাকলে ঢুকতে পারবে না)
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
   ৫. সিকিউর রাউটিং (রোল অনুযায়ী নির্দিষ্ট পেজে পাঠানো)
   ========================================================================== */
function redirectBasedOnRole(role) {
    // সেশনে টোকেন সেভ করে রাখা যাতে অন্য পেজগুলো বুঝতে পারে লগইন হয়েছে
    sessionStorage.setItem('mvx_session', 'ACTIVE');
    sessionStorage.setItem('mvx_role', role);

    if (role === 'owner') {
        window.location.replace('owner.html'); // মাস্টার প্যানেলে যাবে
    } else if (role === 'admin') {
        window.location.replace('admin.html'); // নরমাল অ্যাডমিন প্যানেলে যাবে
    } else {
        window.location.replace('index.html'); // সাধারণ ইউজার স্টোরে যাবে
    }
}
