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
            carContainer.innerHTML = `<p class="no-results">No se encontraron vehículos.</p>`;
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

    function aplicarFiltros() {
        const searchText = normalizar(searchInput?.value || "");
        const fBrand = normalizar(document.getElementById('filter-brand')?.value || "");
        const fModel = normalizar(document.getElementById('filter-model')?.value || "");
        const fLocation = normalizar(document.getElementById('filter-location')?.value || "");
        
        const yMin = parseInt(document.getElementById('filter-year-min')?.value) || 0;
        const yMax = parseInt(document.getElementById('filter-year-max')?.value) || 2027;
        const pMax = parseFloat(document.getElementById('filter-price-max')?.value) || Infinity;
        const body = document.getElementById('filter-body')?.value || "all";

        const filtered = allCars.filter(car => {
            const matchesSearch = normalizar(car.brand).includes(searchText) || normalizar(car.model).includes(searchText);
            const matchesFBrand = fBrand === "" || normalizar(car.brand).includes(fBrand);
            const matchesFModel = fModel === "" || normalizar(car.model).includes(fModel);
            const matchesLocation = fLocation === "" || normalizar(car.location).includes(fLocation);
            
            const matchesYear = car.year >= yMin && car.year <= yMax;
            const matchesPrice = car.price <= pMax;
            
            const carBody = normalizar(car.bodyType);
            const fBody = normalizar(body);
            const matchesBody = (body === "all") || (carBody === fBody) || carBody.includes(fBody) || fBody.includes(carBody);

            return matchesSearch && matchesFBrand && matchesFModel && matchesLocation && matchesYear && matchesPrice && matchesBody;
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