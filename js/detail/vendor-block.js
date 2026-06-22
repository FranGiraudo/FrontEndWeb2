/**
 * js/detail/vendor-block.js
 * Módulo puro encargado de renderizar el bloque del vendedor.
 */

export function generateVendorBlockHTML(seller) {
    if (!seller) return '';
    
    // Usar datos del backend prioritariamente
    const nameStr = seller.name || (seller.nombre ? seller.nombre + ' ' + (seller.apellido || '') : 'Vendedor');
    const avatarUrl = seller.profilePicture || seller.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nameStr) + '&background=random&color=fff';
    const rating = seller.ratingAverage ?? seller.rating ?? (Math.random() * (5 - 3.5) + 3.5).toFixed(1);
    const totalReviews = seller.totalReviews ?? Math.floor(Math.random() * 100) + 5;
    const isTopVendedor = seller.isTopVendedor ?? (rating > 4.5);
    
    const badgeHTML = isTopVendedor ? `<div class="vendor-badge">Vendedor Destacado</div>` : '';
    
    const starFilledSVG = `<svg viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1rem;height:1rem;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    const starEmptySVG = `<svg viewBox="0 0 24 24" fill="transparent" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1rem;height:1rem;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += i <= Math.round(rating) ? starFilledSVG : starEmptySVG;
    }

    return `
        <div class="vendor-block">
            ${badgeHTML}
            <div class="vendor-avatar-wrapper">
                <img src="${avatarUrl}" alt="Foto de ${nameStr}">
            </div>
            <div class="vendor-info">
                <h4 class="vendor-name">${nameStr}</h4>
                <div class="vendor-rating">
                    <div style="display:flex; gap:2px; margin-right:4px;">${starsHTML}</div>
                    <span><strong>${rating} / 5</strong> (${totalReviews})</span>
                </div>
            </div>
            <div id="vendor-rating-interactive-${seller.id}" style="width: 100%; margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem;">
                <p style="font-size: 0.8rem; color: var(--text-slate); margin-bottom: 0.5rem; text-align: center;">¿Hiciste negocio? Calificá al vendedor:</p>
            </div>
        </div>
    `;
}
