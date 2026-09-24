import { db } from '../firebase/firebase-config.js';
import { ref, push, update, serverTimestamp, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

window.selectPaymentMethod = (method) => {
    document.getElementById('payCOD').checked = (method === 'COD');
    document.getElementById('payONLINE').checked = (method === 'ONLINE');

    const codLabel = document.getElementById('codLabel');
    const onlineLabel = document.getElementById('onlineLabel');
    const onlineBox = document.getElementById('onlinePaymentBox');
    const utrInput = document.getElementById('chkUtr');

    if(method === 'ONLINE') {
        codLabel.className = "flex items-center p-5 bg-white border-2 border-gray-200 rounded-2xl cursor-pointer transition";
        onlineLabel.className = "flex items-center p-5 bg-brand-50 border-2 border-brand-900 rounded-2xl cursor-pointer transition";
        onlineBox.classList.remove('hidden');
        utrInput.setAttribute('required', 'required');

        const qrImg = document.getElementById('qrCodeImage');
        if(qrImg && window.AppState.settings.paymentQR) qrImg.src = window.AppState.settings.paymentQR;
    } else {
        codLabel.className = "flex items-center p-5 bg-brand-50 border-2 border-brand-900 rounded-2xl cursor-pointer transition";
        onlineLabel.className = "flex items-center p-5 bg-white border-2 border-gray-200 rounded-2xl cursor-pointer transition";
        onlineBox.classList.add('hidden');
        utrInput.removeAttribute('required');
    }
};

window.renderCheckout = () => {
    if(window.AppState.cart.length === 0) {
        window.navigate('shop');
        return;
    }

    document.getElementById('chkUseWallet').checked = false;
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
    document.getElementById('chkOrderItems').innerHTML = itemsHtml;

    if (window.getRecommendationsHtml) {
        document.getElementById('checkoutRecommendations').innerHTML = window.getRecommendationsHtml('checkout');
    }
    
    if(window.currentUser) {
        document.getElementById('chkEmail').value = window.currentUser.email || '';
        get(ref(db, `users/${window.currentUser.uid}`)).then(snap => {
            if(snap.exists()) {
                const d = snap.val();
                if(d.name) document.getElementById('chkName').value = d.name;
                if(d.phone) document.getElementById('chkMobile').value = d.phone;
            }
        });
    }
};

window.calculateCheckoutTotals = () => {
    const subtotal = window.AppState.cart.reduce((s, i) => s + (i.price * i.qty), 0);
    document.getElementById('chkSubtotal').innerText = window.formatPrice(subtotal);

    let payable = subtotal;
    let walletDiscount = 0;

    const walletBox = document.getElementById('checkoutWalletBox');
    if(window.currentUser) {
        walletBox.classList.remove('hidden');
        const available = window.getValidWalletBalance ? window.getValidWalletBalance() : 0;
        document.getElementById('chkWalletAvailable').innerText = `₹${available} Available`;
        
        if(document.getElementById('chkUseWallet').checked && available > 0) {
            walletDiscount = Math.min(available, subtotal); 
            payable = subtotal - walletDiscount;
            document.getElementById('chkWalletAppliedAmount').innerText = `-₹${walletDiscount}`;
            document.getElementById('chkWalletDiscountRow').classList.remove('hidden');
            document.getElementById('chkWalletDiscountDisplay').innerText = `-₹${walletDiscount}`;
        } else {
            document.getElementById('chkWalletAppliedAmount').innerText = `-₹0`;
            document.getElementById('chkWalletDiscountRow').classList.add('hidden');
        }
    } else {
        walletBox.classList.add('hidden');
        document.getElementById('chkWalletDiscountRow').classList.add('hidden');
    }

    document.getElementById('chkTotal').innerText = window.formatPrice(payable);
    document.getElementById('qrAmount').innerText = window.formatPrice(payable);

    if(!document.getElementById('payONLINE').checked && !document.getElementById('payCOD').checked) {
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

    const selectedPaymentMethod = document.getElementById('payONLINE').checked ? 'ONLINE' : 'COD';
    const utrNumber = selectedPaymentMethod === 'ONLINE' ? document.getElementById('chkUtr').value.trim() : null;

    if(selectedPaymentMethod === 'ONLINE' && !utrNumber) {
        window.showToast('Please enter the UTR / Transaction ID', 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    let walletDiscount = 0;
    let finalPayable = subtotal;
    let rewardsUsed = [];

    if(window.currentUser && document.getElementById('chkUseWallet').checked) {
        const available = window.getValidWalletBalance ? window.getValidWalletBalance() : 0;
        if(available > 0) {
            walletDiscount = Math.min(available, subtotal);
            finalPayable = subtotal - walletDiscount;
            
            let remainingToDeduct = walletDiscount;
            const now = Date.now();
            const activeRewards = window.AppState.walletRewards
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
        shippingCharge: 0,
        walletDiscount: walletDiscount,
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
        if (window.saveCart) window.saveCart();
        btn.innerHTML = originalText;
        btn.disabled = false;
        window.showToast(`Order ${orderId} Confirmed!`);
        
        document.getElementById('chkName').value = '';
        document.getElementById('chkEmail').value = '';
        document.getElementById('chkMobile').value = '';
        document.getElementById('chkAddress1').value = '';
        document.getElementById('chkAddress2').value = '';
        document.getElementById('chkPincode').value = '';
        document.getElementById('chkCity').value = '';
        document.getElementById('chkState').value = '';
        document.getElementById('chkUtr').value = '';
        window.selectPaymentMethod('COD');
        
        window.navigate('home');
    } catch(e) {
        console.error("Order error", e);
        window.showToast('Transaction Failed: Ensure Database Rules are true', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};
