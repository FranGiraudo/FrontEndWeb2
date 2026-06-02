// js/login.js

// getSession() viene de database.js (cargado antes) — valida expiración del token
if (typeof getSession === 'function' ? getSession() : localStorage.getItem('user_session')) {
    window.location.href = "profile.html";
}

// --- FUNCIÓN GLOBAL DE NOTIFICACIONES TOAST ---
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
    
    toast.innerHTML = `${type === 'success' ? iconSuccess : iconError} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500); // El cartel desaparece a los 3.5 segundos
}

document.addEventListener('DOMContentLoaded', () => {
    const cardLogin = document.getElementById('card-login');
    const cardRegister = document.getElementById('card-register');
    const linkToRegister = document.getElementById('link-to-register');
    const linkToLogin = document.getElementById('link-to-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // --- LÓGICA MOSTRAR/OCULTAR CONTRASEÑA ---
    function setupPasswordToggle(inputId, toggleId) {
        const input = document.getElementById(inputId);
        const btnToggle = document.getElementById(toggleId);

        if (!input || !btnToggle) return;

        const iconEye = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        const iconEyeOff = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

        btnToggle.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btnToggle.innerHTML = isPassword ? iconEyeOff : iconEye;
        });
    }

    setupPasswordToggle('login-password', 'toggle-login-pass');
    setupPasswordToggle('reg-pass', 'toggle-reg-pass');
    setupPasswordToggle('reg-pass-confirm', 'toggle-reg-pass-confirm');

    // --- CAMBIAR PANTALLAS ---
    linkToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        cardLogin.style.display = 'none';
        cardRegister.style.display = 'block';
    });

    linkToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        cardRegister.style.display = 'none';
        cardLogin.style.display = 'block';
    });

    // --- LÓGICA DE REGISTRO ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('reg-pass').value;
        const confirmPassword = document.getElementById('reg-pass-confirm').value;

        if (password !== confirmPassword) {
            showToast("Las contraseñas no coinciden. Verificalas.", "error");
            return;
        }

        const isVendedorChecked = document.getElementById('reg_role_vendedor').checked;

        const newUser = {
            nombre: document.getElementById('reg-nombre').value,
            apellido: document.getElementById('reg-apellido').value,
            dni: document.getElementById('reg-dni').value,
            telefono: document.getElementById('reg-tel').value,
            direccion: document.getElementById('reg-dir').value,
            email: document.getElementById('reg-email').value,
            password: password, 
            rol: isVendedorChecked ? 'vendedor' : 'comprador'
        };

        const response = await registerUserInDB(newUser);

        if (!response.success) {
            showToast(response.error, "error");
            return;
        }

        showToast("Cuenta creada con éxito. Iniciá sesión.", "success");
        registerForm.reset();
        
        cardRegister.style.display = 'none';
        cardLogin.style.display = 'block';
        document.getElementById('login-email').value = newUser.email; 
    });

    // --- LÓGICA DE LOGIN ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const response = await authenticateUserInDB(email, password);

        if (response.success) {
            const sessionData = {
                email: response.user.email,
                role: response.user.role || response.user.rol,
                nombre: response.user.nombre,
                token: response.access_token,
                loggedAt: response.user.loggedAt || new Date().getTime()
            };
            
            localStorage.setItem('user_session', JSON.stringify(sessionData));
            
            // Redirección al index
            window.location.href = "../index.html";
        } else {
            showToast(response.error, "error");
        }
    });
});