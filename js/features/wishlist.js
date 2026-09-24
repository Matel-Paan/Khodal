window.toggleWishlist = (id, e) => {
    if(e) { e.stopPropagation(); e.preventDefault(); }
    const idx = window.AppState.wishlist.indexOf(id);
    if(idx > -1) {
        window.AppState.wishlist.splice(idx, 1);
        window.showToast('Removed from Wishlist', 'error');
    } else {
        window.AppState.wishlist.push(id);
        window.showToast('Added to Wishlist');
    }
    localStorage.setItem('tbk_wishlist', JSON.stringify(window.AppState.wishlist));
    window.updateSidebarBadges();
    
    const hash = window.location.hash.replace('#', '');
    if(hash.includes('product') && window.renderProduct) window.renderProduct(`id=${id}`);
    else if(hash.includes('shop') && window.renderShop) window.renderShop(window.location.hash.split('?')[1]);
    else if(hash.includes('wishlist')) window.renderWishlist();
    else if(window.renderHome) window.renderHome();
};

window.renderWishlist = () => {
    const grid = document.getElementById('wishlistGrid');
    const empty = document.getElementById('wishlistEmpty');
    
    if(window.AppState.wishlist.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        const products = window.AppState.wishlist.map(id => window.AppState.products.find(p => p.id === id)).filter(p => p);
        grid.innerHTML = products.map(window.createProductCard).join('');
    }
};

window.updateSidebarBadges = () => {
    const wCount = window.AppState.wishlist.length;
    const wBadge = document.getElementById('sidebarWishlistCount');
    if(wCount > 0) { wBadge.innerText = wCount; wBadge.classList.remove('hidden'); }
    else { wBadge.classList.add('hidden'); }
};
