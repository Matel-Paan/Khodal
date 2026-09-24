import './core/state.js';
import './core/helpers.js';
import './components/ui.js';
import './features/products.js';
import './features/cart.js';
import './features/wishlist.js';
import './features/checkout.js';
import './features/orders.js';
import './features/rewards.js';
import './features/search.js';
import './pages/views.js';
import { setupAuthObserver } from './firebase/auth.js';
import { setupRealtimeDatabase, setupUserRealtimeListeners } from './firebase/db-sync.js';

// Application Router
window.handleRoute = () => {
    if (!window.isAuthInitialized) return; 

    let hash = window.location.hash.replace('#', '') || 'home';
    const [path, queryStr] = hash.split('?');
    
    const protectedRoutes = ['track', 'checkout', 'wishlist', 'orders', 'profile', 'rewards'];
    if (protectedRoutes.includes(path) && !window.currentUser) {
        window.navigate(`auth?redirect=${path}`);
        return;
    }

    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const mainHeader = document.getElementById('mainHeader');
    const pdpBottomBar = document.getElementById('pdpBottomBar');

    if(path === 'checkout') mainHeader.classList.add('hidden');
    else mainHeader.classList.remove('hidden');

    if(path === 'product') pdpBottomBar.classList.replace('hidden', 'flex');
    else pdpBottomBar.classList.replace('flex', 'hidden');

    const viewElement = document.getElementById(`view-${path}`);
    if(viewElement) {
        viewElement.classList.add('active');
    } else {
        document.getElementById('view-home').classList.add('active');
    }

    if(path === 'home' && window.renderHome) window.renderHome();
    if(path === 'shop' && window.renderShop) window.renderShop(queryStr);
    if(path === 'product' && window.renderProduct) window.renderProduct(queryStr);
    if(path === 'checkout' && window.renderCheckout) window.renderCheckout();
    if(path === 'wishlist' && window.renderWishlist) window.renderWishlist();
    if(path === 'rewards' && window.renderRewards) window.renderRewards();
    if(path === 'gift-reward' && window.renderGiftReward) window.renderGiftReward(queryStr);
    
    if(path !== 'track' && window.currentOrderTrackerUnsubscribe) {
        window.currentOrderTrackerUnsubscribe();
        window.currentOrderTrackerUnsubscribe = null;
        document.getElementById('trackResults').innerHTML = '';
    }
};

window.updateCurrentView = window.handleRoute;

const initApp = () => {
    if(window.checkAffiliateReferral) window.checkAffiliateReferral();
    if(window.saveCart) window.saveCart();
    if(window.updateSidebarBadges) window.updateSidebarBadges();
    
    setupRealtimeDatabase();
    setupAuthObserver(setupUserRealtimeListeners, window.handleRoute);
    
    window.addEventListener('hashchange', window.handleRoute);
};

window.onload = initApp;
