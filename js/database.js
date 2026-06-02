// js/database.js

// Leer la URL desde el archivo env.js si existe, de lo contrario usar el default local
const API_BASE_URL = (window.ENV && window.ENV.API_BASE_URL) ? window.ENV.API_BASE_URL : 'http://localhost:3000/api';


/**
 * Helper para obtener cabeceras de autorización con JWT.
 */
function getAuthHeaders(contentType = 'application/json') {
    const headers = {};
    if (contentType) {
        headers['Content-Type'] = contentType;
    }
    const sessionStr = localStorage.getItem('user_session');
    if (sessionStr) {
        try {
            const session = JSON.parse(sessionStr);
            if (session && session.token) {
                headers['Authorization'] = `Bearer ${session.token}`;
            }
        } catch (e) {
            console.error('Error al decodificar la sesión de usuario.', e);
        }
    }
    return headers;
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
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error('Error al obtener la lista de vehículos.');
        }
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
        const res = await fetch(`${API_BASE_URL}/cars/${id}`);
        if (!res.ok) {
            throw new Error('Vehículo no encontrado.');
        }
        return await res.json();
    } catch (error) {
        console.error('Error en getCarById:', error);
        return null;
    }
}

/**
 * 2. SISTEMA DE ANALYTICS CENTRALIZADO
 * Las visitas y contactos son registrados de forma automática por el backend.
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        const data = await res.json();
        
        if (!res.ok) {
            return { success: false, error: data.message || 'Error en el registro.' };
        }
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
            return { success: false, error: data.message || 'Email o contraseña incorrectos.' };
        }
        return { 
            success: true, 
            user: data.user, 
            access_token: data.access_token 
        };
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
        const res = await fetch(`${API_BASE_URL}/inquiries`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                carId: Number(autoId),
                text: messageText
            })
        });
        const data = await res.json();

        if (!res.ok) {
            return { success: false, error: data.message || 'Error al enviar consulta.' };
        }
        return { success: true };
    } catch (error) {
        console.error('Error en sendInquiryToSeller:', error);
        return { success: false, error: 'No se pudo conectar con el servidor.' };
    }
}

// MENSAJES RECIBIDOS (VENDEDOR)
async function getMessagesForSeller(sellerEmail) {
    try {
        const res = await fetch(`${API_BASE_URL}/inquiries/seller`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error('Error en getMessagesForSeller:', error);
        return [];
    }
}

// CONSULTAS ENVIADAS (COMPRADOR)
async function getMessagesForBuyer(buyerEmail) {
    try {
        const res = await fetch(`${API_BASE_URL}/inquiries/buyer`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error('Error en getMessagesForBuyer:', error);
        return [];
    }
}

// RESPONDER A CONSULTA
async function addReplyToMessage(messageId, replyText, senderName, senderRole) {
    try {
        const res = await fetch(`${API_BASE_URL}/inquiries/${messageId}/reply`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                text: replyText
            })
        });
        const data = await res.json();

        if (!res.ok) {
            return { success: false, error: data.message || 'Error al responder la consulta.' };
        }
        return { success: true };
    } catch (error) {
        console.error('Error en addReplyToMessage:', error);
        return { success: false, error: 'No se pudo conectar con el servidor.' };
    }
}

// MARCAR COMO LEÍDO
async function markMessageAsReadInDB(messageId, userRole) {
    try {
        const res = await fetch(`${API_BASE_URL}/inquiries/${messageId}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        if (!res.ok) return { success: false };
        return { success: true };
    } catch (error) {
        console.error('Error en markMessageAsReadInDB:', error);
        return { success: false };
    }
}

// ELIMINAR CONVERSACIÓN
async function removeInquiryFromDB(messageId) {
    try {
        const res = await fetch(`${API_BASE_URL}/inquiries/${messageId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
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
        const res = await fetch(`${API_BASE_URL}/favorites`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) return [];
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
        const res = await fetch(`${API_BASE_URL}/favorites/${carId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (!res.ok) return false;
        return data.isFavorite; // Retorna true si se guardó, false si se eliminó
    } catch (error) {
        console.error('Error en toggleFavoriteStatus:', error);
        return false;
    }
}