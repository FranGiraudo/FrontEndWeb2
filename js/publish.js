/**
 * js/publish.js
 * Orquestador principal de la vista de publicación.
 */
import { initAuctionTabs } from './publish/auction-tabs.js';
import { initAiAutofill } from './publish/ai-autofill.js';
import { initFormSubmit } from './publish/form-submit.js';

document.addEventListener('DOMContentLoaded', async () => {
    const session = typeof window.requireAuth === 'function' ? window.requireAuth('vendedor') : null;
    if (!session) return;

    const uiNodes = {
        dropZone: document.getElementById('drop-zone'),
        fileInput: document.getElementById('file-input'),
        dropText: document.getElementById('drop-text'),
        galleryPreview: document.getElementById('gallery-preview'),
        aiBox: document.getElementById('ai-text'),
        aiContainer: document.getElementById('ai-container'),
        correctionUI: document.getElementById('correction-ui'),
        selectCarroceria: document.getElementById('select-carroceria-manual'),
        btnSubmit: document.querySelector('.btn-submit'),
        publishForm: document.getElementById('form-publicar'),
        marcaInput: document.getElementById('input-marca'),
        modeloInput: document.getElementById('input-modelo'),
        precioInput: document.getElementById('input-precio'),
        yearInput: document.getElementById('input-anio'),
        kmInput: document.getElementById('input-km'),
        engineInput: document.getElementById('input-engine'),
        fuelInput: document.getElementById('input-fuel'),
        transInput: document.getElementById('input-trans'),
        ubicacionInput: document.getElementById('input-ubicacion'),
        descripcionInput: document.getElementById('input-descripcion'),
        auctionPriceInput: document.getElementById('input-auction-price'),
        auctionDurationInput: document.getElementById('input-auction-duration'),
        
        actualizarTextoIA: function(manual = false) {
            if (!this.aiBox) return;
            this.aiBox.innerHTML = `<b>Carrocería${manual ? ' (Manual)' : ''}:</b> ${state.carroceriaDetectada}<br><b>Estado IA:</b> <span style="color:var(--accent-lavender);">${state.estadoGeneralIA}</span><br><b>Daños:</b> ${state.danosVisiblesIA}`;
        },
        mostrarSelectorManual: function() {
            if (this.correctionUI) this.correctionUI.style.display = 'block';
            if (this.selectCarroceria) this.selectCarroceria.value = state.carroceriaDetectada;
        }
    };

    const state = {
        fotosCargadas: [], fotoValidadaIA: false, carroceriaDetectada: "Sedán",
        estadoGeneralIA: "Buen estado", danosVisiblesIA: "Ninguno detectado",
        rangoPrecioIA: { min: 0, max: 0 }, aiScoreIA: 0, isAuctionMode: false, editModeId: null
    };

    const utils = {
        API_BASE_URL: typeof window.env !== 'undefined' ? window.env.API_BASE_URL : 'http://localhost:3000/api',
        getAuthHeaders: window.getAuthHeaders,
        showToast: window.showToast,
        getSession: window.getSession,
        saveCar: window.saveCar
    };

    if (uiNodes.selectCarroceria) {
        uiNodes.selectCarroceria.addEventListener('change', (e) => {
            state.carroceriaDetectada = e.target.value;
            uiNodes.actualizarTextoIA(true);
        });
    }

    const editId = new URLSearchParams(window.location.search).get('edit') || sessionStorage.getItem('editModeId');
    if (editId) {
        sessionStorage.removeItem('editModeId');
        state.editModeId = Number(editId);
        uiNodes.btnSubmit.textContent = "CARGANDO DATOS...";
        uiNodes.btnSubmit.disabled = true;

        const autoAEditar = await window.getCarById(state.editModeId);
        if (autoAEditar) {
            uiNodes.marcaInput.value = autoAEditar.brand;
            uiNodes.modeloInput.value = autoAEditar.model;
            uiNodes.yearInput.value = autoAEditar.year;
            uiNodes.precioInput.value = autoAEditar.price;
            uiNodes.kmInput.value = autoAEditar.km;
            uiNodes.engineInput.value = autoAEditar.engine || '';
            uiNodes.fuelInput.value = autoAEditar.fuel;
            uiNodes.transInput.value = autoAEditar.transmission;
            uiNodes.ubicacionInput.value = autoAEditar.location;
            uiNodes.descripcionInput.value = autoAEditar.description || '';

            state.fotosCargadas = autoAEditar.images || [];
            if (state.fotosCargadas.length > 0) {
                if (uiNodes.dropText) uiNodes.dropText.style.display = 'none';
                uiNodes.galleryPreview.innerHTML = state.fotosCargadas.map((url, idx) => `<div style="position:relative; display:inline-block;"><img src="${url}" class="thumb-preview"><button onclick="document.dispatchEvent(new CustomEvent('removeImage', {detail: '${url}'}))" style="position:absolute;top:5px;right:5px;background:rgba(255,0,0,0.8);color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:12px;font-weight:bold;">X</button></div>`).join('');
                document.addEventListener('removeImage', (e) => {
                    state.fotosCargadas = state.fotosCargadas.filter(u => u !== e.detail);
                    e.target.parentElement.remove(); // This event setup is simplified for ES modules edit mode
                    if(state.fotosCargadas.length === 0) { if(uiNodes.dropText) uiNodes.dropText.style.display='block'; state.fotoValidadaIA=false; }
                });
            }

            state.fotoValidadaIA = true;
            state.carroceriaDetectada = autoAEditar.bodyType || "Sedán";
            state.estadoGeneralIA = autoAEditar.aiStatus || "Excelente estado";
            state.danosVisiblesIA = autoAEditar.aiDamages || "Ninguno visible";
            state.rangoPrecioIA = { min: autoAEditar.aiPriceMin || Math.round(autoAEditar.price*0.85), max: autoAEditar.aiPriceMax || Math.round(autoAEditar.price*1.15) };

            uiNodes.actualizarTextoIA();
            uiNodes.mostrarSelectorManual();
            if (uiNodes.aiContainer) { uiNodes.aiContainer.style.backgroundColor = "var(--accent-alpha-15)"; uiNodes.aiContainer.style.borderLeft = "4px solid var(--accent-lavender)"; }
            
            uiNodes.btnSubmit.disabled = false;
            uiNodes.btnSubmit.style.opacity = "1";
            uiNodes.btnSubmit.textContent = "GUARDAR CAMBIOS";
        } else {
            window.showToast("No se pudo cargar la publicación a editar.", "error");
            uiNodes.btnSubmit.textContent = "PUBLICAR VEHÍCULO";
        }
    }

    initAuctionTabs(state);
    initAiAutofill(uiNodes, state, utils);
    initFormSubmit(uiNodes, state, utils);
});
