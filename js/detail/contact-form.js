/**
 * js/detail/contact-form.js
 * Módulo para inicializar el formulario de contacto con el vendedor.
 */

export function initContactForm(carId, requireAuth, sendInquiryToSeller, trackMetric, showToast) {
    const contactForm = document.getElementById('form-contactar-vendedor');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const session = typeof requireAuth === 'function' ? requireAuth('comprador') : null;
        if (!session) return; 

        const messageText = document.getElementById('input-inquiry-message').value;

        if (!messageText.trim()) {
            if (typeof showToast === 'function') showToast("El mensaje no puede estar vacío.", "error");
            return;
        }

        const btnSubmit = contactForm.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;

        if (typeof sendInquiryToSeller === 'function') {
            const response = await sendInquiryToSeller(Number(carId), session.email, session.nombre, messageText);
            btnSubmit.disabled = false;

            if (response.success) {
                if (typeof showToast === 'function') showToast("Consulta enviada con éxito.", "success");
                document.getElementById('input-inquiry-message').value = "";
                if (typeof trackMetric === 'function') trackMetric(carId, 'contactos');
            } else {
                if (typeof showToast === 'function') showToast(response.error, "error");
            }
        }
    });
}
