document.addEventListener('DOMContentLoaded', () => {
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

    // 1. Lógica de selección de archivos
    dropZone.addEventListener('click', (e) => {
        if (e.target !== fileInput) fileInput.click();
    });

    // 2. Procesar y COMPRIMIR imágenes
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
                        const optimizedUrl = canvas.toDataURL('image/jpeg', 0.6); // Compresión al 60%
                        fotosCargadas.push(optimizedUrl);
                        
                        const imgThumb = document.createElement('img');
                        imgThumb.src = optimizedUrl;
                        imgThumb.classList.add('thumb-preview');
                        galleryPreview.appendChild(imgThumb);
                    };
                };
                reader.readAsDataURL(file);
            });

            // Lógica de Simulación de IA
            fotoValidadaIA = false;
            btnSubmit.disabled = true;
            aiBox.innerHTML = "🔍 <b>IA Analizando imágenes...</b>";
            aiContainer.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
            
            setTimeout(() => {
                const marcaVal = document.getElementById('input-marca').value.trim().toLowerCase();
                const modeloVal = document.getElementById('input-modelo').value.trim().toLowerCase();
                const textoBusqueda = `${marcaVal} ${modeloVal}`;

                // DICCIONARIO SINCRONIZADO CON EL HOME
                const diccionarios = {
                    "Hatchback": ["golf", "208", "308", "onix", "sandero", "etios", "fiesta", "focus", "argo", "mobi", "kwid", "up"],
                    "SUV / Crossover": ["sw4", "crv", "tracker", "renegade", "duster", "kicks", "t-cross", "nivus", "compass", "hrv", "ecosport", "taos", "corolla cross"],
                    "Pickup": ["hilux", "amarok", "ranger", "frontier", "toro", "oroch", "s10", "f150", "ram", "saveiro", "strada"],
                    "Sedán": ["corolla", "cruze", "cronos", "virtus", "yaris", "civic", "sentra", "logan", "prisma"]
                };

                // Detección inicial
                carroceriaDetectada = "Sedán"; 
                for (const [categoria, palabras] of Object.entries(diccionarios)) {
                    if (palabras.some(p => textoBusqueda.includes(p))) {
                        carroceriaDetectada = categoria;
                        break;
                    }
                }

                // UI DE RESULTADO E IA
                aiBox.innerHTML = `✨ <b>IA Resultado:</b> ✅ Carrocería detectada: <b>${carroceriaDetectada}</b>.`;
                aiContainer.style.backgroundColor = "rgba(76, 175, 80, 0.15)"; 
                aiContainer.style.borderLeft = "4px solid #4caf50";

                // Inyectamos selector manual para evitar errores de sincronización
                if(!document.getElementById('manual-fix-container')){
                    const fixHTML = `
                        <div id="manual-fix-container" style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                            <label style="font-size: 0.7rem; color: #bbb;">¿La IA falló? Ajustar categoría:</label>
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
                        aiBox.innerHTML = `✨ <b>Categoría ajustada:</b> <b>${carroceriaDetectada}</b>.`;
                    });
                }
                
                // Seteamos el valor detectado en el select
                document.getElementById('select-manual-body').value = carroceriaDetectada;
                
                fotoValidadaIA = true;
                btnSubmit.disabled = false; 
                btnSubmit.style.opacity = "1";
                btnSubmit.style.cursor = "pointer";
            }, 2000);
        }
    });

    // 3. Envío del Formulario
    publishForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!fotoValidadaIA || fotosCargadas.length === 0) {
            alert("❌ Por favor, esperá la validación de la IA.");
            return;
        }

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
            carroceriaIA: carroceriaDetectada, // IMPORTANTE: Guarda el valor final
            fotos: fotosCargadas,
            fotoPrincipal: fotosCargadas[0]
        };

        try {
            let publicaciones = JSON.parse(localStorage.getItem('misAutosPublicados')) || [];
            publicaciones.push(nuevoAuto);
            localStorage.setItem('misAutosPublicados', JSON.stringify(publicaciones));

            btnSubmit.innerHTML = "✨ PUBLICANDO...";
            btnSubmit.disabled = true;

            setTimeout(() => {
                alert(" Vehículo publicado con éxito!");
                window.location.href = "profile.html";
            }, 1000);

        } catch (error) {
            alert(" Error: Memoria llena. Borrá publicaciones viejas en tu perfil.");
            btnSubmit.disabled = false;
        }
    });
});