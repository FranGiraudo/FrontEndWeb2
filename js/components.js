document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('header-placeholder');
    if (!headerContainer) return;

    // Detectamos si estamos en la raíz o dentro de /pages para ajustar la ruta
    const isInsidePages = window.location.pathname.includes('/pages/');
    const headerPath = isInsidePages ? '../components/header.html' : 'components/header.html';

    fetch(headerPath)
        .then(response => response.text())
        .then(data => {
            headerContainer.innerHTML = data;
            setupNavigation(isInsidePages);
        })
        .catch(err => console.error('Error cargando el header:', err));
});

function setupNavigation(isInsidePages) {
    const prefix = isInsidePages ? './' : 'pages/';
    const rootPrefix = isInsidePages ? '../' : './';

    // Ajustar enlaces dinámicamente según la ubicación actual
    const homeLink = document.querySelector('.logo-link');
    const navHome = document.getElementById('nav-home');
    const navPublish = document.getElementById('nav-publish');
    const navProfile = document.getElementById('nav-profile');

    if (homeLink) homeLink.href = `${rootPrefix}index.html`;
    if (navHome) navHome.href = `${rootPrefix}index.html`;
    if (navPublish) navPublish.href = `${prefix}publish.html`;
    if (navProfile) navProfile.href = `${prefix}login.html`;

    // Marcar página activa (Opcional, mejora el UX)
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(a => {
        if (a.getAttribute('href').includes(currentPage)) {
            a.classList.add('active-page');
        }
    });
}