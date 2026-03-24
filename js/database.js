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
    
    if (users.some(u => u.email === userData.email)) {
        return { success: false, error: "Este email ya se encuentra registrado." };
    }

    // OFUSCACIÓN DE SEGURIDAD (Base64)
    userData.password = btoa(userData.password);

    users.push(userData);
    localStorage.setItem('smartauto_users', JSON.stringify(users));
    
    return { success: true };
}

// SIMULACIÓN ENDPOINT: POST /api/login
function authenticateUserInDB(email, password) {
    // Backdoors de prueba (estos no se cifran porque no van a la DB)
    if (email === "admin@vendor" && password === "123") return { success: true, user: { email, rol: 'vendedor', nombre: 'Test Vendor' } };
    if (email === "admin@client" && password === "123") return { success: true, user: { email, rol: 'comprador', nombre: 'Test Client' } };
    if (email === "admin@admin.com" && password === "123") return { success: true, user: { email, rol: 'vendedor', nombre: 'Admin Master' } };

    const users = _getUsersTable();
    
    // Codificamos la contraseña que ingresa el usuario para compararla con la guardada
    const encodedInputPassword = btoa(password);
    
    const validUser = users.find(u => u.email === email && u.password === encodedInputPassword);

    if (validUser) {
        return { success: true, user: validUser };
    }

    return { success: false, error: "Email o contraseña incorrectos." };
}

/**
 * ==========================================
 * 5. SISTEMA DE MENSAJERÍA (Consultas)
 * ==========================================
 */

function _getMessagesTable() {
    return JSON.parse(localStorage.getItem('smartauto_messages')) || [];
}

// SIMULACIÓN ENDPOINT: POST /api/messages
function sendInquiryToSeller(autoId, senderEmail, senderName, messageText) {
    const messages = _getMessagesTable();
    const allCars = JSON.parse(localStorage.getItem('misAutosPublicados')) || [];
    
    // Buscamos el auto para saber a qué vendedor pertenece
    const auto = allCars.find(a => a.id === Number(autoId));
    if (!auto) return { success: false, error: "El vehículo ya no está disponible." };

    // En una app real, el auto tendría el ID o email del vendedor.
    // Como estamos simulando, lo asignamos por defecto al primer vendedor o al email del creador si lo tuviéramos.
    // Para este ejercicio, asumiremos que todos los autos en 'misAutosPublicados' son del vendedor actual (o admin@vendor).
    const sellerEmail = auto.vendedorEmail || "admin@vendor"; 

    const newMessage = {
        id: Date.now(),
        autoId: Number(autoId),
        autoMarca: auto.marca,
        autoModelo: auto.modelo,
        sellerEmail: sellerEmail,
        senderEmail: senderEmail,
        senderName: senderName,
        text: messageText,
        date: new Date().toISOString(),
        read: false
    };

    messages.push(newMessage);
    localStorage.setItem('smartauto_messages', JSON.stringify(messages));
    
    return { success: true };
}

// SIMULACIÓN ENDPOINT: GET /api/messages/:email
function getMessagesForSeller(sellerEmail) {
    const messages = _getMessagesTable();
    // Filtramos los mensajes que son para este vendedor
    return messages.filter(m => m.sellerEmail === sellerEmail).sort((a, b) => b.id - a.id);
}

function getMessagesForBuyer(buyerEmail) {
    const messages = _getMessagesTable();
    // Filtramos los mensajes enviados por este comprador
    return messages.filter(m => m.senderEmail === buyerEmail).sort((a, b) => b.id - a.id);
}
// SIMULACIÓN ENDPOINT: POST /api/messages/reply
function addReplyToMessage(messageId, replyText, senderName, senderRole) {
    const messages = _getMessagesTable();
    const msgIndex = messages.findIndex(m => m.id === messageId);
    
    if (msgIndex === -1) return { success: false, error: "Conversación no encontrada." };

    if (!messages[msgIndex].replies) {
        messages[msgIndex].replies = [];
    }

    // Si alguien responde, borramos la marca de "leído" para que le vuelva a saltar la notificación a la otra persona
    delete messages[msgIndex].markedAsReadBy;

    messages[msgIndex].replies.push({
        id: Date.now(),
        text: replyText,
        senderName: senderName,
        senderRole: senderRole,
        date: new Date().toISOString()
    });

    localStorage.setItem('smartauto_messages', JSON.stringify(messages));
    return { success: true };
}

// SIMULACIÓN ENDPOINT: PUT /api/messages/read
function markMessageAsReadInDB(messageId, userRole) {
    const messages = _getMessagesTable();
    const msg = messages.find(m => m.id === messageId);
    
    if (msg) {
        msg.markedAsReadBy = userRole; // Guardamos quién fue el que lo marcó como leído
        localStorage.setItem('smartauto_messages', JSON.stringify(messages));
        return { success: true };
    }
    return { success: false, error: "No se encontró el mensaje." };
}