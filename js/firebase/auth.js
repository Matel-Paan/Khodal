import { auth, provider, db } from './firebase-config.js';
import { signInWithPopup, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

window.signInWithGoogle = async () => {
    try {
        await signInWithPopup(auth, provider);
        window.showToast("Logged in successfully!");
        window.redirectAfterAuth();
    } catch(e) {
        window.showToast(e.message, 'error');
    }
};

window.handleEmailAuth = async () => {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPassword').value;
    const btn = document.getElementById('btnEmailAuth');
    btn.innerHTML = `<div class="loader border-white border-t-transparent mx-auto w-5 h-5"></div>`;
    
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        window.showToast("Logged in successfully!");
        window.redirectAfterAuth();
    } catch (error) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            try {
                await createUserWithEmailAndPassword(auth, email, pass);
                window.showToast("Account created and logged in!");
                window.redirectAfterAuth();
            } catch(e) {
                window.showToast(e.message, 'error');
            }
        } else {
            window.showToast(error.message, 'error');
        }
    } finally {
        btn.innerHTML = `Sign In / Sign Up`;
    }
};

window.redirectAfterAuth = () => {
    let redirectParams = new URLSearchParams(window.location.hash.split('?')[1]);
    let target = redirectParams.get('redirect') || 'home';
    window.navigate(target);
};

window.updateAuthUI = () => {
    const guestSection = document.getElementById('sidebarAuthGuest');
    const userSection = document.getElementById('sidebarAuthUser');
    
    if(window.currentUser) {
        guestSection.classList.add('hidden');
        userSection.classList.remove('hidden');
        
        get(ref(db, `users/${window.currentUser.uid}`)).then(snap => {
            if(snap.exists()) {
                const d = snap.val();
                if(document.getElementById('profPageName')) document.getElementById('profPageName').value = d.name || '';
                if(document.getElementById('profPagePhone')) document.getElementById('profPagePhone').value = d.phone || '';
                if(document.getElementById('profPageAddress')) document.getElementById('profPageAddress').value = d.address || '';
            }
        });
    } else {
        guestSection.classList.remove('hidden');
        userSection.classList.add('hidden');
        
        if(document.getElementById('profPageName')) document.getElementById('profPageName').value = '';
        if(document.getElementById('profPagePhone')) document.getElementById('profPagePhone').value = '';
        if(document.getElementById('profPageAddress')) document.getElementById('profPageAddress').value = '';
    }
};

window.saveUserProfile = async () => {
    if(!window.currentUser) return;
    const btn = document.getElementById('btnSaveProfilePage');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<div class="loader border-white border-t-transparent mx-auto w-4 h-4"></div>`;
    btn.disabled = true;

    const name = document.getElementById('profPageName').value;
    const phone = document.getElementById('profPagePhone').value;
    const address = document.getElementById('profPageAddress').value;
    
    try {
        await update(ref(db, `users/${window.currentUser.uid}`), { name, phone, address });
        window.showToast("Profile Saved Successfully!");
    } catch(e) {
        window.showToast("Error updating profile", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

window.requestLogout = () => {
    if (window.innerWidth < 1024) window.toggleSidebar(); 
    const modal = document.getElementById('customLogoutModal');
    const content = document.getElementById('logoutModalContent');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
};

window.closeLogoutModal = () => {
    const modal = document.getElementById('customLogoutModal');
    const content = document.getElementById('logoutModalContent');
    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
};

window.confirmLogout = () => {
    window.closeLogoutModal();
    signOut(auth).then(() => {
        window.showToast("Logged out successfully");
        window.navigate('home');
    });
};

export const setupAuthObserver = (setupUserRealtimeListeners, handleRoute) => {
    onAuthStateChanged(auth, (user) => {
        window.currentUser = user;
        if(user) {
            if(setupUserRealtimeListeners) setupUserRealtimeListeners(user.uid);
        } else {
            if(window.userWalletUnsubscribe) { window.userWalletUnsubscribe(); window.userWalletUnsubscribe = null; }
            if(window.userClaimsUnsubscribe) { window.userClaimsUnsubscribe(); window.userClaimsUnsubscribe = null; }
            if(window.userOrdersUnsubscribe) { window.userOrdersUnsubscribe(); window.userOrdersUnsubscribe = null; }
            window.AppState.walletRewards = [];
            window.AppState.rewardClaims = [];
            window.AppState.hasOrders = false;
        }

        if (!window.isAuthInitialized) {
            window.isAuthInitialized = true;
            if(handleRoute) handleRoute(); 
        }
        window.updateAuthUI();
    });
};
