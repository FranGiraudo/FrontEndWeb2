// js/publish.js

document.addEventListener('DOMContentLoaded', () => {
    // --- 0. CONTROL DE SEGURIDAD Y ACCESO (Route Guard) ---
    let session = null;
    try {
        session = JSON.parse(localStorage.getItem('user_session'));
    } catch (e) {
        console.error("Error leyendo la sesión", e);
    }

    if (!session) {
        window.location.href = "login.html"; // Ambas están en /pages
        return;
    }

    if (session.role !== 'vendedor') {
        if(typeof showToast === 'function') showToast("Acceso denegado: Se requiere rol Vendedor.", "error");
        // FIX DE RUTA: Sube un nivel para ir al index desde /pages/publish.html
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
    
    // Variables para cumplir con Req 4.5
    let estadoGeneralIA = "Buen estado";
    let danosVisiblesIA = "Ninguno detectado";
    let rangoPrecioIA = { min: 0, max: 0 };
    
    let editModeId = null;

    // --- 1. LÓGICA DE MODO EDICIÓN ---
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
        editModeId = Number(editId);
        const publicaciones = JSON.parse(localStorage.getItem('misAutosPublicados')) || [];
        const autoAEditar = publicaciones.find(a => a.id === editModeId);

        if (autoAEditar) {
            document.getElementById('input-marca').value = autoAEditar.marca;
            document.getElementById('input-modelo').value = autoAEditar.modelo;
            document.getElementById('input-anio').value = autoAEditar.anio;
            document.getElementById('input-precio').value = autoAEditar.precio;
            document.getElementById('input-km').value = autoAEditar.kilometraje;
            document.getElementById('input-fuel').value = autoAEditar.combustible;
            document.getElementById('input-trans').value = autoAEditar.transmision;
            document.getElementById('input-ubicacion').value = autoAEditar.ubicacion;
            document.getElementById('input-descripcion').value = autoAEditar.descripcion;

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
            
            btnSubmit.disabled = false;
            btnSubmit.style.opacity = "1";
            btnSubmit.style.cursor = "pointer";
            btnSubmit.textContent = "GUARDAR CAMBIOS";

            aiBox.innerHTML = `Categoría actual: <b>${carroceriaDetectada}</b>.`;
            aiContainer.style.backgroundColor = "var(--accent-alpha-15)"; 
            aiContainer.style.borderLeft = "4px solid var(--accent-lavender)";

            inyectarSelectorManual();
            document.getElementById('select-manual-body').value = carroceriaDetectada;
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
                // Actualizar info visual, manteniendo la validación de la IA
                aiBox.innerHTML = `
                    <b>Carrocería (Manual):</b> ${carroceriaDetectada}<br>
                    <b>Estado IA:</b> ${estadoGeneralIA} <br>
                    <b>Precio Sugerido:</b> u$s ${rangoPrecioIA.min} - u$s ${rangoPrecioIA.max}
                `;
            });
        }
    }

    // --- 2. LÓGICA DE SELECCIÓN Y PROCESAMIENTO DE IMÁGENES ---
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
                        
                        const maxResolution = 1920;
                        let width = img.width;
                        let height = img.height;

                        if (width > maxResolution || height > maxResolution) {
                            if (width > height) {
                                height *= maxResolution / width;
                                width = maxResolution;
                            } else {
                                width *= maxResolution / height;
                                height = maxResolution;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        const optimizedUrl = canvas.toDataURL('image/webp', 0.8); 
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
            aiBox.innerHTML = "Analizando daños y estado general con IA...";
            aiContainer.style.backgroundColor = "var(--white-alpha-05)";
            
            // Simulación de respuesta IA requerida en doc 4.5
            setTimeout(() => {
                const marcaVal = document.getElementById('input-marca').value.trim().toLowerCase();
                const modeloVal = document.getElementById('input-modelo').value.trim().toLowerCase();
                const precioUsuario = Number(document.getElementById('input-precio').value) || 10000;
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

                // Generación de estado pseudo-aleatorio para mock
                const estadosPosibles = ["Excelente estado", "Buen estado", "Estado regular", "Requiere reparación"];
                const rnd = Math.random();
                if(rnd > 0.8) estadoGeneralIA = estadosPosibles[0];
                else if (rnd > 0.3) estadoGeneralIA = estadosPosibles[1];
                else if (rnd > 0.1) estadoGeneralIA = estadosPosibles[2];
                else estadoGeneralIA = estadosPosibles[3];

                danosVisiblesIA = estadoGeneralIA === "Excelente estado" ? "Ninguno detectado" : "Leves rayones en paragolpes";
                
                // Rango de precio sugerido
                rangoPrecioIA.min = Math.round(precioUsuario * 0.85);
                rangoPrecioIA.max = Math.round(precioUsuario * 1.15);

                aiBox.innerHTML = `
                    <b>Carrocería:</b> ${carroceriaDetectada} <br>
                    <b>Estado IA:</b> <span style="color:var(--accent-lavender);">${estadoGeneralIA}</span> <br>
                    <b>Daños:</b> ${danosVisiblesIA} <br>
                    <b>Precio Sugerido:</b> u$s ${rangoPrecioIA.min} - u$s ${rangoPrecioIA.max}
                `;
                
                aiContainer.style.backgroundColor = "var(--accent-alpha-15)"; 
                aiContainer.style.borderLeft = "4px solid var(--accent-lavender)";

                inyectarSelectorManual();
                document.getElementById('select-manual-body').value = carroceriaDetectada;
                
                fotoValidadaIA = true;
                btnSubmit.disabled = false; 
                btnSubmit.style.opacity = "1";
                btnSubmit.style.cursor = "pointer";
            }, 2500);
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

            const datosAuto = {
                marca: document.getElementById('input-marca').value,
                modelo: document.getElementById('input-modelo').value,
                anio: document.getElementById('input-anio').value,
                precio: document.getElementById('input-precio').value,
                kilometraje: document.getElementById('input-km').value,
                combustible: document.getElementById('input-fuel').value,
                transmision: document.getElementById('input-trans').value,
                ubicacion: document.getElementById('input-ubicacion').value,
                descripcion: document.getElementById('input-descripcion').value,
                // Guardamos los datos de la IA para usarlos en el detalle
                carroceriaIA: carroceriaDetectada,
                estadoIA: estadoGeneralIA,
                danosIA: danosVisiblesIA,
                precioSugerido: rangoPrecioIA,
                fotos: fotosCargadas,
                fotoPrincipal: fotosCargadas[0]
            };

            if (editModeId) {
                const index = publicaciones.findIndex(a => a.id === editModeId);
                if (index !== -1) {
                    publicaciones[index] = { ...publicaciones[index], ...datosAuto };
                }
            } else {
                publicaciones.push({ id: Date.now(), ...datosAuto });
            }

            localStorage.setItem('misAutosPublicados', JSON.stringify(publicaciones));

            btnSubmit.innerHTML = "GUARDANDO...";
            btnSubmit.disabled = true;

            setTimeout(() => {
                if(typeof showToast === 'function') showToast(editModeId ? "Publicación actualizada" : "Vehículo publicado", "success");
                else alert(editModeId ? "Publicación actualizada con éxito." : "Vehículo publicado con éxito.");
                window.location.href = "profile.html"; // Mismo directorio
            }, 1000);

        } catch (error) {
            if(typeof showToast === 'function') showToast("Error: Memoria del navegador llena. Borrá publicaciones antiguas.", "error");
            btnSubmit.disabled = false;
        }
    });
});