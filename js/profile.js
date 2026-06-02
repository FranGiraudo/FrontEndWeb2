// js/profile.js

document.addEventListener('DOMContentLoaded', async () => {
    const session = JSON.parse(localStorage.getItem('user_session'));
    
    if (!session) { 
        window.location.href = "login.html"; 
        return; 
    }

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
                return profile;
            }
        } catch (e) {
            console.error("Error al obtener perfil del servidor:", e);
        }
        return null;
    }

    await getProfileInfo();

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
    if (userAvatar) userAvatar.textContent = nombreUsuario.charAt(0).toUpperCase();

    if (navConsultas) {
        navConsultas.textContent = session.role === 'vendedor' ? 'Consultas Recibidas' : 'Consultas Realizadas';
    }

    // Inicialización de la vista según el rol
    if (session.role === 'vendedor') {
        const vendedorView = document.getElementById('vendedor-view');
        if (vendedorView) {
            vendedorView.style.display = 'block';
            await renderizarPanelVendedor(userId);
        }
    } else {
        const compradorView = document.getElementById('comprador-view');
        if (compradorView) {
            compradorView.style.display = 'block';
            await renderizarPanelComprador(session.email);
        }
    }

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
    
    if (toast) toast.classList.add('show');
}

window.hideDeleteToast = function() {
    const toast = document.getElementById('delete-toast');
    if (toast) toast.classList.remove('show');
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
                <p>${car.year} • ${car.km.toLocaleString()} km</p>
                <div class="car-footer">
                    <span class="price">u$s ${Number(car.price).toLocaleString()}</span>
                    <div style="display: flex; gap: 10px; width: 100%;">
                        <button class="btn-detail" onclick="window.verDetalleVehiculo('${car.id}')" style="width: 100%;">Ver Detalles</button>
                    </div>
                </div>
            </div>`;
        favGrid.appendChild(card);
    });

    favGrid.querySelectorAll('.btn-favorite').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idStr = e.currentTarget.getAttribute('data-fav-id');
            const id = isNaN(idStr) ? idStr : Number(idStr);
            
            e.currentTarget.disabled = true;
            await toggleFavoriteStatus(userEmail, id);
            e.currentTarget.disabled = false;

            if(typeof showToast === 'function') showToast("Vehículo eliminado de la lista.", "success");
            await renderizarPanelComprador(userEmail);
        });
    });
}

/* ==========================================================================
   PANEL DEL VENDEDOR
   ========================================================================== */
async function renderizarPanelVendedor(userId) {
    const grid = document.getElementById('my-cars-grid');
    if (!grid) return;
    grid.innerHTML = "<p style='color: var(--text-slate);'>Cargando tus publicaciones...</p>";

    let misPublicaciones = [];
    try {
        const res = await fetch(`${API_BASE_URL}/cars/me`, {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            misPublicaciones = await res.json();
        }
    } catch (e) {
        console.error("Error al obtener publicaciones de vendedor:", e);
    }

    if (misPublicaciones.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="text-align: center; padding: 3rem; background: var(--bg-shark); border-radius: 12px; border: 1px dashed var(--border);"><p style="margin-bottom: 1rem; color: var(--text-slate);">Todavía no tenés vehículos publicados.</p><button class="btn-detail" onclick="location.href='publish.html'">Publicar mi primer auto</button></div>`;
        return;
    }

    grid.innerHTML = "";
    misPublicaciones.forEach(auto => {
        const card = document.createElement('div');
        card.className = 'mini-card';
        card.style.marginBottom = "1.5rem";
        card.innerHTML = `
            <div class="mini-card-img">
                <img src="${auto.image}" alt="${auto.model}">
                <span class="status-tag">ACTIVO</span>
            </div>
            <div class="mini-card-details">
                <div class="mini-card-header"><h4>${auto.brand} ${auto.model}</h4><span class="mini-price">u$s ${Number(auto.price).toLocaleString()}</span></div>
                <p class="meta-text">${auto.year} • ${auto.fuel} • ${auto.bodyType || 'Sedán'}</p>
                <div class="analytics-container">
                    <div class="stat-box"><span class="stat-label">Visitas</span><span class="stat-value">${auto.views}</span></div>
                    <div class="stat-box"><span class="stat-label">Contactos</span><span class="stat-value">${auto.contacts}</span></div>
                    <div class="stat-box"><span class="stat-label">IA Score</span><span class="stat-value" style="color: #4caf50;">98%</span></div>
                </div>
                <div class="action-bar">
                    <button class="btn-action btn-edit" onclick="location.href='publish.html?edit=${auto.id}'">Editar</button>
                    <button class="btn-action btn-delete" onclick="window.eliminarPublicacion(${auto.id})">Eliminar</button>
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

    let htmlContent = `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: var(--bg-shark); padding: 1rem 1.5rem; border-radius: 8px; border: 1px solid var(--border); flex-wrap: wrap; gap: 1rem;"><span style="color: white; font-weight: 600;"><span style="color: ${cantidadSinResponder > 0 ? '#ff5252' : '#4caf50'}; font-size: 1.2rem; margin-right: 5px;">•</span>${cantidadSinResponder} consulta(s) esperando respuesta</span><div class="filter-segmented-control"><input type radio name="msg_filter" id="filter-all" value="all" ${window.filtroMensajesActual === 'all' ? 'checked' : ''} onchange="window.cambiarFiltroMensajes('all', '${userEmail}', '${userRole}')"><label for="filter-all">Todas</label><input type="radio" name="msg_filter" id="filter-unanswered" value="unanswered" ${window.filtroMensajesActual === 'unanswered' ? 'checked' : ''} onchange="window.cambiarFiltroMensajes('unanswered', '${userEmail}', '${userRole}')"><label for="filter-unanswered">Pendientes</label><div class="slider"></div></div></div>`;

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

        let chatHistoryHTML = `<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;"><div style="align-self: ${userRole === 'comprador' ? 'flex-end' : 'flex-start'}; background: ${userRole === 'comprador' ? 'var(--accent-lavender)' : 'rgba(255,255,255,0.05)'}; color: ${userRole === 'comprador' ? 'var(--bg-shark)' : 'white'}; padding: 10px 14px; border-radius: 12px; max-width: 85%; font-size: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><strong style="font-size: 0.75rem; display: block; margin-bottom: 4px; opacity: 0.8;">${msg.senderName}</strong>${msg.text}</div>`;
        replies.forEach(r => {
            const isMe = r.senderRole === userRole;
            chatHistoryHTML += `<div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; background: ${isMe ? 'var(--accent-lavender)' : 'rgba(255,255,255,0.05)'}; color: ${isMe ? 'var(--bg-shark)' : 'white'}; padding: 10px 14px; border-radius: 12px; max-width: 85%; font-size: 0.9rem; border: 1px solid rgba(255,255,255,0.1);"><strong style="font-size: 0.75rem; display: block; margin-bottom: 4px; opacity: 0.8;">${r.senderName}</strong>${r.text}</div>`;
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
                            <div style="display: flex; gap: 10px; margin-top: 15px;">
                                <input type="text" id="reply-input-${msg.id}" autocomplete="off" onkeypress="if(event.key === 'Enter') enviarRespuesta(${msg.id}, '${userRole}')" placeholder="Escribir respuesta..." style="flex-grow: 1; padding: 12px; border-radius: 6px; border: 1px solid var(--border); background: #1a1a1a; color: white; font-family: inherit; outline: none;">
                                ${isUnanswered ? `<button class="btn-action" onclick="window.marcarComoLeido(${msg.id}, '${userRole}')" style="background: transparent; color: var(--text-slate); border: 1px solid var(--border); border-radius: 6px; padding: 0 15px; cursor: pointer; font-size: 0.8rem; transition: background 0.3s;">Marcar como leído</button>` : ''}
                                <button class="btn-action" onclick="enviarRespuesta(${msg.id}, '${userRole}')" style="background: var(--accent-lavender); color: var(--bg-shark); font-weight: bold; border: none; border-radius: 6px; padding: 0 20px; cursor: pointer;">Enviar</button>
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