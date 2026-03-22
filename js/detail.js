/**
 * SmartAuto - detail.js
 * Este archivo ahora es puramente un controlador de la VISTA.
 * Los DATOS y las MÉTRICAS se consumen de database.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('car-detail-content');
    const carId = Number(localStorage.getItem('car_id_view'));
    let currentIndex = 0;
    let carImages = [];

    // --- Iconos SVG (Mantenemos los iconos aquí para no ensuciar el database.js) ---
    const icons = {
        motor: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14 4a1 1 0 0 1 0 2h-1v1h.383a2 2 0 0 1 1.787 1.106l1.45 2.894h.38v-1a1 1 0 0 1 .883 -.993l.117 -.007h2a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-2a1 1 0 0 1 -1 -1v-1h-1v1a2 2 0 0 1 -1.85 1.995l-.15 .005h-3.465a2 2 0 0 1 -1.664 -.89l-1.407 -2.11h-1.464a1 1 0 0 1 -.993 -.883l-.007 -.117v-2h-1v2a1 1 0 0 1 -2 0v-6a1 1 0 1 1 2 0v2h1v-2a1 1 0 0 1 1 -1h1.584l1.709 -1.707a1 1 0 0 1 .576 -.284l.131 -.009h1v-1h-1a1 1 0 1 1 0 -2z" /></svg>`,
        transmision: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a3 3 0 0 1 1 5.829v1.171a3 3 0 0 1 -3 3h-4v2.171a3.001 3.001 0 1 1 -4 2.829l.005 -.176a3 3 0 0 1 1.995 -2.654v-2.17h-5v2.171a3.001 3.001 0 1 1 -4 2.829l.005 -.176a3 3 0 0 1 1.995 -2.654v-6.341a3 3 0 0 1 -2 -2.829l.005 -.176a3 3 0 1 1 3.996 3.005l-.001 2.171h5v-2.17a3 3 0 0 1 -2 -2.83l.005 -.176a3 3 0 1 1 3.996 3.005l-.001 2.171h4a1 1 0 0 0 1 -1v-1.17a3 3 0 0 1 -2 -2.83l.005 -.176a3 3 0 0 1 2.995 -2.824" /></svg>`,
        km: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-.293 3.953a1 1 0 0 0 -1.414 0l-2.59 2.59l-.083 .094l-.068 .1a2.001 2.001 0 0 0 -2.547 1.774l-.005 .149l.005 .15a2 2 0 1 0 3.917 -.701a.968 .968 0 0 0 .195 -.152l2.59 -2.59l.083 -.094a1 1 0 0 0 -.083 -1.32zm-4.707 -1.293a6 6 0 0 0 -6 6a1 1 0 0 0 2 0a4 4 0 0 1 4 -4a1 1 0 0 0 0 -2z" /></svg>`,
        combustible: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21a1 1 0 0 1 0 -2v-13a3 3 0 0 1 3 -3h6a3 3 0 0 1 3 3v4a3 3 0 0 1 3 3v3a.5 .5 0 1 0 1 0v-6a2 2 0 0 1 -2 -2v-.585l-.707 -.708a1 1 0 0 1 -.083 -1.32l.083 -.094a1 1 0 0 1 1.414 0l3.003 3.002l.095 .112l.028 .04l.044 .073l.052 .11l.031 .09l.02 .076l.012 .078l.008 .126v7a2.5 2.5 0 1 1 -5 0v-3a1 1 0 0 0 -1 -1v7a1 1 0 0 1 0 2zm9 -16h-6a1 1 0 0 0 -1 1v4h8v-4a1 1 0 0 0 -1 -1" /></svg>`,
        anio: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 2a1 1 0 0 1 .993 .883l.007 .117v1h1a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h1v-1a1 1 0 0 1 1.993 -.117l.007 .117v1h6v-1a1 1 0 0 1 1 -1m3 8h-14v8.625c0 .705 .386 1.286 .883 1.366l.117 .009h12c.513 0 .936 -.53 .993 -1.215l.007 -.16zm-9 4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1z" /></svg>`,
        ubicacion: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6" /></svg>`,
        carroceria: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14 5a1 1 0 0 1 .694 .28l.087 .095l3.699 4.625h.52a3 3 0 0 1 2.995 2.824l.005 .176v4a1 1 0 0 1 -1 1h-1.171a3.001 3.001 0 0 1 -5.658 0h-4.342a3.001 3.001 0 0 1 -5.658 0h-1.171a1 1 0 0 1 -1 -1v-6l.007 -.117l.008 -.056l.017 -.078l.012 -.036l.014 -.05l2.014 -5.034a1 1 0 0 1 .928 -.629zm-7 11a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m10 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m-6 -9h-5.324l-1.2 3h6.524zm2.52 0h-.52v3h2.92z" /></svg>`
    };

    // --- 1. Obtener auto desde la Base de Datos Centralizada ---
    const allCars = getAllCars(); // Función global de database.js
    const car = allCars.find(c => c.id === carId);

    if (!car) {
        container.innerHTML = `<div class="error-msg"><h2>Vehículo no encontrado</h2><a href="index.html">Volver</a></div>`;
        return;
    }

    // --- 2. Registro de Visita con Seguro (sessionStorage) ---
    const sessionKey = `viewed_${car.id}`;
    if (!sessionStorage.getItem(sessionKey)) {
        if (typeof trackMetric === 'function') {
            trackMetric(car.id, 'visitas');
        } else {
            console.warn("Advertencia: trackMetric no está definida. Revisá la carga de database.js");
        } // Función global de database.js
        sessionStorage.setItem(sessionKey, 'true');
    }

    carImages = car.images;

    // --- 3. Inyectar Contenido ---
    container.innerHTML = `
        <div class="gallery-column">
            <div class="main-photo-wrapper" id="main-photo-container">
                <img id="main-car-photo" src="${carImages[0]}" alt="${car.model}">
                <div class="zoom-hint">Click para pantalla completa (Usa flechas ◄ ►)</div>
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
                <h1>${car.brand} ${car.model}</h1>
                <p class="subtitle">Publicado hoy | ID: ${car.id}</p>
            </div>
            <div class="price-box">
                <p style="font-size: 0.7rem; color: #888; margin-bottom: 5px;">PRECIO SUGERIDO IA</p>
                <h2 class="price-value">u$s ${car.price.toLocaleString()}</h2>
            </div>
            <button class="btn-contact" id="btn-whatsapp">CONTACTAR DUEÑO</button>
        </aside>
    `;

    // --- 4. Lógica de Galería y Miniaturas ---
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

    // --- 5. Lógica de Lightbox ---
    const lightbox = document.getElementById('photo-lightbox');
    const lightboxImg = document.getElementById('lightbox-image');

    const updateLightbox = () => {
        lightboxImg.src = carImages[currentIndex];
    };

    document.getElementById('main-photo-container').addEventListener('click', () => {
        updateLightbox();
        lightbox.style.display = "flex";
        document.body.style.overflow = "hidden";
    });

    const closeLightbox = () => {
        lightbox.style.display = "none";
        document.body.style.overflow = "auto";
        lightboxImg.classList.remove('zoomed');
    };

    document.querySelector('.close-lightbox')?.addEventListener('click', closeLightbox);
    
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

    // --- 6. Navegación por Teclado ---
    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === "flex") {
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

    // --- 7. Registro de Contacto ---
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    if (btnWhatsapp) {
        btnWhatsapp.addEventListener('click', () => {
            trackMetric(car.id, 'contactos');
            const msg = `Hola! Vi tu ${car.brand} ${car.model} en SmartAuto y me interesa.`;
            window.open(`https://wa.me/549351000000?text=${encodeURIComponent(msg)}`, '_blank');
        });
    }
});