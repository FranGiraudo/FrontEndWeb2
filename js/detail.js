/**
 * SmartAuto - detail.js
 * Controlador de la VISTA.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('car-detail-content');
    
    // Obtener sesión (getSession() viene de database.js y valida expiración del JWT)
    const sessionData = (typeof getSession === 'function') ? getSession() : null;
    const isComprador = sessionData && sessionData.role === 'comprador';
    const userIdentifier = sessionData ? sessionData.email : null;

    // Leer y limpiar el ID del auto — evita que un bookmark a detail.html muestre el último auto visitado
    const carIdStr = localStorage.getItem('car_id_view') || new URLSearchParams(window.location.search).get('id');
    localStorage.removeItem('car_id_view');
    const carId = isNaN(carIdStr) ? carIdStr : Number(carIdStr);
    
    let currentIndex = 0;
    let carImages = [];

    // --- Iconos SVG ---
    const icons = {
        motor: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14 4a1 1 0 0 1 0 2h-1v1h.383a2 2 0 0 1 1.787 1.106l1.45 2.894h.38v-1a1 1 0 0 1 .883 -.993l.117 -.007h2a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-2a1 1 0 0 1 -1 -1v-1h-1v1a2 2 0 0 1 -1.85 1.995l-.15 .005h-3.465a2 2 0 0 1 -1.664 -.89l-1.407 -2.11h-1.464a1 1 0 0 1 -.993 -.883l-.007 -.117v-2h-1v2a1 1 0 0 1 -2 0v-6a1 1 0 1 1 2 0v2h1v-2a1 1 0 0 1 1 -1h1.584l1.709 -1.707a1 1 0 0 1 .576 -.284l.131 -.009h1v-1h-1a1 1 0 1 1 0 -2z" /></svg>`,
        transmision: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a3 3 0 0 1 1 5.829v1.171a3 3 0 0 1 -3 3h-4v2.171a3.001 3.001 0 1 1 -4 2.829l.005 -.176a3 3 0 0 1 1.995 -2.654v-2.17h-5v2.171a3.001 3.001 0 1 1 -4 2.829l.005 -.176a3 3 0 0 1 1.995 -2.654v-6.341a3 3 0 0 1 -2 -2.829l.005 -.176a3 3 0 1 1 3.996 3.005l-.001 2.171h5v-2.17a3 3 0 0 1 -2 -2.83l.005 -.176a3 3 0 1 1 3.996 3.005l-.001 2.171h4a1 1 0 0 0 1 -1v-1.17a3 3 0 0 1 -2 -2.83l.005 -.176a3 3 0 0 1 2.995 -2.824" /></svg>`,
        km: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-.293 3.953a1 1 0 0 0 -1.414 0l-2.59 2.59l-.083 .094l-.068 .1a2.001 2.001 0 0 0 -2.547 1.774l-.005 .149l.005 .15a2 2 0 1 0 3.917 -.701a.968 .968 0 0 0 .195 -.152l2.59 -2.59l.083 -.094a1 1 0 0 0 -.083 -1.32zm-4.707 -1.293a6 6 0 0 0 -6 6a1 1 0 0 0 2 0a4 4 0 0 1 4 -4a1 1 0 0 0 0 -2z" /></svg>`,
        combustible: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21a1 1 0 0 1 0 -2v-13a3 3 0 0 1 3 -3h6a3 3 0 0 1 3 3v4a3 3 0 0 1 3 3v3a.5 .5 0 1 0 1 0v-6a2 2 0 0 1 -2 -2v-.585l-.707 -.708a1 1 0 0 1 -.083 -1.32l.083 -.094a1 1 0 0 1 1.414 0l3.003 3.002l.095 .112l.028 .04l.044 .073l.052 .11l.031 .09l.02 .076l.012 .078l.008 .126v7a2.5 2.5 0 1 1 -5 0v-3a1 1 0 0 0 -1 -1v7a1 1 0 0 1 0 2zm9 -16h-6a1 1 0 0 0 -1 1v4h8v-4a1 1 0 0 0 -1 -1" /></svg>`,
        anio: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 2a1 1 0 0 1 .993 .883l.007 .117v1h1a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h1v-1a1 1 0 0 1 1.993 -.117l.007 .117v1h6v-1a1 1 0 0 1 1 -1m3 8h-14v8.625c0 .705 .386 1.286 .883 1.366l.117 .009h12c.513 0 .936 -.53 .993 -1.215l.007 -.16zm-9 4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1z" /></svg>`,
        ubicacion: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6" /></svg>`,
        carroceria: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14 5a1 1 0 0 1 .694 .28l.087 .095l3.699 4.625h.52a3 3 0 0 1 2.995 2.824l.005 .176v4a1 1 0 0 1 -1 1h-1.171a3.001 3.001 0 0 1 -5.658 0h-4.342a3.001 3.001 0 0 1 -5.658 0h-1.171a1 1 0 0 1 -1 -1v-6l.007 -.117l.008 -.056l.017 -.078l.012 -.036l.014 -.05l2.014 -5.034a1 1 0 0 1 .928 -.629zm-7 11a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m10 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m-6 -9h-5.324l-1.2 3h6.524zm2.52 0h-.52v3h2.92z" /></svg>`,
        color: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-8.5l3.5 3.5 6-6"/></svg>`
    };

    // --- 1. Obtener auto de la API ---
    if (typeof getCarById !== 'function') {
        console.error('getCarById no está definido en database.js');
        return;
    }
    
    const car = await getCarById(carId);

    if (!car) {
        if(container) container.innerHTML = `<div class="error-msg" style="text-align:center; padding: 4rem;"><h2>Vehículo no encontrado</h2><a href="index.html" class="btn-detail">Volver</a></div>`;
        return;
    }

    // --- 2. Registro de Visita (El backend registra la visita automáticamente al obtener por ID) ---
    const sessionKey = `viewed_${car.id}`;
    if (!sessionStorage.getItem(sessionKey)) {
        if (typeof trackMetric === 'function') trackMetric(car.id, 'visitas');
        sessionStorage.setItem(sessionKey, 'true');
    }

    carImages = car.images && car.images.length > 0 ? car.images : [car.image];

    // --- 3. Generar Botón Favoritos (Asíncrono) ---
    const isFav = (isComprador && userIdentifier) ? await isCarFavorite(userIdentifier, car.id) : false;
    let htmlFavorito = '';
    if (isComprador) {
        htmlFavorito = `
            <button id="btn-detail-favorite" class="btn-favorite ${isFav ? 'active' : ''}" title="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}" style="top: 1rem; right: 1rem; left: auto; transform: scale(1.2);">
                <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
        `;
    }

    // --- 4. Inyectar Contenido ---
    if(container) {
        // En caso de que no tenga IA de precio sugerido, estimamos
        const sugMin = car.aiPriceMin || Math.round(car.price * 0.85);
        const sugMax = car.aiPriceMax || Math.round(car.price * 1.15);

        // Caja de Análisis IA
        const hasAiData = car.aiStatus || car.aiDamages;
        const aiInfoHtml = hasAiData ? `
            <div class="ai-info-box" style="margin-top: 1.5rem; background: var(--accent-alpha-15); border-left: 4px solid var(--accent-lavender); padding: 1rem; border-radius: 0.5rem; font-size: 0.85rem; line-height: 1.5;">
                <h4 style="color: var(--accent-lavender); font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                    Análisis Inteligente SmartAuto
                </h4>
                <p style="margin: 0; color: #eee;">
                    <b>Estado Detectado:</b> <span style="color: var(--accent-lavender); font-weight: 600;">${car.aiStatus || 'Excelente estado'}</span><br>
                    <b>Daños en Chapa/Pintura:</b> ${car.aiDamages || 'Ninguno detectado'}<br>
                    <b>Valoración Sugerida:</b> u$s ${sugMin.toLocaleString()} - u$s ${sugMax.toLocaleString()}
                </p>
            </div>
        ` : '';

        container.innerHTML = `
            <div class="gallery-column">
                <div class="main-photo-wrapper" id="main-photo-container">
                    ${htmlFavorito}
                    <img id="main-car-photo" src="${carImages[0]}" alt="${car.model}">
                    <div class="zoom-hint">Click para abrir la galería a pantalla completa</div>
                </div>
                <div class="thumbnail-carousel">
                    ${carImages.map((img, i) => `<img src="${img}" class="thumb-img ${i===0?'active':''}" data-index="${i}">`).join('')}
                </div>

                ${aiInfoHtml}

                <div class="details-section">
                    <h3>Especificaciones Técnicas</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="spec-header"><span class="spec-icon">${icons.anio}</span><span class="spec-label">Año</span></div>
                            <span class="spec-value">${car.year}</span>
                        </div>
                        <div class="info-item">
                            <div class="spec-header"><span class="spec-icon">${icons.km}</span><span class="spec-label">Kilómetros</span></div>
                            <span class="spec-value">${car.km.toLocaleString()} km</span>
                        </div>
                        <div class="info-item">
                            <div class="spec-header"><span class="spec-icon">${icons.motor}</span><span class="spec-label">Motor</span></div>
                            <span class="spec-value">${car.engine || 'No especificado'}</span>
                        </div>
                        <div class="info-item">
                            <div class="spec-header"><span class="spec-icon">${icons.color}</span><span class="spec-label">Color</span></div>
                            <span class="spec-value">${car.color || 'No especificado'}</span>
                        </div>
                        <div class="info-item">
                            <div class="spec-header"><span class="spec-icon">${icons.transmision}</span><span class="spec-label">Transmisión</span></div>
                            <span class="spec-value">${car.transmission || 'No especificada'}</span>
                        </div>
                        <div class="info-item">
                            <div class="spec-header"><span class="spec-icon">${icons.combustible}</span><span class="spec-label">Combustible</span></div>
                            <span class="spec-value">${car.fuel || 'No especificado'}</span>
                        </div>
                        <div class="info-item">
                            <div class="spec-header"><span class="spec-icon">${icons.carroceria}</span><span class="spec-label">Carrocería</span></div>
                            <span class="spec-value">${car.bodyType}</span>
                        </div>
                        <div class="info-item">
                            <div class="spec-header"><span class="spec-icon">${icons.ubicacion}</span><span class="spec-label">Ubicación</span></div>
                            <span class="spec-value">${car.location}</span>
                        </div>
                    </div>
                    <div class="description-box">
                        <h3>Descripción del vendedor</h3>
                        <div class="description-text">${car.description || "Sin descripción adicional."}</div>
                    </div>
                </div>
            </div>

            <aside class="action-sidebar">
                <div class="sidebar-header">
                    <p class="subtitle" style="text-transform: uppercase; letter-spacing: 1px; color: var(--accent-lavender); margin-bottom: 5px;">${car.brand}</p>
                    <h1>${car.model}</h1>
                </div>
                
                <div class="price-box">
                    <p style="font-size: 0.7rem; text-transform: uppercase;">Precio Publicado</p>
                    <h2 class="price-value">u$s ${Number(car.price).toLocaleString()}</h2>
                </div>
                
                <div class="contact-form-container">
                    <h3 style="color: white; margin-bottom: 1rem; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-lavender)" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Consultar al vendedor
                    </h3>
                    <form id="form-contactar-vendedor">
                        <textarea id="input-inquiry-message" autocomplete="off" placeholder="Hola, me interesa este vehículo. ¿Sigue disponible?" required></textarea>
                        <button type="submit" class="btn-contact">ENVIAR MENSAJE</button>
                    </form>
                    ${car.seller ? `
                    <div style="margin-top: 1rem;">
                        <a href="https://wa.me/${(car.seller.telefono || '5491100000000').replace(/[^0-9]/g, '')}?text=Hola,%20vengo%20de%20SmartAuto.%20Estoy%20interesado%20en%20el%20${encodeURIComponent(car.brand + ' ' + car.model + ' (' + car.year + ')')}." target="_blank" style="display: flex; align-items: center; justify-content: center; gap: 10px; background-color: #25D366; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; width: 100%; box-sizing: border-box;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                            Consultar por WhatsApp
                        </a>
                    </div>` : ''}
                    <button id="btn-download-pdf" class="btn-detail" style="margin-top: 1rem; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--bg-shark); border: 1px solid var(--border);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                        Descargar Ficha PDF
                    </button>
                </div>
            </aside>
        `;
    }

    // --- 5. Lógica de Interacciones ---

    // A) Favoritos
    const btnDetailFav = document.getElementById('btn-detail-favorite');
    if (btnDetailFav) {
        btnDetailFav.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            btnDetailFav.disabled = true;
            const isAdded = await toggleFavoriteStatus(userIdentifier, car.id);
            btnDetailFav.disabled = false;

            if (isAdded) {
                btnDetailFav.classList.add('active');
                btnDetailFav.title = 'Quitar de favoritos';
                if(typeof showToast === 'function') showToast("Vehículo guardado en favoritos.", "success");
            } else {
                btnDetailFav.classList.remove('active');
                btnDetailFav.title = 'Agregar a favoritos';
                if(typeof showToast === 'function') showToast("Vehículo eliminado de favoritos.", "error");
            }
        });
    }

    // B) Galería
    const mainPhoto = document.getElementById('main-car-photo');
    const thumbnails = document.querySelectorAll('.thumb-img');

    thumbnails.forEach((thumb, i) => {
        thumb.addEventListener('click', () => {
            const active = document.querySelector('.thumb-img.active');
            if(active) active.classList.remove('active');
            thumb.classList.add('active');
            mainPhoto.src = thumb.src;
            currentIndex = i;
        });
    });

    // C) Lightbox interactivo (Zoom por clic inteligente)
    const lightbox = document.getElementById('photo-lightbox');
    const lightboxImg = document.getElementById('lightbox-image');
    let isLightboxZoomed = false;

    // Resetea el estado del zoom
    const resetLightboxZoom = () => {
        if(lightboxImg) {
            lightboxImg.style.transform = 'scale(1)';
            lightboxImg.style.cursor = 'zoom-in';
            setTimeout(() => {
                if (!isLightboxZoomed && lightboxImg) {
                    lightboxImg.style.transformOrigin = 'center center';
                }
            }, 350); // Espera a que termine la animación
            isLightboxZoomed = false;
        }
    };

    const updateLightbox = () => {
        if(lightboxImg) lightboxImg.src = carImages[currentIndex];
        resetLightboxZoom();
    };

    // Abrir Lightbox
    const mainContainer = document.getElementById('main-photo-container');
    if(mainContainer && lightbox) {
        mainContainer.addEventListener('click', () => {
            updateLightbox();
            lightbox.style.display = "flex";
            document.body.style.overflow = "hidden";
        });
    }

    // Clic en la foto del Lightbox = Zoom Inteligente
    if (lightboxImg) {
        lightboxImg.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (!isLightboxZoomed) {
                const rect = lightboxImg.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                lightboxImg.style.transformOrigin = `${x}% ${y}%`;
                lightboxImg.style.transform = 'scale(2.5)'; // Aumento
                lightboxImg.style.cursor = 'zoom-out';
                isLightboxZoomed = true;
            } else {
                resetLightboxZoom();
            }
        });
    }

    // Cerrar Lightbox
    const closeLightbox = () => {
        if(lightbox) {
            lightbox.style.display = "none";
            document.body.style.overflow = "auto";
            resetLightboxZoom();
        }
    };

    const closeBtn = document.querySelector('.close-lightbox');
    if(closeBtn) closeBtn.addEventListener('click', closeLightbox);
    
    // Controles de flechas (Aseguramos que el clic no traspase y reseteamos el zoom)
    document.getElementById('next-btn')?.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        currentIndex = (currentIndex + 1) % carImages.length; 
        updateLightbox(); 
    });
    
    document.getElementById('prev-btn')?.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        currentIndex = (currentIndex - 1 + carImages.length) % carImages.length; 
        updateLightbox(); 
    });

    // Teclado
    document.addEventListener('keydown', (e) => {
        if (lightbox && lightbox.style.display === "flex") {
            if (e.key === "ArrowRight") { 
                currentIndex = (currentIndex + 1) % carImages.length; 
                updateLightbox(); 
            }
            if (e.key === "ArrowLeft") { 
                currentIndex = (currentIndex - 1 + carImages.length) % carImages.length; 
                updateLightbox(); 
            }
            if (e.key === "Escape") closeLightbox();
        }
    });

    // D) Formulario de Contacto (Mensajería Asíncrona)
    const contactForm = document.getElementById('form-contactar-vendedor');
    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!sessionData) {
                if(typeof showToast === 'function') showToast("Debes iniciar sesión para consultar.", "error");
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1000);
                return;
            }

            if (sessionData.role !== 'comprador') {
                if(typeof showToast === 'function') showToast("Solo los compradores pueden enviar consultas.", "error");
                return;
            }

            const messageText = document.getElementById('input-inquiry-message').value;

            if (!messageText.trim()) {
                if(typeof showToast === 'function') showToast("El mensaje no puede estar vacío.", "error");
                return;
            }

            const btnSubmit = contactForm.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;

            if (typeof sendInquiryToSeller === 'function') {
                const response = await sendInquiryToSeller(Number(car.id), sessionData.email, sessionData.nombre, messageText);
                btnSubmit.disabled = false;

                if (response.success) {
                    if(typeof showToast === 'function') showToast("Consulta enviada con éxito.", "success");
                    document.getElementById('input-inquiry-message').value = "";
                    if (typeof trackMetric === 'function') trackMetric(car.id, 'contactos');
                } else {
                    if(typeof showToast === 'function') showToast(response.error, "error");
                }
            }
        });
    }

    // E) Generar PDF
    const btnPdf = document.getElementById('btn-download-pdf');
    if (btnPdf) {
        btnPdf.addEventListener('click', async () => {
            if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
                if(typeof showToast === 'function') showToast("Las librerías para PDF no están cargadas.", "error");
                return;
            }

            btnPdf.disabled = true;
            btnPdf.innerHTML = "Generando PDF...";

            try {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                // Colors
                const accentColor = [118, 74, 241];
                const darkText = [40, 40, 40];
                const grayText = [100, 100, 100];

                // Header Background
                pdf.setFillColor(20, 20, 20);
                pdf.rect(0, 0, pdfWidth, 40, 'F');

                // Title
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(24);
                pdf.setFont("helvetica", "bold");
                pdf.text("SMARTAUTO", 20, 25);
                
                pdf.setTextColor(200, 200, 200);
                pdf.setFontSize(12);
                pdf.setFont("helvetica", "normal");
                pdf.text("Ficha Técnica Oficial", pdfWidth - 60, 25);

                // Car details
                pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
                pdf.setFontSize(22);
                pdf.setFont("helvetica", "bold");
                pdf.text(`${car.brand} ${car.model}`, 20, 60);

                pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
                pdf.setFontSize(18);
                pdf.text(`u$s ${Number(car.price).toLocaleString()}`, pdfWidth - 60, 60);

                pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
                pdf.setFontSize(12);
                pdf.text(`${car.year}  •  ${car.km.toLocaleString()} km  •  ${car.location}`, 20, 70);

                // Load image properly using a Promise to ensure it's ready
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = car.image || '';
                
                await new Promise((resolve, reject) => {
                    if (!car.image) { resolve(); return; }
                    img.onload = resolve;
                    img.onerror = () => { console.warn("No se pudo cargar la imagen para el PDF"); resolve(); };
                });
                
                // Draw image if available
                if (car.image) {
                    pdf.addImage(img, 'JPEG', 20, 80, pdfWidth - 40, 100);
                }

                // Specifications Box
                pdf.setDrawColor(220, 220, 220);
                pdf.setFillColor(250, 250, 250);
                pdf.rect(20, 190, pdfWidth - 40, 60, 'FD');

                pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
                pdf.setFontSize(14);
                pdf.setFont("helvetica", "bold");
                pdf.text("Especificaciones:", 25, 200);

                pdf.setFontSize(11);
                pdf.setFont("helvetica", "normal");
                pdf.text(`Combustible: ${car.fuel}`, 25, 210);
                pdf.text(`Transmisión: ${car.transmission}`, 25, 220);
                pdf.text(`Motor: ${car.engine || 'N/A'}`, 25, 230);
                pdf.text(`Color: ${car.color || 'N/A'}`, 25, 240);

                pdf.text(`Carrocería: ${car.bodyType}`, pdfWidth/2 + 10, 210);
                pdf.text(`Estado: ${car.status || 'Disponible'}`, pdfWidth/2 + 10, 220);
                
                // Footer
                pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
                pdf.rect(0, pdfHeight - 20, pdfWidth, 20, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.text(`SmartAuto Marketplace - ${new Date().toLocaleDateString()}`, 20, pdfHeight - 8);

                pdf.save(`Ficha_${car.brand}_${car.model}_${car.year}.pdf`);
                if(typeof showToast === 'function') showToast("PDF generado correctamente.", "success");

            } catch (error) {
                console.error(error);
                if(typeof showToast === 'function') showToast("Ocurrió un error al generar el PDF.", "error");
            } finally {
                btnPdf.disabled = false;
                btnPdf.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                    Descargar Ficha PDF
                `;
            }
        });
    }
});