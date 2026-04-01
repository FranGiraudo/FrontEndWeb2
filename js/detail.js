/**
 * SmartAuto - detail.js
 * Controlador de la VISTA.
 */

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('car-detail-content');
    
    // Obtener sesión
    let sessionData = null;
    try { sessionData = JSON.parse(localStorage.getItem('user_session')); } catch(e){}
    const isComprador = sessionData && sessionData.role === 'comprador';
    const userIdentifier = sessionData ? sessionData.email : null; 

    // Obtener ID del auto
    const carIdStr = localStorage.getItem('car_id_view') || new URLSearchParams(window.location.search).get('id');
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
        carroceria: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14 5a1 1 0 0 1 .694 .28l.087 .095l3.699 4.625h.52a3 3 0 0 1 2.995 2.824l.005 .176v4a1 1 0 0 1 -1 1h-1.171a3.001 3.001 0 0 1 -5.658 0h-4.342a3.001 3.001 0 0 1 -5.658 0h-1.171a1 1 0 0 1 -1 -1v-6l.007 -.117l.008 -.056l.017 -.078l.012 -.036l.014 -.05l2.014 -5.034a1 1 0 0 1 .928 -.629zm-7 11a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m10 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m-6 -9h-5.324l-1.2 3h6.524zm2.52 0h-.52v3h2.92z" /></svg>`
    };

    // --- 1. Obtener auto ---
    const allCars = typeof getAllCars === 'function' ? getAllCars() : [];
    const car = allCars.find(c => c.id === carId);

    if (!car) {
        if(container) container.innerHTML = `<div class="error-msg" style="text-align:center; padding: 4rem;"><h2>Vehículo no encontrado</h2><a href="index.html" class="btn-detail">Volver</a></div>`;
        return;
    }

    // --- 2. Registro de Visita ---
    const sessionKey = `viewed_${car.id}`;
    if (!sessionStorage.getItem(sessionKey)) {
        if (typeof trackMetric === 'function') trackMetric(car.id, 'visitas');
        sessionStorage.setItem(sessionKey, 'true');
    }

    carImages = car.images;

    // --- 3. Generar Botón Favoritos ---
    const isFav = (isComprador && userIdentifier) ? isCarFavorite(userIdentifier, car.id) : false;
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
                    <p style="font-size: 0.7rem; text-transform: uppercase;">Valor Sugerido IA</p>
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
                </div>
            </aside>
        `;
    }

    // --- 5. Lógica de Interacciones ---

    // A) Favoritos
    const btnDetailFav = document.getElementById('btn-detail-favorite');
    if (btnDetailFav) {
        btnDetailFav.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isAdded = toggleFavoriteStatus(userIdentifier, car.id);
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
                // Calculamos en qué porcentaje de la imagen hizo clic el usuario
                const rect = lightboxImg.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                // Centramos el origen de la transformación justo donde hizo clic
                lightboxImg.style.transformOrigin = `${x}% ${y}%`;
                lightboxImg.style.transform = 'scale(2.5)'; // Aumento
                lightboxImg.style.cursor = 'zoom-out';
                isLightboxZoomed = true;
            } else {
                // Si ya está con zoom, lo alejamos
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

    // D) Formulario de Contacto
    const contactForm = document.getElementById('form-contactar-vendedor');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();

            if (!sessionData) {
                if(typeof showToast === 'function') showToast("Debes iniciar sesión para consultar.", "error");
                window.location.href = "login.html";
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

            if (typeof sendInquiryToSeller === 'function') {
                const response = sendInquiryToSeller(car.id, sessionData.email, sessionData.nombre, messageText);

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
});