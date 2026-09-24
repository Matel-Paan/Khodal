import { db } from '../firebase/firebase-config.js';
import { ref, query, orderByChild, equalTo, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

window.initiateOrderTracking = () => {
    const mobile = document.getElementById('trackMobile').value.trim();
    const resultsContainer = document.getElementById('trackResults');
    
    if(!mobile) return window.showToast('Enter mobile number', 'error');
    
    resultsContainer.innerHTML = `<div class="flex justify-center py-10"><div class="loader border-brand-900 border-t-transparent"></div></div>`;
    
    if(window.currentOrderTrackerUnsubscribe) {
        window.currentOrderTrackerUnsubscribe();
    }
    
    try {
        const ordersQuery = query(ref(db, "orders"), orderByChild("mobile"), equalTo(mobile));

        window.currentOrderTrackerUnsubscribe = onValue(ordersQuery, (snapshot) => {
            if (!snapshot.exists()) {
                resultsContainer.innerHTML = `
                    <div class="text-center py-10 bg-white border border-gray-100 shadow-sm rounded-3xl max-w-md mx-auto">
                        <i class="fa-solid fa-circle-exclamation text-3xl text-gray-300 mb-4"></i>
                        <p class="text-brand-900 font-bold uppercase tracking-tight mb-1">No Orders Found</p>
                        <p class="text-gray-500 text-sm font-medium">We couldn't find anything for ${mobile}.</p>
                    </div>`;
                return;
            }

            const orders = [];
            snapshot.forEach(child => orders.push({ id: child.key, ...child.val() }));
            
            orders.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.date || 0).getTime();
                const dateB = new Date(b.createdAt || b.date || 0).getTime();
                return dateB - dateA;
            });

            let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';
            orders.forEach((data) => {
                const ts = data.createdAt || data.date || Date.now();
                const d = new Date(ts);
                
                const statusColors = {
                    'NEW': 'bg-blue-50 text-blue-600 border-blue-200',
                    'CONFIRMED': 'bg-blue-50 text-blue-600 border-blue-200',
                    'PROCESSING': 'bg-orange-50 text-orange-600 border-orange-200',
                    'READY_FOR_QIKINK': 'bg-indigo-50 text-indigo-600 border-indigo-200',
                    'SHIPPED': 'bg-purple-50 text-purple-600 border-purple-200',
                    'OUT_FOR_DELIVERY': 'bg-teal-50 text-teal-600 border-teal-200',
                    'DELIVERED': 'bg-green-50 text-green-600 border-green-200',
                    'CANCELLED': 'bg-red-50 text-red-600 border-red-200',
                    'RETURNED': 'bg-red-50 text-red-600 border-red-200',
                };
                const badgeClass = statusColors[data.status] || 'bg-gray-50 text-gray-600 border-gray-200';

                html += `
                    <div class="bg-white border border-gray-100 rounded-3xl p-6 shadow-soft relative">
                        <div class="absolute top-4 right-4 flex items-center gap-1 text-[9px] font-bold text-green-500 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            <span class="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span> Live
                        </div>
                        <div class="flex justify-between items-start mb-6 border-b border-gray-100 pb-4 mt-2">
                            <div>
                                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Order Number</p>
                                <p class="font-display font-bold text-brand-900 text-lg">${data.orderId || data.id}</p>
                            </div>
                            <div class="text-right mt-4">
                                <span class="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded border ${badgeClass}">${data.status || 'NEW'}</span>
                                <p class="text-xs text-gray-400 mt-2 font-medium">${d.toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}</p>
                            </div>
                        </div>
                        <div class="space-y-4 mb-6">
                            ${(data.products || []).map(p => `
                                <div class="flex gap-4 items-center">
                                    <img src="${p.image}" class="w-14 h-16 object-cover bg-brand-50">
                                    <div class="flex-1">
                                        <p class="text-xs font-bold text-brand-900 uppercase tracking-tight line-clamp-1 mb-1">${p.name}</p>
                                        <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Qty: ${p.qty} • Size: ${p.size}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="flex justify-between items-center border-t border-gray-100 pt-4">
                            <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Amount</span>
                            <span class="font-display font-bold text-brand-900 text-lg">${window.formatPrice(data.totalAmount || 0)}</span>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            resultsContainer.innerHTML = html;
        }, (error) => {
            console.error("Tracking Error:", error);
            resultsContainer.innerHTML = `
                <div class="text-center py-10 bg-white border border-red-100 shadow-sm rounded-3xl max-w-md mx-auto">
                    <i class="fa-solid fa-triangle-exclamation text-3xl text-accent-red mb-4"></i>
                    <p class="text-brand-900 font-bold uppercase tracking-tight mb-1">System Error</p>
                    <p class="text-gray-500 text-sm font-medium">Please check Database Rules.</p>
                </div>`;
        });

    } catch (error) {
        console.error("Tracking Init Error:", error);
    }
};
