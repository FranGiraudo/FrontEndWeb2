// js/database.js

const API_BASE_URL = (window.ENV && window.ENV.API_BASE_URL) ? window.ENV.API_BASE_URL : 'http://localhost:3000/api';

const JWT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Lee y valida la sesión del localStorage.
 * Retorna null si no existe, está corrupta o el token expiró (7 días).
 */
function getSession() {
    try {
        const s = JSON.parse(localStorage.getItem('user_session'));
        if (!s || !s.token) return null;
        if (s.loggedAt && Date.now() - s.loggedAt > JWT_EXPIRY_MS) {
            localStorage.removeItem('user_session');
            return null;
        }
        return s;
    } catch (e) {
        localStorage.removeItem('user_session');
        return null;
    }
}

/**
 * Limpia la sesión y redirige al login desde cualquier página.
 */
function handleUnauthorized() {
    localStorage.removeItem('user_session');
    const inPages = window.location.pathname.includes('/pages/');
    window.location.href = inPages ? 'login.html' : 'pages/login.html';
}

/**
 * Helper para obtener cabeceras de autorización con JWT.
 */
function getAuthHeaders(contentType = 'application/json') {
    const headers = {};
    if (contentType) headers['Content-Type'] = contentType;
    const session = getSession();
    if (session && session.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
    }
    return headers;
}

/**
 * Wrapper de fetch para endpoints protegidos.
 * Redirige automáticamente al login si el servidor responde 401.
 */
async function authFetch(url, options = {}) {
    const res = await fetch(url, options);
    if (res.status === 401) {
        handleUnauthorized();
        return null;
    }
    return res;
}

/**
 * 1. OBTENER TODOS LOS VEHÍCULOS DESDE EL BACKEND
 */
async function getAllCars(filters = {}) {
    try {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        });

        const url = `${API_BASE_URL}/cars${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('Error al obtener la lista de vehículos.');
        return await res.json();
    } catch (error) {
        console.error('Error en getAllCars:', error);
        return [];
    }
}

/**
 * OBTENER UN VEHÍCULO POR SU ID DESDE EL BACKEND
 */
async function getCarById(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/cars/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Vehículo no encontrado.');
        return await res.json();
    } catch (error) {
        console.error('Error en getCarById:', error);
        return null;
    }
}

/**
 * 2. SISTEMA DE ANALYTICS CENTRALIZADO
 */
function trackMetric(id, type) {
    console.log(`[SmartAuto Analytics] Evento '${type}' para el vehículo ${id} registrado en servidor.`);
}

/**
 * ==========================================
 * 3. SISTEMA DE USUARIOS (Endpoints Reales)
 * ==========================================
 */

// REGISTRO
async function registerUserInDB(userData) {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.message || 'Error en el registro.' };
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Error en registerUserInDB:', error);
        return { success: false, error: 'No se pudo conectar con el servidor.' };
    }
}

// INICIO DE SESIÓN
async function authenticateUserInDB(email, password) {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.message || 'Email o contraseña incorrectos.' };
        return { success: true, user: data.user, access_token: data.access_token };
    } catch (error) {
        console.error('Error en authenticateUserInDB:', error);
        return { success: false, error: 'No se pudo conectar con el servidor.' };
    }
}

/**
 * ==========================================
 * 4. SISTEMA DE MENSAJERÍA (Consultas)
 * ==========================================
 */

// ENVIAR CONSULTA
async function sendInquiryToSeller(autoId, senderEmail, senderName, messageText) {
    try {
        const res = await authFetch(`${API_BASE_URL}/inquiries`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ carId: Number(autoId), text: messageText })
        });
        if (!res) return { success: false, error: 'Sesión expirada.' };
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.message || 'Error al enviar consulta.' };
        return { success: true };
    } catch (error) {
        console.error('Error en sendInquiryToSeller:', error);
        return { success: false, error: 'No se pudo conectar con el servidor.' };
    }
}

// MENSAJES RECIBIDOS (VENDEDOR)
async function getMessagesForSeller(sellerEmail) {
    try {
        const res = await authFetch(`${API_BASE_URL}/inquiries/seller`, {
            headers: getAuthHeaders()
        });
        if (!res || !res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error('Error en getMessagesForSeller:', error);
        return [];
    }
}

// CONSULTAS ENVIADAS (COMPRADOR)
async function getMessagesForBuyer(buyerEmail) {
    try {
        const res = await authFetch(`${API_BASE_URL}/inquiries/buyer`, {
            headers: getAuthHeaders()
        });
        if (!res || !res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error('Error en getMessagesForBuyer:', error);
        return [];
    }
}

// RESPONDER A CONSULTA
async function addReplyToMessage(messageId, replyText, senderName, senderRole) {
    try {
        const res = await authFetch(`${API_BASE_URL}/inquiries/${messageId}/reply`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ text: replyText })
        });
        if (!res) return { success: false, error: 'Sesión expirada.' };
        const data = await res.json();
        if (!res.ok) return { success: false, error: data.message || 'Error al responder la consulta.' };
        return { success: true };
    } catch (error) {
        console.error('Error en addReplyToMessage:', error);
        return { success: false, error: 'No se pudo conectar con el servidor.' };
    }
}

// MARCAR COMO LEÍDO
async function markMessageAsReadInDB(messageId, userRole) {
    try {
        const res = await authFetch(`${API_BASE_URL}/inquiries/${messageId}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        if (!res || !res.ok) return { success: false };
        return { success: true };
    } catch (error) {
        console.error('Error en markMessageAsReadInDB:', error);
        return { success: false };
    }
}

// ELIMINAR CONVERSACIÓN
async function removeInquiryFromDB(messageId) {
    try {
        const res = await authFetch(`${API_BASE_URL}/inquiries/${messageId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res) return { success: false, error: 'Sesión expirada.' };
        const data = await res.json();
        return { success: res.ok, message: data.message };
    } catch (error) {
        console.error('Error en removeInquiryFromDB:', error);
        return { success: false, error: 'No se pudo conectar con el servidor.' };
    }
}

/* ==========================================================================
   SISTEMA DE FAVORITOS
   ========================================================================== */

// Obtiene la lista de IDs de vehículos favoritos de un usuario
async function getUserFavorites(userIdentifier) {
    try {
        const res = await authFetch(`${API_BASE_URL}/favorites`, {
            headers: getAuthHeaders()
        });
        if (!res || !res.ok) return [];
        const favCars = await res.json();
        return favCars.map(car => car.id);
    } catch (error) {
        console.error('Error en getUserFavorites:', error);
        return [];
    }
}

// Verifica si un vehículo específico es favorito
async function isCarFavorite(userIdentifier, carId) {
    const favs = await getUserFavorites(userIdentifier);
    return favs.includes(Number(carId));
}

// Alterna el estado de favorito (POST /api/favorites/:carId)
async function toggleFavoriteStatus(userIdentifier, carId) {
    try {
        const res = await authFetch(`${API_BASE_URL}/favorites/${carId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!res || !res.ok) return false;
        const data = await res.json();
        return data.isFavorite;
    } catch (error) {
        console.error('Error en toggleFavoriteStatus:', error);
        return false;
    }
}
