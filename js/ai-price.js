// js/ai-price.js

/**
 * Renderiza el componente de análisis de precio IA con diseño de Gauge Gradient.
 * @param {HTMLElement} container - Nodo padre donde inyectar.
 * @param {Object} data - Datos del análisis.
 */
window.renderAiAnalysis = function(container, data) {
    if (!container || !data) return;

    const { status, damages, minPrice, maxPrice, currentPrice } = data;
    const avgPrice = (minPrice + maxPrice) / 2;

    let label = 'En promedio';
    let cssClass = 'warning';
    
    if (currentPrice < minPrice) {
        label = 'Bajo el mercado';
        cssClass = 'good';
    } else if (currentPrice > maxPrice) {
        label = 'Sobrevalorado';
        cssClass = 'bad';
    } else {
        if (currentPrice <= avgPrice) {
            cssClass = 'good';
            label = 'Buen precio';
        } else {
            label = 'En promedio';
        }
    }

    // Calcular posición del marcador de precio actual (porcentaje)
    // El rango visual será minPrice * 0.8 a maxPrice * 1.2
    const visualMin = minPrice * 0.8;
    const visualMax = maxPrice * 1.2;
    let percent = ((currentPrice - visualMin) / (visualMax - visualMin)) * 100;
    
    // Limitar al 0-100%
    percent = Math.max(0, Math.min(100, percent));

    const formatFn = window.formatPrice || ((num) => Number(num).toLocaleString());

    const html = `
        <div class="ai-price-container">
            <div class="ai-price-header">
                <div class="ai-price-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                    Análisis de Mercado IA
                </div>
                <div class="ai-price-status status-${cssClass}">${label}</div>
            </div>

            <!-- Gauge / Progress Bar -->
            <div class="ai-price-bar-wrapper">
                <div class="ai-price-bar-gradient"></div>
                <div class="ai-price-marker" style="left: ${percent}%;">
                    <div class="ai-price-marker-label">Tu precio</div>
                </div>
            </div>
            <div class="ai-price-range-labels">
                <span>u$s ${formatFn(Math.round(visualMin))}</span>
                <span>u$s ${formatFn(Math.round(visualMax))}</span>
            </div>

            <div class="ai-price-details">
                <div class="ai-price-row">
                    <span class="ai-price-label">Rango sugerido</span>
                    <span class="ai-price-value">u$s ${formatFn(Math.round(minPrice))} - u$s ${formatFn(Math.round(maxPrice))}</span>
                </div>
                <div class="ai-price-row">
                    <span class="ai-price-label">Promedio de mercado</span>
                    <span class="ai-price-value">u$s ${formatFn(Math.round(avgPrice))}</span>
                </div>
                <div class="ai-price-row">
                    <span class="ai-price-label">Estado detectado</span>
                    <span class="ai-price-value">${status}</span>
                </div>
                ${damages ? `
                <div class="ai-price-row ai-price-alert">
                    <span class="ai-price-label">Observaciones</span>
                    <span class="ai-price-value">${damages}</span>
                </div>` : ''}
            </div>
        </div>
    `;

    container.innerHTML = '';
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    container.appendChild(template.content.firstChild);
    
    // Animación de entrada suave para el marcador
    setTimeout(() => {
        const marker = container.querySelector('.ai-price-marker');
        if (marker) {
            marker.style.left = '0%';
            marker.offsetHeight; // force reflow
            marker.style.left = `${percent}%`;
        }
    }, 50);
};
