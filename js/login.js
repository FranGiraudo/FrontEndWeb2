// login.js
if (localStorage.getItem('user_session')) {
    window.location.href = "profile.html"; 
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            // 1. Evitamos que la página se recargue (comportamiento por defecto)
            e.preventDefault();

            // 2. Capturamos los datos
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            const userType = loginForm.querySelector('select').value;

            console.log("Intentando ingresar con:", email, userType);

            // 3. Simulación de validación (Cambiá esto por lo que quieras)
            if (email === "admin@admin.com" && password === "123") {
                
                // Guardamos en LocalStorage que el usuario está logueado
                const userData = {
                    email: email,
                    role: userType,
                    loggedAt: new Date().getTime()
                };
                
                localStorage.setItem('user_session', JSON.stringify(userData));

                alert("¡Bienvenido a SmartAuto!");
                
                // 4. Redirección al Home
                window.location.href = "index.html";

            } else {
                // Si le erran a los datos
                alert("Email o contraseña incorrectos. (Prueba con admin@admin.com / 123)");
            }
        });
    }
});