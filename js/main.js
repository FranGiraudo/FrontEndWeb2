// js/main.js

function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconSuccess = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    const iconError = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    toast.innerHTML = `${type === 'success' ? iconSuccess : iconError} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

window.confirmarCierreSesion = function() {
    let modal = document.getElementById('custom-logout-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'custom-logout-modal';
        modal.className = 'lightbox-overlay';
        modal.style.zIndex = '100000'; 
        modal.innerHTML = `
            <div style="background-color: var(--bg-shark); width: 90%; max-width: 25rem; border-radius: 1.5rem; border: 1px solid var(--border); box-shadow: 0 1.5rem 3rem rgba(0,0,0,0.6); padding: 2.5rem; text-align: center; display: flex; flex-direction: column; gap: 1rem; animation: fadeIn 0.3s ease;">
                <div style="background: var(--error-alpha-10); width: 4.5rem; height: 4.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                    <svg viewBox="0 0 24 24" style="width: 2.2rem; height: 2.2rem; stroke: var(--error); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </div>
                <h3 style="color: var(--white); font-size: 1.5rem; margin: 0;">¿Cerrar sesión?</h3>
                <p style="color: var(--text-slate); margin: 0 0 1.5rem 0; font-size: 0.95rem;">Estás a punto de salir de tu cuenta de SmartAuto.</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button id="btn-cancel-logout" style="flex: 1; padding: 0.8rem; border-radius: 0.8rem; font-weight: 700; border: 1px solid var(--border); background: var(--bg-elevated); color: var(--text-slate); cursor: pointer; transition: all 0.2s;">Cancelar</button>
                    <button id="btn-confirm-logout" style="flex: 1; padding: 0.8rem; border-radius: 0.8rem; font-weight: 700; background: var(--error); color: white; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(255,82,82,0.3);">Sí, salir</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const btnCancel = document.getElementById('btn-cancel-logout');
        const btnConfirm = document.getElementById('btn-confirm-logout');
        btnCancel.addEventListener('click', () => modal.style.display = 'none');
        btnConfirm.addEventListener('click', () => {
            localStorage.removeItem('user_session');
            window.location.href = "index.html";
        });
    }
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
};

window.vehiculosAComparar = [];
const MAX_COMPARACION = 3;

document.addEventListener('DOMContentLoaded', () => {
    let session = null;
    try {
        const storedSession = localStorage.getItem('user_session');
        if (storedSession) session = JSON.parse(storedSession);
    } catch (error) { localStorage.removeItem('user_session'); }

    const navUl = document.querySelector('nav ul');
    const profileLink = document.getElementById('nav-profile-link');

    // Visibilidad de Publicar
    const navLinksList = document.querySelectorAll('nav ul li');
    navLinksList.forEach(li => {
        const link = li.querySelector('a');
        if (link && link.getAttribute('href').includes('publish.html')) {
            if (session && session.role === 'vendedor') {
                li.style.display = 'inline-flex'; 
                li.style.alignItems = 'center';
            } else {
                li.style.display = 'none';
            }
        }
    });

    if (session) {
        if (profileLink) {
            profileLink.href = "profile.html";
            profileLink.textContent = "Mi Perfil";
        }
        if (navUl && !document.getElementById('logout-btn')) {
            const logoutHtml = `<li><a href="#" id="logout-btn" class="logout-link">Salir</a></li>`;
            navUl.insertAdjacentHTML('beforeend', logoutHtml);
            document.getElementById('logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                window.confirmarCierreSesion();
            });
        }
    } else {
        if (profileLink) {
            profileLink.href = "login.html";
            profileLink.textContent = "Iniciar Sesión";
        }
    }

    function actualizarNavegacion() {
        const url = window.location.href.toLowerCase();
        const navLinks = document.querySelectorAll('nav ul li a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href').toLowerCase();
            link.classList.remove('active-page');
            const esExplorar = url.includes('index.html') || url.endsWith('/') || url.endsWith('smartauto/');
            const esPublicar = url.includes('publish.html');
            const esPerfil = url.includes('profile.html') || url.includes('login.html');
            if ((esExplorar && href.includes('index')) || 
                (esPublicar && href.includes('publish')) || 
                (esPerfil && (href.includes('profile') || link.id === 'nav-profile-link'))) {
                link.classList.add('active-page');
            }
        });
    }
    actualizarNavegacion();

    // Filtros
    const carContainer = document.getElementById('container-autos');
    const btnToggle = document.getElementById('btn-toggle-filters');
    const panelFilters = document.getElementById('advanced-filters');
    const btnReset = document.getElementById('btn-reset');
    const searchInput = document.getElementById('busqueda');
    const allCars = typeof getAllCars === 'function' ? getAllCars() : [];

    const normalizar = (texto) => texto ? texto.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

    function obtenerCriteriosFiltro() {
        const pMin = parseFloat(document.getElementById('filter-price-min')?.value);
        const pMax = parseFloat(document.getElementById('filter-price-max')?.value);
        const kmMin = parseInt(document.getElementById('filter-km-min')?.value);
        const kmMax = parseInt(document.getElementById('filter-km-max')?.value);
        const yMin = parseInt(document.getElementById('filter-year-min')?.value);
        const yMax = parseInt(document.getElementById('filter-year-max')?.value);

        return {
            search: normalizar(searchInput?.value || ""),
            brand: normalizar(document.getElementById('filter-brand')?.value || ""),
            model: normalizar(document.getElementById('filter-model')?.value || ""),
            location: normalizar(document.getElementById('filter-location')?.value || ""),
            yearMin: isNaN(yMin) ? 0 : yMin,
            yearMax: isNaN(yMax) ? 9999 : yMax,
            priceMin: isNaN(pMin) ? 0 : pMin,
            priceMax: isNaN(pMax) ? Infinity : pMax,
            kmMin: isNaN(kmMin) ? 0 : kmMin,
            kmMax: isNaN(kmMax) ? Infinity : kmMax,
            body: document.getElementById('filter-body')?.value || "all",
            fuel: document.getElementById('filter-fuel')?.value || "all",
            transmission: document.getElementById('filter-trans')?.value || "all"
        };
    }

    function aplicarFiltros() {
        const criterios = obtenerCriteriosFiltro();
        const filtered = allCars.filter(car => {
            const cBrand = normalizar(car.brand);
            const cModel = normalizar(car.model);
            const cLocation = normalizar(car.location);
            const cBody = normalizar(car.bodyType);
            const cFuel = normalizar(car.fuel);
            const cTrans = normalizar(car.transmission);
            const fBody = normalizar(criterios.body);
            const fFuel = normalizar(criterios.fuel);
            const fTrans = normalizar(criterios.transmission);

            const matchesSearch = cBrand.includes(criterios.search) || cModel.includes(criterios.search);
            const matchesBrand = criterios.brand === "" || cBrand.includes(criterios.brand);
            const matchesModel = criterios.model === "" || cModel.includes(criterios.model);
            const matchesLocation = criterios.location === "" || cLocation.includes(criterios.location);
            const matchesYear = car.year >= criterios.yearMin && car.year <= criterios.yearMax;
            const matchesPrice = car.price >= criterios.priceMin && car.price <= criterios.priceMax;
            const matchesKm = car.km >= criterios.kmMin && car.km <= criterios.kmMax;
            const matchesBody = (criterios.body === "all") || cBody.includes(fBody) || fBody.includes(cBody);
            const matchesFuel = (criterios.fuel === "all") || cFuel.includes(fFuel) || fFuel.includes(cFuel);
            const matchesTrans = (criterios.transmission === "all") || cTrans.includes(fTrans) || fTrans.includes(cTrans);

            return matchesSearch && matchesBrand && matchesModel && matchesLocation && 
                   matchesYear && matchesPrice && matchesKm && matchesBody && matchesFuel && matchesTrans;
        });
        renderCars(filtered);
    }

    function renderCars(list) {
        if(!carContainer) return;
        carContainer.innerHTML = "";
        if (list.length === 0) {
            carContainer.innerHTML = `<div class="no-results">No se encontraron vehículos.</div>`;
            return;
        }
        const isComprador = session && session.role === 'comprador';
        const userIdentifier = session ? session.email : null; 
        
        list.forEach(car => {
            const isSelected = window.vehiculosAComparar.includes(car.id);
            const isFav = (isComprador && userIdentifier) ? isCarFavorite(userIdentifier, car.id) : false;
            const card = document.createElement('div');
            card.className = 'card-auto';
            let htmlBotones = `<button class="btn-detail" onclick="navigateToDetail('${car.id}')">Detalles</button>`;
            let htmlFavorito = ''; 
            if (isComprador) {
                htmlBotones = `<button class="btn-compare-card ${isSelected ? 'active' : ''}" data-id="${car.id}">${isSelected ? 'Agregado' : 'Comparar'}</button>${htmlBotones}`;
                htmlFavorito = `<button class="btn-favorite ${isFav ? 'active' : ''}" data-fav-id="${car.id}"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></button>`;
            }
            card.innerHTML = `<div class="img-container">${htmlFavorito}<img src="${car.image}" alt="${car.model}"><span class="badge-ia">${car.bodyType}</span></div><div class="info-auto"><h3>${car.brand} ${car.model}</h3><p class="car-meta">${car.year} • ${car.km.toLocaleString()} km</p><p class="car-location">📍 ${car.location}</p><div class="car-footer"><span class="price">u$s ${Number(car.price).toLocaleString()}</span><div style="display: flex; gap: 8px;">${htmlBotones}</div></div></div>`;
            carContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-compare-card').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idStr = e.currentTarget.getAttribute('data-id');
                manejarToggleComparacion(isNaN(idStr) ? idStr : Number(idStr));
            });
        });

        document.querySelectorAll('.btn-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idStr = e.currentTarget.getAttribute('data-fav-id');
                const id = isNaN(idStr) ? idStr : Number(idStr);
                if (toggleFavoriteStatus(userIdentifier, id)) {
                    e.currentTarget.classList.add('active');
                    showToast("Guardado en favoritos.");
                } else {
                    e.currentTarget.classList.remove('active');
                    showToast("Eliminado de favoritos.", "error");
                }
            });
        });
    }

    if (btnToggle) btnToggle.addEventListener('click', () => panelFilters.classList.toggle('active'));
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            document.querySelectorAll('.advanced-filters-panel input').forEach(i => i.value = "");
            document.querySelectorAll('.advanced-filters-panel select').forEach(s => s.value = "all");
            if(searchInput) searchInput.value = "";
            aplicarFiltros();
        });
    }
    const allInputs = document.querySelectorAll('.advanced-filters-panel input, .advanced-filters-panel select, #busqueda');
    allInputs.forEach(el => {
        el.addEventListener('input', aplicarFiltros);
        el.addEventListener('change', aplicarFiltros);
    });

    // --- LÓGICA DE COMPARACIÓN MEJORADA ---
    function manejarToggleComparacion(id) {
        const index = window.vehiculosAComparar.indexOf(id);
        if (index > -1) window.vehiculosAComparar.splice(index, 1);
        else {
            if (window.vehiculosAComparar.length >= MAX_COMPARACION) {
                showToast(`Podés comparar hasta ${MAX_COMPARACION} vehículos.`, "error");
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
        
        if (window.vehiculosAComparar.length > 0) {
            barra.style.display = 'flex';
            // Pequeño delay para que la clase CSS anime la entrada
            setTimeout(() => barra.classList.add('show'), 10);
            contador.textContent = window.vehiculosAComparar.length;
        } else { 
            barra.classList.remove('show');
            setTimeout(() => { if(!barra.classList.contains('show')) barra.style.display = 'none'; }, 400);
        }
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
            showToast("Lista de comparación limpiada.", "success");
        });
    }
    if (btnOpenCompare) {
        btnOpenCompare.addEventListener('click', () => {
            if (window.vehiculosAComparar.length < 2) {
                showToast("Necesitás al menos 2 vehículos para comparar.", "error");
                return;
            }
            generarTablaComparacion();
            if (compareModal) compareModal.style.display = 'flex';
        });
    }
    if (btnCloseCompare) btnCloseCompare.addEventListener('click', () => { if (compareModal) compareModal.style.display = 'none'; });

    // Exponer la función para que el botón de eliminar del modal funcione
    window.removerDeComparacion = function(id) {
        const index = window.vehiculosAComparar.indexOf(id);
        if (index > -1) {
            window.vehiculosAComparar.splice(index, 1);
            actualizarUIComparacion();
            if (window.vehiculosAComparar.length < 2) {
                if (compareModal) compareModal.style.display = 'none';
                showToast("Comparación cerrada. Necesitás al menos 2 vehículos.", "error");
            } else {
                generarTablaComparacion(); // Re-renderiza la tabla sin cerrarla
            }
        }
    };

    function generarTablaComparacion() {
        const table = document.getElementById('compare-table');
        if (!table) return;
        const listaAutos = typeof getAllCars === 'function' ? getAllCars() : [];
        const autosSeleccionados = window.vehiculosAComparar.map(id => listaAutos.find(c => c.id === id)).filter(Boolean);
        
        let widthP = 80 / autosSeleccionados.length; // Ancho dinámico de las columnas

        // Construcción de la Matriz HTML
        let htmlHeaders = `<th></th>`;
        let htmlPrecio = `<tr><td>Valor Sugerido</td>`;
        let htmlAnio = `<tr><td>Año</td>`;
        let htmlKm = `<tr><td>Kilometraje</td>`;
        let htmlCombustible = `<tr><td>Combustible</td>`;
        let htmlTransmision = `<tr><td>Transmisión</td>`;
        let htmlCarroceria = `<tr><td>Carrocería IA</td>`;
        let htmlUbicacion = `<tr><td>Ubicación</td>`;
        let htmlAcciones = `<tr><td style="border-bottom:none;"></td>`;

        autosSeleccionados.forEach(auto => {
            htmlHeaders += `
                <th style="text-align: center; width: ${widthP}%;">
                    <div style="position: relative; border-radius: 1rem; overflow: hidden; margin-bottom: 1rem; border: 1px solid var(--white-alpha-10);">
                        <img src="${auto.image}" alt="${auto.model}" style="width: 100%; height: 160px; object-fit: cover; display: block;">
                        <button onclick="window.removerDeComparacion(${auto.id})" style="position: absolute; top: 0.5rem; right: 0.5rem; background: var(--error); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 14px; transition: transform 0.2s;">✕</button>
                    </div>
                    <h3 style="color: var(--white); font-size: 1.3rem; margin: 0;">${auto.brand}</h3>
                    <p style="color: var(--text-slate); font-size: 0.9rem; margin: 0; font-weight: 500;">${auto.model}</p>
                </th>`;

            htmlPrecio += `<td style="text-align: center;"><strong style="color: var(--accent-lavender); font-size: 1.4rem;">u$s ${Number(auto.price).toLocaleString()}</strong></td>`;
            htmlAnio += `<td style="text-align: center; color: var(--white); font-weight: 600;">${auto.year}</td>`;
            htmlKm += `<td style="text-align: center; color: var(--white);">${auto.km.toLocaleString()} km</td>`;
            htmlCombustible += `<td style="text-align: center; color: var(--text-slate);">${auto.fuel}</td>`;
            htmlTransmision += `<td style="text-align: center; color: var(--text-slate);">${auto.transmission || 'N/A'}</td>`;
            htmlCarroceria += `<td style="text-align: center;"><span style="background: var(--accent-alpha-10); color: var(--accent-lavender); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; border: 1px solid var(--accent-alpha-20);">${auto.bodyType}</span></td>`;
            htmlUbicacion += `<td style="text-align: center; color: var(--text-muted);">${auto.location}</td>`;
            htmlAcciones += `<td style="text-align: center; border-bottom: none; padding-top: 1.5rem;"><button class="btn-detail" style="width: 100%;" onclick="navigateToDetail('${auto.id}')">Ver Vehículo</button></td>`;
        });

        htmlPrecio += `</tr>`; htmlAnio += `</tr>`; htmlKm += `</tr>`;
        htmlCombustible += `</tr>`; htmlTransmision += `</tr>`; htmlCarroceria += `</tr>`;
        htmlUbicacion += `</tr>`; htmlAcciones += `</tr>`;

        // Inyección final en la tabla
        table.innerHTML = `
            <thead><tr>${htmlHeaders}</tr></thead>
            <tbody>
                ${htmlPrecio} ${htmlAnio} ${htmlKm} 
                ${htmlCombustible} ${htmlTransmision} 
                ${htmlCarroceria} ${htmlUbicacion}
                ${htmlAcciones}
            </tbody>
        `;
    }

    renderCars(allCars);
});

function navigateToDetail(id) {
    localStorage.setItem('car_id_view', id);
    window.location.href = "detail.html";
}