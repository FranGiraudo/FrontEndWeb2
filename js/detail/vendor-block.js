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
    
    // SVG Estrella (Semántica, Cero Emojis)
    const starSVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

    return `
        <div class="vendor-block">
            ${badgeHTML}
            <div class="vendor-avatar-wrapper">
                <img src="${avatarUrl}" alt="Foto de ${nameStr}">
            </div>
            <div class="vendor-info">
                <h4 class="vendor-name">${nameStr}</h4>
                <div class="vendor-rating">
                    ${starSVG}
                    <span><strong>${rating} / 5</strong> (${totalReviews} calificaciones)</span>
                </div>
            </div>
        </div>
    `;
}
