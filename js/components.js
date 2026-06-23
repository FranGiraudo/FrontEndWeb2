// js/components.js — Carga el header y aplica estado de sesión al nav

document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('header-placeholder');
    if (!headerContainer) return;

    const inPages = window.location.pathname.includes('/pages/');
    const headerPath = inPages ? '../components/header.html' : 'components/header.html';
    const noCachePath = headerPath + '?t=' + new Date().getTime();

    fetch(noCachePath)
        .then(res => res.text())
        .then(data => {
            headerContainer.innerHTML = data;
            setupNavLinks(inPages);
            applySessionToNav(inPages);
        })
        .catch(err => console.error('Error cargando el header:', err));
});

// Ajusta los hrefs estáticos según si estamos en /pages/ o en la raíz
function setupNavLinks(inPages) {
    const prefix = inPages ? './' : 'pages/';
    const root = inPages ? '../' : './';

    const logoLink = document.querySelector('.logo-link');
    const navHome = document.getElementById('nav-home');
    const navPublish = document.getElementById('nav-publish');
    const navProfile = document.getElementById('nav-profile');

    if (logoLink) logoLink.href = `${root}index.html`;
    if (navHome) navHome.href = `${root}index.html`;
    if (navPublish) navPublish.href = `${prefix}publish.html`;
    if (navProfile) navProfile.href = `${prefix}login.html`;

    // Highlight the current page
    function forceActive(element) {
        if (!element) return;
        element.classList.add('active-page');
        element.style.setProperty('color', 'var(--white)', 'important');
        element.style.setProperty('opacity', '1', 'important');
    }

    const currentPath = window.location.pathname;
    if (currentPath.includes('index.html') || currentPath.endsWith('/') || currentPath.includes('detail.html')) {
        forceActive(navHome);
    } else if (currentPath.includes('publish.html')) {
        forceActive(navPublish);
    } else if (currentPath.includes('profile.html') || currentPath.includes('login.html')) {
        forceActive(navProfile);
    }
}

// Aplica el estado de sesión al nav una vez que el header está en el DOM.
// Esto resuelve la race condition anterior donde main.js intentaba buscar
// #nav-profile-link (que no existe) antes de que el fetch terminara.
function applySessionToNav(inPages) {
    const session = (typeof getSession === 'function') ? getSession() : null;
    const prefix = inPages ? './' : 'pages/';

    const navProfile = document.getElementById('nav-profile');
    const navList = document.getElementById('nav-list');

    // Ocultar "Publicar" si el usuario no es vendedor
    document.querySelectorAll('#nav-list li').forEach(li => {
        const a = li.querySelector('a');
        if (a && a.getAttribute('href') && a.getAttribute('href').includes('publish.html')) {
            if (session && session.role === 'vendedor') {
                li.style.display = 'inline-flex';
                li.style.alignItems = 'center';
            } else {
                li.style.display = 'none';
            }
        }
    });

    if (session) {
        if (navProfile) {
            navProfile.href = `${prefix}profile.html`;
            navProfile.textContent = 'Mi Perfil';
        }
        // Agregar campana de notificaciones si no existe
        if (navList && !document.getElementById('notif-bell-li')) {
            const li = document.createElement('li');
            li.id = 'notif-bell-li';
            li.style.position = 'relative';
            
            const btn = document.createElement('button');
            btn.className = 'notification-bell';
            btn.id = 'btn-notifications';
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span class="badge" id="notif-badge"></span>
            `;
            
            const dropdown = document.createElement('div');
            dropdown.className = 'notifications-dropdown';
            dropdown.id = 'notifications-dropdown';
            dropdown.innerHTML = `
                <div class="notifications-header">
                    <h3>Notificaciones</h3>
                </div>
                <div id="notifications-list" style="padding: 1rem; color: var(--text-slate); text-align: center; font-size: 0.9rem;">
                    Cargando...
                </div>
            `;
            
            li.appendChild(btn);
            li.appendChild(dropdown);
            if (navList.firstChild) {
                navList.insertBefore(li, navList.firstChild);
            } else {
                navList.appendChild(li);
            }

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.toggle('show');
                if (dropdown.classList.contains('show')) {
                    if (window.renderNotificationsPanel) {
                        window.renderNotificationsPanel();
                    }
                }
            });

            document.addEventListener('click', (e) => {
                if (!li.contains(e.target)) {
                    dropdown.classList.remove('show');
                }
            });

            // Initial fetch to show the red dot if there are unread notifications
            if (window.renderNotificationsPanel) {
                // Call it silently in the background just to update the badge
                setTimeout(() => {
                    window.renderNotificationsPanel();
                }, 1000);
            }
        }

        // Agregar botón Salir si aún no existe
        if (navList && !document.getElementById('logout-btn')) {
            const li = document.createElement('li');
            li.className = 'logout-item';
            const a = document.createElement('a');
            a.href = '#';
            a.id = 'logout-btn';
            a.textContent = 'Salir';
            a.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof window.confirmarCierreSesion === 'function') window.confirmarCierreSesion();
            });
            li.appendChild(a);
            navList.appendChild(li);
        }
    } else {
        if (navProfile) {
            navProfile.href = `${prefix}login.html`;
            navProfile.textContent = 'Iniciar Sesión';
        }
    }

    // Marcar la página activa en el nav
    const url = window.location.href.toLowerCase();
    document.querySelectorAll('#nav-list a').forEach(link => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        link.classList.remove('active-page');
        link.style.cssText = 'color: var(--text-slate); opacity: 0.7; border-bottom: 2px solid transparent;';

        const esHome    = url.includes('index') || url.endsWith('/') || url.endsWith('smartauto/') || url.includes('detail');
        const esPublish = url.includes('publish');
        const esPerfil  = url.includes('profile') || url.includes('login');

        if ((esHome && href.includes('index')) ||
            (esPublish && href.includes('publish')) ||
            (esPerfil && (href.includes('profile') || href.includes('login')))) {
            link.classList.add('active-page');
            link.style.cssText = 'color: var(--white); opacity: 1; border-bottom: 2px solid var(--white); font-weight: 800;';
        }
    });
}

// ==========================================================================
// COMPONENTES DINÁMICOS: REPORTES Y CALIFICACIONES
// ==========================================================================

window.showReportModal = function(carId) {
    if (!window.requireAuth || !window.requireAuth()) return;

    let modal = document.getElementById('report-modal');
    if (!modal) {
        const modalHTML = `
            <div id="report-modal" class="report-modal-overlay">
                <div class="report-modal-content">
                    <button class="report-modal-close" onclick="window.closeReportModal()">
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <h3 class="report-modal-title">
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        Reportar Publicación
                    </h3>
                    <div class="form-group">
                        <label for="report-reason">Motivo</label>
                        <select id="report-reason">
                            <option value="">Selecciona un motivo...</option>
                            <option value="FRAUD">Sospecha de Fraude / Estafa</option>
                            <option value="FAKE_INFO">Información Falsa</option>
                            <option value="OFFENSIVE">Contenido Ofensivo</option>
                            <option value="OTHER">Otro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="report-description">Descripción detallada</label>
                        <textarea id="report-description" rows="4" placeholder="Explica por qué estás reportando esta publicación..."></textarea>
                    </div>
                    <button class="btn-submit" style="width: 100%;" onclick="window.submitReport(${carId})">Enviar Reporte</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('report-modal');
    }
    
    const reasonInput = document.getElementById('report-reason');
    const descInput = document.getElementById('report-description');
    if (reasonInput) reasonInput.value = '';
    if (descInput) descInput.value = '';

    const submitBtn = modal.querySelector('.btn-submit');
    if(submitBtn) submitBtn.onclick = () => window.submitReport(carId);

    modal.classList.add('active');
};

window.closeReportModal = function() {
    const modal = document.getElementById('report-modal');
    if (modal) modal.classList.remove('active');
};

window.submitReport = async function(carId) {
    const reason = document.getElementById('report-reason').value;
    const description = document.getElementById('report-description').value.trim();

    if (!reason) {
        if(window.showToast) window.showToast('Debes seleccionar un motivo', 'error');
        else alert('Debes seleccionar un motivo');
        return;
    }

    const session = typeof getSession === 'function' ? getSession() : null;
    if (!session || !session.token) return;

    try {
        const response = await fetch('http://localhost:3000/api/reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.token}`
            },
            body: JSON.stringify({ carId: Number(carId), reason, description })
        });

        if (!response.ok) {
            const errData = await response.json().catch(()=>({}));
            throw new Error(errData.message || 'Error al enviar reporte');
        }

        window.closeReportModal();
        if(window.showToast) window.showToast('Reporte enviado correctamente', 'success');
        
    } catch (error) {
        if(window.showToast) window.showToast(error.message, 'error');
        else alert(error.message);
    }
};

window.renderStarRating = function(containerId, vendorId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let selectedScore = 0;

    let starsHTML = '<div class="star-rating-container">';
    for (let i = 1; i <= 5; i++) {
        starsHTML += `
            <button type="button" class="star-btn" data-value="${i}" title="Calificar con ${i} estrellas">
                <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
            </button>
        `;
    }
    starsHTML += `</div>
        <div class="form-group" style="margin-top: 1rem; display: none; flex-direction: column; gap: 0.5rem; width: 100%; box-sizing: border-box;" id="rating-comment-group-${vendorId}">
            <textarea id="rating-comment-${vendorId}" rows="2" placeholder="Opcional: Deja un comentario..." style="width: 100%; background: var(--bg-shark); color: var(--white); border: 1px solid var(--border); padding: 0.8rem; border-radius: 0.5rem; resize: vertical; font-family: inherit; font-size: 0.875rem; box-sizing: border-box;"></textarea>
            <button class="btn-submit" style="width: 100%; padding: 0.8rem; font-weight: 600; border-radius: 0.5rem; box-sizing: border-box;" id="rating-submit-${vendorId}">Enviar Calificación</button>
        </div>
    `;

    container.innerHTML = starsHTML;

    const starBtns = container.querySelectorAll('.star-btn');
    const commentGroup = container.querySelector(`#rating-comment-group-${vendorId}`);
    const submitBtn = container.querySelector(`#rating-submit-${vendorId}`);
    const commentInput = container.querySelector(`#rating-comment-${vendorId}`);

    const updateStars = (val) => {
        starBtns.forEach(btn => {
            const btnVal = parseInt(btn.getAttribute('data-value'));
            if (btnVal <= val) btn.classList.add('is-filled');
            else btn.classList.remove('is-filled');
        });
    };

    starBtns.forEach(btn => {
        btn.addEventListener('mouseenter', (e) => updateStars(parseInt(e.currentTarget.getAttribute('data-value'))));
        btn.addEventListener('mouseleave', () => updateStars(selectedScore));
        btn.addEventListener('click', (e) => {
            if (!window.requireAuth || !window.requireAuth()) return;
            selectedScore = parseInt(e.currentTarget.getAttribute('data-value'));
            updateStars(selectedScore);
            commentGroup.style.display = 'flex';
        });
    });

    submitBtn.addEventListener('click', async () => {
        if (!selectedScore) return;
        const session = typeof getSession === 'function' ? getSession() : null;
        if (!session || !session.token) return;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            const response = await fetch('http://localhost:3000/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.token}`
                },
                body: JSON.stringify({
                    vendorId: Number(vendorId),
                    score: selectedScore,
                    comment: commentInput.value.trim()
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(()=>({}));
                throw new Error(errData.message || 'Error al calificar');
            }

            if(window.showToast) window.showToast('Calificación enviada', 'success');
            commentGroup.style.display = 'none';
            container.innerHTML = `<p style="color: var(--success); font-weight: 600; font-size: 0.875rem;">¡Gracias por calificar a este vendedor!</p>`;

        } catch (error) {
            if(window.showToast) window.showToast(error.message, 'error');
            else alert(error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar Calificación';
        }
    });
};

// --- LÓGICA DE NOTIFICACIONES ---

window.renderNotificationsPanel = async function() {
    const listContainer = document.getElementById('notifications-list');
    const badge = document.getElementById('notif-badge');
    if (!listContainer) return;

    try {
        const session = (typeof getSession === 'function') ? getSession() : null;
        if (!session || !session.token) return;

        listContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-slate);">Cargando notificaciones...</div>';

        const baseUrl = (window.ENV && window.ENV.API_BASE_URL) ? window.ENV.API_BASE_URL : 'http://localhost:3000/api';
        const res = await fetch(`${baseUrl}/notifications`, {
            headers: {
                'Authorization': `Bearer ${session.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error('Error fetching notifications');

        const notifications = await res.json();

        if (notifications.length === 0) {
            listContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-slate);">No tienes notificaciones.</div>';
            if (badge) badge.classList.remove('active');
            return;
        }

        const unreadCount = notifications.filter(n => !n.isRead).length;
        if (badge) {
            if (unreadCount > 0) {
                badge.classList.add('active');
            } else {
                badge.classList.remove('active');
            }
        }

        listContainer.innerHTML = '';
        notifications.forEach(notif => {
            const item = document.createElement('div');
            item.className = `notification-item ${notif.isRead ? 'read' : 'unread'}`;
            if (notif.linkUrl) {
                item.style.cursor = 'pointer';
                item.addEventListener('click', (e) => {
                    // Evitamos que al marcar como leida se redireccione sin querer
                    if (!e.target.closest('.btn-mark-read')) {
                        window.location.href = notif.linkUrl;
                    }
                });
            }
            
            let btnHtml = '';
            if (!notif.isRead) {
                btnHtml = `<button class="btn-mark-read" onclick="window.markNotificationAsRead(${notif.id}, this); event.stopPropagation();">Marcar como leída</button>`;
            }

            item.innerHTML = `
                <h4 class="notif-title">${notif.title}</h4>
                <p class="notif-msg">${notif.message}</p>
                ${btnHtml}
            `;
            listContainer.appendChild(item);
        });

    } catch (e) {
        console.error(e);
        listContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--accent-rose);">Error al cargar notificaciones.</div>';
    }
};

window.markNotificationAsRead = async function(id, btnElement) {
    try {
        const session = (typeof getSession === 'function') ? getSession() : null;
        if (!session || !session.token) return;

        const baseUrl = (window.ENV && window.ENV.API_BASE_URL) ? window.ENV.API_BASE_URL : 'http://localhost:3000/api';
        const res = await fetch(`${baseUrl}/notifications/${id}/read`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${session.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.ok) {
            // Update UI immediately
            const item = btnElement.closest('.notification-item');
            if (item) {
                item.classList.remove('unread');
                item.classList.add('read');
                btnElement.remove();
            }
            
            // Re-check badge status without reloading everything
            const listContainer = document.getElementById('notifications-list');
            const unreadItems = listContainer.querySelectorAll('.notification-item.unread');
            const badge = document.getElementById('notif-badge');
            if (badge) {
                if (unreadItems.length > 0) {
                    badge.classList.add('active');
                } else {
                    badge.classList.remove('active');
                }
            }
        }
    } catch (e) {
        console.error("Error marking notification as read:", e);
    }
}
