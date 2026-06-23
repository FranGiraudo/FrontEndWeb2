/**
 * js/publish/ai-autofill.js
 * Módulo para gestionar la subida de imágenes y el pre-llenado de datos mediante IA.
 */

export function initAiAutofill(uiNodes, state, utils) {
    const { dropZone, fileInput, galleryPreview, dropText, aiBox, aiContainer, btnSubmit, marcaInput, modeloInput, precioInput, yearInput, kmInput, engineInput, actualizarTextoIA, mostrarSelectorManual } = uiNodes;
    const { API_BASE_URL, getAuthHeaders, showToast } = utils;

    async function handleFiles(files) {
        if (!files || files.length === 0) return;

        galleryPreview.innerHTML = '';
        state.fotosCargadas = [];
        if (dropText) dropText.style.display = 'none';

        Array.from(files).forEach(file => {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.className = 'thumb-preview loading-thumb';
            galleryPreview.appendChild(img);
        });

        state.fotoValidadaIA = false;
        btnSubmit.disabled = true;
        if (aiBox) aiBox.innerHTML = "Subiendo imágenes y analizando con IA en el servidor...";
        if (aiContainer) {
            aiContainer.style.backgroundColor = "var(--white-alpha-05)";
            aiContainer.style.borderLeft = "4px solid var(--text-muted)";
        }

        const prevMarca = marcaInput.value;
        const prevModelo = modeloInput.value;

        marcaInput.disabled = true;
        modeloInput.disabled = true;
        marcaInput.classList.add('loading-input');
        modeloInput.classList.add('loading-input');
        marcaInput.value = 'Detectando...';
        modeloInput.value = 'Detectando...';

        try {
            const formData = new FormData();
            Array.from(files).forEach(file => formData.append('images', file));

            const params = new URLSearchParams({ 
                brand: prevMarca, 
                model: prevModelo, 
                price: precioInput.value.trim() || '0',
                year: yearInput.value.trim() || '0',
                km: kmInput.value.trim() || '0',
                engine: engineInput.value.trim() || 'No especificado'
            });
            
            const res = await fetch(`${API_BASE_URL}/cars/upload-images?${params}`, {
                method: 'POST',
                headers: getAuthHeaders(null),
                body: formData
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Error al subir las imágenes.");

            if (data.aiAnalysis && data.aiAnalysis.isFraud) {
                showToast(`FRAUDE DETECTADO: ${data.aiAnalysis.fraudReason || 'La imagen parece falsa o bajada de internet.'}`, "error");
                if (aiBox) aiBox.innerHTML = `<span style="color:var(--error); font-weight:bold;">¡IMAGEN RECHAZADA!</span><br>La IA determinó que la imagen no es válida o es fraudulenta.<br><em>Motivo: ${data.aiAnalysis.fraudReason}</em>`;
                if (aiContainer) aiContainer.style.borderLeft = "4px solid var(--error)";
                throw new Error("Imagen rechazada por sospecha de fraude.");
            }

            state.fotosCargadas = data.images;
            galleryPreview.innerHTML = '';
            
            state.fotosCargadas.forEach(url => {
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
                    const idx = state.fotosCargadas.indexOf(url);
                    if (idx > -1) state.fotosCargadas.splice(idx, 1);
                    div.remove();
                    if (state.fotosCargadas.length === 0) {
                        if (dropText) dropText.style.display = 'block';
                        state.fotoValidadaIA = false;
                    }
                };
                
                div.appendChild(img);
                div.appendChild(btnDelete);
                galleryPreview.appendChild(div);
            });

            state.carroceriaDetectada = data.aiAnalysis.bodyType || "Sedán";
            state.estadoGeneralIA     = data.aiAnalysis.aiStatus || "No determinado";
            state.danosVisiblesIA     = data.aiAnalysis.aiDamages || "No evaluado";
            state.rangoPrecioIA       = data.aiAnalysis.priceRange || { min: 0, max: 0 };
            state.aiScoreIA           = data.aiAnalysis.aiScore || 0;

            if (data.aiAnalysis.brand) {
                marcaInput.value = data.aiAnalysis.brand;
                showToast("Marca detectada automáticamente.", "success");
            } else {
                marcaInput.value = prevMarca;
            }

            if (data.aiAnalysis.model) {
                modeloInput.value = data.aiAnalysis.model;
                showToast("Modelo detectado automáticamente.", "success");
            } else {
                modeloInput.value = prevModelo;
            }

            actualizarTextoIA();
            mostrarSelectorManual();
            if (aiContainer) {
                aiContainer.style.backgroundColor = "var(--accent-alpha-15)";
                aiContainer.style.borderLeft = "4px solid var(--accent-lavender)";
            }

            state.fotoValidadaIA = true;
            btnSubmit.disabled = false;
            btnSubmit.style.opacity = "1";
            btnSubmit.style.cursor = "pointer";

            showToast("Imágenes subidas y procesadas con éxito por la IA.", "success");

        } catch (error) {
            console.error("Error procesando archivos:", error);
            marcaInput.value = prevMarca;
            modeloInput.value = prevModelo;
            if (aiBox) aiBox.innerHTML = "Error al procesar. Intenta nuevamente.";
            if (aiContainer) aiContainer.style.borderLeft = "4px solid var(--error)";
            showToast("Hubo un error al procesar las imágenes.", "error");
        } finally {
            marcaInput.disabled = false;
            modeloInput.disabled = false;
            marcaInput.classList.remove('loading-input');
            modeloInput.classList.remove('loading-input');
        }
    }

    dropZone.addEventListener('click', (e) => {
        if (e.target !== fileInput) fileInput.click();
    });

    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });

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
    
    return { handleFiles };
}
