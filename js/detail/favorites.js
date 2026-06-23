/**
 * js/detail/favorites.js
 * Módulo para inicializar la lógica de favoritos en la vista de detalle.
 */

export function initFavoritesLogic(btnDetailFav, carId, userIdentifier, toggleFavoriteStatus, showToast) {
    if (!btnDetailFav) return;
    
    btnDetailFav.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Optimistic UI Update
        const wasActive = btnDetailFav.classList.contains('active');
        if (wasActive) {
            btnDetailFav.classList.remove('active');
            btnDetailFav.title = 'Agregar a favoritos';
        } else {
            btnDetailFav.classList.add('active');
            btnDetailFav.title = 'Quitar de favoritos';
            btnDetailFav.style.transform = "scale(1.5)";
            setTimeout(() => btnDetailFav.style.transform = "scale(1.2)", 200); // 1.2 is its default scale in detail
        }
        
        btnDetailFav.disabled = true;
        
        try {
            const isAdded = await toggleFavoriteStatus(userIdentifier, carId);
            if (isAdded && !wasActive && typeof showToast === 'function') showToast("Vehículo guardado en favoritos.", "success");
            if (!isAdded && wasActive && typeof showToast === 'function') showToast("Vehículo eliminado de favoritos.", "error");
            
            // Revert if server disagrees
            if (isAdded !== !wasActive) {
                if (isAdded) {
                    btnDetailFav.classList.add('active');
                    btnDetailFav.title = 'Quitar de favoritos';
                } else {
                    btnDetailFav.classList.remove('active');
                    btnDetailFav.title = 'Agregar a favoritos';
                }
            }
        } catch (err) {
            // Revert on error
            if (wasActive) {
                btnDetailFav.classList.add('active');
                btnDetailFav.title = 'Quitar de favoritos';
            } else {
                btnDetailFav.classList.remove('active');
                btnDetailFav.title = 'Agregar a favoritos';
            }
            if (typeof showToast === 'function') showToast("Error de conexión", "error");
        } finally {
            btnDetailFav.disabled = false;
        }
    });
}
