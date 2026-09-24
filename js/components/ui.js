let toastTimer = null;
window.showToast = (message, type = 'success') => {
    const toast = document.getElementById('toast');
    if(!toast) return;
    
    document.getElementById('toastMessage').innerText = message;
    document.getElementById('toastIcon').className = type === 'success' 
        ? 'fa-solid fa-circle-check text-green-400 text-lg' 
        : 'fa-solid fa-circle-exclamation text-accent-red text-lg';
    
    if (toastTimer) clearTimeout(toastTimer);
    
    toast.classList.add('show');
    toastTimer = setTimeout(() => { toast.classList.remove('show'); }, 3000);
};

window.toggleSidebar = () => {
    const sidebar = document.getElementById('sidebarMenu');
    const backdrop = document.getElementById('sidebarBackdrop');
    if(sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
        if(window.updateSidebarBadges) window.updateSidebarBadges();
        if(window.getRecommendationsHtml) {
            document.getElementById('sidebarRecommendations').innerHTML = window.getRecommendationsHtml('sidebar');
        }
    } else {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
    }
};

window.toggleSearch = () => {
    const overlay = document.getElementById('searchOverlay');
    if(overlay.classList.contains('hidden')) {
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        setTimeout(() => document.getElementById('searchInput').focus(), 100);
    } else {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
};

window.navigate = (hash) => {
    window.location.hash = hash;
    if(!document.getElementById('searchOverlay').classList.contains('hidden')) window.toggleSearch();
};
