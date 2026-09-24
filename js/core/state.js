window.AppState = {
    cart: JSON.parse(localStorage.getItem('tbk_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('tbk_wishlist') || '[]'),
    products: [],
    categories: [], 
    banners: [],
    smallBanners: [],    
    primaryBanners: [],  
    walletRewards: [],
    rewardClaims: [],
    hasOrders: false,
    currentProductView: null,
    settings: { paymentQR: '' }
};

window.currentUser = null;
window.isAuthInitialized = false;

// Application wide state trackers
window.currentOrderTrackerUnsubscribe = null;
window.userWalletUnsubscribe = null;
window.userClaimsUnsubscribe = null;
window.userOrdersUnsubscribe = null;
window.bannerInterval = null;
window.primaryBannerInterval = null;
window.currentBannerIndex = 0;
window.currentTrendingTab = 'ALL';
window.currentGiftCode = null;
window.currentGiftConfig = null;
