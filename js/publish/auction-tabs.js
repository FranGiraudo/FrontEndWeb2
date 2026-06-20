/**
 * js/publish/auction-tabs.js
 * Módulo para gestionar las pestañas de Modo Normal vs. Subasta en la vista de publicación.
 */

export function initAuctionTabs(state) {
    const tabNormal = document.getElementById('tab-normal');
    const tabAuction = document.getElementById('tab-auction');
    const auctionFields = document.querySelectorAll('.auction-fields');
    const groupPrecio = document.getElementById('group-precio');
    const glider = document.getElementById('switch-glider');

    if (tabNormal && tabAuction) {
        tabNormal.addEventListener('click', () => {
            state.isAuctionMode = false;
            tabNormal.style.color = "#fff";
            tabNormal.style.fontWeight = "800";
            tabAuction.style.color = "var(--text-muted)";
            tabAuction.style.fontWeight = "600";
            
            if (glider) glider.style.transform = "translateX(0)";
            
            auctionFields.forEach(el => el.style.display = 'none');
            groupPrecio.style.display = 'flex';
        });

        tabAuction.addEventListener('click', () => {
            state.isAuctionMode = true;
            tabAuction.style.color = "#fff";
            tabAuction.style.fontWeight = "800";
            tabNormal.style.color = "var(--text-muted)";
            tabNormal.style.fontWeight = "600";
            
            if (glider) glider.style.transform = "translateX(100%)";
            
            auctionFields.forEach(el => el.style.display = 'flex');
            groupPrecio.style.display = 'none';
        });
    }
}
