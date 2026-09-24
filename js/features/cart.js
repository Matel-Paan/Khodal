window.toggleCart = () => {
    const drawer = document.getElementById('cartDrawer');
    const backdrop = document.getElementById('cartBackdrop');
    if(drawer.classList.contains('drawer-closed')) {
        window.renderCartUI();
        drawer.classList.remove('drawer-closed');
        drawer.classList.add('drawer-open');
        backdrop.classList.remove('hidden');
    } else {
        drawer.classList.add('drawer-closed');
        drawer.classList.remove('drawer-open');
        backdrop.classList.add('hidden');
    }
};

window.quickAdd = (id, e) => {
    if(e) { e.stopPropagation(); e.preventDefault(); }
    const p = window.AppState.products.find(x => x.id === id);
    if(!p) return;
    
    const size = (p.sizes && p.sizes.length > 0) ? p.sizes[0] : 'Free Size';
    const existing = window.AppState.cart.find(item => item.id === p.id && item.size === size);
    
    if(existing) existing.qty += 1;
    else window.AppState.cart.push({ id: p.id, name: p.name, price: p.salePrice || p.price, image: p.image, size: size, qty: 1 });
    
    window.saveCart();
    window.showToast('Added to Cart');
    
    const drawer = document.getElementById('cartDrawer');
    if(drawer.classList.contains('drawer-closed')) {
        window.toggleCart();
    } else {
        window.renderCartUI();
    }
};

window.pdpAddToCart = () => {
    const p = window.AppState.currentProductView;
    if(!p) return;
    const sizeEl = document.querySelector('.size-btn.bg-brand-900');
    const size = sizeEl ? sizeEl.innerText : (p.sizes && p.sizes.length > 0 ? p.sizes[0] : 'Free Size');
    
    const existing = window.AppState.cart.find(item => item.id === p.id && item.size === size);
    if(existing) existing.qty += 1;
    else window.AppState.cart.push({ id: p.id, name: p.name, price: p.salePrice || p.price, image: p.image, size: size, qty: 1 });
    
    window.saveCart();
    window.showToast('Added to Cart');
    
    const drawer = document.getElementById('cartDrawer');
    if(drawer.classList.contains('drawer-closed')) {
        window.toggleCart();
    } else {
        window.renderCartUI();
    }
};

window.updateCartQty = (index, delta) => {
    window.AppState.cart[index].qty += delta;
    if(window.AppState.cart[index].qty <= 0) window.AppState.cart.splice(index, 1);
    window.saveCart();
    window.renderCartUI();
    
    if(window.location.hash.includes('checkout') && window.renderCheckout) window.renderCheckout();
};

window.saveCart = () => {
    localStorage.setItem('tbk_cart', JSON.stringify(window.AppState.cart));
    const count = window.AppState.cart.reduce((s, i) => s + i.qty, 0);
    const badge = document.getElementById('cartCount');
    if(count > 0) { badge.innerText = count; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
};

window.renderCartUI = () => {
    const container = document.getElementById('cartItemsContainer');
    if(window.AppState.cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 flex flex-col items-center">
                <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                    <i class="fa-solid fa-bag-shopping text-2xl"></i>
                </div>
                <h4 class="font-display font-bold text-brand-900 uppercase tracking-tight mb-2">Your Cart is Empty</h4>
                <button onclick="toggleCart(); navigate('shop')" class="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-400 hover:text-brand-900 transition mt-2">Start Shopping</button>
            </div>` + (window.getRecommendationsHtml ? window.getRecommendationsHtml('cart') : '');
        document.getElementById('cartTotal').innerText = '₹0';
        return;
    }
    
    let total = 0;
    let cartItemsHtml = window.AppState.cart.map((item, i) => {
        total += item.price * item.qty;
        return `
        <div class="flex gap-4 mb-6">
            <img src="${item.image}" class="w-20 h-24 object-cover bg-brand-50 cursor-pointer" onclick="navigate('product?id=${item.id}'); toggleCart()">
            <div class="flex-1 flex flex-col justify-between py-1">
                <div>
                    <div class="flex justify-between items-start gap-4">
                        <h4 class="text-xs font-bold text-brand-900 uppercase tracking-tight line-clamp-2">${item.name}</h4>
                        <button onclick="updateCartQty(${i}, -${item.qty})" class="text-gray-300 hover:text-accent-red transition"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <p class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Size: ${item.size}</p>
                </div>
                <div class="flex justify-between items-end mt-2">
                    <div class="flex items-center border border-gray-200">
                        <button class="w-7 h-7 flex items-center justify-center text-brand-900 hover:bg-brand-50 transition" onclick="updateCartQty(${i}, -1)"><i class="fa-solid fa-minus text-[10px]"></i></button>
                        <span class="w-7 text-center text-xs font-bold text-brand-900">${item.qty}</span>
                        <button class="w-7 h-7 flex items-center justify-center text-brand-900 hover:bg-brand-50 transition" onclick="updateCartQty(${i}, 1)"><i class="fa-solid fa-plus text-[10px]"></i></button>
                    </div>
                    <span class="font-display font-bold text-brand-900">${window.formatPrice(item.price)}</span>
                </div>
            </div>
        </div>`;
    }).join('');
    
    container.innerHTML = cartItemsHtml + `<div class="border-t border-gray-100 pt-2 mt-4">` + (window.getRecommendationsHtml ? window.getRecommendationsHtml('cart') : '') + `</div>`;
    document.getElementById('cartTotal').innerText = window.formatPrice(total);
};

window.proceedToCheckout = () => {
    if(window.AppState.cart.length === 0) return window.showToast('Your cart is empty', 'error');
    window.toggleCart();
    window.navigate('checkout');
};
