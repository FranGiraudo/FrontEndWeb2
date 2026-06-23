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

    // Usar la función global window.normalizeText
    const normalizar = (texto) => window.normalizeText ? window.normalizeText(texto) : (texto ? texto.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '');

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
        debouncedTrackSearch(c);
    }

    let searchTimeout = null;
    function debouncedTrackSearch(criterios) {
        if (!session || !session.token) return; // Sólo logueados
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const hasFilters = Object.values(criterios).some(v => v !== '' && v !== 'all' && v !== 0 && v !== Infinity && v !== 9999);
            if (hasFilters) {
                await saveSearchHistory(criterios.search, criterios);
                await renderSearchHistory(); // Refrescar los chips
            }
        }, 1500);
    }

    async function renderSearchHistory() {
        const container = document.getElementById('search-history-container');
        const chipsDiv = document.getElementById('search-history-chips');
        if (!container || !chipsDiv) return;

        const history = await getSearchHistory();
        if (!history || history.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        chipsDiv.innerHTML = '';

        history.forEach(h => {
            const chip = document.createElement('div');
            chip.className = 'search-chip';
            
            // Texto del chip basado en los filtros
            let text = [];
            if (h.queryText) text.push(`"${h.queryText}"`);
            if (h.filters.brand && h.filters.brand !== '') text.push(h.filters.brand);
            if (h.filters.priceMax && h.filters.priceMax !== Infinity) text.push(`Max $${h.filters.priceMax}`);
            if (h.filters.body && h.filters.body !== 'all') text.push(h.filters.body);
            
            chip.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> 
                              ${text.length > 0 ? text.join(', ') : 'Búsqueda general'}`;
            
            chip.addEventListener('click', () => {
                // Re-aplicar filtros en el DOM
                if (searchInput) searchInput.value = h.filters.search || '';
                const fBrand = document.getElementById('filter-brand'); if(fBrand) fBrand.value = h.filters.brand || '';
                const fModel = document.getElementById('filter-model'); if(fModel) fModel.value = h.filters.model || '';
                const fLoc = document.getElementById('filter-location'); if(fLoc) fLoc.value = h.filters.location || '';
                const yMin = document.getElementById('filter-year-min'); if(yMin) yMin.value = h.filters.yearMin === 0 ? '' : h.filters.yearMin;
                const yMax = document.getElementById('filter-year-max'); if(yMax) yMax.value = h.filters.yearMax === 9999 ? '' : h.filters.yearMax;
                const pMin = document.getElementById('filter-price-min'); if(pMin) pMin.value = h.filters.priceMin === 0 ? '' : h.filters.priceMin;
                const pMax = document.getElementById('filter-price-max'); if(pMax) pMax.value = h.filters.priceMax === Infinity ? '' : h.filters.priceMax;
                const kmMin = document.getElementById('filter-km-min'); if(kmMin) kmMin.value = h.filters.kmMin === 0 ? '' : h.filters.kmMin;
                const kmMax = document.getElementById('filter-km-max'); if(kmMax) kmMax.value = h.filters.kmMax === Infinity ? '' : h.filters.kmMax;
                const fBody = document.getElementById('filter-body'); if(fBody) fBody.value = h.filters.body || 'all';
                const fFuel = document.getElementById('filter-fuel'); if(fFuel) fFuel.value = h.filters.fuel || 'all';
                const fTrans = document.getElementById('filter-trans'); if(fTrans) fTrans.value = h.filters.transmission || 'all';
                
                aplicarFiltros();
            });

            chipsDiv.appendChild(chip);
        });
    }

    async function renderLeaderboard(trendingCars) {
        const section = document.getElementById('trending-leaderboard');
        const listDiv = document.getElementById('leaderboard-list');
        if (!section || !listDiv) return;

        if (!trendingCars || trendingCars.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        const dashboard = document.getElementById('dashboard-widgets');
        if (dashboard) dashboard.style.display = 'grid';
        listDiv.innerHTML = '';

        trendingCars.forEach((car, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            if (index >= 3) {
                item.classList.add('leaderboard-hidden');
            }
            item.setAttribute('data-rank', index + 1);
            item.onclick = () => navigateToDetail(car.id);

            item.innerHTML = `
                <div class="leaderboard-info">
                    <span class="leaderboard-title">${car.brand} ${car.model} (${car.year})</span>
                    <span class="leaderboard-price">u$s ${Number(car.price).toLocaleString()}</span>
                </div>
                <div class="leaderboard-views">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    ${car.viewCount || car.views || 0} visitas
                </div>
            `;
            listDiv.appendChild(item);
        });

        if (trendingCars.length > 3) {
            const btnToggle = document.createElement('button');
            btnToggle.className = 'btn-detail';
            btnToggle.style.marginTop = '1rem';
            btnToggle.style.width = '100%';
            btnToggle.style.display = 'block';
            btnToggle.textContent = 'Ver Top 10';
            
            btnToggle.onclick = () => {
                const hiddenItems = listDiv.querySelectorAll('.leaderboard-hidden');
                const isExpanded = btnToggle.textContent === 'Ver Top 3';
                
                hiddenItems.forEach(item => {
                    if (isExpanded) {
                        item.classList.remove('expanded');
                    } else {
                        item.classList.add('expanded');
                    }
                });
                
                if (isExpanded) {
                    btnToggle.textContent = 'Ver Top 10';
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    btnToggle.textContent = 'Ver Top 3';
                }
            };
            
            listDiv.appendChild(btnToggle);
        }
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

        let dolarRate = null;
        if (window.CurrencyService) {
            dolarRate = await window.CurrencyService.getDolarBlueRate();
        }

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

            let htmlBotones = `<button class="btn-detail" onclick="navigateToDetail('${car.id}')" style="padding: 0.4rem 1rem; font-size: 0.85rem; font-weight: 700; width: auto; flex-grow: 1;">Detalles</button>`;
            let htmlFavorito = '';
            if (isComprador) {
                htmlBotones = `<button class="btn-compare-card ${isSelected ? 'active' : ''}" data-id="${car.id}" style="padding: 0.4rem 0.6rem; font-size: 0.75rem; background: transparent; border: 1px solid var(--border-light); color: var(--text-muted); font-weight: 500;">${isSelected ? 'Agregado' : 'Comparar'}</button>${htmlBotones}`;
                htmlFavorito = `<button class="btn-favorite ${isFav ? 'active' : ''}" data-fav-id="${car.id}"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>`;
            }

            let priceHtml = `<div style="display: flex; flex-direction: column; line-height: 1.2;"><span class="price" style="font-size: 1.15rem;">u$s ${window.formatPrice ? window.formatPrice(car.price) : Number(car.price).toLocaleString()}</span>`;
            if (car.oldPrice && car.oldPrice !== car.price) {
                priceHtml += `<span class="price-old" style="text-decoration: line-through; color: #999; font-size: 0.75rem;">u$s ${Number(car.oldPrice).toLocaleString()}</span>`;
            }
            priceHtml += `</div>`;

            card.innerHTML = `<div class="img-container">${htmlFavorito}<img src="${car.image || ''}" alt="${car.model}" onerror="this.style.visibility='hidden'"><span class="badge-ia">${car.bodyType}</span></div><div class="info-auto"><h3>${car.brand} ${car.model}</h3><p>${car.year} • ${window.formatPrice ? window.formatPrice(car.km) : Number(car.km).toLocaleString()} km</p><div class="car-footer" style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;"><div class="price-container">${priceHtml}</div><div style="display:flex; align-items: center; gap: 6px; flex-wrap: wrap;">${htmlBotones}</div></div></div>`;
            carContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-compare-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idStr = e.currentTarget.getAttribute('data-id');
                manejarToggleComparacion(isNaN(idStr) ? idStr : Number(idStr));
            });
        });

        document.querySelectorAll('.btn-favorite').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const btnElem = e.currentTarget;
                const idStr = btnElem.getAttribute('data-fav-id');
                const id = isNaN(idStr) ? idStr : Number(idStr);
                
                // Optimistic UI Update
                const wasActive = btnElem.classList.contains('active');
                if (wasActive) {
                    btnElem.classList.remove('active');
                } else {
                    btnElem.classList.add('active');
                    btnElem.style.transform = "scale(1.3)";
                    setTimeout(() => btnElem.style.transform = "", 200);
                }
                
                btnElem.disabled = true;
                
                // Background Sync
                try {
                    const isAdded = await toggleFavoriteStatus(userIdentifier, id);
                    cachedFavsList = null;
                    if (isAdded && !wasActive) showToast('Guardado en favoritos.');
                    if (!isAdded && wasActive) showToast('Eliminado de favoritos.', 'error');
                    
                    // Revert if server disagrees
                    if (isAdded !== !wasActive) {
                        if (isAdded) btnElem.classList.add('active');
                        else btnElem.classList.remove('active');
                    }
                } catch (err) {
                    // Revert on error
                    if (wasActive) btnElem.classList.add('active');
                    else btnElem.classList.remove('active');
                    showToast('Error de conexión', 'error');
                } finally {
                    btnElem.disabled = false;
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
        
        document.querySelectorAll('.btn-compare-card').forEach(btn => {
            const idStr = btn.getAttribute('data-id');
            const id = isNaN(idStr) ? idStr : Number(idStr);
            if (window.vehiculosAComparar.includes(id)) {
                btn.classList.add('active');
                btn.textContent = 'Agregado';
            } else {
                btn.classList.remove('active');
                btn.textContent = 'Comparar';
            }
        });
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
        const [carsData, trendingData, historyData, vendorsData] = await Promise.all([
            getAllCars(),
            getTrendingCars(),
            getSearchHistory(),
            getVendorsRanking()
        ]);
        allCars = carsData;
        
        await renderCars(allCars);
        await renderLeaderboard(trendingData);
        renderHistoryList(historyData);
        await renderAiRecommendations();
        await renderVendorsRanking(vendorsData);
    }
    
    async function renderVendorsRanking(vendors) {
        const section = document.getElementById('vendors-ranking-section');
        const listDiv = document.getElementById('vendors-ranking-list');
        if (!section || !listDiv) return;

        if (!vendors || vendors.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        listDiv.innerHTML = '';

        vendors.forEach((vendor, index) => {
            const card = document.createElement('div');
            card.className = 'card-auto'; // Reutilizamos estilo para mantener consistencia
            card.style.textAlign = 'center';
            card.style.padding = '2rem 1rem';
            
            let medalHtml = '';
            if (index === 0) medalHtml = '<i class="fa-solid fa-medal" style="color: gold; font-size: 2rem; margin-bottom: 1rem;"></i>';
            else if (index === 1) medalHtml = '<i class="fa-solid fa-medal" style="color: silver; font-size: 1.5rem; margin-bottom: 1rem;"></i>';
            else if (index === 2) medalHtml = '<i class="fa-solid fa-medal" style="color: #cd7f32; font-size: 1.5rem; margin-bottom: 1rem;"></i>';

            const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.nombre + ' ' + (vendor.apellido || ''))}&background=8b5cf6&color=fff&size=80`;
            const avatar = vendor.avatarUrl || fallbackAvatar;
            
            card.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    ${medalHtml}
                    <img src="${avatar}" alt="${vendor.nombre}" onerror="this.onerror=null; this.src='${fallbackAvatar}'" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; border: 3px solid var(--accent-lavender);">
                    <h3 style="margin-bottom: 0.5rem; color: var(--white);">${vendor.nombre} ${vendor.apellido || ''}</h3>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="color: var(--warning); font-size: 1.2rem; font-weight: bold;">${vendor.avgScore.toFixed(1)}</span>
                        <i class="fa-solid fa-star" style="color: var(--warning);"></i>
                    </div>
                    <p style="color: var(--text-slate); font-size: 0.9rem;">${vendor.totalReviews} reseñas</p>
                </div>
            `;
            listDiv.appendChild(card);
        });
    }

    async function renderAiRecommendations() {
        const container = document.getElementById('ai-recommendations');
        const listDiv = document.getElementById('ai-recommendations-list');
        if (!container || !listDiv) return;

        // Regla estricta: Verificar autenticación con requireAuth
        const session = (typeof window.requireAuth === 'function') ? window.requireAuth() : null;
        if (!session) {
            container.style.display = 'none';
            return;
        }

        try {
            listDiv.innerHTML = '<div class="ai-empty-message" style="opacity: 0.5;">Cargando recomendaciones...</div>';
            container.style.display = 'block';
            const dashboard = document.getElementById('dashboard-widgets');
            if (dashboard) dashboard.style.display = 'grid';

            const btnForce = document.getElementById('btn-force-recommendations');
            if (btnForce) {
                btnForce.onclick = async () => {
                    listDiv.innerHTML = '<div class="ai-empty-message" style="opacity: 0.5;"><i class="fa-solid fa-spinner fa-spin"></i> Analizando tu perfil con IA...</div>';
                    btnForce.disabled = true;
                    try {
                        const res = await fetch(`${API_BASE_URL}/recommendations/generate`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${session.token}` }
                        });
                        if (!res.ok) throw new Error('Error al generar');
                        const data = await res.json();

                        if (!data.cars || data.cars.length === 0) {
                            listDiv.innerHTML = '<div class="ai-empty-message">No hay historial suficiente para recomendar.</div>';
                            return;
                        }

                        listDiv.innerHTML = '';
                        data.cars.forEach((car, index) => {
                            const imgUrl = car.images && car.images.length > 0 ? car.images[0].url : (car.image || 'assets/placeholder-car.jpg');
                            const card = document.createElement('div');
                            card.className = 'card-auto'; 
                            if (index >= 1) {
                                card.classList.add('ai-hidden');
                            }
                            
                            let priceHtml = `<div style="display: flex; flex-direction: column; line-height: 1.2;"><span class="price" style="font-size: 1.15rem;">u$s ${window.formatPrice ? window.formatPrice(car.price) : Number(car.price).toLocaleString()}</span>`;
                            if (car.oldPrice && car.oldPrice !== car.price) {
                                priceHtml += `<span class="price-old" style="text-decoration: line-through; color: #999; font-size: 0.75rem;">u$s ${Number(car.oldPrice).toLocaleString()}</span>`;
                            }
                            priceHtml += `</div>`;

                            let htmlBotones = `<button class="btn-detail" onclick="navigateToDetail('${car.id}')" style="padding: 0.4rem 1rem; font-size: 0.85rem; font-weight: 700; width: auto; flex-grow: 1;">Detalles</button>`;
                            card.innerHTML = `<div class="img-container"><img src="${imgUrl}" alt="${car.model}" onerror="this.style.visibility='hidden'"><span class="badge-ia">Recomendado</span></div>
                            <div class="info-auto"><h3>${car.brand} ${car.model}</h3><p>${car.year} • ${window.formatPrice ? window.formatPrice(car.km) : Number(car.km).toLocaleString()} km</p>
                            <div class="car-footer" style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;"><div class="price-container">${priceHtml}</div><div style="display:flex; align-items: center; gap: 6px; flex-wrap: wrap;">${htmlBotones}</div></div></div>`;
                            listDiv.appendChild(card);
                        });

                        if (data.cars.length > 1) {
                            const btnToggle = document.createElement('button');
                            btnToggle.className = 'btn-detail';
                            btnToggle.style.marginTop = '1rem';
                            btnToggle.style.width = '100%';
                            btnToggle.style.display = 'block';
                            btnToggle.textContent = 'Ver Todas (' + data.cars.length + ')';
                            
                            btnToggle.onclick = () => {
                                const hiddenItems = listDiv.querySelectorAll('.ai-hidden');
                                const isExpanded = btnToggle.textContent.startsWith('Ver Menos');
                                
                                hiddenItems.forEach(item => {
                                    if (isExpanded) {
                                        item.classList.remove('expanded');
                                    } else {
                                        item.classList.add('expanded');
                                    }
                                });
                                
                                if (isExpanded) {
                                    btnToggle.textContent = 'Ver Todas (' + data.cars.length + ')';
                                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                } else {
                                    btnToggle.textContent = 'Ver Menos';
                                }
                            };
                            
                            listDiv.appendChild(btnToggle);
                        }

                    } catch (e) {
                        listDiv.innerHTML = '<div class="ai-empty-message">Error al generar recomendaciones.</div>';
                    } finally {
                        btnForce.disabled = false;
                    }
                };
            }

            const response = await fetch(`${API_BASE_URL}/recommendations/me`, {
                headers: { 'Authorization': `Bearer ${session.token}` }
            });

            if (!response.ok) throw new Error('Error fetching recommendations');
            
            const data = await response.json();

            if (!data.cars || data.cars.length === 0) {
                listDiv.innerHTML = '<div class="ai-empty-message">No hay recomendaciones esta semana.</div>';
                return;
            }

            listDiv.innerHTML = '';
            data.cars.forEach((car, index) => {
                const imgUrl = car.images && car.images.length > 0 ? car.images[0].url : (car.image || 'assets/placeholder-car.jpg');
                const card = document.createElement('div');
                card.className = 'card-auto'; 
                if (index >= 1) {
                    card.classList.add('ai-hidden');
                }
                
                let priceHtml = `<div style="display: flex; flex-direction: column; line-height: 1.2;"><span class="price" style="font-size: 1.15rem;">u$s ${window.formatPrice ? window.formatPrice(car.price) : Number(car.price).toLocaleString()}</span>`;
                if (car.oldPrice && car.oldPrice !== car.price) {
                    priceHtml += `<span class="price-old" style="text-decoration: line-through; color: #999; font-size: 0.75rem;">u$s ${Number(car.oldPrice).toLocaleString()}</span>`;
                }
                priceHtml += `</div>`;

                let htmlBotones = `<button class="btn-detail" onclick="navigateToDetail('${car.id}')" style="padding: 0.4rem 1rem; font-size: 0.85rem; font-weight: 700; width: auto; flex-grow: 1;">Detalles</button>`;
                card.innerHTML = `<div class="img-container"><img src="${imgUrl}" alt="${car.model}" onerror="this.style.visibility='hidden'"><span class="badge-ia">Recomendado</span></div>
                <div class="info-auto"><h3>${car.brand} ${car.model}</h3><p>${car.year} • ${window.formatPrice ? window.formatPrice(car.km) : Number(car.km).toLocaleString()} km</p>
                <div class="car-footer" style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;"><div class="price-container">${priceHtml}</div><div style="display:flex; align-items: center; gap: 6px; flex-wrap: wrap;">${htmlBotones}</div></div></div>`;
                listDiv.appendChild(card);
            });

            if (data.cars.length > 1) {
                const btnToggle = document.createElement('button');
                btnToggle.className = 'btn-detail';
                btnToggle.style.marginTop = '1rem';
                btnToggle.style.width = '100%';
                btnToggle.style.display = 'block';
                btnToggle.textContent = 'Ver Todas (' + data.cars.length + ')';
                
                btnToggle.onclick = () => {
                    const hiddenItems = listDiv.querySelectorAll('.ai-hidden');
                    const isExpanded = btnToggle.textContent.startsWith('Ver Menos');
                    
                    hiddenItems.forEach(item => {
                        if (isExpanded) {
                            item.classList.remove('expanded');
                        } else {
                            item.classList.add('expanded');
                        }
                    });
                    
                    if (isExpanded) {
                        btnToggle.textContent = 'Ver Todas (' + data.cars.length + ')';
                        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        btnToggle.textContent = 'Ver Menos';
                    }
                };
                
                listDiv.appendChild(btnToggle);
            }

        } catch (error) {
            console.error('Error:', error);
            listDiv.innerHTML = '<div class="ai-empty-message">Error al cargar recomendaciones.</div>';
        }
    }
    
    function renderHistoryList(history) {
        const container = document.getElementById('search-history-container');
        const chipsDiv = document.getElementById('search-history-chips');
        if (!container || !chipsDiv) return;

        if (!history || history.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        chipsDiv.innerHTML = '';

        history.forEach(h => {
            const chip = document.createElement('div');
            chip.className = 'search-chip';
            
            // Texto del chip basado en los filtros
            let text = [];
            if (h.queryText) text.push(`"${h.queryText}"`);
            if (h.filters.brand && h.filters.brand !== '') text.push(h.filters.brand);
            if (h.filters.priceMax && h.filters.priceMax !== Infinity) text.push(`Max $${h.filters.priceMax}`);
            if (h.filters.body && h.filters.body !== 'all') text.push(h.filters.body);
            
            chip.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> 
                              ${text.length > 0 ? text.join(', ') : 'Búsqueda general'}`;
            
            chip.addEventListener('click', () => {
                if (searchInput) searchInput.value = h.filters.search || '';
                const fBrand = document.getElementById('filter-brand'); if(fBrand) fBrand.value = h.filters.brand || '';
                const fModel = document.getElementById('filter-model'); if(fModel) fModel.value = h.filters.model || '';
                const fLoc = document.getElementById('filter-location'); if(fLoc) fLoc.value = h.filters.location || '';
                const yMin = document.getElementById('filter-year-min'); if(yMin) yMin.value = h.filters.yearMin === 0 ? '' : h.filters.yearMin;
                const yMax = document.getElementById('filter-year-max'); if(yMax) yMax.value = h.filters.yearMax === 9999 ? '' : h.filters.yearMax;
                const pMin = document.getElementById('filter-price-min'); if(pMin) pMin.value = h.filters.priceMin === 0 ? '' : h.filters.priceMin;
                const pMax = document.getElementById('filter-price-max'); if(pMax) pMax.value = h.filters.priceMax === Infinity ? '' : h.filters.priceMax;
                const kmMin = document.getElementById('filter-km-min'); if(kmMin) kmMin.value = h.filters.kmMin === 0 ? '' : h.filters.kmMin;
                const kmMax = document.getElementById('filter-km-max'); if(kmMax) kmMax.value = h.filters.kmMax === Infinity ? '' : h.filters.kmMax;
                const fBody = document.getElementById('filter-body'); if(fBody) fBody.value = h.filters.body || 'all';
                const fFuel = document.getElementById('filter-fuel'); if(fFuel) fFuel.value = h.filters.fuel || 'all';
                const fTrans = document.getElementById('filter-trans'); if(fTrans) fTrans.value = h.filters.transmission || 'all';
                aplicarFiltros();
            });

            chipsDiv.appendChild(chip);
        });
    }

    init();
});
