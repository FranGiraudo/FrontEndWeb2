/**
 * js/publish/form-submit.js
 * Módulo para gestionar el envío del formulario principal.
 */

export function initFormSubmit(uiNodes, state, utils) {
    const { publishForm, btnSubmit, marcaInput, modeloInput, precioInput, yearInput, kmInput, engineInput, fuelInput, transInput, ubicacionInput, descripcionInput, auctionPriceInput, auctionDurationInput } = uiNodes;
    const { getSession, saveCar, showToast } = utils;

    publishForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!state.fotoValidadaIA || state.fotosCargadas.length === 0) {
            showToast("Esperá a cargar imágenes y a que se complete el análisis IA.", "error");
            return;
        }

        btnSubmit.innerHTML = "GUARDANDO...";
        btnSubmit.disabled = true;

        const datosAuto = {
            brand:        marcaInput.value.trim(),
            model:        modeloInput.value.trim(),
            year:         Number(yearInput.value),
            price:        parseFloat(precioInput.value),
            km:           Number(kmInput.value),
            engine:       engineInput.value.trim(),
            fuel:         fuelInput.value,
            transmission: transInput.value,
            location:     ubicacionInput.value.trim(),
            description:  descripcionInput.value.trim(),
            bodyType:     state.carroceriaDetectada,
            aiStatus:     state.estadoGeneralIA,
            aiDamages:    state.danosVisiblesIA,
            aiPriceMin:   Number(state.rangoPrecioIA.min),
            aiPriceMax:   Number(state.rangoPrecioIA.max),
            aiScore:      Number(state.aiScoreIA) || 0,
            images:       state.fotosCargadas
        };

        if (state.isAuctionMode) {
            datosAuto.isAuction = true;
            datosAuto.auctionStartingPrice = parseFloat(auctionPriceInput.value) || 0;
            datosAuto.auctionDurationDays = parseInt(auctionDurationInput.value) || 3;
            if (datosAuto.auctionStartingPrice <= 0) {
                showToast("El precio inicial de subasta debe ser mayor a 0", "error");
                btnSubmit.innerHTML = state.editModeId ? "GUARDAR CAMBIOS" : "PUBLICAR VEHÍCULO";
                btnSubmit.disabled = false;
                return;
            }
        } else {
            datosAuto.isAuction = false;
        }

        try {
            const session = getSession();
            let savedCar;
            
            if (state.editModeId) {
                const API_URL = typeof window.env !== 'undefined' ? window.env.API_URL : 'http://localhost:3000/api';
                const response = await fetch(`${API_URL}/cars/${state.editModeId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.token}`
                    },
                    body: JSON.stringify(datosAuto)
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || 'Error al actualizar auto');
                }
                savedCar = await response.json();
                showToast("¡Vehículo actualizado con éxito!", "success");
            } else {
                savedCar = await saveCar(datosAuto);
                showToast("¡Vehículo publicado con éxito!", "success");
            }
            
            if (savedCar) {
                setTimeout(() => {
                    window.location.href = "profile.html";
                }, 1500);
            }
        } catch (error) {
            console.error("Error guardando auto:", error);
            showToast(error.message || "Error al guardar publicación.", "error");
            btnSubmit.innerHTML = state.editModeId ? "GUARDAR CAMBIOS" : "PUBLICAR VEHÍCULO";
            btnSubmit.disabled = false;
        }
    });
}
