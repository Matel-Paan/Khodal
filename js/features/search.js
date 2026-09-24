document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const resultsContainer = document.getElementById('searchResults');
            
            if(query.length < 2) {
                resultsContainer.classList.add('hidden');
                return;
            }

            const results = window.AppState.products.filter(p => 
                p.name.toLowerCase().includes(query) || 
                (p.tags && p.tags.includes(query)) || 
                p.category.toLowerCase().includes(query)
            );
            
            if(results.length > 0) {
                resultsContainer.innerHTML = results.map(window.createProductCard).join('');
                resultsContainer.classList.remove('hidden');
            } else {
                resultsContainer.innerHTML = `<div class="col-span-full text-center py-10 text-gray-500 font-medium">No results found for "${query}"</div>`;
                resultsContainer.classList.remove('hidden');
            }
        });
    }

    // Global Timer Tick Function for Limited Time Offers
    setInterval(() => {
        document.querySelectorAll('.offer-timer').forEach(el => {
            const endTime = parseInt(el.dataset.endtime); 
            if(isNaN(endTime)) return;
            
            const now = Date.now();
            const diff = endTime - now;
            const textEl = el.querySelector('.timer-text');
            
            if(diff <= 0) {
                if(textEl) textEl.innerHTML = "Offer Expired";
                el.classList.add('opacity-50');
                el.classList.remove('timer-pulse');
            } else {
                const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const m = Math.floor((diff / 1000 / 60) % 60);
                const s = Math.floor((diff / 1000) % 60);
                
                let str = "";
                if(d > 0) str += `${d}d `;
                str += `${h.toString().padStart(2,'0')}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
                
                if(textEl) textEl.innerHTML = str;
            }
        });
    }, 1000);
});
