// js/profile.js

document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(localStorage.getItem('user_session'));
    
    if (!session) { 
        window.location.href = "login.html"; 
        return; 
    }

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

    const navPanel = document.getElementById('nav-panel-general');
    const viewVendedor = document.getElementById('vendedor-view');
    const viewComprador = document.getElementById('comprador-view');
    const viewMensajes = document.getElementById('mensajes-view');

    function switchTab(tabName) {
        if (navPanel) navPanel.classList.remove('active');
        if (navConsultas) navConsultas.classList.remove('active');
        
        if (viewVendedor) viewVendedor.style.display = 'none';
        if (viewComprador) viewComprador.style.display = 'none';
        if (viewMensajes) viewMensajes.style.display = 'none';

        if (tabName === 'panel') {
            if (navPanel) navPanel.classList.add('active');
            if (session.role === 'vendedor' && viewVendedor) viewVendedor.style.display = 'block';
            if (session.role === 'comprador' && viewComprador) viewComprador.style.display = 'block';
        } 
        else if (tabName === 'mensajes') {
            if (navConsultas) navConsultas.classList.add('active');
            if (viewMensajes) viewMensajes.style.display = 'block';
            
            if (session.role === 'vendedor') {
                document.getElementById('titulo-mensajes').textContent = "Consultas Recibidas";
                document.getElementById('subtitulo-mensajes').textContent = "Mensajes de compradores interesados en tus vehículos.";
                renderizarBandejaMensajes(session.email, 'vendedor');
            } else {
                document.getElementById('titulo-mensajes').textContent = "Consultas Realizadas";
                document.getElementById('subtitulo-mensajes').textContent = "Seguimiento de los vehículos que te interesaron.";
                renderizarBandejaMensajes(session.email, 'comprador');
            }
        }
    }

    if (navPanel) navPanel.addEventListener('click', (e) => { e.preventDefault(); switchTab('panel'); });
    if (navConsultas) navConsultas.addEventListener('click', (e) => { e.preventDefault(); switchTab('mensajes'); });

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

function renderizarPanelVendedor() {
    const grid = document.getElementById('my-cars-grid');
    if (!grid) return;

    const misPublicaciones = JSON.parse(localStorage.getItem('misAutosPublicados')) || [];
    const analytics = JSON.parse(localStorage.getItem('smartauto_analytics')) || {};

    if (misPublicaciones.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 3rem; background: var(--bg-shark); border-radius: 12px; border: 1px dashed var(--border);">
                <p style="margin-bottom: 1rem; color: var(--text-slate);">Todavía no tenés vehículos publicados.</p>
                <button class="btn-detail" onclick="location.href='publish.html'">Publicar mi primer auto</button>
            </div>`;
        return;
    }

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
                    <button class="btn-action btn-edit" onclick="location.href='publish.html?edit=${auto.id}'">Editar</button>
                    <button class="btn-action btn-delete" onclick="eliminarPublicacion(${auto.id})">Eliminar</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function eliminarPublicacion(id) {
    if (confirm("¿Estás seguro de que querés eliminar esta publicación? Esta acción no se puede deshacer.")) {
        let publicaciones = JSON.parse(localStorage.getItem('misAutosPublicados')) || [];
        publicaciones = publicaciones.filter(auto => auto.id !== id);
        localStorage.setItem('misAutosPublicados', JSON.stringify(publicaciones));
        
        let analytics = JSON.parse(localStorage.getItem('smartauto_analytics')) || {};
        delete analytics[id];
        localStorage.setItem('smartauto_analytics', JSON.stringify(analytics));

        location.reload();
    }
}

function renderizarPanelComprador() {
    const container = document.querySelector('#comprador-view .empty-state');
    if (container) {
        container.style.display = "grid";
        container.style.gridTemplateColumns = "repeat(auto-fill, minmax(250px, 1fr))";
        container.style.gap = "1.5rem";
        container.style.marginTop = "1.5rem";

        container.innerHTML = `
            <div style="background: var(--bg-shark); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border);">
                <span style="font-size: 0.8rem; color: var(--accent-lavender); font-weight: 700;">VISTO RECIENTEMENTE</span>
                <h4 style="color: white; margin: 0.5rem 0;">Volkswagen Golf GTI</h4>
                <p style="font-size: 0.9rem; color: var(--text-slate); margin-bottom: 1rem;">u$s 35,000</p>
                <button class="btn-detail" onclick="location.href='index.html'" style="width: 100%;">Ver publicación</button>
            </div>
        `;
    }
}

// --- SISTEMA DE MENSAJERÍA ---

window.filtroMensajesActual = 'all';

function renderizarBandejaMensajes(userEmail, userRole) {
    const gridMensajes = document.getElementById('grid-mensajes');
    if (!gridMensajes) return;

    gridMensajes.style.gridTemplateColumns = "1fr";

    let messages = [];
    if (userRole === 'vendedor') {
        messages = typeof getMessagesForSeller === 'function' ? getMessagesForSeller(userEmail) : [];
    } else {
        messages = typeof getMessagesForBuyer === 'function' ? getMessagesForBuyer(userEmail) : [];
    }

    const estaSinResponder = (msg) => {
        if (msg.markedAsReadBy === userRole) return false;
        
        if (!msg.replies || msg.replies.length === 0) {
            return userRole === 'vendedor'; 
        }
        const lastReply = msg.replies[msg.replies.length - 1];
        return lastReply.senderRole !== userRole;
    };

    const cantidadSinResponder = messages.filter(estaSinResponder).length;

    let mensajesFiltrados = messages;
    if (window.filtroMensajesActual === 'unanswered') {
        mensajesFiltrados = messages.filter(estaSinResponder);
    }

    // NUEVO DISEÑO DEL FILTRO: Animado y con inputs ocultos
    let htmlContent = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: var(--bg-shark); padding: 1rem 1.5rem; border-radius: 8px; border: 1px solid var(--border); flex-wrap: wrap; gap: 1rem;">
            <span style="color: white; font-weight: 600;">
                <span style="color: ${cantidadSinResponder > 0 ? '#ff5252' : '#4caf50'}; font-size: 1.2rem; margin-right: 5px;">•</span>
                ${cantidadSinResponder} consulta(s) esperando tu respuesta
            </span>
            
            <div class="filter-segmented-control">
                <input type="radio" name="msg_filter" id="filter-all" value="all" ${window.filtroMensajesActual === 'all' ? 'checked' : ''} onchange="window.cambiarFiltroMensajes('all', '${userEmail}', '${userRole}')">
                <label for="filter-all">Todas</label>

                <input type="radio" name="msg_filter" id="filter-unanswered" value="unanswered" ${window.filtroMensajesActual === 'unanswered' ? 'checked' : ''} onchange="window.cambiarFiltroMensajes('unanswered', '${userEmail}', '${userRole}')">
                <label for="filter-unanswered">Pendientes</label>

                <div class="slider"></div>
            </div>
        </div>
    `;

    if (mensajesFiltrados.length === 0) {
        htmlContent += `
            <div style="background: var(--bg-shark); padding: 3rem; border-radius: 12px; border: 1px dashed var(--border); text-align: center;">
                <p style="color: var(--text-slate); font-size: 1rem;">No hay mensajes para mostrar en esta vista.</p>
            </div>
        `;
        gridMensajes.innerHTML = htmlContent;
        return;
    }

    let mensajesHtml = mensajesFiltrados.map(msg => {
        const fechaOriginal = new Date(msg.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
        const tituloInterlocutor = userRole === 'vendedor' ? `Comprador: ${msg.senderName}` : `Vendedor`;
        const isUnanswered = estaSinResponder(msg);

        const replies = msg.replies || [];
        let chatHistoryHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
                <div style="align-self: ${userRole === 'comprador' ? 'flex-end' : 'flex-start'}; background: ${userRole === 'comprador' ? 'var(--accent-lavender)' : 'rgba(255,255,255,0.05)'}; color: ${userRole === 'comprador' ? 'var(--bg-shark)' : 'white'}; padding: 10px 14px; border-radius: 12px; max-width: 85%; font-size: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">
                    <strong style="font-size: 0.75rem; display: block; margin-bottom: 4px; opacity: 0.8;">${msg.senderName}</strong>
                    ${msg.text}
                </div>
        `;

        replies.forEach(r => {
            const isMe = r.senderRole === userRole;
            chatHistoryHTML += `
                <div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; background: ${isMe ? 'var(--accent-lavender)' : 'rgba(255,255,255,0.05)'}; color: ${isMe ? 'var(--bg-shark)' : 'white'}; padding: 10px 14px; border-radius: 12px; max-width: 85%; font-size: 0.9rem; border: 1px solid rgba(255,255,255,0.1);">
                    <strong style="font-size: 0.75rem; display: block; margin-bottom: 4px; opacity: 0.8;">${r.senderName}</strong>
                    ${r.text}
                </div>
            `;
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
                    <div id="chevron-${msg.id}" style="color: var(--text-slate); font-size: 1.2rem; transition: transform 0.3s ease;">
                        ▼
                    </div>
                </div>
                
                <div id="chat-wrapper-${msg.id}" style="display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                    <div style="overflow: hidden;">
                        <div id="chat-body-${msg.id}" style="display: flex; flex-direction: column; padding: 0 1.2rem 1.2rem 1.2rem; border-top: 1px solid rgba(255,255,255,0.05);">
                            <div class="chat-box" style="flex-grow: 1; max-height: 350px; overflow-y: auto; background: #0f1115; border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 5px; margin-top: 1rem; border: 1px solid rgba(255,255,255,0.05);">
                                ${chatHistoryHTML}
                            </div>
                            
                            <div style="display: flex; gap: 10px; margin-top: 15px;">
                                <input type="text" id="reply-input-${msg.id}" onkeypress="if(event.key === 'Enter') enviarRespuesta(${msg.id}, '${userRole}')" placeholder="Escribir respuesta..." style="flex-grow: 1; padding: 12px; border-radius: 6px; border: 1px solid var(--border); background: #1a1a1a; color: white; font-family: inherit; outline: none;">
                                
                                ${isUnanswered ? `<button class="btn-action" onclick="window.marcarComoLeido(${msg.id}, '${userRole}')" style="background: transparent; color: var(--text-slate); border: 1px solid var(--border); border-radius: 6px; padding: 0 15px; cursor: pointer; font-size: 0.8rem; transition: background 0.3s;">Marcar como leído</button>` : ''}
                                
                                <button class="btn-action" onclick="enviarRespuesta(${msg.id}, '${userRole}')" style="background: var(--accent-lavender); color: var(--bg-shark); font-weight: bold; border: none; border-radius: 6px; padding: 0 20px; cursor: pointer;">Enviar</button>
                            </div>
                            
                            ${userRole === 'comprador' ? `<div style="margin-top: 15px; text-align: center;"><a href="#" onclick="verDetalleVehiculo(${msg.autoId})" style="color: var(--text-slate); font-size: 0.8rem; text-decoration: underline;">Ver publicación original</a></div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    gridMensajes.innerHTML = htmlContent + mensajesHtml;
}

// --- CONTROLES DE INTERFAZ DEL CHAT ---

window.cambiarFiltroMensajes = function(filterValue, userEmail, userRole) {
    window.filtroMensajesActual = filterValue;
    renderizarBandejaMensajes(userEmail, userRole);
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

window.marcarComoLeido = function(msgId, userRole) {
    if (typeof markMessageAsReadInDB === 'function') {
        const response = markMessageAsReadInDB(msgId, userRole);
        if (response.success) {
            const session = JSON.parse(localStorage.getItem('user_session'));
            renderizarBandejaMensajes(session.email, userRole);
            
            setTimeout(() => window.mantenerChatAbierto(msgId), 50);
        } else {
            alert(response.error);
        }
    } else {
        alert("Error: Faltó actualizar database.js con la función de lectura.");
    }
};

window.enviarRespuesta = function(msgId, userRole) {
    const input = document.getElementById(`reply-input-${msgId}`);
    const text = input.value.trim();
    
    if (!text) {
        alert("Por favor, escribí un mensaje antes de enviar.");
        return;
    }

    const session = JSON.parse(localStorage.getItem('user_session'));
    const senderName = session.nombre || session.email.split('@')[0];

    if (typeof addReplyToMessage === 'function') {
        const response = addReplyToMessage(msgId, text, senderName, userRole);
        
        if (response.success) {
            renderizarBandejaMensajes(session.email, userRole);
            setTimeout(() => window.mantenerChatAbierto(msgId), 50);
        } else {
            alert("Error de guardado: " + response.error);
        }
    } else {
        alert("ERROR: La función 'addReplyToMessage' no existe en database.js");
    }
};

window.verDetalleVehiculo = function(id) {
    localStorage.setItem('car_id_view', id);
    window.location.href = "detail.html";
};