window.createProductCard = (p) => {
    const isWishlisted = window.AppState.wishlist.includes(p.id);
    const activePrice = p.salePrice || p.price;
    let discount = 0;
    if (p.salePrice && p.price > p.salePrice) {
        discount = Math.round(((p.price - p.salePrice) / p.price) * 100);
    }
    
    return `
    <div class="group flex flex-col cursor-pointer bg-white" onclick="navigate('product?id=${p.id}')">
        <div class="relative bg-gray-100 aspect-[3/4] mb-3 overflow-hidden">
            <img src="${p.image}" class="w-full h-full object-cover object-center img-hover-zoom" alt="${p.name}" loading="lazy">
            <button onclick="toggleWishlist('${p.id}', event)" class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center z-10 hover:scale-110 transition">
                <i class="fa-${isWishlisted ? 'solid text-accent-red' : 'regular text-gray-500'} fa-heart text-xl"></i>
            </button>
        </div>
        
        <div class="flex flex-col px-1">
            <div class="flex justify-between items-start">
                <div class="flex-1 pr-2">
                    <h4 class="text-sm font-medium text-gray-800 leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">${p.name}</h4>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="font-bold text-brand-900 text-sm">${window.formatPrice(activePrice)}</span>
                        ${discount > 0 ? `<span class="text-gray-400 text-xs line-through">${window.formatPrice(p.price)}</span>` : ''}
                    </div>
                </div>
                <button onclick="quickAdd('${p.id}', event)" class="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-brand-900 transition mt-1 bg-gray-50 rounded-md">
                    <i class="fa-solid fa-plus text-sm"></i>
                </button>
            </div>
        </div>
    </div>`;
};

window.scrollPdpThumbs = (dir) => {
    const container = document.getElementById('pdpThumbContainer');
    if(container) container.scrollBy({ left: dir * 150, behavior: 'smooth' });
};

window.selectPdpSize = (btn) => {
    document.querySelectorAll('.size-btn').forEach(b => {
        b.classList.remove('bg-brand-900', 'text-white', 'border-brand-900');
        b.classList.add('bg-white', 'text-brand-900', 'border-gray-200');
    });
    btn.classList.remove('bg-white', 'text-brand-900', 'border-gray-200');
    btn.classList.add('bg-brand-900', 'text-white', 'border-brand-900');
};

// ==========================================
// NEW FEATURES: ACCORDION, DELIVERY & COUPON
// ==========================================

window.toggleAccordion = (btn) => {
    const content = btn.nextElementSibling;
    const icon = btn.querySelector('.accordion-icon');
    
    document.querySelectorAll('.accordion-content').forEach(el => {
        if(el !== content) el.style.maxHeight = null;
    });
    document.querySelectorAll('.accordion-icon').forEach(el => {
        if(el !== icon) el.textContent = '+';
    });

    if (content.style.maxHeight) {
        content.style.maxHeight = null;
        icon.textContent = '+';
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
        icon.textContent = '-';
    }
};

window.checkDelivery = () => {
    const pincode = document.getElementById('pincode-input').value.trim();
    const msg = document.getElementById('delivery-msg');
    const errorMsg = document.getElementById('delivery-error-msg');
    
    msg.classList.add('hidden');
    errorMsg.classList.add('hidden');

    if(pincode.length === 6 && !isNaN(pincode)) {
        msg.classList.remove('hidden');
    } else {
        errorMsg.classList.remove('hidden');
    }
};

window.copyCouponCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
        if (window.showToast) window.showToast('Coupon code copied!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
};
