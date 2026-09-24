import { db } from '../firebase/firebase-config.js';
import { ref, push, set, serverTimestamp, get, update, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

window.getValidWalletBalance = () => {
    let balance = 0;
    const now = Date.now();
    window.AppState.walletRewards.forEach(r => {
        if(r.status === 'ACTIVE' && r.expiresAt > now) {
            balance += (Number(r.amount) - Number(r.usedAmount || 0));
        }
    });
    return balance;
};

window.renderRewards = () => {
    if(!window.currentUser) return window.navigate('auth');
    const now = Date.now();
    let activeBalance = window.getValidWalletBalance();
    
    document.getElementById('walletBalanceDisplay').innerText = window.formatPrice(activeBalance);

    // Mission 1: Follow Status
    const followClaim = window.AppState.rewardClaims.find(c => c.type === 'FOLLOW');
    const m1Area = document.getElementById('mission1ActionArea');
    if(followClaim) {
        if(followClaim.status === 'PENDING') m1Area.innerHTML = `<span class="text-[10px] font-bold text-orange-500 uppercase tracking-widest"><i class="fa-solid fa-clock mr-1"></i> Verification Pending</span>`;
        else if(followClaim.status === 'APPROVED') m1Area.innerHTML = `<span class="text-[10px] font-bold text-green-500 uppercase tracking-widest"><i class="fa-solid fa-check mr-1"></i> Reward Claimed</span>`;
        else m1Area.innerHTML = `<span class="text-[10px] font-bold text-red-500 uppercase tracking-widest"><i class="fa-solid fa-xmark mr-1"></i> Rejected</span>`;
    } else {
        m1Area.innerHTML = `<button onclick="submitMissionClaim('FOLLOW', 'mission1ActionArea')" class="bg-brand-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition">I Followed (Submit)</button>`;
    }

    // Mission 2: UGC Status
    const ugcClaim = window.AppState.rewardClaims.find(c => c.type === 'UGC_SHARE');
    const m2Area = document.getElementById('mission2ActionArea');
    if(ugcClaim) {
        if(ugcClaim.status === 'PENDING') m2Area.innerHTML = `<span class="text-[10px] font-bold text-orange-500 uppercase tracking-widest"><i class="fa-solid fa-clock mr-1"></i> Link Submitted. Review Pending.</span>`;
        else if(ugcClaim.status === 'APPROVED') m2Area.innerHTML = `<span class="text-[10px] font-bold text-green-500 uppercase tracking-widest"><i class="fa-solid fa-check mr-1"></i> Reward Claimed</span>`;
        else m2Area.innerHTML = `<span class="text-[10px] font-bold text-red-500 uppercase tracking-widest"><i class="fa-solid fa-xmark mr-1"></i> Rejected. Try again.</span>`;
    } else {
        m2Area.innerHTML = `
            <input type="url" id="ugcUrlInput" placeholder="Instagram Post URL" class="flex-1 bg-brand-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-brand-900">
            <button onclick="submitUgcClaim()" class="bg-brand-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition whitespace-nowrap">Submit Link</button>
        `;
    }

    // Mission 3: First Order Status
    const m3Area = document.getElementById('mission3ActionArea');
    if(window.AppState.hasOrders) {
        m3Area.innerHTML = `<span class="text-[10px] font-bold text-green-500 uppercase tracking-widest"><i class="fa-solid fa-check mr-1"></i> Mission Accomplished</span>`;
    }

    // Ledger Lists
    let activeHtml = '';
    let historyHtml = '';

    const sortedRewards = [...window.AppState.walletRewards].sort((a,b) => a.expiresAt - b.expiresAt);

    sortedRewards.forEach(r => {
        const remaining = Number(r.amount) - Number(r.usedAmount || 0);
        const isExpired = r.expiresAt <= now;
        const d = new Date(r.createdAt || r.expiresAt - (30*24*60*60*1000)).toLocaleDateString('en-IN');
        
        let title = r.type === 'FOLLOW' ? 'Mission 01: Follow Reward' : 
                    r.type === 'UGC_SHARE' ? 'Mission 02: Wear & Share Reward' : 
                    r.type === 'FIRST_ORDER' ? 'Mission 03: First Order Reward' : 
                    'Gift Card Reward';

        if(r.status === 'ACTIVE' && !isExpired && remaining > 0) {
            const daysLeft = Math.ceil((r.expiresAt - now)/(1000*60*60*24));
            activeHtml += `
            <div class="flex justify-between items-center bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                <div>
                    <p class="font-bold text-brand-900 text-sm tracking-tight mb-1">${title}</p>
                    <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Expires in ${daysLeft} days</p>
                </div>
                <div class="text-right">
                    <span class="font-display font-bold text-lg text-green-500">${window.formatPrice(remaining)}</span>
                    ${r.usedAmount > 0 ? `<p class="text-[9px] text-gray-400 font-bold uppercase mt-1">Partially Used</p>` : ''}
                </div>
            </div>`;
        } else {
            let statusLabel = r.status === 'USED' ? '<span class="text-gray-500">Fully Used</span>' : 
                              isExpired ? '<span class="text-red-500">Expired</span>' : 
                              `<span class="text-gray-500">${r.status}</span>`;
            
            historyHtml += `
            <div class="flex justify-between items-center bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                <div>
                    <p class="font-bold text-gray-700 text-sm tracking-tight mb-1">${title}</p>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${d}</p>
                </div>
                <div class="text-right">
                    <span class="font-display font-bold text-gray-500">${window.formatPrice(r.amount)}</span>
                    <p class="text-[9px] font-bold uppercase mt-1">${statusLabel}</p>
                </div>
            </div>`;
        }
    });

    document.getElementById('activeRewardsList').innerHTML = activeHtml || `<div class="text-center py-6 text-gray-500 text-sm font-medium bg-gray-50 rounded-2xl border border-gray-100">No active rewards found.</div>`;
    document.getElementById('historyRewardsList').innerHTML = historyHtml || `<div class="text-center py-6 text-gray-500 text-sm font-medium bg-gray-50 rounded-2xl border border-gray-100">No past rewards found.</div>`;
};

window.submitMissionClaim = async (type, btnId) => {
    if(!window.currentUser) return window.navigate('auth');
    const uid = window.currentUser.uid;
    
    const btnContainer = document.getElementById(btnId);
    const originalHTML = btnContainer.innerHTML;
    btnContainer.innerHTML = `<div class="loader w-4 h-4 border-brand-900 border-t-transparent inline-block"></div>`;

    try {
        const claimId = push(ref(db, 'rewardClaims')).key;
        await set(ref(db, `rewardClaims/${claimId}`), {
            uid,
            type,
            status: 'PENDING',
            submittedAt: serverTimestamp()
        });
        window.showToast('Claim Submitted for Verification!');
    } catch(e) {
        console.error(e);
        window.showToast('Failed to submit claim.', 'error');
        btnContainer.innerHTML = originalHTML;
    }
};

window.submitUgcClaim = async () => {
    if(!window.currentUser) return window.navigate('auth');
    const urlInput = document.getElementById('ugcUrlInput');
    const url = urlInput.value.trim();
    if(!url || !url.includes('instagram.com')) return window.showToast('Please enter a valid Instagram URL', 'error');

    const uid = window.currentUser.uid;
    const btnContainer = document.getElementById('mission2ActionArea');
    const originalHTML = btnContainer.innerHTML;
    btnContainer.innerHTML = `<div class="loader w-4 h-4 border-brand-900 border-t-transparent inline-block"></div>`;

    try {
        const claimId = push(ref(db, 'rewardClaims')).key;
        const sanitizedUrl = url.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        await set(ref(db, `rewardClaims/${claimId}`), {
            uid,
            type: 'UGC_SHARE',
            url: sanitizedUrl,
            status: 'PENDING',
            submittedAt: serverTimestamp()
        });
        window.showToast('UGC Link Submitted for Review!');
    } catch(e) {
        console.error(e);
        window.showToast('Failed to submit claim.', 'error');
        btnContainer.innerHTML = originalHTML;
    }
};

window.renderGiftReward = async (queryStr) => {
    const code = new URLSearchParams(queryStr).get('code');
    const stateReveal = document.getElementById('giftRevealState');
    const stateSuccess = document.getElementById('giftSuccessState');
    const stateError = document.getElementById('giftErrorState');
    
    stateReveal.classList.add('hidden');
    stateSuccess.classList.add('hidden');
    stateError.classList.add('hidden');

    if(!code) {
        stateError.classList.remove('hidden');
        return;
    }

    if(!window.currentUser) {
        window.navigate(`auth?redirect=gift-reward?code=${code}`);
        return;
    }

    try {
        const snap = await get(ref(db, `giftCards/${code}`));
        if(!snap.exists()) {
            stateError.classList.remove('hidden');
            return;
        }

        const data = snap.val();
        if(data.status !== 'ACTIVE' || (data.expiresAt && data.expiresAt < Date.now()) || (data.maxRedemptions && (data.redemptionCount || 0) >= data.maxRedemptions)) {
            stateError.classList.remove('hidden');
            return;
        }

        const redemptionQuery = query(ref(db, 'giftCardRedemptions'), orderByChild('uid'), equalTo(window.currentUser.uid));
        const userRedemptionsSnap = await get(redemptionQuery);
        let alreadyRedeemed = false;
        if(userRedemptionsSnap.exists()) {
            userRedemptionsSnap.forEach(child => {
                if(child.val().code === code) alreadyRedeemed = true;
            });
        }

        if(alreadyRedeemed) {
            stateError.classList.remove('hidden');
            return;
        }

        window.currentGiftCode = code;
        window.currentGiftConfig = data;
        stateReveal.classList.remove('hidden');

    } catch(e) {
        console.error(e);
        stateError.classList.remove('hidden');
    }
};

window.revealGiftCard = async () => {
    if(!window.currentGiftCode || !window.currentGiftConfig || !window.currentUser) return;

    const btn = document.getElementById('btnRevealGift');
    btn.innerHTML = `<div class="loader border-white border-t-transparent mx-auto"></div>`;
    btn.disabled = true;

    try {
        let rewardAmount = window.currentGiftConfig.rewardAmount || 50; 
        
        const updates = {};
        const now = Date.now();
        const expiry = now + (30 * 24 * 60 * 60 * 1000);
        
        const newRewardKey = push(ref(db)).key;
        const newRedemptionKey = push(ref(db)).key;

        const newRedemptionCount = (window.currentGiftConfig.redemptionCount || 0) + 1;
        let newStatus = window.currentGiftConfig.status;
        if(window.currentGiftConfig.maxRedemptions && newRedemptionCount >= window.currentGiftConfig.maxRedemptions) {
            newStatus = 'REDEEMED';
        }

        updates[`giftCards/${window.currentGiftCode}/redemptionCount`] = newRedemptionCount;
        updates[`giftCards/${window.currentGiftCode}/status`] = newStatus;

        updates[`giftCardRedemptions/${newRedemptionKey}`] = {
            code: window.currentGiftCode,
            uid: window.currentUser.uid,
            rewardId: newRewardKey,
            amount: rewardAmount,
            redeemedAt: serverTimestamp()
        };

        updates[`users/${window.currentUser.uid}/walletRewards/${newRewardKey}`] = {
            amount: rewardAmount,
            type: 'GIFT_CARD',
            source: window.currentGiftCode,
            status: 'ACTIVE',
            usedAmount: 0,
            createdAt: serverTimestamp(),
            expiresAt: expiry
        };

        await update(ref(db), updates);

        document.getElementById('giftRevealState').classList.add('hidden');
        document.getElementById('giftRewardAmount').innerText = `₹${rewardAmount}`;
        document.getElementById('giftSuccessState').classList.remove('hidden');
        
        window.showToast('Reward added to your wallet!');

    } catch(e) {
        console.error(e);
        window.showToast('Error redeeming gift card.', 'error');
        btn.innerHTML = `Reveal My Reward`;
        btn.disabled = false;
    }
};
