import { db } from './firebase-config.js';
import { ref, onValue, query, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// ==========================================
// ADVANCED CACHING SYSTEM (SWR STRATEGY)
// ==========================================
const fetchWithCache = async (node, storageKey, processor, renderCallback) => {
    const cacheKey = `khodal_cache_${storageKey}`;
    
    // 1. STALE: Render instantly from LocalStorage cache
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        try {
            window.AppState[storageKey] = JSON.parse(cachedData);
            if (renderCallback) renderCallback();
        } catch (e) {
            console.warn("Cache parsing error, fetching fresh data...");
        }
    }

    // 2. REVALIDATE: Fetch fresh data from Firebase in background using get() to save bandwidth
    try {
        const snapshot = await get(ref(db, node));
        if (snapshot.exists()) {
            const rawData = [];
            snapshot.forEach(child => {
                rawData.push({ id: child.key, ...child.val() });
            });
            
            const processedData = processor ? processor(rawData) : rawData;
            
            // Update State & Cache
            window.AppState[storageKey] = processedData;
            localStorage.setItem(cacheKey, JSON.stringify(processedData));
            
            // Re-render with fresh data
            if (renderCallback) renderCallback();
        }
    } catch (error) {
        console.error(`Error fetching ${node}:`, error);
    }
};

export const setupRealtimeDatabase = () => {
    try {
        const loadingHome = document.getElementById('loadingHomeProducts');
        const loadingShop = document.getElementById('loadingShopProducts');
        if(loadingHome) loadingHome.classList.remove('hidden');
        if(loadingShop) loadingShop.classList.remove('hidden');
        
        // Fetch Categories
        fetchWithCache('categories', 'categories', 
            (data) => data.map(c => ({ id: c.id, name: c.name, image: window.processImageUrl(c.image) })), 
            () => {
                if(window.renderCategoriesUI) window.renderCategoriesUI();
                if(window.renderTrendingTabs) window.renderTrendingTabs(); 
            }
        );

        // Fetch Banners
        fetchWithCache('banners', 'banners', null, () => { if(window.renderBanners) window.renderBanners(); });
        fetchWithCache('smallBanners', 'smallBanners', null, () => { if(window.renderSmallBanners) window.renderSmallBanners(); });
        fetchWithCache('primaryBanners', 'primaryBanners', null, () => { if(window.renderPrimaryBanners) window.renderPrimaryBanners(); });
        
        // Fetch Coupons
        fetchWithCache('coupons', 'coupons', null, () => {
            if(window.location.hash.includes('product') && window.renderProduct) {
                window.renderProduct(window.location.hash.split('?')[1]);
            }
        });

        // Fetch Products (Heavy Node)
        fetchWithCache('products', 'products', 
            (data) => {
                return data.map(item => {
                    let rawImages = item.images || [];
                    if (!Array.isArray(rawImages)) rawImages = [];
                    if (rawImages.length === 0 && item.image) rawImages = [item.image];
                    let processedImages = rawImages.map(img => window.processImageUrl(img));

                    return {
                        id: item.id,
                        name: item.name,
                        brand: item.brand || "Khodal",
                        price: Number(item.price),
                        salePrice: item.salePrice ? Number(item.salePrice) : null,
                        rating: item.rating || 4.5,
                        reviews: item.reviewCount || Math.floor(Math.random() * 500) + 10,
                        category: item.category || 'tshirts',
                        tags: item.tags || [],
                        images: processedImages,
                        image: processedImages.length > 0 ? processedImages[0] : '', 
                        description: item.description !== undefined ? item.description : "",
                        material: item.material !== undefined ? item.material : "",
                        fit: item.fit || "Standard Fit",
                        sizes: item.sizes && item.sizes.length > 0 ? item.sizes : ['S', 'M', 'L', 'XL'],
                        offerEndTime: item.offerEndTime || null,
                        colors: item.colors || ['#000000', '#ffffff', '#3b82f6']
                    };
                });
            }, 
            () => {
                if(loadingHome) loadingHome.classList.add('hidden');
                if(loadingShop) loadingShop.classList.add('hidden');
                if(window.updateCurrentView) window.updateCurrentView();
                if(window.location.hash.includes('product') && window.renderProduct) {
                    window.renderProduct(window.location.hash.split('?')[1]);
                }
            }
        );

        // Fetch Settings
        get(ref(db, 'settings')).then((snapshot) => {
            if(snapshot.exists()) {
                const data = snapshot.val() || {};
                window.AppState.settings.paymentQR = window.processImageUrl(data.paymentQR || '');
                const qrImg = document.getElementById('qrCodeImage');
                if(qrImg) qrImg.src = window.AppState.settings.paymentQR;
            }
        });
        
    } catch (error) {
        console.error("Error setting up DB:", error);
    }
};

// User specific listeners remain real-time (onValue) for safety in transactions
export const setupUserRealtimeListeners = (uid) => {
    if(window.userWalletUnsubscribe) window.userWalletUnsubscribe();
    if(window.userClaimsUnsubscribe) window.userClaimsUnsubscribe();
    if(window.userOrdersUnsubscribe) window.userOrdersUnsubscribe();

    window.userWalletUnsubscribe = onValue(ref(db, `users/${uid}/walletRewards`), (snapshot) => {
        const rewards = [];
        snapshot.forEach(child => rewards.push({ id: child.key, ...child.val() }));
        window.AppState.walletRewards = rewards;
        if(window.location.hash.includes('rewards') && window.renderRewards) window.renderRewards();
        if(window.location.hash.includes('checkout') && window.renderCheckout) window.renderCheckout();
    });

    const claimsQuery = query(ref(db, 'rewardClaims'), orderByChild('uid'), equalTo(uid));
    window.userClaimsUnsubscribe = onValue(claimsQuery, (snapshot) => {
        const claims = [];
        snapshot.forEach(child => claims.push({ id: child.key, ...child.val() }));
        window.AppState.rewardClaims = claims;
        if(window.location.hash.includes('rewards') && window.renderRewards) window.renderRewards();
    });

    const ordersQuery = query(ref(db, 'orders'), orderByChild('userId'), equalTo(uid));
    window.userOrdersUnsubscribe = onValue(ordersQuery, (snapshot) => {
        window.AppState.hasOrders = snapshot.exists();
        if(window.location.hash.includes('rewards') && window.renderRewards) window.renderRewards();
    });
};
