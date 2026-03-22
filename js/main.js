document.addEventListener('DOMContentLoaded', () => {
    // --- 1. GESTIÓN DE SESIÓN Y MENÚ ---
    const session = JSON.parse(localStorage.getItem('user_session'));
    const navUl = document.querySelector('nav ul');
    const profileLink = document.getElementById('nav-profile-link');

    if (session) {
        if (profileLink) {
            profileLink.href = "profile.html";
            profileLink.textContent = "Mi Perfil";
        }
        
        // Si no existe el botón de salir, lo agregamos como un <li> normal
        if (navUl && !document.getElementById('logout-btn')) {
            const logoutHtml = `<li><a href="#" id="logout-btn" class="logout-link">Salir</a></li>`;
            navUl.insertAdjacentHTML('beforeend', logoutHtml);
            
            document.getElementById('logout-btn').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('user_session');
                window.location.href = "index.html";
            });
        }
    }

    // --- 2. NAVEGACIÓN DINÁMICA (Botón Blanco) ---
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

    // --- 3. LÓGICA DE FILTROS ---
    const carContainer = document.getElementById('container-autos');
    const btnToggle = document.getElementById('btn-toggle-filters');
    const panelFilters = document.getElementById('advanced-filters');
    const btnReset = document.getElementById('btn-reset');
    const searchInput = document.getElementById('busqueda');
    
    // getAllCars() debe estar definida en database.js
    const allCars = typeof getAllCars === 'function' ? getAllCars() : [];

    const normalizar = (texto) => {
        return texto ? texto.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";
    };

    function renderCars(list) {
        if(!carContainer) return;
        carContainer.innerHTML = "";

        if (list.length === 0) {
            carContainer.innerHTML = `<p class="no-results">No se encontraron vehículos que coincidan con los filtros.</p>`;
            return;
        }
        
        list.forEach(car => {
            const card = document.createElement('div');
            card.className = 'card-auto';
            card.innerHTML = `
                <div class="img-container">
                    <img src="${car.image}" alt="${car.model}">
                    <span class="badge-ia">${car.bodyType}</span>
                </div>
                <div class="info-auto">
                    <h3>${car.brand} ${car.model}</h3>
                    <p>${car.year} • ${car.km.toLocaleString()} km • ${car.fuel}</p>
                    <div class="car-footer">
                        <span class="price">u$s ${Number(car.price).toLocaleString()}</span>
                        <button class="btn-detail" onclick="navigateToDetail('${car.id}')">Detalles</button>
                    </div>
                </div>`;
            carContainer.appendChild(card);
        });
    }

    // NUEVO: Función separada para obtener los datos de los inputs
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
            
            // Validamos con isNaN por si los campos numéricos están vacíos
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

    // NUEVO: Aplicar los filtros de forma estructurada
    function aplicarFiltros() {
        const criterios = obtenerCriteriosFiltro();

        const filtered = allCars.filter(car => {
            // Normalizamos los datos del vehículo actual
            const cBrand = normalizar(car.brand);
            const cModel = normalizar(car.model);
            const cLocation = normalizar(car.location);
            const cBody = normalizar(car.bodyType);
            const cFuel = normalizar(car.fuel);
            const cTrans = normalizar(car.transmission);

            // Normalizamos los criterios de selección fijos
            const fBody = normalizar(criterios.body);
            const fFuel = normalizar(criterios.fuel);
            const fTrans = normalizar(criterios.transmission);

            // Validaciones de Texto
            const matchesSearch = cBrand.includes(criterios.search) || cModel.includes(criterios.search);
            const matchesBrand = criterios.brand === "" || cBrand.includes(criterios.brand);
            const matchesModel = criterios.model === "" || cModel.includes(criterios.model);
            const matchesLocation = criterios.location === "" || cLocation.includes(criterios.location);
            
            // Validaciones Numéricas (Ahora sí contempla Mínimos y Máximos)
            const matchesYear = car.year >= criterios.yearMin && car.year <= criterios.yearMax;
            const matchesPrice = car.price >= criterios.priceMin && car.price <= criterios.priceMax;
            const matchesKm = car.km >= criterios.kmMin && car.km <= criterios.kmMax;

            // Validaciones de Selectores (Combustible, Transmisión y Carrocería)
            const matchesBody = (criterios.body === "all") || cBody.includes(fBody) || fBody.includes(cBody);
            const matchesFuel = (criterios.fuel === "all") || cFuel.includes(fFuel) || fFuel.includes(cFuel);
            const matchesTrans = (criterios.transmission === "all") || cTrans.includes(fTrans) || fTrans.includes(cTrans);

            // El auto debe cumplir TODOS los requisitos
            return matchesSearch && matchesBrand && matchesModel && matchesLocation && 
                   matchesYear && matchesPrice && matchesKm && 
                   matchesBody && matchesFuel && matchesTrans;
        });

        renderCars(filtered);
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

    // Event listeners a todos los campos para que filtren en tiempo real
    const allInputs = document.querySelectorAll('.advanced-filters-panel input, .advanced-filters-panel select, #busqueda');
    allInputs.forEach(el => {
        el.addEventListener('input', aplicarFiltros);
        el.addEventListener('change', aplicarFiltros);
    });

    renderCars(allCars);
});

function navigateToDetail(id) {
    localStorage.setItem('car_id_view', id);
    window.location.href = "detail.html";
}