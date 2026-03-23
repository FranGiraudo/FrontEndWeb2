// js/database.js

/**
 * 1. ARRAY DE VEHÍCULOS ESTÁTICOS
 */
const initialCars = [
    { 
        id: 1, 
        brand: "Volkswagen", 
        model: "Golf GTI", 
        year: 2022, 
        price: 35000, 
        km: 15000, 
        bodyType: "Hatchback", 
        location: "Córdoba", 
        transmission: "Automática", 
        fuel: "Nafta", 
        image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200",
        images: ["https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200"],
        description: "Impecable estado, todos los services oficiales. Cubiertas nuevas." 
    },
    { 
        id: 2, 
        brand: "Toyota", 
        model: "SW4", 
        year: 2023, 
        price: 55000, 
        km: 5000, 
        bodyType: "SUV", 
        location: "Buenos Aires", 
        transmission: "Automática", 
        fuel: "Diesel", 
        image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200",
        images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200"],
        description: "Versión SRX de 7 asientos. Auxilio sin rodar." 
    },
    { 
        id: 3, 
        brand: "Peugeot", 
        model: "208", 
        year: 2021, 
        price: 18000, 
        km: 30000, 
        bodyType: "Hatchback", 
        location: "Rosario", 
        transmission: "Manual", 
        fuel: "Nafta", 
        image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200",
        images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200"],
        description: "Techo panorámico, pantalla con Apple CarPlay." 
    },
    { 
        id: 4, 
        brand: "Toyota", 
        model: "Hilux", 
        year: 2024, 
        price: 62000, 
        km: 0, 
        bodyType: "Pickup", 
        location: "Córdoba", 
        transmission: "Manual", 
        fuel: "Diesel", 
        image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200",
        images: ["https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200"],
        description: "Unidad 0km lista para patentar." 
    }
];

/**
 * 2. FUNCIÓN PARA OBTENER TODOS LOS AUTOS
 */
function getAllCars() {
    const list = [...initialCars];
    const misPublicaciones = JSON.parse(localStorage.getItem('misAutosPublicados')) || [];
    
    const publicacionesFormateadas = misPublicaciones.map(pub => ({
        id: pub.id,
        brand: pub.marca,
        model: pub.modelo,
        year: Number(pub.anio),
        price: Number(pub.precio),
        km: Number(pub.kilometraje),
        image: pub.fotoPrincipal || (pub.fotos ? pub.fotos[0] : ""),
        images: pub.fotos || [],
        fuel: pub.combustible,
        transmission: pub.transmision,
        location: pub.ubicacion,
        // CORRECCIÓN: Usamos carroceriaIA que es como lo guarda publish.js
        bodyType: pub.carroceriaIA || "Sedán", 
        description: pub.descripcion
    }));

    return list.concat(publicacionesFormateadas);
}

/**
 * 3. SISTEMA DE ANALYTICS CENTRALIZADO
 */
function trackMetric(id, type) {
    let stats = JSON.parse(localStorage.getItem('smartauto_analytics')) || {};
    
    if (!stats[id]) {
        stats[id] = { visitas: 0, contactos: 0 };
    }
    
    stats[id][type] += 1;
    
    localStorage.setItem('smartauto_analytics', JSON.stringify(stats));
    console.log(`[SmartAuto Analytics] ID ${id}: +1 ${type}`);
}
/**
 * ==========================================
 * 4. SISTEMA DE USUARIOS (Simulación de API Backend)
 * ==========================================
 */

// Función privada para obtener la "tabla" de usuarios
function _getUsersTable() {
    return JSON.parse(localStorage.getItem('smartauto_users')) || [];
}

// SIMULACIÓN ENDPOINT: POST /api/register
function registerUserInDB(userData) {
    const users = _getUsersTable();
    
    // Validar si el email ya existe
    if (users.some(u => u.email === userData.email)) {
        return { success: false, error: "Este email ya se encuentra registrado." };
    }

    // Insertar en la "base de datos"
    users.push(userData);
    localStorage.setItem('smartauto_users', JSON.stringify(users));
    
    return { success: true };
}

// SIMULACIÓN ENDPOINT: POST /api/login
function authenticateUserInDB(email, password) {
    // 1. Verificar atajos/backdoors de prueba
    if (email === "admin@vendor" && password === "123") return { success: true, user: { email, rol: 'vendedor', nombre: 'Test Vendor' } };
    if (email === "admin@client" && password === "123") return { success: true, user: { email, rol: 'comprador', nombre: 'Test Client' } };
    if (email === "admin@admin.com" && password === "123") return { success: true, user: { email, rol: 'vendedor', nombre: 'Admin Master' } };

    // 2. Buscar en la base de datos local
    const users = _getUsersTable();
    const validUser = users.find(u => u.email === email && u.password === password);

    if (validUser) {
        return { success: true, user: validUser };
    }

    return { success: false, error: "Email o contraseña incorrectos." };
}