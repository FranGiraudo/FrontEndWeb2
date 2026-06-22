// js/utils.js — Funciones de utilidad y formato para SmartAuto

// --- APLICACIÓN INICIAL DE TEMA ---
(function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && savedTheme !== 'default' && savedTheme !== 'dark') {
        document.documentElement.classList.add(savedTheme);
    }
})();

window.AppIcons = {
    anio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    km: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    carroceria: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H7.3a2 2 0 0 0-1.6.8L3 11l-1.16.86a1 1 0 0 0-.84.99V16h3m14 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0-4 0m-10 0a2 2 0 1 1-4 0m4 0a2 2 0 1 0-4 0"></path></svg>`,
    ubicacion: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`
};

window.escapeHTML = function(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
};

// --- FORMATEO ---

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
    toast.innerHTML = `${type === 'success' ? iconSuccess : iconError} <span>${window.escapeHTML(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

window.confirmarCierreSesion = function () {
    let modal = document.getElementById('custom-logout-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'custom-logout-modal';
        modal.className = 'lightbox-overlay';
        modal.style.zIndex = '100000';
        modal.innerHTML = `
            <div style="background-color: var(--bg-shark); width: 90%; max-width: 25rem; border-radius: 1rem; border: 1px solid var(--border); box-shadow: 0 1.5rem 3rem rgba(0,0,0,0.6); padding: 2rem; text-align: center; display: flex; flex-direction: column; gap: 1rem; animation: fadeIn 0.3s ease;">
                <div style="background: rgba(255,77,77,0.1); width: 4rem; height: 4rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                    <svg viewBox="0 0 24 24" style="width: 2rem; height: 2rem; stroke: #ff4d4d; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </div>
                <h3 style="color: var(--white); font-size: 1.5rem; margin: 0;">¿Cerrar sesión?</h3>
                <p style="color: var(--text-slate); margin: 0 0 1rem 0; font-size: 0.95rem;">Estás a punto de salir de tu cuenta de SmartAuto.</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button id="btn-cancel-logout" style="flex: 1; padding: 0.8rem; border-radius: 0.6rem; font-weight: 600; border: 1px solid var(--border); background: transparent; color: var(--text-slate); cursor: pointer; transition: all 0.2s;">Cancelar</button>
                    <button id="btn-confirm-logout" style="flex: 1; padding: 0.8rem; border-radius: 0.6rem; font-weight: 600; background: #ff4d4d; color: white; border: none; cursor: pointer; transition: all 0.2s;">Sí, salir</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        document.getElementById('btn-cancel-logout').addEventListener('click', () => modal.style.display = 'none');
        document.getElementById('btn-confirm-logout').addEventListener('click', () => {
            localStorage.removeItem('user_session');
            const inPages = window.location.pathname.includes('/pages/');
            window.location.href = inPages ? '../index.html' : 'index.html';
        });
    }
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
};

function navigateToDetail(id) {
    localStorage.setItem('car_id_view', id);
    const inPages = window.location.pathname.includes('/pages/');
    window.location.href = inPages ? 'detail.html' : 'pages/detail.html';
}
