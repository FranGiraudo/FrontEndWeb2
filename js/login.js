// login.js
if (localStorage.getItem('user_session')) {
    window.location.href = "profile.html"; 
}

document.addEventListener('DOMContentLoaded', () => {
    const cardLogin = document.getElementById('card-login');
    const cardRegister = document.getElementById('card-register');
    const linkToRegister = document.getElementById('link-to-register');
    const linkToLogin = document.getElementById('link-to-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

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
            alert(" Las contraseñas no coinciden. Por favor, verificalas.");
            return;
        }

        // Leemos el valor del radio button seleccionado
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

        let users = JSON.parse(localStorage.getItem('smartauto_users')) || [];

        const emailExiste = users.some(u => u.email === newUser.email);
        if (emailExiste) {
            alert("⚠️ Este email ya se encuentra registrado.");
            return;
        }

        users.push(newUser);
        localStorage.setItem('smartauto_users', JSON.stringify(users));

        alert("✅ ¡Cuenta creada con éxito! Ahora podés iniciar sesión.");
        registerForm.reset();
        
        cardRegister.style.display = 'none';
        cardLogin.style.display = 'block';
        document.getElementById('login-email').value = newUser.email; 
    });

    // --- LÓGICA DE LOGIN ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // Traemos todos los usuarios registrados
        const users = JSON.parse(localStorage.getItem('smartauto_users')) || [];
        
        // Buscamos al usuario en la base de datos
        const validUser = users.find(u => u.email === email && u.password === password);

        // Atajos (Backdoors) para pruebas rápidas
        const isTestVendor = email === "admin@vendor" && password === "123";
        const isTestClient = email === "admin@client" && password === "123";

        // Verificamos si es un usuario de prueba o un usuario válido registrado
        if (isTestVendor || isTestClient || validUser) {
            
            // Determinamos el rol correcto
            let determinedRole = 'comprador'; // Valor por defecto
            if (validUser) {
                determinedRole = validUser.rol; // El rol que eligió al registrarse
            } else if (isTestVendor) {
                determinedRole = 'vendedor'; // El atajo de vendedor
            } 
            // Si es isTestClient, ya queda como 'comprador' por el valor por defecto

            // Armamos la sesión
            const userData = {
                email: email,
                role: determinedRole, 
                nombre: validUser ? validUser.nombre : "Usuario de Prueba",
                loggedAt: new Date().getTime()
            };
            
            localStorage.setItem('user_session', JSON.stringify(userData));
            window.location.href = "index.html";

        } else {
            alert(" Email o contraseña incorrectos.");
        }
    });
});