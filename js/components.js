// js/components.js — Carga el header y aplica estado de sesión al nav

document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('header-placeholder');
    if (!headerContainer) return;

    const inPages = window.location.pathname.includes('/pages/');
    const headerPath = inPages ? '../components/header.html' : 'components/header.html';

    fetch(headerPath)
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

        const esHome    = url.includes('index.html') || url.endsWith('/') || url.endsWith('smartauto/');
        const esPublish = url.includes('publish.html');
        const esPerfil  = url.includes('profile.html') || url.includes('login.html');

        if ((esHome && href.includes('index')) ||
            (esPublish && href.includes('publish')) ||
            (esPerfil && (href.includes('profile') || href.includes('login')))) {
            link.classList.add('active-page');
            link.style.cssText = 'color: var(--white); opacity: 1; border-bottom: 2px solid var(--white); font-weight: 800;';
        }
    });
}
