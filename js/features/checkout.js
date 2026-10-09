import { db } from '../firebase/firebase-config.js';
import { ref, push, update, serverTimestamp, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

window.appliedCoupon = null;

window.selectPaymentMethod = (method) => {
    const payCOD = document.getElementById('payCOD');
    const payONLINE = document.getElementById('payONLINE');
    const codLabel = document.getElementById('codLabel');
    const onlineLabel = document.getElementById('onlineLabel');
    const onlineBox = document.getElementById('onlinePaymentBox');
    const utrInput = document.getElementById('chkUtr');

    if(payCOD) payCOD.checked = (method === 'COD');
    if(payONLINE) payONLINE.checked = (method === 'ONLINE');

    if(method === 'ONLINE') {
        if(codLabel) codLabel.className = "flex items-center p-5 bg-white border-2 border-gray-200 rounded-2xl cursor-pointer transition";
        if(onlineLabel) onlineLabel.className = "flex items-center p-5 bg-brand-50 border-2 border-brand-900 rounded-2xl cursor-pointer transition";
        if(onlineBox) onlineBox.classList.remove('hidden');
        if(utrInput) utrInput.setAttribute('required', 'required');

        const qrImg = document.getElementById('qrCodeImage');
        if(qrImg && window.AppState.settings && window.AppState.settings.paymentQR) qrImg.src = window.AppState.settings.paymentQR;
    } else {
        if(codLabel) codLabel.className = "flex items-center p-5 bg-brand-50 border-2 border-brand-900 rounded-2xl cursor-pointer transition";
        if(onlineLabel) onlineLabel.className = "flex items-center p-5 bg-white border-2 border-gray-200 rounded-2xl cursor-pointer transition";
        if(onlineBox) onlineBox.classList.add('hidden');
        if(utrInput) utrInput.removeAttribute('required');
    }
};

window.applyCheckoutCoupon = () => {
    const inputEl = document.getElementById('chkCouponInput');
    const msgEl = document.getElementById('chkCouponMsg');
    const code = inputEl.value.trim().toUpperCase();

    if (!code) {
        msgEl.textContent = 'Please enter a coupon code.';
        msgEl.className = 'text-xs mt-2 text-red-300 font-medium';
        msgEl.classList.remove('hidden');
        return;
    }

    const coupon = window.AppState.coupons ? window.AppState.coupons.find(c => c.code.toUpperCase() === code) : null;
    
    if (!coupon) {
        msgEl.textContent = 'Invalid or expired coupon code.';
        msgEl.className = 'text-xs mt-2 text-red-300 font-medium';
        msgEl.classList.remove('hidden');
        window.appliedCoupon = null;
        window.calculateCheckoutTotals();
        return;
    }

    const subtotal = window.AppState.cart.reduce((s, i) => s + (i.price * i.qty), 0);
    
    if (subtotal < coupon.minOrder) {
        msgEl.textContent = `This coupon requires a minimum order of ₹${coupon.minOrder}. Add more items to apply.`;
        msgEl.className = 'text-xs mt-2 text-orange-300 font-medium';
        msgEl.classList.remove('hidden');
        window.appliedCoupon = null;
        window.calculateCheckoutTotals();
        return;
    }

    window.appliedCoupon = coupon;
    msgEl.textContent = `Coupon applied successfully! ${coupon.discount}% off.`;
    msgEl.className = 'text-xs mt-2 text-green-400 font-medium';
    msgEl.classList.remove('hidden');
    window.calculateCheckoutTotals();
};

window.renderCheckout = () => {
    if(window.AppState.cart.length === 0) {
        window.navigate('shop');
        return;
    }

    const chkUseWallet = document.getElementById('chkUseWallet');
    if(chkUseWallet) chkUseWallet.checked = false;
    
    window.appliedCoupon = null;
    const couponInput = document.getElementById('chkCouponInput');
    const couponMsg = document.getElementById('chkCouponMsg');
    if(couponInput) couponInput.value = '';
    if(couponMsg) couponMsg.classList.add('hidden');

    window.calculateCheckoutTotals();

    const itemsHtml = window.AppState.cart.map(item => `
        <div class="flex justify-between items-center gap-4">
            <div class="flex items-center gap-3">
                <div class="relative">
                    <img src="${item.image}" class="w-12 h-14 object-cover bg-white/10 rounded">
                    <span class="absolute -top-2 -right-2 bg-white text-brand-900 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">${item.qty}</span>
                </div>
                <div>
                    <p class="text-xs font-bold uppercase tracking-tight text-white/90 line-clamp-1">${item.name}</p>
                    <p class="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">Size: ${item.size}</p>
                </div>
            </div>
            <span class="text-sm font-bold">${window.formatPrice(item.price * item.qty)}</span>
        </div>
    `).join('');
    
    const orderItemsContainer = document.getElementById('chkOrderItems');
    if (orderItemsContainer) orderItemsContainer.innerHTML = itemsHtml;

    if (window.getRecommendationsHtml) {
        const checkoutRecs = document.getElementById('checkoutRecommendations');
        if (checkoutRecs) checkoutRecs.innerHTML = window.getRecommendationsHtml('checkout');
    }
    
    if(window.currentUser) {
        const emailInput = document.getElementById('chkEmail');
        if (emailInput) emailInput.value = window.currentUser.email || '';
        
        get(ref(db, `users/${window.currentUser.uid}`)).then(snap => {
            if(snap.exists()) {
                const d = snap.val();
                const nameInput = document.getElementById('chkName');
                const mobileInput = document.getElementById('chkMobile');
                if(d.name && nameInput) nameInput.value = d.name;
                if(d.phone && mobileInput) mobileInput.value = d.phone;
            }
        }).catch(err => console.error(err));
    }
};

window.calculateCheckoutTotals = () => {
    const subtotal = window.AppState.cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const subtotalEl = document.getElementById('chkSubtotal');
    if(subtotalEl) subtotalEl.innerText = window.formatPrice(subtotal);

    let payable = subtotal;

    // Apply Coupon Discount
    let couponDiscountAmount = 0;
    const couponRow = document.getElementById('chkCouponDiscountRow');
    const msgEl = document.getElementById('chkCouponMsg');

    if (window.appliedCoupon) {
        if (subtotal >= window.appliedCoupon.minOrder) {
            couponDiscountAmount = Math.round(subtotal * (window.appliedCoupon.discount / 100));
            payable -= couponDiscountAmount;
            if (couponRow) {
                couponRow.classList.remove('hidden');
                document.getElementById('chkCouponCodeDisplay').innerText = window.appliedCoupon.code;
                document.getElementById('chkCouponDiscountAmount').innerText = `-₹${couponDiscountAmount}`;
            }
        } else {
            window.appliedCoupon = null;
            if (couponRow) couponRow.classList.add('hidden');
            if (msgEl) {
                msgEl.textContent = 'Coupon removed. Cart total is below the minimum order requirement.';
                msgEl.className = 'text-xs mt-2 text-orange-300 font-medium';
                msgEl.classList.remove('hidden');
            }
        }
    } else {
        if (couponRow) couponRow.classList.add('hidden');
    }

    // Apply Wallet Discount
    let walletDiscount = 0;
    const walletBox = document.getElementById('checkoutWalletBox');
    const chkUseWallet = document.getElementById('chkUseWallet');
    const chkWalletAvailable = document.getElementById('chkWalletAvailable');
    const chkWalletAppliedAmount = document.getElementById('chkWalletAppliedAmount');
    const chkWalletDiscountRow = document.getElementById('chkWalletDiscountRow');
    const chkWalletDiscountDisplay = document.getElementById('chkWalletDiscountDisplay');

    if(window.currentUser && walletBox) {
        walletBox.classList.remove('hidden');
        const available = window.getValidWalletBalance ? window.getValidWalletBalance() : 0;
        if(chkWalletAvailable) chkWalletAvailable.innerText = `₹${available} Available`;
        
        if(chkUseWallet && chkUseWallet.checked && available > 0) {
            walletDiscount = Math.min(available, payable); 
            payable -= walletDiscount;
            if(chkWalletAppliedAmount) chkWalletAppliedAmount.innerText = `-₹${walletDiscount}`;
            if(chkWalletDiscountRow) chkWalletDiscountRow.classList.remove('hidden');
            if(chkWalletDiscountDisplay) chkWalletDiscountDisplay.innerText = `-₹${walletDiscount}`;
        } else {
            if(chkWalletAppliedAmount) chkWalletAppliedAmount.innerText = `-₹0`;
            if(chkWalletDiscountRow) chkWalletDiscountRow.classList.add('hidden');
        }
    } else {
        if(walletBox) walletBox.classList.add('hidden');
        if(chkWalletDiscountRow) chkWalletDiscountRow.classList.add('hidden');
    }

    const totalEl = document.getElementById('chkTotal');
    const qrAmountEl = document.getElementById('qrAmount');
    if(totalEl) totalEl.innerText = window.formatPrice(payable);
    if(qrAmountEl) qrAmountEl.innerText = window.formatPrice(payable);

    const payONLINE = document.getElementById('payONLINE');
    const payCOD = document.getElementById('payCOD');
    if(payONLINE && payCOD && !payONLINE.checked && !payCOD.checked) {
        window.selectPaymentMethod('COD');
    }
};

window.placeOrder = async () => {
    const form = document.getElementById('checkoutForm');
    if(!form.checkValidity()) { form.reportValidity(); return; }
    
    const btn = document.getElementById('btnPlaceOrder');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<div class="loader border-brand-900 border-t-transparent mx-auto"></div>`;
    btn.disabled = true;
    
    const subtotal = window.AppState.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    
    const prefix = "KHODAL"; 
    const year = new Date().getFullYear();
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const orderId = `${prefix}-${year}-${randomCode}`;
    
    const mobile = document.getElementById('chkMobile').value;
    const affiliateCode = localStorage.getItem('pod_affiliate_ref');

    const payONLINE = document.getElementById('payONLINE');
    const selectedPaymentMethod = (payONLINE && payONLINE.checked) ? 'ONLINE' : 'COD';
    const utrInput = document.getElementById('chkUtr');
    const utrNumber = selectedPaymentMethod === 'ONLINE' && utrInput ? utrInput.value.trim() : null;

    if(selectedPaymentMethod === 'ONLINE' && !utrNumber) {
        window.showToast('Please enter the UTR / Transaction ID', 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    let couponDiscountAmount = 0;
    if (window.appliedCoupon && subtotal >= window.appliedCoupon.minOrder) {
        couponDiscountAmount = Math.round(subtotal * (window.appliedCoupon.discount / 100));
    }

    let postCouponTotal = subtotal - couponDiscountAmount;
    let walletDiscount = 0;
    let finalPayable = postCouponTotal;
    let rewardsUsed = [];

    const chkUseWallet = document.getElementById('chkUseWallet');
    if(window.currentUser && chkUseWallet && chkUseWallet.checked) {
        const available = window.getValidWalletBalance ? window.getValidWalletBalance() : 0;
        if(available > 0) {
            walletDiscount = Math.min(available, postCouponTotal);
            finalPayable = postCouponTotal - walletDiscount;
            
            let remainingToDeduct = walletDiscount;
            const now = Date.now();
            const activeRewards = (window.AppState.walletRewards || [])
                .filter(r => r.status === 'ACTIVE' && r.expiresAt > now)
                .sort((a,b) => a.expiresAt - b.expiresAt);

            for(let r of activeRewards) {
                if(remainingToDeduct <= 0) break;
                let rRem = Number(r.amount) - Number(r.usedAmount || 0);
                if(rRem > 0) {
                    let deduct = Math.min(rRem, remainingToDeduct);
                    rewardsUsed.push({
                        id: r.id,
                        amountDeducted: deduct,
                        newUsedAmount: Number(r.usedAmount || 0) + deduct,
                        fullyUsed: (Number(r.usedAmount || 0) + deduct) >= Number(r.amount)
                    });
                    remainingToDeduct -= deduct;
                }
            }
        }
    }

    const addressLine1 = document.getElementById('chkAddress1').value;
    const addressLine2 = document.getElementById('chkAddress2').value;
    const pincode = document.getElementById('chkPincode').value;
    const city = document.getElementById('chkCity').value;
    const state = document.getElementById('chkState').value;

    const orderData = {
        orderId: orderId,
        customerName: document.getElementById('chkName').value,
        email: document.getElementById('chkEmail').value,
        mobile: mobile,
        addressLine1: addressLine1,
        addressLine2: addressLine2 || '',
        pincode: pincode,
        city: city,
        state: state,
        address: [addressLine1, addressLine2, city, state, pincode].filter(Boolean).join(', '),
        products: window.AppState.cart,
        subtotal: subtotal,
        couponCode: window.appliedCoupon ? window.appliedCoupon.code : null,
        couponDiscount: couponDiscountAmount,
        walletDiscount: walletDiscount,
        shippingCharge: 0,
        rewardsUsedLog: rewardsUsed.length > 0 ? rewardsUsed.map(r => ({id: r.id, amount: r.amountDeducted})) : null,
        totalAmount: finalPayable,
        paymentMethod: selectedPaymentMethod,
        utrNumber: utrNumber,
        paymentStatus: selectedPaymentMethod === 'ONLINE' ? 'UTR_SUBMITTED' : 'PENDING',
        status: 'NEW',
        affiliateCode: affiliateCode || null,
        userId: window.currentUser ? window.currentUser.uid : 'guest',
        date: new Date().toISOString() 
    };

    try {
        if(db) {
            const updates = {};
            const newOrderKey = push(ref(db, 'orders')).key;
            
            orderData.createdAt = serverTimestamp();
            orderData.updatedAt = serverTimestamp();
            updates[`orders/${newOrderKey}`] = orderData;

            if(window.currentUser && rewardsUsed.length > 0) {
                rewardsUsed.forEach(r => {
                    updates[`users/${window.currentUser.uid}/walletRewards/${r.id}/usedAmount`] = r.newUsedAmount;
                    if(r.fullyUsed) {
                        updates[`users/${window.currentUser.uid}/walletRewards/${r.id}/status`] = 'USED';
                    }
                });
            }

            if(window.currentUser && !window.AppState.hasOrders) {
                const newRewardKey = push(ref(db)).key;
                const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); 
                updates[`users/${window.currentUser.uid}/walletRewards/${newRewardKey}`] = {
                    amount: 100,
                    type: 'FIRST_ORDER',
                    source: 'khodal_mission',
                    status: 'ACTIVE',
                    usedAmount: 0,
                    createdAt: serverTimestamp(),
                    expiresAt: expiry
                };
            }

            await update(ref(db), updates);
        }
        
        window.AppState.cart = [];
        window.appliedCoupon = null;
        if (window.saveCart) window.saveCart();
        btn.innerHTML = originalText;
        btn.disabled = false;
        window.showToast(`Order ${orderId} Confirmed!`);
        
        const idsToReset = ['chkName', 'chkEmail', 'chkMobile', 'chkAddress1', 'chkAddress2', 'chkPincode', 'chkCity', 'chkState', 'chkUtr'];
        idsToReset.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = '';
        });
        
        window.selectPaymentMethod('COD');
        window.navigate('home');
    } catch(e) {
        console.error("Order error", e);
        window.showToast('Transaction Failed', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};