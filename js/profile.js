/**
 * SmartAuto - profile.js
 * Gestiona el panel de control del usuario (Vendedor o Comprador).
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. VERIFICACIÓN DE SESIÓN
    const session = JSON.parse(localStorage.getItem('user_session'));
    
    if (!session) { 
        window.location.href = "login.html"; 
        return; 
    }

    // 2. PERSONALIZACIÓN DE LA INTERFAZ
    const displayEmail = document.getElementById('display-email');
    const displayRole = document.getElementById('display-role');
    const userAvatar = document.getElementById('user-avatar');

    if (displayEmail) displayEmail.textContent = session.email;
    if (displayRole) displayRole.textContent = session.role;
    if (userAvatar) userAvatar.textContent = session.email.charAt(0).toUpperCase();

    // 3. RENDERIZADO SEGÚN EL ROL
    if (session.role === 'vendedor') {
        const vendedorView = document.getElementById('vendedor-view');
        if (vendedorView) {
            vendedorView.style.display = 'block';
            renderizarPanelVendedor();
        }
    } else {
        const compradorView = document.getElementById('comprador-view');
        if (compradorView) {
            compradorView.style.display = 'block';
            renderizarPanelComprador();
        }
    }

    // 4. LÓGICA DE CIERRE DE SESIÓN
    const btnLogout = document.getElementById('btn-logout-sidebar');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("¿Estás seguro de que quieres salir?")) {
                localStorage.removeItem('user_session');
                window.location.href = "index.html";
            }
        });
    }
});

/**
 * Renderiza la colección de autos publicados del usuario
 */
function renderizarPanelVendedor() {
    const grid = document.getElementById('my-cars-grid');
    if (!grid) return;

    // Obtenemos el array de publicaciones (Multiauto)
    const misPublicaciones = JSON.parse(localStorage.getItem('misAutosPublicados')) || [];
    const analytics = JSON.parse(localStorage.getItem('smartauto_analytics')) || {};

    if (misPublicaciones.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>Todavía no tenés vehículos publicados.</p>
                <button class="btn-detail" onclick="location.href='publish.html'" style="margin-top:1rem">Publicar ahora</button>
            </div>`;
        return;
    }

    // Limpiamos y recorremos la lista
    grid.innerHTML = "";
    misPublicaciones.forEach(auto => {
        const stats = analytics[auto.id] || { visitas: 0, contactos: 0 };
        
        const card = document.createElement('div');
        card.className = 'mini-card';
        card.style.marginBottom = "1.5rem";
        
        card.innerHTML = `
            <div class="mini-card-img">
                <img src="${auto.fotoPrincipal}" alt="${auto.modelo}">
                <span class="status-tag">ACTIVO</span>
            </div>
            <div class="mini-card-details">
                <div class="mini-card-header">
                    <h4>${auto.marca} ${auto.modelo}</h4>
                    <span class="mini-price">u$s ${Number(auto.precio).toLocaleString()}</span>
                </div>
                <p class="meta-text">${auto.anio} • ${auto.combustible} • ${auto.carroceriaIA || 'Sedán'}</p>
                
                <div class="analytics-container">
                    <div class="stat-box">
                        <span class="stat-label">Visitas</span>
                        <span class="stat-value">${stats.visitas}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Contactos</span>
                        <span class="stat-value">${stats.contactos}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">IA Score</span>
                        <span class="stat-value" style="color: #4caf50;">98%</span>
                    </div>
                </div>

                <div class="action-bar">
                    <button class="btn-action btn-edit" onclick="location.href='publish.html'">Editar</button>
                    <button class="btn-action btn-delete" onclick="eliminarPublicacion(${auto.id})">Eliminar</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

/**
 * Elimina un auto específico por su ID
 */
function eliminarPublicacion(id) {
    if (confirm("¿Estás seguro de que querés eliminar esta publicación?")) {
        let publicaciones = JSON.parse(localStorage.getItem('misAutosPublicados')) || [];
        
        // Filtramos para mantener todos menos el que queremos borrar
        publicaciones = publicaciones.filter(auto => auto.id !== id);
        localStorage.setItem('misAutosPublicados', JSON.stringify(publicaciones));
        
        // Limpiamos métricas
        let analytics = JSON.parse(localStorage.getItem('smartauto_analytics')) || {};
        delete analytics[id];
        localStorage.setItem('smartauto_analytics', JSON.stringify(analytics));

        location.reload();
    }
}

function renderizarPanelComprador() {
    const container = document.querySelector('#comprador-view .empty-state');
    if (container) {
        container.innerHTML = `<div class="log-entry"><p>No tienes actividad reciente.</p></div>`;
    }
}