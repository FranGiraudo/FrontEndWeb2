/**
 * js/detail/map-init.js
 * Módulo para la inicialización y renderizado del mapa de ubicación usando Leaflet.
 */

export async function initLeafletMap(locationStr) {
    if (!document.getElementById('map') || typeof L === 'undefined') return;
    
    // Coordenadas por defecto (Obelisco, Buenos Aires)
    let lat = -34.603722;
    let lng = -58.381592;
    let zoom = 12;

    try {
        // Intentar geocodificar la ubicación con Nominatim (OSM)
        const query = encodeURIComponent(locationStr + ', Argentina');
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
            zoom = 13;
        }
    } catch (error) {
        console.error('Error al geocodificar ubicación:', error);
    }

    const map = L.map('map', { zoomControl: false }).setView([lat, lng], zoom);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    const customPin = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<svg viewBox="0 0 24 24" fill="var(--accent-lavender)" stroke="var(--bg-shark)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3" fill="var(--bg-shark)"></circle>
               </svg>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });

    L.marker([lat, lng], { icon: customPin }).addTo(map)
        .bindPopup(`<b style="color:var(--bg-shark); font-family:var(--font-family, 'Inter');">${locationStr}</b>`);
}
