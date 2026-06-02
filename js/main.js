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
            <div style="background-color: var(--bg-shark); width: 90%; max-width: 25rem; border-radius: 1rem; border: 1px solid var(--border); box-shadow: 0 1.5rem 3rem rgba(0,0,0,0.6); padding: 2rem; text-align: center; display: flex; flex-direction: column; gap: 1rem; animation: fadeIn 0.3s ease;">
                <div style="background: rgba(255, 77, 77, 0.1); width: 4rem; height: 4rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                    <svg viewBox="0 0 24 24" style="width: 2rem; height: 2rem; stroke: #ff4d4d; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </div>
                <h3 style="color: var(--white); font-size: 1.5rem; margin: 0;">¿Cerrar sesión?</h3>
                <p style="color: var(--text-slate); margin: 0 0 1rem 0; font-size: 0.95rem;">Estás a punto de salir de tu cuenta de SmartAuto.</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button id="btn-cancel-logout" style="flex: 1; padding: 0.8rem; border-radius: 0.6rem; font-weight: 600; border: 1px solid var(--border); background: transparent; color: var(--text-slate); cursor: pointer; transition: all 0.2s;">Cancelar</button>
                    <button id="btn-confirm-logout" style="flex: 1; padding: 0.8rem; border-radius: 0.6rem; font-weight: 600; background: #ff4d4d; color: white; border: none; cursor: pointer; transition: all 0.2s;">Sí, salir</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const btnCancel = document.getElementById('btn-cancel-logout');
        const btnConfirm = document.getElementById('btn-confirm-logout');
        btnCancel.addEventListener('click', () => modal.style.display = 'none');
        btnConfirm.addEventListener('click', () => {
            localStorage.removeItem('user_session');
            const isInsidePages = window.location.pathname.includes('/pages/');
            window.location.href = isInsidePages ? "../index.html" : "index.html";
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
    const isInsidePages = window.location.pathname.includes('/pages/'); 

    // --- LÓGICA DE VISIBILIDAD DE "PUBLICAR" ---
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
            profileLink.href = isInsidePages ? "profile.html" : "pages/profile.html";
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
            profileLink.href = isInsidePages ? "login.html" : "pages/login.html";
            profileLink.textContent = "Iniciar Sesión";
        }
    }

    function actualizarNavegacion() {
        const url = window.location.href.toLowerCase();
        const navLinks = document.querySelectorAll('nav ul li a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href').toLowerCase();
            link.classList.remove('active-page');
            link.style.color = "var(--text-slate)";
            link.style.opacity = "0.7";
            link.style.borderBottom = "2px solid transparent";
            const esExplorar = url.includes('index.html') || url.endsWith('/') || url.endsWith('smartauto/');
            const esPublicar = url.includes('publish.html');
            const esPerfil = url.includes('profile.html') || url.includes('login.html');
            if ((esExplorar && href.includes('index')) || 
                (esPublicar && href.includes('publish')) || 
                (esPerfil && (href.includes('profile') || link.id === 'nav-profile-link'))) {
                link.classList.add('active-page');
                link.style.color = "var(--white)";
                link.style.opacity = "1";
                link.style.borderBottom = "2px solid var(--white)";
                link.style.fontWeight = "800";
            }
        });
    }
    actualizarNavegacion();

    // --- CARGA ASÍNCRONA DE VEHÍCULOS ---
    const carContainer = document.getElementById('container-autos');
    const btnToggle = document.getElementById('btn-toggle-filters');
    const panelFilters = document.getElementById('advanced-filters');
    const btnReset = document.getElementById('btn-reset');
    const searchInput = document.getElementById('busqueda');
    
    let allCars = [];

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

    async function renderCars(list) {
        if(!carContainer) return;
        carContainer.innerHTML = "";
        if (list.length === 0) {
            carContainer.innerHTML = `<p class="no-results">No se encontraron vehículos.</p>`;
            return;
        }
        const isComprador = session && session.role === 'comprador';
        const userIdentifier = session ? session.email : null; 
        
        // Obtener favoritos de forma asíncrona una sola vez para esta renderización
        const favsList = (isComprador && userIdentifier) ? await getUserFavorites(userIdentifier) : [];

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
            card.innerHTML = `<div class="img-container">${htmlFavorito}<img src="${car.image}" alt="${car.model}"><span class="badge-ia">${car.bodyType}</span></div><div class="info-auto"><h3>${car.brand} ${car.model}</h3><p>${car.year} • ${car.km.toLocaleString()} km</p><div class="car-footer"><span class="price">u$s ${Number(car.price).toLocaleString()}</span><div style="display: flex; gap: 8px;">${htmlBotones}</div></div></div>`;
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
                
                e.currentTarget.disabled = true; // Evitar spam clicks
                const isAdded = await toggleFavoriteStatus(userIdentifier, id);
                e.currentTarget.disabled = false;

                if (isAdded) {
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
            contador.textContent = window.vehiculosAComparar.length;
        } else { barra.style.display = 'none'; }
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

    function generarTablaComparacion() {
        const tbody = document.getElementById('compare-table');
        if (!tbody) return;
        const autosSeleccionados = window.vehiculosAComparar.map(id => allCars.find(c => c.id === id)).filter(Boolean);
        let htmlHeaders = `<th>Especificación</th>`;
        let htmlImg = `<td>Visualización</td>`;
        let htmlPrecio = `<td>Precio Estimado</td>`;
        let htmlAnio = `<td>Año</td>`;
        let htmlKm = `<td>Kilometraje</td>`;
        let htmlCombustible = `<td>Combustible</td>`;
        let htmlTransmision = `<td>Transmisión</td>`;
        let htmlCarroceria = `<td>Carrocería IA</td>`;
        autosSeleccionados.forEach(auto => {
            htmlHeaders += `<th>${auto.brand} ${auto.model}</th>`;
            htmlImg += `<td><img src="${auto.image}" alt="Foto de ${auto.model}"></td>`;
            htmlPrecio += `<td><strong style="color: var(--accent-lavender); font-size: 1.1rem;">u$s ${Number(auto.price).toLocaleString()}</strong></td>`;
            htmlAnio += `<td>${auto.year}</td>`;
            htmlKm += `<td>${auto.km.toLocaleString()} km</td>`;
            htmlCombustible += `<td>${auto.fuel}</td>`;
            htmlTransmision += `<td>${auto.transmission || 'No especificada'}</td>`;
            htmlCarroceria += `<td><span class="badge-role">${auto.bodyType}</span></td>`;
        });
        tbody.innerHTML = `<thead><tr>${htmlHeaders}</tr></thead><tbody><tr>${htmlImg}</tr><tr>${htmlPrecio}</tr><tr>${htmlAnio}</tr><tr>${htmlKm}</tr><tr>${htmlCombustible}</tr><tr>${htmlTransmision}</tr><tr>${htmlCarroceria}</tr></tbody>`;
    }

    // Inicializar cargando vehículos de la API
    async function init() {
        allCars = await getAllCars();
        await renderCars(allCars);
    }
    init();
});

// FIX 4: Navegación dinámica inteligente al detalle
function navigateToDetail(id) {
    localStorage.setItem('car_id_view', id);
    const isInsidePages = window.location.pathname.includes('/pages/');
    window.location.href = isInsidePages ? "detail.html" : "pages/detail.html";
}