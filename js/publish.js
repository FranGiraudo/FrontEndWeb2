// js/publish.js

document.addEventListener('DOMContentLoaded', async () => {
    // --- 0. CONTROL DE ACCESO ---
    const session = (typeof getSession === 'function') ? getSession() : null;

    if (!session) {
        window.location.href = "login.html";
        return;
    }
    if (session.role !== 'vendedor') {
        showToast("Acceso denegado: Se requiere rol Vendedor.", "error");
        window.location.href = "../index.html";
        return;
    }

    // --- REFERENCIAS AL DOM ---
    const dropZone       = document.getElementById('drop-zone');
    const fileInput      = document.getElementById('file-input');
    const dropText       = document.getElementById('drop-text');
    const galleryPreview = document.getElementById('gallery-preview');
    const aiBox          = document.getElementById('ai-text');
    const aiContainer    = document.getElementById('ai-container');
    const correctionUI   = document.getElementById('correction-ui');
    const selectCarroceria = document.getElementById('select-carroceria-manual');
    const btnSubmit      = document.querySelector('.btn-submit');
    const publishForm    = document.getElementById('form-publicar');

    let fotosCargadas  = [];
    let fotoValidadaIA = false;
    let carroceriaDetectada = "Sedán";
    let estadoGeneralIA  = "Buen estado";
    let danosVisiblesIA  = "Ninguno detectado";
    let rangoPrecioIA    = { min: 0, max: 0 };
    let aiScoreIA        = 0;
    let editModeId       = null;

    // Actualiza el texto del recuadro IA con los datos actuales
    function actualizarTextoIA(manual = false) {
        if (!aiBox) return;
        aiBox.innerHTML = `
            <b>Carrocería${manual ? ' (Manual)' : ''}:</b> ${carroceriaDetectada}<br>
            <b>Estado IA:</b> <span style="color:var(--accent-lavender);">${estadoGeneralIA}</span><br>
            <b>Daños:</b> ${danosVisiblesIA}<br>
            <b>Precio Sugerido:</b> u$s ${rangoPrecioIA.min.toLocaleString()} - u$s ${rangoPrecioIA.max.toLocaleString()}
        `;
    }

    // Muestra el selector manual de carrocería que ya está en el HTML
    function mostrarSelectorManual() {
        if (correctionUI) correctionUI.style.display = 'block';
        if (selectCarroceria) selectCarroceria.value = carroceriaDetectada;
    }

    // Listener del selector manual (inicializado una sola vez)
    if (selectCarroceria) {
        selectCarroceria.addEventListener('change', (e) => {
            carroceriaDetectada = e.target.value;
            actualizarTextoIA(true);
        });
    }

    // --- 1. MODO EDICIÓN ---
    const editId = new URLSearchParams(window.location.search).get('edit') || sessionStorage.getItem('editModeId');

    if (editId) {
        sessionStorage.removeItem('editModeId'); // Clean up
        editModeId = Number(editId);
        btnSubmit.textContent = "CARGANDO DATOS...";
        btnSubmit.disabled = true;

        const autoAEditar = await getCarById(editModeId);

        if (autoAEditar) {
            document.getElementById('input-marca').value       = autoAEditar.brand;
            document.getElementById('input-modelo').value      = autoAEditar.model;
            document.getElementById('input-anio').value        = autoAEditar.year;
            document.getElementById('input-precio').value      = autoAEditar.price;
            document.getElementById('input-km').value          = autoAEditar.km;
            document.getElementById('input-color').value       = autoAEditar.color || '';
            document.getElementById('input-engine').value      = autoAEditar.engine || '';
            document.getElementById('input-fuel').value        = autoAEditar.fuel;
            document.getElementById('input-trans').value       = autoAEditar.transmission;
            document.getElementById('input-ubicacion').value   = autoAEditar.location;
            document.getElementById('input-descripcion').value = autoAEditar.description || '';

            fotosCargadas = autoAEditar.images || [];
            if (fotosCargadas.length > 0) {
                if (dropText) dropText.style.display = 'none';
                galleryPreview.innerHTML = '';
                fotosCargadas.forEach(url => {
                    const div = document.createElement('div');
                    div.style.position = 'relative';
                    div.style.display = 'inline-block';
                    
                    const img = document.createElement('img');
                    img.src = url;
                    img.className = 'thumb-preview';
                    
                    const btnDelete = document.createElement('button');
                    btnDelete.innerHTML = 'X';
                    btnDelete.style.position = 'absolute';
                    btnDelete.style.top = '5px';
                    btnDelete.style.right = '5px';
                    btnDelete.style.background = 'rgba(255,0,0,0.8)';
                    btnDelete.style.color = 'white';
                    btnDelete.style.border = 'none';
                    btnDelete.style.borderRadius = '50%';
                    btnDelete.style.width = '20px';
                    btnDelete.style.height = '20px';
                    btnDelete.style.cursor = 'pointer';
                    btnDelete.style.fontSize = '12px';
                    btnDelete.style.fontWeight = 'bold';
                    btnDelete.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const idx = fotosCargadas.indexOf(url);
                        if (idx > -1) fotosCargadas.splice(idx, 1);
                        div.remove();
                        if (fotosCargadas.length === 0) {
                            if (dropText) dropText.style.display = 'block';
                            fotoValidadaIA = false;
                        }
                    };
                    
                    div.appendChild(img);
                    div.appendChild(btnDelete);
                    galleryPreview.appendChild(div);
                });
            }

            fotoValidadaIA = true;
            carroceriaDetectada = autoAEditar.bodyType || "Sedán";
            estadoGeneralIA     = autoAEditar.aiStatus || "Excelente estado";
            danosVisiblesIA     = autoAEditar.aiDamages || "Ninguno visible";
            rangoPrecioIA = {
                min: autoAEditar.aiPriceMin || Math.round(autoAEditar.price * 0.85),
                max: autoAEditar.aiPriceMax || Math.round(autoAEditar.price * 1.15)
            };

            actualizarTextoIA();
            mostrarSelectorManual();
            if (aiContainer) {
                aiContainer.style.backgroundColor = "var(--accent-alpha-15)";
                aiContainer.style.borderLeft = "4px solid var(--accent-lavender)";
            }
            btnSubmit.disabled = false;
            btnSubmit.style.opacity = "1";
            btnSubmit.style.cursor = "pointer";
            btnSubmit.textContent = "GUARDAR CAMBIOS";
        } else {
            showToast("No se pudo cargar la publicación a editar.", "error");
            btnSubmit.textContent = "PUBLICAR VEHÍCULO";
        }
    }

    // --- 2. SUBIDA DE IMÁGENES (lógica compartida para click y drag-and-drop) ---
    async function handleFiles(files) {
        if (!files || files.length === 0) return;

        galleryPreview.innerHTML = '';
        fotosCargadas = [];
        if (dropText) dropText.style.display = 'none';

        // Previsualizaciones locales mientras sube
        Array.from(files).forEach(file => {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.className = 'thumb-preview loading-thumb';
            galleryPreview.appendChild(img);
        });

        fotoValidadaIA = false;
        btnSubmit.disabled = true;
        if (aiBox) aiBox.innerHTML = "Subiendo imágenes y analizando con IA en servidor...";
        if (aiContainer) {
            aiContainer.style.backgroundColor = "var(--white-alpha-05)";
            aiContainer.style.borderLeft = "4px solid #555";
        }

        const marcaVal  = document.getElementById('input-marca').value.trim();
        const modeloVal = document.getElementById('input-modelo').value.trim();
        const precioVal = document.getElementById('input-precio').value.trim();
        const yearVal = document.getElementById('input-anio').value.trim();
        const kmVal = document.getElementById('input-km').value.trim();
        const colorVal = document.getElementById('input-color').value.trim();
        const engineVal = document.getElementById('input-engine').value.trim();

        if (!marcaVal || !modeloVal) {
            showToast("Escribí marca y modelo antes de subir las fotos para optimizar el análisis.", "error");
        }

        try {
            const formData = new FormData();
            Array.from(files).forEach(file => formData.append('images', file));

            const params = new URLSearchParams({ 
                brand: marcaVal, 
                model: modeloVal, 
                price: precioVal || '10000',
                year: yearVal || '2020',
                km: kmVal || '0',
                color: colorVal || 'No especificado',
                engine: engineVal || 'No especificado'
            });
            const res = await fetch(`${API_BASE_URL}/cars/upload-images?${params}`, {
                method: 'POST',
                headers: getAuthHeaders(null),
                body: formData
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Error al subir las imágenes.");

            fotosCargadas = data.images;
            galleryPreview.innerHTML = '';
            fotosCargadas.forEach(url => {
                const div = document.createElement('div');
                div.style.position = 'relative';
                div.style.display = 'inline-block';
                
                const img = document.createElement('img');
                img.src = url;
                img.className = 'thumb-preview';
                
                const btnDelete = document.createElement('button');
                btnDelete.innerHTML = 'X';
                btnDelete.style.position = 'absolute';
                btnDelete.style.top = '5px';
                btnDelete.style.right = '5px';
                btnDelete.style.background = 'rgba(255,0,0,0.8)';
                btnDelete.style.color = 'white';
                btnDelete.style.border = 'none';
                btnDelete.style.borderRadius = '50%';
                btnDelete.style.width = '20px';
                btnDelete.style.height = '20px';
                btnDelete.style.cursor = 'pointer';
                btnDelete.style.fontSize = '12px';
                btnDelete.style.fontWeight = 'bold';
                btnDelete.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const idx = fotosCargadas.indexOf(url);
                    if (idx > -1) fotosCargadas.splice(idx, 1);
                    div.remove();
                    if (fotosCargadas.length === 0) {
                        if (dropText) dropText.style.display = 'block';
                        fotoValidadaIA = false;
                    }
                };
                
                div.appendChild(img);
                div.appendChild(btnDelete);
                galleryPreview.appendChild(div);
            });

            carroceriaDetectada = data.aiAnalysis.bodyType;
            estadoGeneralIA     = data.aiAnalysis.aiStatus;
            danosVisiblesIA     = data.aiAnalysis.aiDamages;
            rangoPrecioIA       = data.aiAnalysis.priceRange;
            aiScoreIA           = data.aiAnalysis.aiScore || 0;

            actualizarTextoIA();
            mostrarSelectorManual();
            if (aiContainer) {
                aiContainer.style.backgroundColor = "var(--accent-alpha-15)";
                aiContainer.style.borderLeft = "4px solid var(--accent-lavender)";
            }

            fotoValidadaIA = true;
            btnSubmit.disabled = false;
            btnSubmit.style.opacity = "1";
            btnSubmit.style.cursor = "pointer";

            showToast("Imágenes subidas y procesadas con éxito por la IA.", "success");

        } catch (error) {
            console.error("Error en upload-images:", error);
            showToast(error.message || "Error de conexión con el servidor de imágenes.", "error");
            if (aiBox) aiBox.innerHTML = "No se pudo completar el análisis de imágenes.";
            btnSubmit.disabled = true;
        }
    }

    // Click para abrir el selector de archivos
    dropZone.addEventListener('click', (e) => {
        if (e.target !== fileInput) fileInput.click();
    });

    // Selección de archivos por input
    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });

    // Drag-and-drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    // --- 3. ENVÍO DEL FORMULARIO ---
    publishForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!fotoValidadaIA || fotosCargadas.length === 0) {
            showToast("Esperá a cargar imágenes y a que se complete el análisis IA.", "error");
            return;
        }

        btnSubmit.innerHTML = "GUARDANDO...";
        btnSubmit.disabled = true;

        const datosAuto = {
            brand:        document.getElementById('input-marca').value.trim(),
            model:        document.getElementById('input-modelo').value.trim(),
            year:         Number(document.getElementById('input-anio').value),
            price:        parseFloat(document.getElementById('input-precio').value),
            km:           Number(document.getElementById('input-km').value),
            color:        document.getElementById('input-color').value.trim(),
            engine:       document.getElementById('input-engine').value.trim(),
            fuel:         document.getElementById('input-fuel').value,
            transmission: document.getElementById('input-trans').value,
            location:     document.getElementById('input-ubicacion').value.trim(),
            description:  document.getElementById('input-descripcion').value.trim(),
            bodyType:     carroceriaDetectada,
            aiStatus:     estadoGeneralIA,
            aiDamages:    danosVisiblesIA,
            aiPriceMin:   Number(rangoPrecioIA.min),
            aiPriceMax:   Number(rangoPrecioIA.max),
            aiScore:      Number(aiScoreIA) || 0,
            images:       fotosCargadas
        };

        try {
            const url = editModeId
                ? `${API_BASE_URL}/cars/${editModeId}`
                : `${API_BASE_URL}/cars`;
            const res = await authFetch(url, {
                method: editModeId ? 'PUT' : 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(datosAuto)
            });

            if (!res) return; // authFetch redirigió por 401
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error al registrar la publicación.");

            showToast(editModeId ? "Publicación actualizada con éxito." : "Vehículo publicado con éxito.", "success");
            setTimeout(() => { window.location.href = "profile.html"; }, 1000);

        } catch (error) {
            console.error("Error al publicar:", error);
            showToast(error.message || "Ocurrió un error al guardar en la base de datos.", "error");
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = editModeId ? "GUARDAR CAMBIOS" : "PUBLICAR VEHÍCULO";
        }
    });
});
