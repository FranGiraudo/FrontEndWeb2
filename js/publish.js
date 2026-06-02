// js/publish.js

document.addEventListener('DOMContentLoaded', async () => {
    // --- 0. CONTROL DE SEGURIDAD Y ACCESO (Route Guard) ---
    let session = null;
    try {
        session = JSON.parse(localStorage.getItem('user_session'));
    } catch (e) {
        console.error("Error leyendo la sesión", e);
    }

    if (!session) {
        window.location.href = "login.html"; 
        return;
    }

    if (session.role !== 'vendedor') {
        if(typeof showToast === 'function') showToast("Acceso denegado: Se requiere rol Vendedor.", "error");
        window.location.href = "../index.html";
        return; 
    }

    // --- REFERENCIAS AL DOM ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const dropText = document.getElementById('drop-text');
    const galleryPreview = document.getElementById('gallery-preview');
    const aiBox = document.querySelector('.ai-info-box p');
    const aiContainer = document.querySelector('.ai-info-box');
    const btnSubmit = document.querySelector('.btn-submit');
    const publishForm = document.getElementById('form-publicar');

    let fotosCargadas = []; 
    let fotoValidadaIA = false;
    let carroceriaDetectada = "Sedán";
    
    let estadoGeneralIA = "Buen estado";
    let danosVisiblesIA = "Ninguno detectado";
    let rangoPrecioIA = { min: 0, max: 0 };
    
    let editModeId = null;

    // --- 1. LÓGICA DE MODO EDICIÓN (Asíncrona con el backend) ---
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
        editModeId = Number(editId);
        btnSubmit.textContent = "CARGANDO DATOS...";
        btnSubmit.disabled = true;

        if (typeof getCarById === 'function') {
            const autoAEditar = await getCarById(editModeId);

            if (autoAEditar) {
                document.getElementById('input-marca').value = autoAEditar.brand;
                document.getElementById('input-modelo').value = autoAEditar.model;
                document.getElementById('input-anio').value = autoAEditar.year;
                document.getElementById('input-precio').value = autoAEditar.price;
                document.getElementById('input-km').value = autoAEditar.km;
                document.getElementById('input-fuel').value = autoAEditar.fuel;
                document.getElementById('input-trans').value = autoAEditar.transmission;
                document.getElementById('input-ubicacion').value = autoAEditar.location;
                document.getElementById('input-descripcion').value = autoAEditar.description || '';

                fotosCargadas = autoAEditar.images || [];
                if (fotosCargadas.length > 0) {
                    if (dropText) dropText.style.display = 'none';
                    galleryPreview.innerHTML = "";
                    fotosCargadas.forEach(fotoUrl => {
                        const imgThumb = document.createElement('img');
                        imgThumb.src = fotoUrl;
                        imgThumb.classList.add('thumb-preview');
                        galleryPreview.appendChild(imgThumb);
                    });
                }

                fotoValidadaIA = true;
                carroceriaDetectada = autoAEditar.bodyType || "Sedán";
                estadoGeneralIA = autoAEditar.aiStatus || "Excelente estado";
                danosVisiblesIA = autoAEditar.aiDamages || "Ninguno visible";
                rangoPrecioIA = {
                    min: autoAEditar.aiPriceMin || Math.round(autoAEditar.price * 0.85),
                    max: autoAEditar.aiPriceMax || Math.round(autoAEditar.price * 1.15)
                };
                
                btnSubmit.disabled = false;
                btnSubmit.style.opacity = "1";
                btnSubmit.style.cursor = "pointer";
                btnSubmit.textContent = "GUARDAR CAMBIOS";

                aiBox.innerHTML = `
                    <b>Carrocería:</b> ${carroceriaDetectada} <br>
                    <b>Estado IA:</b> <span style="color:var(--accent-lavender);">${estadoGeneralIA}</span> <br>
                    <b>Daños:</b> ${danosVisiblesIA} <br>
                    <b>Precio Sugerido:</b> u$s ${rangoPrecioIA.min.toLocaleString()} - u$s ${rangoPrecioIA.max.toLocaleString()}
                `;
                aiContainer.style.backgroundColor = "var(--accent-alpha-15)"; 
                aiContainer.style.borderLeft = "4px solid var(--accent-lavender)";

                inyectarSelectorManual();
                document.getElementById('select-manual-body').value = carroceriaDetectada;
            } else {
                if(typeof showToast === 'function') showToast("No se pudo cargar la publicación a editar.", "error");
                btnSubmit.textContent = "PUBLICAR VEHÍCULO";
            }
        }
    }

    function inyectarSelectorManual() {
        if(!document.getElementById('manual-fix-container')){
            const fixHTML = `
                <div id="manual-fix-container" style="margin-top: 0.625rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.625rem; width: 100%;">
                    <label style="font-size: 0.7rem; color: #bbb;">Ajustar categoría manualmente:</label>
                    <select id="select-manual-body" style="background: var(--bg-shark); color: white; border: 1px solid var(--accent-lavender); border-radius: 0.3125rem; width: 100%; padding: 0.3125rem; margin-top: 0.3125rem;">
                        <option value="Sedán">Sedán</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="SUV / Crossover">SUV / Crossover</option>
                        <option value="Pickup">Pickup</option>
                    </select>
                </div>`;
            aiContainer.insertAdjacentHTML('beforeend', fixHTML);
            
            document.getElementById('select-manual-body').addEventListener('change', (e) => {
                carroceriaDetectada = e.target.value;
                aiBox.innerHTML = `
                    <b>Carrocería (Manual):</b> ${carroceriaDetectada}<br>
                    <b>Estado IA:</b> ${estadoGeneralIA} <br>
                    <b>Daños:</b> ${danosVisiblesIA} <br>
                    <b>Precio Sugerido:</b> u$s ${rangoPrecioIA.min.toLocaleString()} - u$s ${rangoPrecioIA.max.toLocaleString()}
                `;
            });
        }
    }

    // --- 2. LÓGICA DE SUBIDA E INTERCEPTADO CON EL BACKEND ---
    dropZone.addEventListener('click', (e) => {
        if (e.target !== fileInput) fileInput.click();
    });

    fileInput.addEventListener('change', async function() {
        if (this.files && this.files.length > 0) {
            galleryPreview.innerHTML = ""; 
            fotosCargadas = [];
            if(dropText) dropText.style.display = 'none';

            // 1. Mostrar previsualizaciones locales temporalmente
            Array.from(this.files).forEach((file) => {
                const imgThumb = document.createElement('img');
                imgThumb.src = URL.createObjectURL(file);
                imgThumb.classList.add('thumb-preview', 'loading-thumb');
                galleryPreview.appendChild(imgThumb);
            });

            fotoValidadaIA = false;
            btnSubmit.disabled = true;
            aiBox.innerHTML = "Subiendo imágenes y analizando daños con IA en servidor...";
            aiContainer.style.backgroundColor = "var(--white-alpha-05)";
            aiContainer.style.borderLeft = "4px solid #555";

            // 2. Construir FormData
            const formData = new FormData();
            Array.from(this.files).forEach((file) => {
                formData.append('images', file);
            });

            const marcaVal = document.getElementById('input-marca').value.trim();
            const modeloVal = document.getElementById('input-modelo').value.trim();
            const precioVal = document.getElementById('input-precio').value.trim();

            if (!marcaVal || !modeloVal) {
                if(typeof showToast === 'function') showToast("Por favor, escribí marca y modelo antes de subir imágenes para optimizar el análisis.", "error");
            }

            try {
                const queryParams = new URLSearchParams({
                    brand: marcaVal,
                    model: modeloVal,
                    price: precioVal || '10000'
                });

                // 3. Subir imágenes
                const res = await fetch(`${API_BASE_URL}/cars/upload-images?${queryParams.toString()}`, {
                    method: 'POST',
                    headers: getAuthHeaders(null), // Importante: sin Content-Type JSON para multipart
                    body: formData
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Error al subir las imágenes.");
                }

                // 4. Guardar las URLs oficiales del servidor
                fotosCargadas = data.images;
                
                // Limpiar previsualizaciones temporales e inyectar las del servidor
                galleryPreview.innerHTML = "";
                fotosCargadas.forEach(url => {
                    const imgThumb = document.createElement('img');
                    imgThumb.src = url;
                    imgThumb.classList.add('thumb-preview');
                    galleryPreview.appendChild(imgThumb);
                });

                // Cargar análisis del backend
                carroceriaDetectada = data.aiAnalysis.bodyType;
                estadoGeneralIA = data.aiAnalysis.aiStatus;
                danosVisiblesIA = data.aiAnalysis.aiDamages;
                rangoPrecioIA = data.aiAnalysis.priceRange;

                aiBox.innerHTML = `
                    <b>Carrocería:</b> ${carroceriaDetectada} <br>
                    <b>Estado IA:</b> <span style="color:var(--accent-lavender);">${estadoGeneralIA}</span> <br>
                    <b>Daños:</b> ${danosVisiblesIA} <br>
                    <b>Precio Sugerido:</b> u$s ${rangoPrecioIA.min.toLocaleString()} - u$s ${rangoPrecioIA.max.toLocaleString()}
                `;
                
                aiContainer.style.backgroundColor = "var(--accent-alpha-15)"; 
                aiContainer.style.borderLeft = "4px solid var(--accent-lavender)";

                inyectarSelectorManual();
                document.getElementById('select-manual-body').value = carroceriaDetectada;
                
                fotoValidadaIA = true;
                btnSubmit.disabled = false; 
                btnSubmit.style.opacity = "1";
                btnSubmit.style.cursor = "pointer";

                if(typeof showToast === 'function') showToast("Imágenes subidas y procesadas con éxito por la IA.", "success");

            } catch (error) {
                console.error("Error en upload-images:", error);
                if(typeof showToast === 'function') showToast(error.message || "Error de conexión con el servidor de imágenes.", "error");
                aiBox.innerHTML = "No se pudo completar el análisis de imágenes.";
                btnSubmit.disabled = true;
            }
        }
    });

    // --- 3. ENVÍO DEL FORMULARIO AL BACKEND ---
    publishForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!fotoValidadaIA || fotosCargadas.length === 0) {
            if(typeof showToast === 'function') showToast("Esperá a cargar imágenes y a que se complete el análisis IA.", "error");
            return;
        }

        btnSubmit.innerHTML = "GUARDANDO...";
        btnSubmit.disabled = true;

        const datosAuto = {
            brand: document.getElementById('input-marca').value.trim(),
            model: document.getElementById('input-modelo').value.trim(),
            year: Number(document.getElementById('input-anio').value),
            price: parseFloat(document.getElementById('input-precio').value),
            km: Number(document.getElementById('input-km').value),
            fuel: document.getElementById('input-fuel').value,
            transmission: document.getElementById('input-trans').value,
            location: document.getElementById('input-ubicacion').value.trim(),
            description: document.getElementById('input-descripcion').value.trim(),
            bodyType: carroceriaDetectada,
            aiStatus: estadoGeneralIA,
            aiDamages: danosVisiblesIA,
            aiPriceMin: Number(rangoPrecioIA.min),
            aiPriceMax: Number(rangoPrecioIA.max),
            images: fotosCargadas
        };

        try {
            let res;
            if (editModeId) {
                // Editar existente (PUT /cars/:id)
                res = await fetch(`${API_BASE_URL}/cars/${editModeId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(datosAuto)
                });
            } else {
                // Publicar nuevo (POST /cars)
                res = await fetch(`${API_BASE_URL}/cars`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(datosAuto)
                });
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Error al registrar la publicación.");
            }

            if(typeof showToast === 'function') showToast(editModeId ? "Publicación actualizada con éxito." : "Vehículo publicado con éxito.", "success");
            
            setTimeout(() => {
                window.location.href = "profile.html"; 
            }, 1000);

        } catch (error) {
            console.error("Error al publicar:", error);
            if(typeof showToast === 'function') showToast(error.message || "Ocurrió un error al guardar en la base de datos.", "error");
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = editModeId ? "GUARDAR CAMBIOS" : "PUBLICAR VEHÍCULO";
        }
    });
});