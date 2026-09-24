// ==========================================
// CATEGORIES & TRENDING
// ==========================================

window.renderCategoriesUI = () => {
    const homeCatGrid = document.getElementById('homeCategoriesGrid');
    if(window.AppState.categories.length === 0) {
        homeCatGrid.innerHTML = `<div class="col-span-full text-center py-6 text-gray-500 font-medium border-b border-r border-gray-200">Categories will appear here once added by Admin.</div>`;
    } else {
        homeCatGrid.innerHTML = window.AppState.categories.map(c => `
            <div onclick="navigate('shop?category=${c.name.toLowerCase()}')" class="group flex flex-col items-center bg-white border-b border-r border-gray-200 p-3 lg:p-4 cursor-pointer hover:shadow-md transition">
                <h3 class="text-brand-900 font-sans font-bold text-xs lg:text-sm uppercase tracking-wider mb-2 lg:mb-3 text-left w-full">${c.name}</h3>
                <img src="${c.image}" class="w-full h-auto object-contain img-hover-zoom aspect-square">
            </div>
        `).join('');
    }

    const footerCatList = document.getElementById('footerCategoriesList');
    if(footerCatList) {
        footerCatList.innerHTML = window.AppState.categories.slice(0, 4).map(c => `
            <li><a href="#shop?category=${c.name.toLowerCase()}" class="hover:text-white transition">${c.name}</a></li>
        `).join('') + `<li><a href="#shop" class="hover:text-white transition">All Products</a></li>`;
    }
};

window.renderTrendingTabs = () => {
    const trendingTabsContainer = document.getElementById('trendingTabs');
    if(!trendingTabsContainer) return;
    
    let tabsHtml = `<button onclick="setTrendingTab('ALL')" class="pb-2 text-sm font-bold uppercase tracking-wider whitespace-nowrap border-b-2 ${window.currentTrendingTab === 'ALL' ? 'border-brand-900 text-brand-900' : 'border-transparent text-gray-400'} transition">ALL</button>`;
    
    window.AppState.categories.forEach(c => {
        tabsHtml += `<button onclick="setTrendingTab('${c.name}')" class="pb-2 text-sm font-bold uppercase tracking-wider whitespace-nowrap border-b-2 ${window.currentTrendingTab === c.name ? 'border-brand-900 text-brand-900' : 'border-transparent text-gray-400'} transition">${c.name}</button>`;
    });
    
    trendingTabsContainer.innerHTML = tabsHtml;
};

window.setTrendingTab = (catName) => {
    window.currentTrendingTab = catName;
    window.renderTrendingTabs();
    window.renderHome();
};

// ==========================================
// BANNERS
// ==========================================

window.renderBanners = () => {
    const container = document.getElementById('bannerSlidesContainer');
    const indicators = document.getElementById('bannerIndicators');
    
    if(window.AppState.banners.length === 0) {
        container.innerHTML = `
        <div class="w-full flex-shrink-0 h-full relative">
            <img src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1600&auto=format" class="absolute inset-0 w-full h-full object-cover object-center">
            <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
            <div class="relative z-10 h-full max-w-[1400px] mx-auto px-5 lg:px-10 flex flex-col justify-end pb-12 lg:pb-24">
                <span class="text-xs lg:text-sm font-bold tracking-[0.2em] text-white/90 uppercase mb-4 shadow-sm">The New Drop is Here</span>
                <h1 class="font-display text-4xl lg:text-7xl font-bold text-white mb-4 lg:mb-6 leading-[1.1] tracking-tight max-w-3xl uppercase drop-shadow-md">Wear What Defines You.</h1>
                <p class="text-white text-sm lg:text-lg mb-8 max-w-xl font-medium drop-shadow-md">Original designs made for people who don't follow the crowd. Premium heavyweight cotton, oversized fits.</p>
                <div class="flex flex-col sm:flex-row gap-4">
                    <button onclick="navigate('shop')" class="bg-white text-brand-900 px-8 py-4 rounded-full font-bold text-sm hover:bg-gray-100 transition shadow-floating">
                        SHOP NEW DROP
                    </button>
                </div>
            </div>
        </div>`;
        indicators.innerHTML = '';
        return;
    }

    container.innerHTML = window.AppState.banners.map(b => `
        <div class="w-full flex-shrink-0 h-full relative cursor-pointer bg-brand-50" onclick="navigate('${b.targetLink || 'shop'}')">
            <img src="${window.processImageUrl(b.imageUrl)}" class="absolute inset-0 w-full h-full object-cover object-center">
            <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
        </div>
    `).join('');
    
    indicators.innerHTML = window.AppState.banners.map((_, i) => `
        <button onclick="goToBanner(${i})" class="w-2.5 h-2.5 rounded-full transition-all shadow-sm ${i === 0 ? 'bg-white w-6' : 'bg-white/60 hover:bg-white'}"></button>
    `).join('');

    window.currentBannerIndex = 0;
    window.updateBannerPosition();
    window.startBannerAutoPlay();
};

window.renderSmallBanners = () => {
    const container = document.getElementById('smallBannerContainer');
    if(!container) return;
    if(window.AppState.smallBanners && window.AppState.smallBanners.length > 0) {
        const b = window.AppState.smallBanners[0];
        container.innerHTML = `<img src="${window.processImageUrl(b.imageUrl)}" class="w-full h-full object-cover cursor-pointer" onclick="navigate('${b.targetLink || 'shop'}')">`;
    } else {
        container.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">Small Banner [1200x400]</div>`;
    }
};

window.renderPrimaryBanners = () => {
    const container = document.getElementById('primaryBannerContainer');
    if(!container) return;
    if(window.AppState.primaryBanners && window.AppState.primaryBanners.length > 0) {
        container.innerHTML = `
            <div id="primaryBannerScroll" class="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full h-full scroll-smooth">
                ${window.AppState.primaryBanners.map(b => `
                    <img src="${window.processImageUrl(b.imageUrl)}" class="w-full h-full object-cover shrink-0 snap-center cursor-pointer" onclick="navigate('${b.targetLink || 'shop'}')">
                `).join('')}
            </div>
        `;
        window.startPrimaryBannerAutoPlay();
    } else {
        container.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">Primary Banner [1000x1500]</div>`;
    }
};

window.startPrimaryBannerAutoPlay = () => {
    if(window.primaryBannerInterval) clearInterval(window.primaryBannerInterval);
    if(window.AppState.primaryBanners && window.AppState.primaryBanners.length > 1) {
        window.primaryBannerInterval = setInterval(window.nextPrimaryBanner, 3000); 
    }
};

window.nextPrimaryBanner = () => {
    const scrollContainer = document.getElementById('primaryBannerScroll');
    if(!scrollContainer) return;
    
    const bannerWidth = scrollContainer.clientWidth;
    let currentIndex = Math.round(scrollContainer.scrollLeft / bannerWidth);
    
    let nextIndex = currentIndex + 1;
    if(nextIndex >= window.AppState.primaryBanners.length) {
        nextIndex = 0; 
    }
    
    scrollContainer.scrollTo({
        left: bannerWidth * nextIndex,
        behavior: 'smooth'
    });
};

window.updateBannerPosition = () => {
    const container = document.getElementById('bannerSlidesContainer');
    const indicators = document.getElementById('bannerIndicators').children;
    if(window.AppState.banners.length === 0) return;
    container.style.transform = `translateX(-${window.currentBannerIndex * 100}%)`;
    
    Array.from(indicators).forEach((ind, i) => {
        if(i === window.currentBannerIndex) {
            ind.className = "w-6 h-2.5 rounded-full transition-all bg-white shadow-sm";
        } else {
            ind.className = "w-2.5 h-2.5 rounded-full transition-all bg-white/60 hover:bg-white shadow-sm";
        }
    });
};

window.nextBanner = () => {
    if(window.AppState.banners.length <= 1) return;
    window.currentBannerIndex = (window.currentBannerIndex + 1) % window.AppState.banners.length;
    window.updateBannerPosition();
    window.startBannerAutoPlay();
};

window.prevBanner = () => {
    if(window.AppState.banners.length <= 1) return;
    window.currentBannerIndex = (window.currentBannerIndex - 1 + window.AppState.banners.length) % window.AppState.banners.length;
    window.updateBannerPosition();
    window.startBannerAutoPlay();
};

window.goToBanner = (idx) => {
    window.currentBannerIndex = idx;
    window.updateBannerPosition();
    window.startBannerAutoPlay();
};

window.startBannerAutoPlay = () => {
    if(window.bannerInterval) clearInterval(window.bannerInterval);
    if(window.AppState.banners.length > 1) {
        window.bannerInterval = setInterval(window.nextBanner, 3000); 
    }
};

// ==========================================
// VIEWS RENDERING
// ==========================================

window.renderHome = () => {
    const grid = document.getElementById('homeProductGrid');
    const empty = document.getElementById('emptyHomeProducts');
    
    if(window.AppState.products.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    
    empty.classList.add('hidden');

    let displayProducts = window.AppState.products;
    if (window.currentTrendingTab !== 'ALL') {
        displayProducts = displayProducts.filter(p => p.category.toLowerCase() === window.currentTrendingTab.toLowerCase());
    } else {
        let trending = displayProducts.filter(p => p.tags && p.tags.includes('trending'));
        if(trending.length > 0) displayProducts = trending;
    }

    displayProducts = displayProducts.slice(0, 8);

    if(displayProducts.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
    } else {
        grid.innerHTML = displayProducts.map(window.createProductCard).join('');
    }
};

window.renderShop = (queryStr) => {
    let cat = new URLSearchParams(queryStr).get('category');
    
    let filtered = cat ? window.AppState.products.filter(p => p.category.toLowerCase() === cat.toLowerCase() || (p.tags && p.tags.join(' ').toLowerCase().includes(cat.toLowerCase()))) : window.AppState.products;
    
    let title = cat ? cat : 'All Collection';
    document.getElementById('shopTitle').innerText = title;
    document.getElementById('shopBreadcrumb').innerText = title;
    
    const grid = document.getElementById('shopGrid');
    const empty = document.getElementById('emptyShopProducts');
    
    if (filtered.length === 0 && window.AppState.products.length > 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        grid.innerHTML = filtered.map(window.createProductCard).join('');
    }

    let pillsHtml = `<button onclick="navigate('shop')" class="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors border ${!cat ? 'bg-brand-900 text-white border-brand-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}">All</button>`;
    
    window.AppState.categories.forEach(c => {
        const cNameLower = c.name.toLowerCase();
        const isActive = cat === cNameLower;
        pillsHtml += `<button onclick="navigate('shop?category=${cNameLower}')" class="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors border ${isActive ? 'bg-brand-900 text-white border-brand-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}">${c.name}</button>`;
    });

    document.getElementById('shopCategoriesList').innerHTML = pillsHtml;
};

window.renderProduct = (queryStr) => {
    const id = new URLSearchParams(queryStr).get('id');
    const product = window.AppState.products.find(p => p.id === id);
    
    if(!product && window.AppState.products.length > 0) return window.navigate('home');
    if(!product) return; 
    
    window.AppState.currentProductView = product;
    const isWishlisted = window.AppState.wishlist.includes(id);
    const activePrice = product.salePrice || product.price;
    let discount = 0;
    if(product.salePrice && product.price > product.salePrice) {
        discount = Math.round(((product.price - product.salePrice) / product.price) * 100);
    }

    document.getElementById('pdpStickyPrice').innerText = window.formatPrice(activePrice);

    let timerHtml = '';
    if(product.offerEndTime && !isNaN(parseInt(product.offerEndTime))) {
        timerHtml = `
        <div class="bg-red-50 text-accent-red border border-red-100 rounded-xl p-4 mt-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between offer-timer timer-pulse" data-endtime="${product.offerEndTime}">
            <div class="flex items-center gap-2 font-bold mb-2 sm:mb-0"><i class="fa-solid fa-bolt text-lg"></i> Limited Time Offer!</div>
            <div class="font-display font-bold text-xl tracking-widest timer-text bg-white px-4 py-1.5 rounded-lg border border-red-100 shadow-sm text-center">00:00:00</div>
        </div>`;
    }

    const html = `
        <div class="flex flex-col lg:flex-row gap-8 lg:gap-16 relative">
            <div class="w-full lg:w-[55%]">
                <div class="sticky top-24 flex flex-col gap-4">
                    <div class="absolute top-4 left-4 flex gap-2 z-30 lg:hidden">
                        <button onclick="history.back()" class="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-brand-900 shadow-sm">
                            <i class="fa-solid fa-arrow-left text-sm"></i>
                        </button>
                    </div>
                    
                    <div class="bg-brand-50 w-full aspect-[4/5] lg:aspect-auto lg:h-[65vh] overflow-hidden rounded-3xl relative border border-gray-100 shadow-sm">
                        <div id="pdpMainSlider" class="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full h-full scroll-smooth">
                            ${product.images && product.images.length > 0 ? product.images.map((img, index) => `
                                <img id="mainImg-${index}" src="${img}" class="w-full h-full object-cover object-center snap-center snap-always shrink-0" alt="${product.name}">
                            `).join('') : `<img src="${product.image}" class="w-full h-full object-cover object-center snap-center snap-always shrink-0" alt="${product.name}">`}
                        </div>
                    </div>
                    
                    ${product.images && product.images.length > 1 ? `
                    <div class="relative flex items-center group px-1">
                        <button onclick="scrollPdpThumbs(-1)" class="absolute left-0 z-10 w-8 h-8 bg-white shadow-md text-brand-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-0 -translate-x-1/2 hover:scale-110"><i class="fa-solid fa-chevron-left text-xs"></i></button>
                        
                        <div id="pdpThumbContainer" class="flex gap-3 overflow-x-auto hide-scrollbar snap-x w-full scroll-smooth py-2 px-1">
                            ${product.images.map((img, i) => `
                                <img src="${img}" onclick="document.getElementById('mainImg-${i}').scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'}); document.querySelectorAll('.pdp-thumb').forEach(el=>el.classList.replace('border-brand-900', 'border-transparent')); this.classList.replace('border-transparent', 'border-brand-900');" class="w-20 h-24 lg:w-24 lg:h-28 object-cover rounded-xl cursor-pointer border-2 ${i===0 ? 'border-brand-900' : 'border-transparent'} hover:border-brand-900 transition-colors snap-start shrink-0 pdp-thumb bg-brand-50 shadow-sm">
                            `).join('')}
                        </div>
                        
                        <button onclick="scrollPdpThumbs(1)" class="absolute right-0 z-10 w-8 h-8 bg-white shadow-md text-brand-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-0 translate-x-1/2 hover:scale-110"><i class="fa-solid fa-chevron-right text-xs"></i></button>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="w-full lg:w-[45%] px-5 lg:px-0 py-4 lg:py-10 pb-28 lg:pb-10">
                <div class="flex items-center justify-between mb-4">
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Khodal Official</div>
                    <div class="flex items-center gap-1 text-xs font-bold text-brand-900 bg-brand-50 px-2 py-1 rounded">
                        <i class="fa-solid fa-star text-accent-red text-[10px]"></i> ${product.rating} <span class="text-gray-400 ml-1">(${product.reviews})</span>
                    </div>
                </div>

                <h1 class="font-display text-2xl lg:text-4xl font-bold text-brand-900 uppercase tracking-tight mb-4 leading-[1.1]">${product.name}</h1>
                
                ${timerHtml}

                <div class="flex items-end gap-3 mb-8">
                    <span class="font-display font-bold text-3xl text-brand-900">${window.formatPrice(activePrice)}</span>
                    ${discount > 0 ? `
                        <span class="text-gray-400 text-lg line-through mb-0.5">${window.formatPrice(product.price)}</span>
                        <span class="text-accent-red font-bold text-xs uppercase tracking-widest bg-red-50 px-2 py-1 rounded mb-1">Save ${discount}%</span>
                    ` : ''}
                </div>

                <p class="text-sm lg:text-base text-gray-600 font-medium leading-relaxed mb-8 whitespace-pre-line">${product.description || 'No description provided.'}</p>

                <div class="mb-10">
                    <div class="flex justify-between items-end mb-4">
                        <h4 class="text-xs font-bold text-brand-900 uppercase tracking-widest">Select Size</h4>
                        <button onclick="navigate('sizes')" class="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-400 hover:text-brand-900 transition">Size Guide</button>
                    </div>
                    <div class="grid grid-cols-4 gap-3">
                        ${(product.sizes && product.sizes.length > 0 ? product.sizes : ['Free Size']).map((s, i) => `
                            <button class="size-btn py-3 lg:py-4 border ${i===0 ? 'border-brand-900 bg-brand-900 text-white' : 'border-gray-200 bg-white text-brand-900'} text-sm font-bold uppercase tracking-wider transition-colors hover:border-brand-900" onclick="selectPdpSize(this)">${s}</button>
                        `).join('')}
                    </div>
                </div>

                <div class="hidden lg:flex gap-4 mb-12">
                    <button onclick="pdpAddToCart()" class="flex-1 bg-brand-900 text-white py-4.5 font-bold text-sm uppercase tracking-wider shadow-floating hover:bg-gray-800 transition">
                        Add to Cart
                    </button>
                    <button onclick="toggleWishlist('${product.id}')" class="w-14 h-14 border border-gray-200 flex items-center justify-center text-brand-900 hover:border-brand-900 transition" id="pdpWishlistBtnDesktop">
                        <i class="fa-${isWishlisted ? 'solid text-accent-red' : 'regular'} fa-heart text-lg"></i>
                    </button>
                </div>

                <div class="border-t border-gray-100 divide-y divide-gray-100">
                    <div class="py-5">
                        <h5 class="text-sm font-bold text-brand-900 uppercase tracking-wider mb-2">Details & Fit</h5>
                        <ul class="text-sm text-gray-600 font-medium space-y-2 list-disc list-inside">
                            ${product.material ? `<li>${product.material}</li>` : ''}
                            ${product.fit ? `<li>${product.fit}</li>` : ''}
                            <li>Machine wash cold, lay flat to dry</li>
                        </ul>
                    </div>
                    <div class="py-5">
                        <h5 class="text-sm font-bold text-brand-900 uppercase tracking-wider mb-2">Shipping & Returns</h5>
                        <p class="text-sm text-gray-600 font-medium">Delivered in 5-7 days. Easy replacements for damaged items. <a href="#returns" class="underline">View policy</a>.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('productDetailContainer').innerHTML = html;
};
