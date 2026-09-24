import { db } from './firebase-config.js';
import { ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

export const setupRealtimeDatabase = () => {
    try {
        document.getElementById('loadingHomeProducts').classList.remove('hidden');
        document.getElementById('loadingShopProducts').classList.remove('hidden');
        
        onValue(ref(db, 'categories'), (snapshot) => {
            const cats = [];
            snapshot.forEach((child) => {
                cats.push({ id: child.key, name: child.val().name, image: window.processImageUrl(child.val().image) });
            });
            window.AppState.categories = cats;
            if(window.renderCategoriesUI) window.renderCategoriesUI();
            if(window.renderTrendingTabs) window.renderTrendingTabs(); 
        });

        onValue(ref(db, 'banners'), (snapshot) => {
            const arr = [];
            snapshot.forEach(child => { arr.push({ id: child.key, ...child.val() }); });
            window.AppState.banners = arr;
            if(window.renderBanners) window.renderBanners();
        });

        onValue(ref(db, 'smallBanners'), (snapshot) => {
            const arr = [];
            snapshot.forEach(child => { arr.push({ id: child.key, ...child.val() }); });
            window.AppState.smallBanners = arr;
            if(window.renderSmallBanners) window.renderSmallBanners();
        });

        onValue(ref(db, 'primaryBanners'), (snapshot) => {
            const arr = [];
            snapshot.forEach(child => { arr.push({ id: child.key, ...child.val() }); });
            window.AppState.primaryBanners = arr;
            if(window.renderPrimaryBanners) window.renderPrimaryBanners();
        });

        onValue(ref(db, 'products'), (snapshot) => {
            const products = [];
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                
                let rawImages = data.images || [];
                if (!Array.isArray(rawImages)) rawImages = [];
                if (rawImages.length === 0 && data.image) rawImages = [data.image];
                let processedImages = rawImages.map(img => window.processImageUrl(img));

                products.push({
                    id: childSnapshot.key,
                    name: data.name,
                    brand: data.brand || "Khodal",
                    price: Number(data.price),
                    salePrice: data.salePrice ? Number(data.salePrice) : null,
                    rating: data.rating || 4.5,
                    reviews: data.reviewCount || Math.floor(Math.random() * 500) + 10,
                    category: data.category || 'tshirts',
                    tags: data.tags || [],
                    images: processedImages,
                    image: processedImages.length > 0 ? processedImages[0] : '', 
                    description: data.description !== undefined ? data.description : "",
                    material: data.material !== undefined ? data.material : "",
                    fit: data.fit || "Standard Fit",
                    sizes: data.sizes && data.sizes.length > 0 ? data.sizes : ['S', 'M', 'L', 'XL'],
                    offerEndTime: data.offerEndTime || null,
                    colors: data.colors || ['#000000', '#ffffff', '#3b82f6']
                });
            });
            
            window.AppState.products = products;
            document.getElementById('loadingHomeProducts').classList.add('hidden');
            document.getElementById('loadingShopProducts').classList.add('hidden');
            
            if(window.updateCurrentView) window.updateCurrentView();
        });

        onValue(ref(db, 'settings'), (snapshot) => {
            const data = snapshot.val() || {};
            window.AppState.settings.paymentQR = window.processImageUrl(data.paymentQR || '');
            const qrImg = document.getElementById('qrCodeImage');
            if(qrImg) qrImg.src = window.AppState.settings.paymentQR;
        });
        
    } catch (error) {
        console.error("Error setting up real-time DB:", error);
    }
};

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
