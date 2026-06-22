/**
 * SmartAuto - detail.js
 * Controlador de la VISTA (ES Module refactored).
 */
import { generateVendorBlockHTML } from './detail/vendor-block.js';
import { initLeafletMap } from './detail/map-init.js';
import { initAuctionLogic } from './detail/auction-logic.js';
import { initFavoritesLogic } from './detail/favorites.js';
import { initLightbox } from './detail/lightbox.js';
import { initContactForm } from './detail/contact-form.js';
import { initPdfExport } from './detail/pdf-export.js';

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('car-detail-content');
    const carIdStr = localStorage.getItem('car_id_view') || new URLSearchParams(window.location.search).get('id');
    localStorage.removeItem('car_id_view');
    const carId = isNaN(carIdStr) ? carIdStr : Number(carIdStr);
    
    if (carId && !new URLSearchParams(window.location.search).has('id')) {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?id=${carId}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
    }

    const icons = window.AppIcons || {};
    const car = await window.getCarById(carId);

    if (!car) {
        if(container) container.innerHTML = `<div class="error-msg" style="text-align:center; padding: 4rem;"><h2>Vehículo no encontrado</h2><a href="index.html" class="btn-detail">Volver</a></div>`;
        return;
    }

    const sessionKey = `viewed_${car.id}`;
    if (!sessionStorage.getItem(sessionKey)) {
        if (typeof window.trackMetric === 'function') window.trackMetric(car.id, 'visitas');
        sessionStorage.setItem(sessionKey, 'true');
    }

    const carImages = car.images && car.images.length > 0 ? car.images : [car.image];
    const sessionData = (typeof window.getSession === 'function') ? window.getSession() : null;
    const isComprador = sessionData && sessionData.role === 'comprador';
    const userIdentifier = sessionData ? sessionData.email : null;
    const isFav = (isComprador && userIdentifier) ? await window.isCarFavorite(userIdentifier, car.id) : false;
    
    let htmlFavorito = '';
    if (isComprador) {
        htmlFavorito = `<button id="btn-detail-favorite" class="btn-favorite ${isFav ? 'active' : ''}" style="top: 1rem; right: 1rem; left: auto; transform: scale(1.2);"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>`;
    }

    if(container) {
        container.removeAttribute('style');
        container.innerHTML = `
            <div class="gallery-column">
                <div class="main-photo-wrapper" id="main-photo-container">
                    ${htmlFavorito}
                    <img id="main-car-photo" src="${carImages[0]}" alt="${car.model}">
                </div>
                <div class="thumbnail-carousel">
                    ${carImages.map((img, i) => `<img src="${img}" class="thumb-img ${i===0?'active':''}" data-index="${i}">`).join('')}
                </div>
                <div class="details-section">
                    <h3>Especificaciones Técnicas</h3>
                    <div class="info-grid">
                        <div class="info-item"><div class="spec-header"><span class="spec-icon">${icons.anio}</span><span class="spec-label">Año</span></div><span class="spec-value">${car.year}</span></div>
                        <div class="info-item"><div class="spec-header"><span class="spec-icon">${icons.km}</span><span class="spec-label">Kilómetros</span></div><span class="spec-value">${car.km.toLocaleString()} km</span></div>
                        <div class="info-item"><div class="spec-header"><span class="spec-icon">${icons.carroceria}</span><span class="spec-label">Carrocería</span></div><span class="spec-value">${car.bodyType || 'Sedán'}</span></div>
                        <div class="info-item"><div class="spec-header"><span class="spec-icon">${icons.ubicacion}</span><span class="spec-label">Ubicación</span></div><span class="spec-value">${car.location}</span></div>
                    </div>
                    <div class="description-box"><h3>Descripción</h3><div class="description-text">${car.description || "Sin descripción adicional."}</div></div>
                    <div class="map-box"><h3 style="margin-bottom: 1rem; color: var(--text-main); font-size: 1.1rem;">Ubicación</h3><div id="map" class="leaflet-map-container"></div></div>
                </div>
            </div>
            <aside class="action-sidebar">
                <div class="sidebar-header"><p class="subtitle" style="text-transform: uppercase; color: var(--accent-lavender);">${car.brand}</p><h1>${car.model}</h1></div>
                ${car.auction && car.auction.active ? `
                <div class="auction-box" data-ends-at="${car.auction.endsAt}" data-auction-id="${car.auction.id}">
                    <div class="auction-header"><span class="auction-badge">EN SUBASTA</span><div class="auction-countdown" id="auction-countdown"></div></div>
                    <div class="auction-prices">
                        <div class="auction-price-item"><p>Precio Inicial</p><span>u$s ${car.auction.startingPrice.toLocaleString()}</span></div>
                        <div class="auction-price-item current"><p>Puja Actual</p><h2 id="auction-current-price">u$s ${car.auction.currentPrice.toLocaleString()}</h2></div>
                    </div>
                    <div class="auction-bid-form">
                        <input type="number" id="auction-bid-amount" placeholder="Monto (mín. ${car.auction.currentPrice + 100})" min="${car.auction.currentPrice + 100}">
                        <button id="btn-submit-bid" class="btn-detail">ENVIAR PUJA</button>
                    </div>
                </div>` : `<div class="price-box"><p style="font-size: 0.7rem; text-transform: uppercase;">Precio Publicado</p><h2 class="price-value" id="detail-main-price">u$s ${Number(car.price).toLocaleString()}</h2></div>`}
                ${generateVendorBlockHTML(car.vendor || car.seller)}
                <div id="ai-price-placeholder"></div>
                <div class="contact-form-container">
                    <h3 style="color: white; margin-bottom: 1rem;">Consultar al vendedor</h3>
                    <form id="form-contactar-vendedor"><textarea id="input-inquiry-message" required></textarea><button type="submit" class="btn-contact">ENVIAR MENSAJE</button></form>
                    <div style="display: flex; gap: 10px; margin-top: 1rem; width: 100%;">
                        <button id="btn-download-pdf" class="btn-detail" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 8px;">Ficha PDF</button>
                        <button type="button" class="btn-detail" onclick="if(typeof window.showReportModal==='function') window.showReportModal(${car.id})" style="flex: 1; background: rgba(255, 77, 77, 0.1); color: var(--error); border: 1px solid var(--error); display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 8px; font-weight: 600;">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            Reportar
                        </button>
                    </div>
                </div>
                
                <div class="vendor-block" style="margin-top: 1rem; padding: 1.5rem; box-sizing: border-box; width: 100%; display: flex; flex-direction: column;">
                    <p style="font-size: 0.85rem; color: var(--text-slate); margin-bottom: 0.5rem; text-align: center; font-weight: 500;">¿Hiciste negocio? Calificá al vendedor:</p>
                    <div id="vendor-rating-interactive-${car.sellerId || 1}" style="display: flex; flex-direction: column; align-items: center; width: 100%;"></div>
                </div>
            </aside>
        `;
        
        setTimeout(() => initLeafletMap(car.location), 100);
        if (car.auction && car.auction.active) initAuctionLogic(car.auction, window.requireAuth, window.formatPrice);
        initFavoritesLogic(document.getElementById('btn-detail-favorite'), car.id, userIdentifier, window.toggleFavoriteStatus, window.showToast);
        initLightbox(carImages);
        initContactForm(car.id, window.requireAuth, window.sendInquiryToSeller, window.trackMetric, window.showToast);
        initPdfExport(car, window.showToast);

        // Conversión a ARS quitada de la vista por pedido del usuario
        
        if (typeof window.renderStarRating === 'function') {
            const targetId = car.sellerId || 1;
            if (targetId) {
                window.renderStarRating(`vendor-rating-interactive-${targetId}`, targetId);
            }
        }

        if (typeof window.initFinancingSimulator === 'function' && !car.auction) {
            window.initFinancingSimulator(document.querySelector('.action-sidebar'), Number(car.price));
        }
        const aiPlaceholder = document.getElementById('ai-price-placeholder');
        if (aiPlaceholder && car.aiStatus && car.aiPriceMin) {
            if (typeof window.renderAiAnalysis === 'function') {
                window.renderAiAnalysis(aiPlaceholder, {
                    status: car.aiStatus,
                    damages: car.aiDamages,
                    minPrice: car.aiPriceMin,
                    maxPrice: car.aiPriceMax,
                    currentPrice: car.price
                });
            }
        }
    }
});