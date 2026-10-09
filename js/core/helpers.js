window.formatPrice = (price) => `₹${Number(price).toLocaleString('en-IN')}`;

window.processImageUrl = (url) => {
    if (!url) return '';
    try {
        if (url.includes('drive.google.com')) {
            let fileId = '';
            const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) fileId = match[1];
            else {
                const urlObj = new URL(url);
                fileId = urlObj.searchParams.get('id');
            }
            if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
        }
    } catch (e) {
        console.error('Error parsing Image URL', e);
    }
    return url;
};

window.checkAffiliateReferral = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
        localStorage.setItem('pod_affiliate_ref', refCode);
        localStorage.setItem('pod_affiliate_timestamp', Date.now().toString());
        window.history.replaceState({}, document.title, window.location.pathname);
    }
};

window.getRecommendationsHtml = (context) => {
    if (window.AppState.products.length === 0) return '';
    
    let recs = [...window.AppState.products].sort(() => 0.5 - Math.random()).slice(0, 4);
    let closeAction = context === 'cart' ? 'toggleCart();' : (context === 'sidebar' ? 'toggleSidebar();' : '');

    let cardsHtml = recs.map(p => `
        <div class="w-36 shrink-0 snap-start group relative flex flex-col">
            <div class="bg-brand-50 rounded-xl aspect-[4/5] overflow-hidden mb-2 relative cursor-pointer" onclick="${closeAction} navigate('product?id=${p.id}')">
                <img src="${p.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            </div>
            <button onclick="quickAdd('${p.id}', event)" class="absolute top-2 right-2 w-7 h-7 bg-white text-brand-900 rounded-full shadow-sm flex items-center justify-center hover:bg-brand-900 hover:text-white transition z-10"><i class="fa-solid fa-plus text-[10px]"></i></button>
            <p class="text-xs font-bold text-brand-900 uppercase tracking-tight line-clamp-1 cursor-pointer" onclick="${closeAction} navigate('product?id=${p.id}')">${p.name}</p>
            <p class="text-[10px] font-bold text-gray-500 mt-1">${formatPrice(p.salePrice || p.price)}</p>
        </div>
    `).join('');

    return `
    <div class="w-full mt-6 mb-2">
        <h4 class="font-display font-bold text-brand-900 uppercase tracking-tight mb-4 text-sm flex items-center justify-between">
            <span>You May Also Like</span>
            <i class="fa-solid fa-fire text-accent-red"></i>
        </h4>
        <div class="flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-2 -mx-1 px-1">
            ${cardsHtml}
        </div>
    </div>`;
};
