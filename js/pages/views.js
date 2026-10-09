// ==========================================
// CATEGORIES & TRENDING
// ==========================================

window.renderCategoriesUI = () => {
    const homeCatGrid = document.getElementById('homeCategoriesGrid');
    if(!homeCatGrid) return;
    
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
    if(!container || !indicators) return;
    
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
    const indicators = document.getElementById('bannerIndicators');
    if(!container || !indicators) return;
    if(window.AppState.banners.length === 0) return;
    
    container.style.transform = `translateX(-${window.currentBannerIndex * 100}%)`;
    
    Array.from(indicators.children).forEach((ind, i) => {
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
// VIEWS RENDERING (HOME, SHOP, PDP)
// ==========================================

window.renderHome = () => {
    const grid = document.getElementById('homeProductGrid');
    const empty = document.getElementById('emptyHomeProducts');
    const loader = document.getElementById('loadingHomeProducts');
    
    if(!grid || !empty) return;
    if(loader) loader.classList.add('hidden');
    
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
    const shopTitle = document.getElementById('shopTitle');
    const shopBreadcrumb = document.getElementById('shopBreadcrumb');
    if(shopTitle) shopTitle.innerText = title;
    if(shopBreadcrumb) shopBreadcrumb.innerText = title;
    
    const grid = document.getElementById('shopGrid');
    const empty = document.getElementById('emptyShopProducts');
    const loader = document.getElementById('loadingShopProducts');
    
    if(!grid || !empty) return;
    if(loader) loader.classList.add('hidden');
    
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

    const list = document.getElementById('shopCategoriesList');
    if(list) list.innerHTML = pillsHtml;
};

window.renderProduct = (queryStr) => {
    const id = new URLSearchParams(queryStr).get('id');
    const product = window.AppState.products.find(p => p.id === id);
    
    if(!product) return window.navigate('home');
    
    window.AppState.currentProductView = product;
    const isWishlisted = window.AppState.wishlist.includes(id);
    const activePrice = product.salePrice || product.price;
    let discount = 0;
    
    if(product.salePrice && product.price > product.salePrice) {
        discount = Math.round(((product.price - product.salePrice) / product.price) * 100);
    }

    const pdpStickyPrice = document.getElementById('pdpStickyPrice');
    if(pdpStickyPrice) pdpStickyPrice.innerText = window.formatPrice(activePrice);

    let sliderHtml = '';
    let thumbHtml = '';
    const imagesArray = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
    imagesArray.forEach((img, i) => {
        let imgId = `mainImg-${i}`;
        sliderHtml += `<img id="${imgId}" src="${img}" class="w-full h-full object-cover object-center snap-center snap-always shrink-0" alt="${product.name}">`;
        let borderClass = (i === 0) ? 'border-brand-900' : 'border-transparent';
        thumbHtml += `<img src="${img}" onclick="document.getElementById('${imgId}').scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'});" class="w-16 h-20 object-cover rounded cursor-pointer border-2 ${borderClass} snap-start shrink-0">`;
    });

    const allProducts = window.AppState.products || [];
    let relatedProducts = allProducts.filter(p => p.id !== product.id).slice(0, 4);
    let relatedHtml = relatedProducts.map(window.createProductCard).join('');

    // === MULTI-COUPON CAROUSEL DESIGN ===
    let couponHtml = '';
    const productCoupons = window.AppState.coupons ? window.AppState.coupons.filter(c => c.productId === product.id) : [];
    
    if (productCoupons.length > 0) {
        const couponsCards = productCoupons.map(c => `
            <div class="snap-start shrink-0 w-[80%] md:w-[250px] p-3 rounded-lg flex flex-col items-start gap-1 shadow-sm" style="background-color: #FDF6F6; border: 1px solid #F5E6E6;">
                <div onclick="copyCouponCode('${c.code}')" class="flex items-center gap-2 px-2.5 py-1 rounded cursor-pointer transition active:scale-95" style="background-color: #FCA595;">
                    <span class="font-bold text-black tracking-wider text-xs uppercase">${c.code}</span>
                    <i class="fa-regular fa-copy text-black text-[10px] ml-1"></i>
                </div>
                <p class="text-gray-800 text-xs font-medium mt-1 line-clamp-2">${c.description}</p>
            </div>
        `).join('');

        couponHtml = `
            <div class="mt-4 mb-6">
                <div class="flex gap-3 overflow-x-auto hide-scrollbar snap-x w-full pb-1">
                    ${couponsCards}
                </div>
            </div>
        `;
    }

    const html = `
        <div class="flex flex-col lg:flex-row gap-8 lg:gap-16 relative p-5 lg:p-0">
            <div class="w-full lg:w-[55%] flex flex-col items-center">
                <div class="relative w-full max-w-[691px] aspect-[691/1050] bg-gray-50 overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                    <div id="pdpMainSlider" class="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full h-full scroll-smooth">
                        ${sliderHtml}
                    </div>
                </div>
                ${imagesArray.length > 1 ? `
                    <div class="flex gap-2 mt-4 overflow-x-auto hide-scrollbar snap-x max-w-[691px] w-full">
                        ${thumbHtml}
                    </div>
                ` : ''}
            </div>

            <div class="w-full lg:w-[45%] py-4 pb-28 lg:pb-10">
                <h1 class="font-display text-2xl lg:text-4xl font-bold text-brand-900 uppercase tracking-tight mb-2 leading-[1.1]">${product.name}</h1>
                
                <div class="flex items-center gap-1 text-xs font-bold text-brand-900 bg-brand-50 px-2 py-1 rounded w-fit mb-4">
                    <i class="fa-solid fa-star text-accent-red text-[10px]"></i> ${product.rating || '4.8'} 
                    <span class="text-gray-400 ml-1">(${product.reviews || '10+'} reviews)</span>
                </div>

                <div class="flex items-end gap-3 mb-2">
                    <span class="font-display font-bold text-3xl text-brand-900">${window.formatPrice(activePrice)}</span>
                    ${discount > 0 ? `
                        <span class="text-gray-400 text-lg line-through mb-0.5">${window.formatPrice(product.price)}</span>
                        <span class="text-accent-red font-bold text-xs uppercase tracking-widest bg-red-50 px-2 py-1 rounded mb-1">Save ${discount}%</span>
                    ` : ''}
                </div>

                ${couponHtml}

                <div class="mt-8 mb-8">
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

                <div class="flex gap-4 mb-12">
                    <button onclick="pdpAddToCart()" class="flex-1 bg-brand-900 text-white py-4.5 font-bold text-sm uppercase tracking-wider shadow-floating hover:bg-gray-800 transition rounded-xl">
                        Add to Cart
                    </button>
                    <button onclick="toggleWishlist('${product.id}')" class="w-14 h-14 border border-gray-200 flex items-center justify-center text-brand-900 hover:border-brand-900 transition rounded-xl" id="pdpWishlistBtnDesktop">
                        <i class="fa-${isWishlisted ? 'solid text-accent-red' : 'regular'} fa-heart text-lg"></i>
                    </button>
                </div>

                <div class="w-full border-t border-gray-100 pt-4" id="product-accordion">
                    
                    <div class="accordion-item border-b border-gray-200">
                        <button class="accordion-header w-full py-5 flex justify-between items-center text-left focus:outline-none group" onclick="window.toggleAccordion(this)">
                            <span class="text-sm font-bold text-brand-900 tracking-widest uppercase">Delivery</span>
                            <span class="accordion-icon text-gray-400 text-2xl font-light transition-transform duration-300 group-hover:text-brand-900">+</span>
                        </button>
                        <div class="accordion-content max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
                            <div class="pb-6 text-sm text-gray-600 font-medium">
                                <div class="flex gap-2">
                                    <input type="text" id="pincode-input" class="border border-gray-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-brand-900 outline-none" placeholder="Enter Pincode" maxlength="6">
                                    <button onclick="window.checkDelivery()" class="bg-black text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider hover:bg-gray-800 transition">Check</button>
                                </div>
                                <p id="delivery-msg" class="text-green-600 font-bold mt-3 hidden">Yes, we can deliver to your doorstep! We also provide all-India delivery.</p>
                                <p id="delivery-error-msg" class="text-accent-red font-bold mt-3 hidden">Please enter a valid 6-digit Pincode.</p>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item border-b border-gray-200">
                        <button class="accordion-header w-full py-5 flex justify-between items-center text-left focus:outline-none group" onclick="window.toggleAccordion(this)">
                            <span class="text-sm font-bold text-brand-900 tracking-widest uppercase">Description & Fit</span>
                            <span class="accordion-icon text-gray-400 text-2xl font-light transition-transform duration-300 group-hover:text-brand-900">+</span>
                        </button>
                        <div class="accordion-content max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
                            <div class="pb-6 text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-line">
                                ${product.description || 'No description provided.'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="accordion-item border-b border-gray-200">
                        <button class="accordion-header w-full py-5 flex justify-between items-center text-left focus:outline-none group" onclick="window.toggleAccordion(this)">
                            <span class="text-sm font-bold text-brand-900 tracking-widest uppercase">Reviews (4.8/5)</span>
                            <span class="accordion-icon text-gray-400 text-2xl font-light transition-transform duration-300 group-hover:text-brand-900">+</span>
                        </button>
                        <div class="accordion-content max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
                            <div class="pb-6 space-y-4">
                                <div class="bg-gray-50 p-4 rounded-xl">
                                    <div class="flex text-yellow-400 text-xs mb-1"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>
                                    <p class="font-bold text-brand-900 text-sm">Rahul S.</p>
                                    <p class="text-xs text-gray-600 mt-1">Awesome quality and perfect fit! Delivery was also fast.</p>
                                </div>
                                <div class="bg-gray-50 p-4 rounded-xl">
                                    <div class="flex text-yellow-400 text-xs mb-1"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>
                                    <p class="font-bold text-brand-900 text-sm">Priya M.</p>
                                    <p class="text-xs text-gray-600 mt-1">The print is exactly as shown in the picture. Will buy again.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="accordion-item border-b border-gray-200">
                        <button class="accordion-header w-full py-5 flex justify-between items-center text-left focus:outline-none group" onclick="window.toggleAccordion(this)">
                            <span class="text-sm font-bold text-brand-900 tracking-widest uppercase">Return Policy</span>
                            <span class="accordion-icon text-gray-400 text-2xl font-light transition-transform duration-300 group-hover:text-brand-900">+</span>
                        </button>
                        <div class="accordion-content max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
                            <div class="pb-6 text-sm text-gray-600 font-medium leading-relaxed">
                                At <b>Khodal</b>, all our products are custom printed on-demand just for you in partnership with <b>Qikink</b>. We do not accept returns or exchanges for size or color preference issues. Returns or replacements are only accepted if you receive a damaged or misprinted item. Please report any defects within 7 days of delivery with an unboxing video.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="w-full mt-10 pt-10 border-t border-gray-100 pb-10 px-5 lg:px-0">
            <h2 class="font-display text-2xl lg:text-3xl font-bold text-brand-900 uppercase tracking-tight mb-8 text-center">May You Also Like</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
                ${relatedHtml || '<p class="text-center col-span-full text-gray-500">More products coming soon.</p>'}
            </div>
        </div>
    `;

    const container = document.getElementById('productDetailContainer');
    if(container) container.innerHTML = html;
};
