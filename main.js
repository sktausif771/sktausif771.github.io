/* ==========================================================================
   MVX STORE V5.0 - CORE UI INTERACTIONS & PROFILE ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined') {
        console.error("Firebase SDK critical error in main.js");
        return;
    }

    const db = firebase.database();
    const auth = firebase.auth();

    // DOM Elements Cache
    const editModal = document.getElementById('profileEditModal');
    const editNameInput = document.getElementById('editNameInput');
    const editAvatarInput = document.getElementById('editAvatarInput');
    const editPreviewAvatar = document.getElementById('editPreviewAvatar');

    // ==========================================================================
    // 1. PROFILE MODAL CONTROLS & DATA POPULATION
    // ==========================================================================
    window.openProfileEditModal = function() {
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to edit your profile.");
            return;
        }

        // ডাটাবেজ থেকে বর্তমান নাম ও ছবি এনে ইনপুট বক্সে বসানো
        db.ref('users/' + user.uid).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (editNameInput) editNameInput.value = data.name || "";
                if (editAvatarInput) editAvatarInput.value = data.avatarUrl || "";
                if (editPreviewAvatar) {
                    editPreviewAvatar.src = data.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`;
                }
            }
            if (editModal) editModal.classList.add('active');
        });
    };

    window.closeProfileEditModal = function() {
        if (editModal) editModal.classList.remove('active');
    };

    // লিংক পেস্ট করার সাথে সাথে ছবির লাইভ প্রিভিউ দেখার লজিক
    if (editAvatarInput && editPreviewAvatar) {
        editAvatarInput.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) {
                editPreviewAvatar.src = url;
            }
        });
    }

    // ==========================================================================
    // 2. SAVE PROFILE CHANGES TO FIREBASE (ImgBB / URL Supported)
    // ==========================================================================
    window.saveProfileChanges = function() {
        const user = auth.currentUser;
        if (!user) return;

        const newName = editNameInput.value.trim();
        const newAvatar = editAvatarInput.value.trim();

        if (!newName) {
            alert("Name cannot be empty.");
            return;
        }

        const saveBtn = document.querySelector('#profileEditModal .play-btn');
        if (saveBtn) {
            saveBtn.innerText = "SAVING...";
            saveBtn.disabled = true;
        }

        // ফায়ারবেস রিয়েলটাইম ডাটাবেজে প্রোফাইল আপডেট
        db.ref('users/' + user.uid).update({
            name: newName,
            avatarUrl: newAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newName}`
        }).then(() => {
            if (saveBtn) {
                saveBtn.innerText = "SAVE CHANGES";
                saveBtn.disabled = false;
            }
            closeProfileEditModal();
            alert("Profile updated successfully!");
        }).catch((err) => {
            if (saveBtn) {
                saveBtn.innerText = "SAVE CHANGES";
                saveBtn.disabled = false;
            }
            alert("Error saving profile: " + err.message);
        });
    };

    // ==========================================================================
    // 3. SECURE LOGOUT SYSTEM
    // ==========================================================================
    window.secureLogout = function() {
        if (confirm("Are you sure you want to log out safely?")) {
            sessionStorage.clear();
            auth.signOut().then(() => {
                window.location.replace('login.html');
            }).catch((err) => {
                window.location.replace('login.html');
            });
        }
    };

    // ==========================================================================
    // 4. GLOBAL SEARCH FILTER ENGINE (For Bottom Search Tab)
    // ==========================================================================
    window.triggerLocalSearch = function(query) {
        const cards = document.querySelectorAll('.app-card');
        const lowerQuery = query.toLowerCase().trim();

        cards.forEach(card => {
            const title = card.querySelector('.app-title-list').innerText.toLowerCase();
            if (title.includes(lowerQuery)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    };
});
