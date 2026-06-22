// js/profile.js

document.addEventListener('DOMContentLoaded', async () => {
    const session = typeof window.requireAuth === 'function' ? window.requireAuth() : null;
    if (!session) return;

    // --- OBTENER PERFIL DESDE EL BACKEND ---
    let userId = null;
    let userDetails = null;

    async function getProfileInfo() {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const profile = await res.json();
                userId = profile.id;
                userDetails = profile;
                
                // Si es vendedor, mostramos su rating
                if (profile.role === 'vendedor' || profile.rol === 'vendedor') {
                    const displayRating = document.getElementById('display-rating');
                    if (displayRating) {
                        displayRating.style.display = 'flex';
                        const rating = profile.ratingAverage ?? profile.rating ?? (Math.random() * (5 - 3.5) + 3.5).toFixed(1);
                        const reviews = profile.totalReviews ?? Math.floor(Math.random() * 50) + 10;
                        const starSVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
                        displayRating.innerHTML = `${starSVG} ${rating} / 5 (${reviews} calificaciones)`;
                        displayRating.style.marginTop = '0.5rem';
                        displayRating.style.fontSize = '0.75rem';
                        displayRating.style.color = 'var(--accent-lavender)';
                        displayRating.style.alignItems = 'center';
                        displayRating.style.justifyContent = 'center';
                        displayRating.style.gap = '0.25rem';
                    }
                }
                
                return profile;
            }
        } catch (e) {
            console.error("Error al obtener perfil del servidor:", e);
        }
        return null;
    }

    // --- LÓGICA DE MENÚ COLAPSABLE (MOBILE) ---
    const btnToggleProfile = document.getElementById('btn-toggle-profile');
    const profileNav = document.getElementById('profile-nav');

    if (btnToggleProfile && profileNav) {
        btnToggleProfile.addEventListener('click', () => {
            profileNav.classList.toggle('open');
            btnToggleProfile.classList.toggle('active');
        });
    }

    // --- INTEGRACIÓN DE BOTONES DEL TOAST DE ELIMINACIÓN ---
    const btnConfirmDelete = document.getElementById('confirm-delete');
    const btnCancelDelete = document.getElementById('cancel-delete');

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', async () => {
            if (window.carIdToDelete !== null) {
                await ejecutarEliminacionReal(window.carIdToDelete);
                window.hideDeleteToast();
            } else if (window.chatIdToDelete !== null) {
                await ejecutarEliminacionChat(window.chatIdToDelete);
                window.hideDeleteToast();
            }
        });
    }

    if (btnCancelDelete) {
        btnCancelDelete.addEventListener('click', () => window.hideDeleteToast());
    }

    // Referencias al DOM (Header del perfil)
    const displayEmail = document.getElementById('display-email');
    const displayRole = document.getElementById('display-role');
    const userAvatar = document.getElementById('user-avatar');
    const displayName = document.getElementById('display-name');
    const navConsultas = document.getElementById('nav-consultas');

    const nombreUsuario = session.nombre || session.email.split('@')[0];

    if (displayName) displayName.textContent = nombreUsuario;
    if (displayEmail) displayEmail.textContent = session.email;
    if (displayRole) displayRole.textContent = session.role;
    if (userAvatar) {
        if (session.avatarUrl) {
            userAvatar.style.backgroundImage = `url(${session.avatarUrl})`;
            userAvatar.textContent = '';
        } else {
            userAvatar.textContent = nombreUsuario.charAt(0).toUpperCase();
        }
    }

    if (navConsultas) {
        navConsultas.textContent = session.role === 'vendedor' ? 'Consultas Recibidas' : 'Consultas Realizadas';
    }

    // --- NUEVA LÓGICA DE EDICIÓN DE PERFIL (MODAL) ---
    const navEditProfile = document.getElementById('nav-edit-profile');
    const modalEditProfile = document.getElementById('edit-profile-modal');
    const btnCancelProfile = document.getElementById('btn-cancel-profile');
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const btnChangeModalAvatar = document.getElementById('btn-change-modal-avatar');
    const modalInputAvatar = document.getElementById('modal-input-avatar');
    const modalAvatarPreview = document.getElementById('modal-avatar-preview');
    
    let tempAvatarFile = null;
    let tempAvatarUrl = session.avatarUrl;

    if (navEditProfile && modalEditProfile) {
        navEditProfile.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Pre-llenar datos
            const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
            if (res.ok) {
                const userData = await res.json();
                document.getElementById('modal-input-nombre').value = userData.nombre || '';
                document.getElementById('modal-input-apellido').value = userData.apellido || '';
                document.getElementById('modal-input-desc').value = userData.descripcion || '';
                
                tempAvatarUrl = userData.avatarUrl;
                if (tempAvatarUrl) {
                    modalAvatarPreview.style.backgroundImage = `url(${tempAvatarUrl})`;
                    modalAvatarPreview.textContent = '';
                } else {
                    modalAvatarPreview.textContent = (userData.nombre || session.nombre).charAt(0).toUpperCase();
                }
            }
            
            // Set initial theme switch state
            const modalThemeSelect = document.getElementById('modal-theme-select');
            if (modalThemeSelect) {
                const currentTheme = localStorage.getItem('theme') || 'default';
                modalThemeSelect.value = currentTheme;
            }
            
            modalEditProfile.style.display = 'flex';
            document.querySelectorAll('#profile-nav a').forEach(a => a.classList.remove('active'));
            navEditProfile.classList.add('active');
        });

        btnCancelProfile.addEventListener('click', () => {
            modalEditProfile.style.display = 'none';
            tempAvatarFile = null;
        });

        modalEditProfile.addEventListener('click', (e) => {
            if (e.target === modalEditProfile) {
                modalEditProfile.style.display = 'none';
                tempAvatarFile = null;
            }
        });

        btnChangeModalAvatar.addEventListener('click', () => {
            modalInputAvatar.click();
        });

        modalInputAvatar.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                tempAvatarFile = file;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    modalAvatarPreview.style.backgroundImage = `url(${ev.target.result})`;
                    modalAvatarPreview.textContent = '';
                };
                reader.readAsDataURL(file);
            }
            // Limpiar el input para que detecte si se vuelve a elegir la misma imagen u otra
            e.target.value = '';
        });

        const modalThemeSelect = document.getElementById('modal-theme-select');
        if (modalThemeSelect) {
            modalThemeSelect.addEventListener('change', (e) => {
                // Quitar todos los temas posibles
                document.documentElement.classList.remove(
                    'light-theme', 
                    'theme-violeta', 
                    'theme-azul', 
                    'theme-azul-celeste', 
                    'theme-amarillo', 
                    'theme-rojo'
                );
                
                const newTheme = e.target.value;
                if (newTheme !== 'default') {
                    document.documentElement.classList.add(newTheme);
                }
                
                localStorage.setItem('theme', newTheme);
            });
        }

        btnSaveProfile.addEventListener('click', async () => {
            const btnOriginalText = btnSaveProfile.textContent;
            btnSaveProfile.textContent = "Guardando...";
            btnSaveProfile.disabled = true;

            try {
                // Si hay nueva foto, subirla primero
                let finalAvatarUrl = tempAvatarUrl;
                if (tempAvatarFile) {
                    const formData = new FormData();
                    formData.append('avatar', tempAvatarFile);
                    const uploadRes = await fetch(`${API_BASE_URL}/auth/upload-avatar`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${session.token}` },
                        body: formData
                    });
                    if (uploadRes.ok) {
                        const data = await uploadRes.json();
                        finalAvatarUrl = data.url;
                    } else {
                        throw new Error('Falló subida de imagen');
                    }
                }

                // Guardar perfil completo
                const payload = {
                    nombre: document.getElementById('modal-input-nombre').value,
                    apellido: document.getElementById('modal-input-apellido').value,
                    descripcion: document.getElementById('modal-input-desc').value,
                    avatarUrl: finalAvatarUrl
                };

                const updateRes = await fetch(`${API_BASE_URL}/auth/me`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                });

                if (updateRes.ok) {
                    const updateData = await updateRes.json();
                    
                    // Actualizar sesión local
                    const s = JSON.parse(localStorage.getItem('user_session'));
                    s.nombre = updateData.user.nombre;
                    s.avatarUrl = updateData.user.avatarUrl;
                    localStorage.setItem('user_session', JSON.stringify(s));

                    if(typeof showToast === 'function') showToast("Perfil actualizado con éxito.", "success");
                    setTimeout(() => location.reload(), 1000);
                } else {
                    if(typeof showToast === 'function') showToast("Error al actualizar perfil.", "error");
                }
            } catch (err) {
                console.error(err);
                if(typeof showToast === 'function') showToast("Error de conexión.", "error");
            } finally {
                btnSaveProfile.textContent = btnOriginalText;
                btnSaveProfile.disabled = false;
            }
        });
    }

    // Mostrar el panel correspondiente antes de hacer fetch (evita el flash de contenido vacío)
    if (session.role === 'vendedor') {
        const vendedorView = document.getElementById('vendedor-view');
        if (vendedorView) vendedorView.style.display = 'block';
    } else {
        const compradorView = document.getElementById('comprador-view');
        if (compradorView) compradorView.style.display = 'block';
    }

    // Lanzar perfil y panel en paralelo — son independientes entre sí
    await Promise.all([
        getProfileInfo(),
        session.role === 'vendedor'
            ? renderizarPanelVendedor(null)
            : renderizarPanelComprador(session.email)
    ]);

    // --- SISTEMA DE PESTAÑAS (TABS) ---
    const navPanel = document.getElementById('nav-panel-general');
    const viewVendedor = document.getElementById('vendedor-view');
    const viewComprador = document.getElementById('comprador-view');
    const viewMensajes = document.getElementById('mensajes-view');

    async function switchTab(tabName) {
        if (navPanel) navPanel.classList.remove('active');
        if (navConsultas) navConsultas.classList.remove('active');
        
        if (viewVendedor) viewVendedor.style.display = 'none';
        if (viewComprador) viewComprador.style.display = 'none';
        if (viewMensajes) viewMensajes.style.display = 'none';

        if (tabName === 'panel') {
            if (navPanel) navPanel.classList.add('active');
            if (session.role === 'vendedor' && viewVendedor) {
                viewVendedor.style.display = 'block';
                await renderizarPanelVendedor(userId);
            }
            if (session.role === 'comprador' && viewComprador) {
                viewComprador.style.display = 'block';
                await renderizarPanelComprador(session.email);
            }
        } 
        else if (tabName === 'mensajes') {
            if (navConsultas) navConsultas.classList.add('active');
            if (viewMensajes) viewMensajes.style.display = 'block';
            
            if (session.role === 'vendedor') {
                document.getElementById('titulo-mensajes').textContent = "Consultas Recibidas";
                document.getElementById('subtitulo-mensajes').textContent = "Mensajes de compradores interesados en tus vehículos.";
                await renderizarBandejaMensajes(session.email, 'vendedor');
            } else {
                document.getElementById('titulo-mensajes').textContent = "Consultas Realizadas";
                document.getElementById('subtitulo-mensajes').textContent = "Seguimiento de los vehículos que te interesaron.";
                await renderizarBandejaMensajes(session.email, 'comprador');
            }
        }
        
        // Al cambiar de pestaña en móvil, cerramos el menú
        if (window.innerWidth <= 768 && profileNav && profileNav.classList.contains('open')) {
            profileNav.classList.remove('open');
            if (btnToggleProfile) btnToggleProfile.classList.remove('active');
        }
    }

    if (navPanel) navPanel.addEventListener('click', (e) => { e.preventDefault(); switchTab('panel'); });
    if (navConsultas) navConsultas.addEventListener('click', (e) => { e.preventDefault(); switchTab('mensajes'); });

    /// --- LOGOUT ---
    const btnLogout = document.getElementById('btn-logout-sidebar');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.confirmarCierreSesion === 'function') {
                window.confirmarCierreSesion();
            } else {
                localStorage.removeItem('user_session');
                window.location.href = "index.html";
            }
        });
    }
});

window.cambiarEstadoAuto = async function(carId, nuevoEstado) {
    try {
        const res = await authFetch(`${API_BASE_URL}/cars/${carId}/status`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: nuevoEstado })
        });
        if (res && res.ok) {
            if(typeof showToast === 'function') showToast("Estado actualizado correctamente.", "success");
            // Find car and update local state to reflect UI change without reload if needed, 
            // but for now simple reload is fine or just re-render grid
            const sessionData = getSession();
            if (sessionData && sessionData.role === 'vendedor') {
                renderizarPanelVendedor(sessionData.email);
            }
        } else {
            if(typeof showToast === 'function') showToast("Error al actualizar el estado.", "error");
        }
    } catch(err) {
        console.error(err);
        if(typeof showToast === 'function') showToast("Error de conexión.", "error");
    }
};

window.cambiarEstadoInquiry = async function(inquiryId, nuevoEstado) {
    try {
        const res = await authFetch(`${API_BASE_URL}/inquiries/${inquiryId}/status`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: nuevoEstado })
        });
        if (res && res.ok) {
            if(typeof showToast === 'function') showToast("Estado del lead actualizado.", "success");
        } else {
            if(typeof showToast === 'function') showToast("Error al actualizar estado.", "error");
        }
    } catch(err) {
        console.error(err);
        if(typeof showToast === 'function') showToast("Error de conexión.", "error");
    }
};


/* ==========================================================================
   SISTEMA DE ELIMINACIÓN CON TOAST
   ========================================================================== */
window.carIdToDelete = null;
window.chatIdToDelete = null;

window.showDeleteToast = function(id, type = 'car') {
    const toast = document.getElementById('delete-toast');
    const message = toast.querySelector('.toast-message');
    
    if (type === 'car') {
        window.carIdToDelete = id;
        window.chatIdToDelete = null;
        message.textContent = "¿Estás seguro de que querés eliminar esta publicación?";
    } else {
        window.chatIdToDelete = id;
        window.carIdToDelete = null;
        message.textContent = "¿Estás seguro de que querés eliminar esta conversación?";
    }
    
    if (toast) {
        toast.style.display = 'block';
        toast.classList.add('show');
    }
}

window.hideDeleteToast = function() {
    const toast = document.getElementById('delete-toast');
    if (toast) {
        toast.style.display = 'none';
        toast.classList.remove('show');
    }
    window.carIdToDelete = null;
    window.chatIdToDelete = null;
}

window.eliminarPublicacion = function(id) {
    window.showDeleteToast(id, 'car');
}

window.confirmarEliminarChat = function(id) {
    window.showDeleteToast(id, 'chat');
}

async function ejecutarEliminacionReal(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/cars/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        
        if (res.ok) {
            if(typeof showToast === 'function') showToast("Publicación eliminada correctamente.", "success");
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            if(typeof showToast === 'function') showToast(data.message || "Error al eliminar.", "error");
        }
    } catch (e) {
        console.error(e);
        if(typeof showToast === 'function') showToast("Error de conexión al servidor.", "error");
    }
}

async function ejecutarEliminacionChat(id) {
    if (typeof removeInquiryFromDB === 'function') {
        const response = await removeInquiryFromDB(Number(id));
        if (response.success) {
            const session = JSON.parse(localStorage.getItem('user_session'));
            await renderizarBandejaMensajes(session.email, session.role);
            if(typeof showToast === 'function') showToast("Conversación eliminada.", "success");
        } else {
            if(typeof showToast === 'function') showToast(response.error || "Error al eliminar conversación.", "error");
        }
    }
}

/* ==========================================================================
   PANEL DEL COMPRADOR (FAVORITOS)
   ========================================================================== */
async function renderizarPanelComprador(userEmail) {
    const viewComprador = document.getElementById('comprador-view');
    if (!viewComprador) return;

    viewComprador.innerHTML = `
        <h2 style="color: var(--white); font-size: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 2rem;">
            Mis Vehículos Guardados
        </h2>
        <div id="profile-favorites-grid" class="grid-autos">Cargando favoritos...</div>
    `;

    let favCars = [];
    try {
        const res = await fetch(`${API_BASE_URL}/favorites`, {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            favCars = await res.json();
        }
    } catch (e) {
        console.error("Error al obtener vehículos favoritos:", e);
    }

    const favGrid = document.getElementById('profile-favorites-grid');
    favGrid.innerHTML = "";

    if (favCars.length === 0) {
        favGrid.innerHTML = `<p class="no-results" style="grid-column: 1/-1;">Aún no tenés vehículos guardados. ¡Explorá el marketplace!</p>`;
        return;
    }

    favCars.forEach(car => {
        const card = document.createElement('div');
        card.className = 'card-auto';
        const btnRemove = `
            <button class="btn-favorite active" data-fav-id="${car.id}" title="Quitar de favoritos" style="position: absolute; top: 1rem; left: 1rem; z-index: 10;">
                <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
        `;

        card.innerHTML = `
            <div class="img-container">
                ${btnRemove}
                <img src="${car.image}" alt="${car.model}">
                <span class="badge-ia">${car.bodyType}</span>
            </div>
            <div class="info-auto">
                <h3>${car.brand} ${car.model}</h3>
                <p>${car.year} • ${window.formatPrice ? window.formatPrice(car.km) : car.km.toLocaleString()} km</p>
                <div class="car-footer">
                    <span class="price">u$s ${window.formatPrice ? window.formatPrice(car.price) : Number(car.price).toLocaleString()}</span>
                    <div style="display: flex; gap: 10px; width: 100%;">
                        <button class="btn-detail" onclick="window.verDetalleVehiculo('${car.id}')" style="width: 100%;">Ver Detalles</button>
                    </div>
                </div>
            </div>`;
        favGrid.appendChild(card);
    });

    favGrid.querySelectorAll('.btn-favorite').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const btnElem = e.currentTarget;
            const idStr = btnElem.getAttribute('data-fav-id');
            const id = isNaN(idStr) ? idStr : Number(idStr);
            
            btnElem.disabled = true;
            await toggleFavoriteStatus(userEmail, id);
            btnElem.disabled = false;

            if(typeof showToast === 'function') showToast("Vehículo eliminado de la lista.", "success");
            await renderizarPanelComprador(userEmail);
        });
    });
}

/* ==========================================================================
   PANEL DEL VENDEDOR
   ========================================================================== */
let inventarioVendedor = [];

async function renderizarPanelVendedor(userId) {
    const grid = document.getElementById('my-cars-grid');
    if (!grid) return;
    grid.innerHTML = "<p style='color: var(--text-slate);'>Cargando tus publicaciones...</p>";

    try {
        const res = await fetch(`${API_BASE_URL}/cars/me`, {
            headers: getAuthHeaders(),
            cache: 'no-store'
        });
        if (res.ok) {
            inventarioVendedor = await res.json();
        }
    } catch (e) {
        console.error("Error al obtener publicaciones de vendedor:", e);
    }

    const dashboardLayout = document.getElementById('dashboard-layout');
    const top5List = document.getElementById('top5-list');

    if (inventarioVendedor.length === 0) {
        if (dashboardLayout) dashboardLayout.style.display = 'none';
        grid.innerHTML = `<div class="empty-state" style="text-align: center; padding: 3rem; background: rgba(255,255,255,0.03); border-radius: 1rem; border: 1px dashed rgba(255,255,255,0.1);"><p style="margin-bottom: 1rem; color: rgba(255,255,255,0.4);">Todavia no tenes vehiculos publicados.</p><button class="btn-publish-cta" onclick="location.href='publish.html'">Publicar mi primer auto</button></div>`;
        return;
    }

    if (dashboardLayout) dashboardLayout.style.display = 'grid';

    if (inventarioVendedor.length === 0) {
        const kpiGridEl = document.getElementById('kpi-grid');
        if (kpiGridEl) kpiGridEl.innerHTML = '';
        const top5El = document.getElementById('top5-list');
        if (top5El) top5El.innerHTML = '';
        grid.innerHTML = `<div style="text-align:center; padding:3rem; background:rgba(255,255,255,0.03); border-radius:1rem; border:1px dashed rgba(255,255,255,0.1);"><p style="margin-bottom:1rem; color:rgba(255,255,255,0.4);">Todavia no tenes vehiculos publicados.</p><button class="btn-publish-cta" onclick="location.href='publish.html'">Publicar mi primer auto</button></div>`;
        return;
    }

    const kpiGrid = document.getElementById('kpi-grid');
    if (kpiGrid) {
        const totalVisitas   = inventarioVendedor.reduce((s, c) => s + (c.views    || 0), 0);
        const totalConsultas = inventarioVendedor.reduce((s, c) => s + (c.contacts || 0), 0);
        const totalActivos   = inventarioVendedor.filter(c => c.status === 'Disponible' || !c.status).length;
        const precioPromedio = inventarioVendedor.length
            ? Math.round(inventarioVendedor.reduce((s, c) => s + Number(c.price), 0) / inventarioVendedor.length)
            : 0;

        kpiGrid.innerHTML = `
            <div class="kpi-card">
                <div class="kpi-icon violet">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <div class="kpi-body">
                    <div class="kpi-label">Visitas Totales</div>
                    <div class="kpi-value">${totalVisitas.toLocaleString()}</div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div class="kpi-body">
                    <div class="kpi-label">Consultas Recibidas</div>
                    <div class="kpi-value">${totalConsultas.toLocaleString()}</div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>
                <div class="kpi-body">
                    <div class="kpi-label">Publicaciones Activas</div>
                    <div class="kpi-value">${totalActivos}</div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon amber">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div class="kpi-body">
                    <div class="kpi-label">Precio Promedio</div>
                    <div class="kpi-value">u$s ${precioPromedio.toLocaleString()}</div>
                </div>
            </div>
        `;
    }

    // --- Lógica del Gráfico de Vistas ---
    const viewsChartPanel = document.getElementById('views-chart-panel');
    const viewsChart = document.getElementById('views-chart');
    if (viewsChartPanel && viewsChart && inventarioVendedor.length > 0) {
        viewsChartPanel.style.display = 'block';
        viewsChart.innerHTML = '';
        
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        
        // Generar mapa de los últimos 7 días
        const chartDataMap = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            chartDataMap[dateStr] = {
                label: days[d.getDay()],
                value: 0
            };
        }

        // Poblar con las vistas reales de la DB
        inventarioVendedor.forEach(car => {
            if (car.viewLogs && Array.isArray(car.viewLogs)) {
                car.viewLogs.forEach(log => {
                    const logDate = log.date.split('T')[0];
                    if (chartDataMap[logDate] !== undefined) {
                        chartDataMap[logDate].value += log.views;
                    }
                });
            }
        });

        const chartData = Object.values(chartDataMap);
        const maxDaily = Math.max(...chartData.map(d => d.value), 10);
        
        chartData.forEach(data => {
            const heightPercent = Math.max((data.value / maxDaily) * 100, 2); // mínimo 2%
            const barContainer = document.createElement('div');
            barContainer.className = 'chart-bar-container';
            barContainer.innerHTML = `
                <div class="chart-bar" style="height: 0%;" data-value="${data.value}"></div>
                <div class="chart-label">${data.label}</div>
            `;
            viewsChart.appendChild(barContainer);
            
            // Animar la barra luego de un pequeñísimo delay
            setTimeout(() => {
                const bar = barContainer.querySelector('.chart-bar');
                if(bar) bar.style.height = heightPercent + '%';
            }, 100);
        });
    }


    if (top5List) {
        const sortedByViews = [...inventarioVendedor]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5);
        top5List.innerHTML = '';
        const rankColors = ['first', 'second', 'third'];
        sortedByViews.forEach((car, i) => {
            const li = document.createElement('li');
            li.className = 'top5-item';
            li.innerHTML = `
                <div class="top5-rank ${rankColors[i] || ''}">#${i + 1}</div>
                <img class="top5-thumb" src="${car.image}" alt="${car.model}">
                <div class="top5-info">
                    <div class="top5-name">${car.brand} ${car.model}</div>
                    <div class="top5-meta">${car.views || 0} vistas &bull; ${car.contacts || 0} consultas</div>
                </div>
            `;
            top5List.appendChild(li);
        });
    }

    const inputSearch = document.getElementById('inventory-search');
    const selectSort = document.getElementById('inventory-sort');

    if (inputSearch && !inputSearch.dataset.listener) {
        inputSearch.dataset.listener = "true";
        inputSearch.addEventListener('input', () => renderizarGrillaInventario());
    }
    if (selectSort && !selectSort.dataset.listener) {
        selectSort.dataset.listener = "true";
        selectSort.addEventListener('change', () => renderizarGrillaInventario());
    }

    renderizarGrillaInventario();
}

function renderizarGrillaInventario() {
    const grid = document.getElementById('my-cars-grid');
    if (!grid) return;

    const query = (document.getElementById('inventory-search')?.value || '').toLowerCase();
    const sortVal = document.getElementById('inventory-sort')?.value || 'newest';

    let filtrados = inventarioVendedor.filter(car => 
        car.brand.toLowerCase().includes(query) || car.model.toLowerCase().includes(query) || (car.year && car.year.toString().includes(query))
    );

    if (sortVal === 'newest') filtrados.sort((a, b) => b.id - a.id);
    if (sortVal === 'most_viewed') filtrados.sort((a, b) => (b.views || 0) - (a.views || 0));
    if (sortVal === 'highest_price') filtrados.sort((a, b) => Number(b.price) - Number(a.price));
    if (sortVal === 'lowest_price') filtrados.sort((a, b) => Number(a.price) - Number(b.price));

    grid.innerHTML = "";
    if (filtrados.length === 0) {
        grid.innerHTML = "<p style='color: var(--text-slate); grid-column: 1/-1;'>No se encontraron vehículos con esa búsqueda.</p>";
        return;
    }

    filtrados.forEach(auto => {
        const card = document.createElement('div');
        card.className = 'mini-card';
        card.style.marginBottom = "1.5rem";
        card.innerHTML = `
            <div class="mini-card-img">
                <img src="${auto.image}" alt="${auto.model}">
            </div>
            <div class="mini-card-details">
                <div class="mini-card-header"><h4>${auto.brand} ${auto.model}</h4><span class="mini-price">u$s ${window.formatPrice ? window.formatPrice(auto.price) : Number(auto.price).toLocaleString()}</span></div>
                <p class="meta-text">${auto.year} • ${auto.fuel} • ${auto.bodyType || 'Sedán'}</p>
                <div class="analytics-container">
                    <div class="stat-box"><span class="stat-label">Vistas</span><span class="stat-value">${auto.views || 0}</span></div>
                    <div class="stat-box"><span class="stat-label">Consultas</span><span class="stat-value">${auto.contacts || 0}</span></div>
                    <div class="stat-box"><span class="stat-label">IA Score</span><span class="stat-value" style="color: #4caf50;">${auto.aiScore ? auto.aiScore + '%' : '-'}</span></div>
                </div>
                <div class="action-bar" style="display: flex; gap: 8px; align-items: center; justify-content: space-between;">
                    <button class="btn-action btn-edit" style="flex: 1;" onclick="sessionStorage.setItem('editModeId', ${auto.id}); location.href='publish.html';">Editar</button>
                    <button class="btn-action btn-delete" style="flex: 1;" onclick="window.eliminarPublicacion(${auto.id})">Eliminar</button>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

// --- SISTEMA DE MENSAJERÍA ---
window.filtroMensajesActual = 'all';

async function renderizarBandejaMensajes(userEmail, userRole) {
    const gridMensajes = document.getElementById('grid-mensajes');
    if (!gridMensajes) return;
    gridMensajes.style.gridTemplateColumns = "1fr";
    gridMensajes.innerHTML = "<p style='color: var(--text-slate); padding: 1.5rem;'>Cargando conversaciones...</p>";

    let messages = [];
    if (userRole === 'vendedor') {
        if (typeof getMessagesForSeller === 'function') {
            messages = await getMessagesForSeller(userEmail);
        }
    } else {
        if (typeof getMessagesForBuyer === 'function') {
            messages = await getMessagesForBuyer(userEmail);
        }
    }

    const estaSinResponder = (msg) => {
        if (msg.markedAsReadBy === userRole) return false;
        if (!msg.replies || msg.replies.length === 0) return userRole === 'vendedor'; 
        const lastReply = msg.replies[msg.replies.length - 1];
        return lastReply.senderRole !== userRole;
    };

    const cantidadSinResponder = messages.filter(estaSinResponder).length;
    let mensajesFiltrados = (window.filtroMensajesActual === 'unanswered') ? messages.filter(estaSinResponder) : messages;

    const isAllActive    = window.filtroMensajesActual !== 'unanswered';
    const isPendActive   = window.filtroMensajesActual === 'unanswered';
    const dotColor       = cantidadSinResponder > 0 ? '#f87171' : '#34d399';

    let htmlContent = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; background:rgba(255,255,255,0.03); padding:0.9rem 1.25rem; border-radius:0.85rem; border:1px solid rgba(255,255,255,0.07); flex-wrap:wrap; gap:0.75rem;">
            <span style="color:#fff; font-weight:600; font-size:0.88rem; display:flex; align-items:center; gap:0.5rem;">
                <span style="width:0.5rem; height:0.5rem; border-radius:50%; background:${dotColor}; display:inline-block; flex-shrink:0;"></span>
                ${cantidadSinResponder} consulta(s) esperando respuesta
            </span>
            <div class="msg-filter-tabs">
                <button class="msg-filter-tab ${isAllActive ? 'active' : ''}" onclick="window.cambiarFiltroMensajes('all', '${userEmail}', '${userRole}')">Todas</button>
                <button class="msg-filter-tab ${isPendActive ? 'active' : ''}" onclick="window.cambiarFiltroMensajes('unanswered', '${userEmail}', '${userRole}')">Pendientes${cantidadSinResponder > 0 ? ` <span style="background:rgba(248,113,113,0.25);color:#f87171;border-radius:1rem;padding:0 0.4rem;font-size:0.7rem;margin-left:0.25rem;">${cantidadSinResponder}</span>` : ''}</button>
            </div>
        </div>`;


    if (mensajesFiltrados.length === 0) {
        htmlContent += `<div style="background: var(--bg-shark); padding: 3rem; border-radius: 12px; border: 1px dashed var(--border); text-align: center;"><p style="color: var(--text-slate); font-size: 1rem;">No hay mensajes para mostrar en esta vista.</p></div>`;
        gridMensajes.innerHTML = htmlContent;
        return;
    }

    let mensajesHtml = mensajesFiltrados.map(msg => {
        const fechaOriginal = new Date(msg.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
        const tituloInterlocutor = userRole === 'vendedor' ? `Comprador: ${msg.senderName}` : `Vendedor`;
        const isUnanswered = estaSinResponder(msg);
        const replies = msg.replies || [];

        let chatHistoryHTML = `<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px; padding: 10px 0;"><div style="align-self: ${userRole === 'comprador' ? 'flex-end' : 'flex-start'}; background: ${userRole === 'comprador' ? 'linear-gradient(135deg, var(--accent-lavender), var(--accent-hover-dark))' : 'var(--bg-elevated)'}; color: ${userRole === 'comprador' ? 'var(--white)' : 'var(--white)'}; padding: 12px 16px; border-radius: ${userRole === 'comprador' ? '18px 18px 0px 18px' : '18px 18px 18px 0px'}; max-width: 85%; font-size: 0.95rem; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><strong style="font-size: 0.75rem; display: block; margin-bottom: 6px; opacity: 0.7; text-transform: uppercase;">${msg.senderName}</strong>${msg.text}</div>`;
        replies.forEach(r => {
            const isMe = r.senderRole === userRole;
            chatHistoryHTML += `<div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; background: ${isMe ? 'linear-gradient(135deg, var(--accent-lavender), var(--accent-hover-dark))' : 'var(--bg-elevated)'}; color: ${isMe ? 'var(--white)' : 'var(--white)'}; padding: 12px 16px; border-radius: ${isMe ? '18px 18px 0px 18px' : '18px 18px 18px 0px'}; max-width: 85%; font-size: 0.95rem; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><strong style="font-size: 0.75rem; display: block; margin-bottom: 6px; opacity: 0.7; text-transform: uppercase;">${r.senderName}</strong>${r.text}</div>`;
        });
        chatHistoryHTML += `</div>`;

        return `
            <div class="mini-card" style="display: flex; flex-direction: column; background: var(--bg-shark); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
                <div onclick="window.toggleChat(${msg.id})" style="cursor: pointer; padding: 1.2rem; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2);">
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1rem; color: var(--accent-lavender); font-weight: 700;">${msg.autoMarca.toUpperCase()} ${msg.autoModelo.toUpperCase()}</span>
                            ${isUnanswered ? `<span style="background: #ff5252; color: white; font-size: 0.65rem; padding: 3px 8px; border-radius: 12px; font-weight: bold;">NUEVO</span>` : ''}
                        </div>
                        <span style="font-size: 0.85rem; color: var(--text-slate);">${tituloInterlocutor} • ${fechaOriginal}</span>
                    </div>
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <button onclick="event.stopPropagation(); window.confirmarEliminarChat(${msg.id})" style="background: transparent; border: none; color: var(--error); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 5px;" title="Eliminar conversación">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                        <div id="chevron-${msg.id}" style="color: var(--text-slate); font-size: 1.2rem; transition: transform 0.3s ease;">▼</div>
                    </div>
                </div>
                <div id="chat-wrapper-${msg.id}" style="display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                    <div style="overflow: hidden;">
                        <div id="chat-body-${msg.id}" style="display: flex; flex-direction: column; padding: 0 1.2rem 1.2rem 1.2rem; border-top: 1px solid rgba(255,255,255,0.05);">
                            <div class="chat-box" style="flex-grow: 1; max-height: 350px; overflow-y: auto; background: #0f1115; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 5px; margin-top: 1rem; border: 1px solid rgba(255,255,255,0.05);">${chatHistoryHTML}</div>
                            <div style="display: flex; gap: 10px; margin-top: 15px; align-items: center; flex-wrap: wrap;">
                                <input type="text" id="reply-input-${msg.id}" autocomplete="off" onkeypress="if(event.key === 'Enter') enviarRespuesta(${msg.id}, '${userRole}')" placeholder="Escribir respuesta..." style="flex-grow: 1; min-width: 200px; padding: 12px; border-radius: 6px; border: 1px solid var(--border); background: #1a1a1a; color: white; font-family: inherit; outline: none;">
                                ${userRole === 'vendedor' ? `
                                <select onchange="window.cambiarEstadoInquiry(${msg.id}, this.value)" style="padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-elevated); color: var(--text-main); font-size: 0.85rem; cursor: pointer;">
                                    <option value="Nuevo" ${msg.status === 'Nuevo' ? 'selected' : ''}>Nuevo Lead</option>
                                    <option value="EnContacto" ${msg.status === 'EnContacto' ? 'selected' : ''}>En Contacto</option>
                                    <option value="Negociacion" ${msg.status === 'Negociacion' ? 'selected' : ''}>En Negociación</option>
                                    <option value="Cerrado" ${msg.status === 'Cerrado' ? 'selected' : ''}>Cerrado</option>
                                    <option value="Perdido" ${msg.status === 'Perdido' ? 'selected' : ''}>Perdido</option>
                                </select>` : ''}
                                ${isUnanswered ? `<button class="btn-action" onclick="window.marcarComoLeido(${msg.id}, '${userRole}')" style="background: transparent; color: var(--text-slate); border: 1px solid var(--border); border-radius: 6px; padding: 0 15px; height: 40px; cursor: pointer; font-size: 0.8rem; transition: background 0.3s;">Marcar leído</button>` : ''}
                                <button class="btn-action" onclick="enviarRespuesta(${msg.id}, '${userRole}')" style="background: var(--accent-lavender); color: var(--bg-shark); font-weight: bold; border: none; border-radius: 6px; padding: 0 20px; height: 40px; cursor: pointer;">Enviar</button>
                            </div>
                            <div style="margin-top: 15px; text-align: center;"><a href="#" onclick="window.verDetalleVehiculo('${msg.autoId}')" style="color: var(--text-slate); font-size: 0.8rem; text-decoration: underline;">Ver publicación original</a></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    gridMensajes.innerHTML = htmlContent + mensajesHtml;
}

window.cambiarFiltroMensajes = async (f, e, r) => { 
    window.filtroMensajesActual = f; 
    await renderizarBandejaMensajes(e, r); 
};

window.toggleChat = function(msgId) {
    const wrapper = document.getElementById(`chat-wrapper-${msgId}`);
    const chevron = document.getElementById(`chevron-${msgId}`);
    if (wrapper.style.gridTemplateRows === '0fr' || wrapper.style.gridTemplateRows === '') {
        wrapper.style.gridTemplateRows = '1fr';
        if(chevron) chevron.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            const chatBox = document.querySelector(`#chat-body-${msgId} .chat-box`);
            if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        }, 310);
    } else {
        wrapper.style.gridTemplateRows = '0fr';
        if(chevron) chevron.style.transform = 'rotate(0deg)';
    }
};

window.mantenerChatAbierto = function(msgId) {
    const wrapper = document.getElementById(`chat-wrapper-${msgId}`);
    const chevron = document.getElementById(`chevron-${msgId}`);
    if (wrapper) {
        wrapper.style.transition = 'none'; 
        wrapper.style.gridTemplateRows = '1fr';
        if(chevron) chevron.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            wrapper.style.transition = 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            const chatBox = document.querySelector(`#chat-body-${msgId} .chat-box`);
            if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        }, 50);
    }
};

window.marcarComoLeido = async function(msgId, userRole) {
    if (typeof markMessageAsReadInDB === 'function') {
        const response = await markMessageAsReadInDB(msgId, userRole);
        if (response.success) {
            const session = JSON.parse(localStorage.getItem('user_session'));
            await renderizarBandejaMensajes(session.email, userRole);
            setTimeout(() => window.mantenerChatAbierto(msgId), 50);
        } else {
            if(typeof showToast === 'function') showToast(response.error, "error");
        }
    }
};

window.enviarRespuesta = async function(msgId, userRole) {
    const input = document.getElementById(`reply-input-${msgId}`);
    const text = input.value.trim();
    if (!text) {
        if(typeof showToast === 'function') showToast("Escribí un mensaje antes de enviar.", "error");
        return;
    }
    const session = JSON.parse(localStorage.getItem('user_session'));
    const senderName = session.nombre || session.email;
    if (typeof addReplyToMessage === 'function') {
        const response = await addReplyToMessage(msgId, text, senderName, userRole);
        if (response.success) {
            await renderizarBandejaMensajes(session.email, userRole);
            setTimeout(() => window.mantenerChatAbierto(msgId), 50);
        } else {
            if(typeof showToast === 'function') showToast(response.error || "Error al responder.", "error");
        }
    }
};

window.verDetalleVehiculo = function(id) {
    localStorage.setItem('car_id_view', id);
    window.location.href = "detail.html";
};