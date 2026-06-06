// js/main.js — Lógica del marketplace (index.html)
// showToast, confirmarCierreSesion y navigateToDetail viven en utils.js

window.vehiculosAComparar = [];
const MAX_COMPARACION = 3;

document.addEventListener('DOMContentLoaded', () => {
    const session = (typeof getSession === 'function') ? getSession() : null;

    // --- CARGA ASÍNCRONA DE VEHÍCULOS ---
    const carContainer = document.getElementById('container-autos');
    const btnToggle = document.getElementById('btn-toggle-filters');
    const panelFilters = document.getElementById('advanced-filters');
    const btnReset = document.getElementById('btn-reset');
    const searchInput = document.getElementById('busqueda');

    let allCars = [];
    let cachedFavsList = null;

    const normalizar = (texto) =>
        texto ? texto.toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim() : '';

    function obtenerCriteriosFiltro() {
        const pMin = parseFloat(document.getElementById('filter-price-min')?.value);
        const pMax = parseFloat(document.getElementById('filter-price-max')?.value);
        const kmMin = parseInt(document.getElementById('filter-km-min')?.value);
        const kmMax = parseInt(document.getElementById('filter-km-max')?.value);
        const yMin = parseInt(document.getElementById('filter-year-min')?.value);
        const yMax = parseInt(document.getElementById('filter-year-max')?.value);
        return {
            search: normalizar(searchInput?.value || ''),
            brand: normalizar(document.getElementById('filter-brand')?.value || ''),
            model: normalizar(document.getElementById('filter-model')?.value || ''),
            location: normalizar(document.getElementById('filter-location')?.value || ''),
            yearMin: isNaN(yMin) ? 0 : yMin,
            yearMax: isNaN(yMax) ? 9999 : yMax,
            priceMin: isNaN(pMin) ? 0 : pMin,
            priceMax: isNaN(pMax) ? Infinity : pMax,
            kmMin: isNaN(kmMin) ? 0 : kmMin,
            kmMax: isNaN(kmMax) ? Infinity : kmMax,
            body: document.getElementById('filter-body')?.value || 'all',
            fuel: document.getElementById('filter-fuel')?.value || 'all',
            transmission: document.getElementById('filter-trans')?.value || 'all'
        };
    }

    function aplicarFiltros() {
        const c = obtenerCriteriosFiltro();
        const filtered = allCars.filter(car => {
            const cBrand = normalizar(car.brand);
            const cModel = normalizar(car.model);
            const cLocation = normalizar(car.location);
            const cBody = normalizar(car.bodyType);
            const cFuel = normalizar(car.fuel);
            const cTrans = normalizar(car.transmission);
            const fBody = normalizar(c.body);
            const fFuel = normalizar(c.fuel);
            const fTrans = normalizar(c.transmission);

            return (cBrand.includes(c.search) || cModel.includes(c.search)) &&
                (c.brand === '' || cBrand.includes(c.brand)) &&
                (c.model === '' || cModel.includes(c.model)) &&
                (c.location === '' || cLocation.includes(c.location)) &&
                car.year >= c.yearMin && car.year <= c.yearMax &&
                car.price >= c.priceMin && car.price <= c.priceMax &&
                car.km >= c.kmMin && car.km <= c.kmMax &&
                (c.body === 'all' || cBody.includes(fBody) || fBody.includes(cBody)) &&
                (c.fuel === 'all' || cFuel.includes(fFuel) || fFuel.includes(cFuel)) &&
                (c.transmission === 'all' || cTrans.includes(fTrans) || fTrans.includes(cTrans));
        });
        renderCars(filtered);
    }

    async function renderCars(list) {
        if (!carContainer) return;
        carContainer.innerHTML = '';
        if (list.length === 0) {
            carContainer.innerHTML = `<p class="no-results">No se encontraron vehículos.</p>`;
            return;
        }
        const isComprador = session && session.role === 'comprador';
        const userIdentifier = session ? session.email : null;

        // Cachear favoritos — evita un fetch por cada evento de filtro/búsqueda
        if (isComprador && userIdentifier && cachedFavsList === null) {
            cachedFavsList = await getUserFavorites(userIdentifier);
        }
        const favsList = cachedFavsList || [];

        list.forEach(car => {
            const isSelected = window.vehiculosAComparar.includes(car.id);
            const isFav = favsList.includes(car.id);
            const card = document.createElement('div');
            card.className = 'card-auto';

            let htmlBotones = `<button class="btn-detail" onclick="navigateToDetail('${car.id}')">Detalles</button>`;
            let htmlFavorito = '';
            if (isComprador) {
                htmlBotones = `<button class="btn-compare-card ${isSelected ? 'active' : ''}" data-id="${car.id}">${isSelected ? 'Agregado' : 'Comparar'}</button>${htmlBotones}`;
                htmlFavorito = `<button class="btn-favorite ${isFav ? 'active' : ''}" data-fav-id="${car.id}"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>`;
            }
            let statusBadge = '';
            if (car.status === 'Reservado') {
                statusBadge = `<span class="badge-ia" style="background: rgba(255,165,0,0.9); color: #000; top: 10px; left: 10px; right: auto;">RESERVADO</span>`;
            } else if (car.status === 'Vendido') {
                statusBadge = `<span class="badge-ia" style="background: rgba(255,50,50,0.9); top: 10px; left: 10px; right: auto;">VENDIDO</span>`;
            }
            card.innerHTML = `<div class="img-container">${htmlFavorito}${statusBadge}<img src="${car.image || ''}" alt="${car.model}" onerror="this.style.visibility='hidden'"><span class="badge-ia">${car.bodyType}</span></div><div class="info-auto"><h3>${car.brand} ${car.model}</h3><p>${car.year} • ${car.km.toLocaleString()} km</p><div class="car-footer"><span class="price">u$s ${Number(car.price).toLocaleString()}</span><div style="display:flex;gap:8px;">${htmlBotones}</div></div></div>`;
            carContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-compare-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idStr = e.currentTarget.getAttribute('data-id');
                manejarToggleComparacion(isNaN(idStr) ? idStr : Number(idStr));
            });
        });

        document.querySelectorAll('.btn-favorite').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const idStr = e.currentTarget.getAttribute('data-fav-id');
                const id = isNaN(idStr) ? idStr : Number(idStr);
                e.currentTarget.disabled = true;
                const isAdded = await toggleFavoriteStatus(userIdentifier, id);
                cachedFavsList = null;
                e.currentTarget.disabled = false;
                if (isAdded) {
                    e.currentTarget.classList.add('active');
                    showToast('Guardado en favoritos.');
                } else {
                    e.currentTarget.classList.remove('active');
                    showToast('Eliminado de favoritos.', 'error');
                }
            });
        });
    }

    if (btnToggle) btnToggle.addEventListener('click', () => panelFilters.classList.toggle('active'));
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            document.querySelectorAll('.advanced-filters-panel input').forEach(i => i.value = '');
            document.querySelectorAll('.advanced-filters-panel select').forEach(s => s.value = 'all');
            if (searchInput) searchInput.value = '';
            aplicarFiltros();
        });
    }
    document.querySelectorAll('.advanced-filters-panel input, .advanced-filters-panel select, #busqueda')
        .forEach(el => {
            el.addEventListener('input', aplicarFiltros);
            el.addEventListener('change', aplicarFiltros);
        });

    function manejarToggleComparacion(id) {
        const index = window.vehiculosAComparar.indexOf(id);
        if (index > -1) {
            window.vehiculosAComparar.splice(index, 1);
        } else {
            if (window.vehiculosAComparar.length >= MAX_COMPARACION) {
                showToast(`Podés comparar hasta ${MAX_COMPARACION} vehículos.`, 'error');
                return;
            }
            window.vehiculosAComparar.push(id);
        }
        actualizarUIComparacion();
    }

    function actualizarUIComparacion() {
        const barra = document.getElementById('compare-floating-bar');
        const contador = document.getElementById('compare-count');
        if (!barra || !contador) return;
        barra.style.display = window.vehiculosAComparar.length > 0 ? 'flex' : 'none';
        contador.textContent = window.vehiculosAComparar.length;
        aplicarFiltros();
    }

    const btnOpenCompare = document.getElementById('btn-open-compare');
    const btnClearCompare = document.getElementById('btn-clear-compare');
    const btnCloseCompare = document.getElementById('btn-close-compare');
    const compareModal = document.getElementById('compare-modal');

    if (btnClearCompare) {
        btnClearCompare.addEventListener('click', () => {
            window.vehiculosAComparar = [];
            actualizarUIComparacion();
            showToast('Lista de comparación limpiada.', 'success');
        });
    }
    if (btnOpenCompare) {
        btnOpenCompare.addEventListener('click', () => {
            if (window.vehiculosAComparar.length < 2) {
                showToast('Necesitás al menos 2 vehículos para comparar.', 'error');
                return;
            }
            generarTablaComparacion();
            if (compareModal) compareModal.style.display = 'flex';
        });
    }
    if (btnCloseCompare) btnCloseCompare.addEventListener('click', () => { if (compareModal) compareModal.style.display = 'none'; });

    function generarTablaComparacion() {
        const tbody = document.getElementById('compare-table');
        if (!tbody) return;
        const autos = window.vehiculosAComparar.map(id => allCars.find(c => c.id === id)).filter(Boolean);

        // Find best values
        const minPrice = Math.min(...autos.map(a => Number(a.price) || Infinity));
        const minKm = Math.min(...autos.map(a => Number(a.km) || Infinity));
        const maxYear = Math.max(...autos.map(a => Number(a.year) || 0));

        let hHeaders = `<th>Especificación</th>`;
        let hImg = `<td>Visualización</td>`;
        let hPrecio = `<td>Precio Estimado</td>`;
        let hAnio = `<td>Año</td>`;
        let hKm = `<td>Kilometraje</td>`;
        let hCombustible = `<td>Combustible</td>`;
        let hTrans = `<td>Transmisión</td>`;
        let hBody = `<td>Carrocería IA</td>`;

        autos.forEach(a => {
            const priceVal = Number(a.price);
            const kmVal = Number(a.km);
            const yearVal = Number(a.year);

            const isBestPrice = priceVal === minPrice && priceVal > 0;
            const isBestKm = kmVal === minKm && kmVal >= 0;
            const isBestYear = yearVal === maxYear && yearVal > 0;

            hHeaders += `<th>${a.brand} ${a.model}</th>`;
            hImg += `<td><div class="compare-img-wrap"><img src="${a.image || ''}" alt="${a.model}"></div></td>`;
            hPrecio += `<td class="${isBestPrice ? 'winner-highlight' : ''}"><strong style="font-size:1.1rem;">u$s ${priceVal.toLocaleString()}</strong></td>`;
            hAnio += `<td class="${isBestYear ? 'winner-highlight' : ''}">${a.year}</td>`;
            hKm += `<td class="${isBestKm ? 'winner-highlight' : ''}">${kmVal.toLocaleString()} km</td>`;
            hCombustible += `<td>${a.fuel}</td>`;
            hTrans += `<td>${a.transmission || 'No especificada'}</td>`;
            hBody += `<td><span class="badge-role">${a.bodyType}</span></td>`;
        });

        tbody.innerHTML = `<thead><tr>${hHeaders}</tr></thead><tbody><tr>${hImg}</tr><tr>${hPrecio}</tr><tr>${hAnio}</tr><tr>${hKm}</tr><tr>${hCombustible}</tr><tr>${hTrans}</tr><tr>${hBody}</tr></tbody>`;
        
        // Reset AI section
        const aiResult = document.getElementById('ai-verdict-result');
        const btnAi = document.getElementById('btn-ai-verdict');
        if (aiResult) {
            aiResult.style.display = 'none';
            aiResult.innerHTML = '';
        }
        if (btnAi) {
            btnAi.disabled = false;
            btnAi.style.background = 'transparent';
            btnAi.style.border = '2px solid var(--accent-lavender)';
            btnAi.style.color = 'var(--accent-lavender)';
            btnAi.style.padding = '10px 24px';
            btnAi.style.borderRadius = '8px';
            btnAi.style.fontSize = '1rem';
            btnAi.style.fontWeight = '600';
            btnAi.style.boxShadow = 'none';
            btnAi.style.transition = 'all 0.3s ease';
            btnAi.innerHTML = '<i class="fas fa-robot"></i> Pedir Veredicto a IA';
        }
    }

    const btnAiVerdict = document.getElementById('btn-ai-verdict');
    if (btnAiVerdict) {
        btnAiVerdict.addEventListener('click', async () => {
            const btnAi = document.getElementById('btn-ai-verdict');
            const aiResult = document.getElementById('ai-verdict-result');
            const autos = window.vehiculosAComparar.map(id => allCars.find(c => c.id === id)).filter(Boolean);

            if (autos.length < 2) return;

            btnAi.disabled = true;
            btnAi.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analizando con IA...';
            aiResult.style.display = 'block';
            aiResult.innerHTML = '<em>Gemini está evaluando los modelos, años, kilómetros y precios del mercado para darte una recomendación objetiva...</em>';

            try {
                const response = await fetch(`${API_BASE_URL}/ai/compare`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cars: autos })
                });

                if (!response.ok) throw new Error('Error al comparar con IA');
                
                const data = await response.json();
                
                aiResult.innerHTML = `<strong><i class="fas fa-star" style="color:var(--accent-lavender);"></i> Veredicto de Inteligencia Artificial:</strong><br><br>${data.recommendation.replace(/\\n/g, '<br>')}`;
                btnAi.innerHTML = '<i class="fas fa-check"></i> Veredicto Completado';
            } catch (error) {
                console.error(error);
                aiResult.innerHTML = '<span style="color:var(--error);">Ocurrió un error al consultar a la Inteligencia Artificial. Intentá más tarde.</span>';
                btnAi.disabled = false;
                btnAi.innerHTML = '<i class="fas fa-robot"></i> Reintentar Veredicto';
            }
        });
    }

    async function init() {
        allCars = await getAllCars();
        await renderCars(allCars);
    }
    init();
});
