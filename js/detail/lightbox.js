/**
 * js/detail/lightbox.js
 * Módulo para la galería de imágenes y el lightbox interactivo.
 */

export function initLightbox(carImages) {
    let currentIndex = 0;
    const mainPhoto = document.getElementById('main-car-photo');
    const thumbnails = document.querySelectorAll('.thumb-img');
    const lightbox = document.getElementById('photo-lightbox');
    const lightboxImg = document.getElementById('lightbox-image');
    let isLightboxZoomed = false;

    if (!mainPhoto || thumbnails.length === 0) return;

    // Miniaturas
    thumbnails.forEach((thumb, i) => {
        thumb.addEventListener('click', () => {
            const active = document.querySelector('.thumb-img.active');
            if(active) active.classList.remove('active');
            thumb.classList.add('active');
            mainPhoto.src = thumb.src;
            currentIndex = i;
        });
    });

    // Resetea el estado del zoom
    const resetLightboxZoom = () => {
        if(lightboxImg) {
            lightboxImg.style.transform = 'scale(1)';
            lightboxImg.style.cursor = 'zoom-in';
            setTimeout(() => {
                if (!isLightboxZoomed && lightboxImg) {
                    lightboxImg.style.transformOrigin = 'center center';
                }
            }, 350);
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
                lightboxImg.style.transform = 'scale(2.5)';
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
    
    // Controles de flechas
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
}
