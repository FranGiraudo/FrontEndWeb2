/**
 * js/detail/favorites.js
 * Módulo para inicializar la lógica de favoritos en la vista de detalle.
 */

export function initFavoritesLogic(btnDetailFav, carId, userIdentifier, toggleFavoriteStatus, showToast) {
    if (!btnDetailFav) return;
    
    btnDetailFav.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        btnDetailFav.disabled = true;
        const isAdded = await toggleFavoriteStatus(userIdentifier, carId);
        btnDetailFav.disabled = false;

        if (isAdded) {
            btnDetailFav.classList.add('active');
            btnDetailFav.title = 'Quitar de favoritos';
            if (typeof showToast === 'function') showToast("Vehículo guardado en favoritos.", "success");
        } else {
            btnDetailFav.classList.remove('active');
            btnDetailFav.title = 'Agregar a favoritos';
            if (typeof showToast === 'function') showToast("Vehículo eliminado de favoritos.", "error");
        }
    });
}
