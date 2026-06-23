// js/login.js

// getSession() viene de database.js — valida expiración del JWT antes de redirigir
if (typeof getSession === 'function' ? getSession() : localStorage.getItem('user_session')) {
    window.location.href = "profile.html";
}
// showToast viene de utils.js

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
                id: response.user.id,
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