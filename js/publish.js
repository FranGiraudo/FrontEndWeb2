// js/publish.js

document.addEventListener('DOMContentLoaded', () => {
    // --- 0. CONTROL DE SEGURIDAD Y ACCESO (Route Guard) ---
    let session = null;
    try {
        session = JSON.parse(localStorage.getItem('user_session'));
    } catch (e) {
        console.error("Error leyendo la sesión", e);
    }

    // Validación 1: ¿Está logueado?
    if (!session) {
        window.location.href = "login.html";
        return; // Detiene la ejecución del script inmediatamente
    }

    // Validación 2: ¿Es un vendedor?
    if (session.role !== 'vendedor') {
        // CAMBIO: alert -> showToast
        if(typeof showToast === 'function') showToast("Acceso denegado: Se requiere rol Vendedor.", "error");
        window.location.href = "index.html";
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
    let editModeId = null;

    // --- 1. LÓGICA DE MODO EDICIÓN ---
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
        editModeId = Number(editId);
        const publicaciones = JSON.parse(localStorage.getItem('misAutosPublicados')) || [];
        const autoAEditar = publicaciones.find(a => a.id === editModeId);

        if (autoAEditar) {
            // Llenar inputs de texto
            document.getElementById('input-marca').value = autoAEditar.marca;
            document.getElementById('input-modelo').value = autoAEditar.modelo;
            document.getElementById('input-anio').value = autoAEditar.anio;
            document.getElementById('input-precio').value = autoAEditar.precio;
            document.getElementById('input-km').value = autoAEditar.kilometraje;
            document.getElementById('input-fuel').value = autoAEditar.combustible;
            document.getElementById('input-trans').value = autoAEditar.transmision;
            document.getElementById('input-ubicacion').value = autoAEditar.ubicacion;
            document.getElementById('input-descripcion').value = autoAEditar.descripcion;

            // Cargar fotos existentes
            fotosCargadas = autoAEditar.fotos || [];
            if (fotosCargadas.length > 0) {
                if (dropText) dropText.style.display = 'none';
                fotosCargadas.forEach(fotoUrl => {
                    const imgThumb = document.createElement('img');
                    imgThumb.src = fotoUrl;
                    imgThumb.classList.add('thumb-preview');
                    galleryPreview.appendChild(imgThumb);
                });
            }

            fotoValidadaIA = true;
            carroceriaDetectada = autoAEditar.carroceriaIA || "Sedán";
            
            // Cambiar textos del botón
            btnSubmit.disabled = false;
            btnSubmit.style.opacity = "1";
            btnSubmit.style.cursor = "pointer";
            btnSubmit.textContent = "GUARDAR CAMBIOS";

            // Mostrar estado en la caja de IA
            aiBox.innerHTML = `Categoría actual: <b>${carroceriaDetectada}</b>.`;
            aiContainer.style.backgroundColor = "rgba(76, 175, 80, 0.15)"; 
            aiContainer.style.borderLeft = "4px solid #4caf50";

            inyectarSelectorManual();
            document.getElementById('select-manual-body').value = carroceriaDetectada;
        }
    }

    function inyectarSelectorManual() {
        if(!document.getElementById('manual-fix-container')){
            const fixHTML = `
                <div id="manual-fix-container" style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                    <label style="font-size: 0.7rem; color: #bbb;">Ajustar categoría manualmente:</label>
                    <select id="select-manual-body" style="background: #1a1a1a; color: white; border: 1px solid var(--accent-lavender); border-radius: 5px; width: 100%; padding: 5px; margin-top: 5px;">
                        <option value="Sedán">Sedán</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="SUV / Crossover">SUV / Crossover</option>
                        <option value="Pickup">Pickup</option>
                    </select>
                </div>`;
            aiContainer.insertAdjacentHTML('beforeend', fixHTML);
            
            document.getElementById('select-manual-body').addEventListener('change', (e) => {
                carroceriaDetectada = e.target.value;
                aiBox.innerHTML = `Categoría ajustada: <b>${carroceriaDetectada}</b>.`;
            });
        }
    }

    // --- 2. LÓGICA DE SELECCIÓN DE ARCHIVOS ---
    dropZone.addEventListener('click', (e) => {
        if (e.target !== fileInput) fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            galleryPreview.innerHTML = ""; 
            fotosCargadas = [];
            if(dropText) dropText.style.display = 'none';

            Array.from(this.files).forEach((file) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const maxWidth = 800;
                        const scale = maxWidth / img.width;
                        canvas.width = maxWidth;
                        canvas.height = img.height * scale;

                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const optimizedUrl = canvas.toDataURL('image/jpeg', 0.6); 
                        fotosCargadas.push(optimizedUrl);
                        
                        const imgThumb = document.createElement('img');
                        imgThumb.src = optimizedUrl;
                        imgThumb.classList.add('thumb-preview');
                        galleryPreview.appendChild(imgThumb);
                    };
                };
                reader.readAsDataURL(file);
            });

            fotoValidadaIA = false;
            btnSubmit.disabled = true;
            aiBox.innerHTML = "Analizando imágenes...";
            aiContainer.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
            
            setTimeout(() => {
                const marcaVal = document.getElementById('input-marca').value.trim().toLowerCase();
                const modeloVal = document.getElementById('input-modelo').value.trim().toLowerCase();
                const textoBusqueda = `${marcaVal} ${modeloVal}`;

                const diccionarios = {
                    "Hatchback": ["golf", "208", "308", "onix", "sandero", "etios", "fiesta", "focus", "argo", "mobi", "kwid", "up"],
                    "SUV / Crossover": ["sw4", "crv", "tracker", "renegade", "duster", "kicks", "t-cross", "nivus", "compass", "hrv", "ecosport", "taos", "corolla cross"],
                    "Pickup": ["hilux", "amarok", "ranger", "frontier", "toro", "oroch", "s10", "f150", "ram", "saveiro", "strada"],
                    "Sedán": ["corolla", "cruze", "cronos", "virtus", "yaris", "civic", "sentra", "logan", "prisma"]
                };

                carroceriaDetectada = "Sedán"; 
                for (const [categoria, palabras] of Object.entries(diccionarios)) {
                    if (palabras.some(p => textoBusqueda.includes(p))) {
                        carroceriaDetectada = categoria;
                        break;
                    }
                }

                aiBox.innerHTML = `Carrocería detectada: <b>${carroceriaDetectada}</b>.`;
                aiContainer.style.backgroundColor = "rgba(76, 175, 80, 0.15)"; 
                aiContainer.style.borderLeft = "4px solid #4caf50";

                inyectarSelectorManual();
                document.getElementById('select-manual-body').value = carroceriaDetectada;
                
                fotoValidadaIA = true;
                btnSubmit.disabled = false; 
                btnSubmit.style.opacity = "1";
                btnSubmit.style.cursor = "pointer";
            }, 2000);
        }
    });

    // --- 3. ENVÍO DEL FORMULARIO ---
    publishForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!fotoValidadaIA || fotosCargadas.length === 0) {
            if(typeof showToast === 'function') showToast("Esperá la validación de la IA o cargá imágenes.", "error");
            else alert("Por favor, esperá la validación de la IA o cargá imágenes.");
            return;
        }

        try {
            let publicaciones = JSON.parse(localStorage.getItem('misAutosPublicados')) || [];

            if (editModeId) {
                // ACTUALIZAR
                const index = publicaciones.findIndex(a => a.id === editModeId);
                if (index !== -1) {
                    publicaciones[index] = {
                        ...publicaciones[index],
                        marca: document.getElementById('input-marca').value,
                        modelo: document.getElementById('input-modelo').value,
                        anio: document.getElementById('input-anio').value,
                        precio: document.getElementById('input-precio').value,
                        kilometraje: document.getElementById('input-km').value,
                        combustible: document.getElementById('input-fuel').value,
                        transmision: document.getElementById('input-trans').value,
                        ubicacion: document.getElementById('input-ubicacion').value,
                        descripcion: document.getElementById('input-descripcion').value,
                        carroceriaIA: carroceriaDetectada,
                        fotos: fotosCargadas,
                        fotoPrincipal: fotosCargadas[0]
                    };
                }
            } else {
                // CREAR NUEVO
                const nuevoAuto = {
                    id: Date.now(),
                    marca: document.getElementById('input-marca').value,
                    modelo: document.getElementById('input-modelo').value,
                    anio: document.getElementById('input-anio').value,
                    precio: document.getElementById('input-precio').value,
                    kilometraje: document.getElementById('input-km').value,
                    combustible: document.getElementById('input-fuel').value,
                    transmision: document.getElementById('input-trans').value,
                    ubicacion: document.getElementById('input-ubicacion').value,
                    descripcion: document.getElementById('input-descripcion').value,
                    carroceriaIA: carroceriaDetectada,
                    fotos: fotosCargadas,
                    fotoPrincipal: fotosCargadas[0]
                };
                publicaciones.push(nuevoAuto);
            }

            localStorage.setItem('misAutosPublicados', JSON.stringify(publicaciones));

            btnSubmit.innerHTML = "GUARDANDO...";
            btnSubmit.disabled = true;

            setTimeout(() => {
                if(typeof showToast === 'function') showToast(editModeId ? "Publicación actualizada" : "Vehículo publicado", "success");
                else alert(editModeId ? "Publicación actualizada con éxito." : "Vehículo publicado con éxito.");
                
                window.location.href = "profile.html";
            }, 1000);

        } catch (error) {
            // CAMBIO: Se prioriza el Toast sobre el alert para el error de LocalStorage (Memoria llena)
            if(typeof showToast === 'function') showToast("Error: Memoria del navegador llena. Borrá publicaciones antiguas.", "error");
            btnSubmit.disabled = false;
        }
    });
});