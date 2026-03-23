// js/login.js

// 1. Redirección si ya hay sesión iniciada
if (localStorage.getItem('user_session')) {
    window.location.href = "profile.html"; 
}

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los contenedores y enlaces
    const cardLogin = document.getElementById('card-login');
    const cardRegister = document.getElementById('card-register');
    const linkToRegister = document.getElementById('link-to-register');
    const linkToLogin = document.getElementById('link-to-login');

    // Referencias a los formularios
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    // --- LÓGICA MOSTRAR/OCULTAR CONTRASEÑA ---
    function setupPasswordToggle(inputId, toggleId) {
        const input = document.getElementById(inputId);
        const btnToggle = document.getElementById(toggleId);

        if (!input || !btnToggle) return;

        // Icono de ojo normal
        const iconEye = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        
        // Icono de ojo tachado
        const iconEyeOff = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

        btnToggle.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            
            // Cambiamos el tipo de input
            input.type = isPassword ? 'text' : 'password';
            
            // Cambiamos el icono
            btnToggle.innerHTML = isPassword ? iconEyeOff : iconEye;
        });
    }

    // Inicializamos los tres botones
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
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const password = document.getElementById('reg-pass').value;
        const confirmPassword = document.getElementById('reg-pass-confirm').value;

        // VALIDACIÓN: Confirmar Contraseña
        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden. Por favor, verificalas.");
            return;
        }

        // Leemos el valor del radio button seleccionado (slider segmentado)
        const isVendedorChecked = document.getElementById('reg_role_vendedor').checked;

        // Armamos el objeto del nuevo usuario
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

        // LLAMADA A LA "API" EN database.js
        const response = registerUserInDB(newUser);

        if (!response.success) {
            alert(response.error);
            return;
        }

        alert("¡Cuenta creada con éxito! Ahora podés iniciar sesión.");
        registerForm.reset();
        
        // Volvemos a la pantalla de login
        cardRegister.style.display = 'none';
        cardLogin.style.display = 'block';
        
        // Autocompletamos el email para mayor comodidad
        document.getElementById('login-email').value = newUser.email; 
    });

    // --- LÓGICA DE LOGIN ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // LLAMADA A LA "API" EN database.js
        const response = authenticateUserInDB(email, password);

        if (response.success) {
            // Generar la sesión activa guardando los datos necesarios
            const sessionData = {
                email: response.user.email,
                role: response.user.rol,
                nombre: response.user.nombre,
                loggedAt: new Date().getTime()
            };
            
            localStorage.setItem('user_session', JSON.stringify(sessionData));
            window.location.href = "index.html";
        } else {
            alert(response.error);
        }
    });
});