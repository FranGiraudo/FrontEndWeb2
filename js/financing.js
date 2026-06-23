// js/financing.js

/**
 * Simulador de Financiacion
 * Genera dinamicamente la interfaz y maneja el estado local del simulador.
 */

const TASA_INTERES_MENSUAL = 0.05; // 5% mensual simulado

/**
 * Calcula la cuota mensual de un prestamo.
 * @param {number} monto - Monto a financiar.
 * @param {number} meses - Plazo en meses.
 * @returns {number} Cuota mensual.
 */
function calcularCuota(monto, meses) {
    if (monto <= 0 || meses <= 0) return 0;
    // Formula de cuota fija: C = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    const r = TASA_INTERES_MENSUAL;
    const n = meses;
    const cuota = monto * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return cuota;
}

/**
 * Inicializa e inyecta el componente de financiacion en el contenedor especificado.
 * @param {HTMLElement} container - Elemento del DOM donde se inyectara el simulador.
 * @param {number} precioVehiculo - Precio total del vehiculo.
 */
function initFinancingSimulator(container, precioVehiculo) {
    // 1. Creacion del contenedor principal
    const simulatorWrapper = document.createElement('div');
    simulatorWrapper.className = 'financing-calculator';

    // 2. Titulo
    const title = document.createElement('div');
    title.className = 'financing-title';
    title.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
        Simulador de Financiacion
    `;
    simulatorWrapper.appendChild(title);

    // 3. Grupo: Anticipo
    const anticipoGroup = document.createElement('div');
    anticipoGroup.className = 'financing-form-group';
    
    const anticipoLabel = document.createElement('label');
    anticipoLabel.className = 'financing-label';
    anticipoLabel.textContent = 'Anticipo (USD)';
    
    const anticipoInput = document.createElement('input');
    anticipoInput.type = 'number';
    anticipoInput.className = 'financing-input';
    anticipoInput.min = '0';
    anticipoInput.max = precioVehiculo.toString();
    anticipoInput.value = Math.round(precioVehiculo * 0.3).toString(); // 30% por defecto
    
    anticipoGroup.appendChild(anticipoLabel);
    anticipoGroup.appendChild(anticipoInput);
    simulatorWrapper.appendChild(anticipoGroup);

    // 4. Grupo: Plazo en meses
    const mesesGroup = document.createElement('div');
    mesesGroup.className = 'financing-form-group';
    
    const mesesLabel = document.createElement('label');
    mesesLabel.className = 'financing-label';
    mesesLabel.textContent = 'Plazo (Meses)';
    
    const mesesSelect = document.createElement('select');
    mesesSelect.className = 'financing-input';
    [12, 24, 36, 48, 60].forEach(mes => {
        const option = document.createElement('option');
        option.value = mes.toString();
        option.textContent = `${mes} meses`;
        if (mes === 24) option.selected = true;
        mesesSelect.appendChild(option);
    });

    mesesGroup.appendChild(mesesLabel);
    mesesGroup.appendChild(mesesSelect);
    simulatorWrapper.appendChild(mesesGroup);

    // 5. Caja de Resultado
    const resultBox = document.createElement('div');
    resultBox.className = 'financing-result-box';
    
    const resultLabel = document.createElement('div');
    resultLabel.className = 'financing-result-label';
    resultLabel.textContent = 'Cuota Mensual Estimada';
    
    const resultValue = document.createElement('div');
    resultValue.className = 'financing-result-value';
    
    resultBox.appendChild(resultLabel);
    resultBox.appendChild(resultValue);
    simulatorWrapper.appendChild(resultBox);

    // 6. Logica de actualizacion de estado (Reactividad manual)
    const updateResult = () => {
        let anticipo = parseFloat(anticipoInput.value) || 0;
        if (anticipo > precioVehiculo) {
            anticipo = precioVehiculo;
            anticipoInput.value = anticipo.toString();
        }
        
        const meses = parseInt(mesesSelect.value) || 24;
        const montoAFinanciar = precioVehiculo - anticipo;
        
        const cuota = calcularCuota(montoAFinanciar, meses);
        
        if (montoAFinanciar <= 0) {
            resultValue.textContent = 'u$s 0';
        } else {
            resultValue.textContent = `u$s ${Math.round(cuota).toLocaleString()}`;
        }
    };

    // 7. Event Listeners
    anticipoInput.addEventListener('input', updateResult);
    mesesSelect.addEventListener('change', updateResult);

    // Inicializar valor en el primer render
    updateResult();

    // Inyectar al DOM
    container.appendChild(simulatorWrapper);

    // 8. Costo Total del Vehículo (Mantenimiento Mensual Estimado)
    const maintenanceWrapper = document.createElement('div');
    maintenanceWrapper.className = 'financing-calculator'; // Reusamos los estilos de la calculadora
    maintenanceWrapper.style.marginTop = '1.5rem';

    const maintTitle = document.createElement('div');
    maintTitle.className = 'financing-title';
    maintTitle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
        Costo de Mantenimiento Mensual
    `;
    maintenanceWrapper.appendChild(maintTitle);

    const calcPatente = precioVehiculo * 0.05 / 12; // 5% anual / 12
    const calcSeguro = precioVehiculo * 0.01; // 1% mensual
    const calcMantenimiento = 50 + (precioVehiculo * 0.001); // Fijo + desgaste proporcional

    const totalCost = calcPatente + calcSeguro + calcMantenimiento;

    const costsHtml = `
        <div style="font-size: 0.85rem; color: var(--text-slate); margin-bottom: 0.5rem; display: flex; justify-content: space-between;">
            <span>Patente (5% anual / 12)</span> <span style="font-weight:600; color:var(--text-main);">u$s ${Math.round(calcPatente).toLocaleString()}</span>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-slate); margin-bottom: 0.5rem; display: flex; justify-content: space-between;">
            <span>Seguro Completo (~1%)</span> <span style="font-weight:600; color:var(--text-main);">u$s ${Math.round(calcSeguro).toLocaleString()}</span>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-slate); margin-bottom: 1rem; display: flex; justify-content: space-between;">
            <span>Service, nafta y gastos fijos</span> <span style="font-weight:600; color:var(--text-main);">u$s ${Math.round(calcMantenimiento).toLocaleString()}</span>
        </div>
        <div class="financing-result-box" style="margin-top: 0; background: var(--bg-card); border: 1px solid var(--border-color);">
            <div class="financing-result-label" style="font-size: 0.8rem;">Gasto Fijo Total (Estimado)</div>
            <div class="financing-result-value" style="font-size: 1.5rem;">u$s ${Math.round(totalCost).toLocaleString()}</div>
        </div>
    `;

    const costsDiv = document.createElement('div');
    costsDiv.innerHTML = costsHtml;
    maintenanceWrapper.appendChild(costsDiv);

    container.appendChild(maintenanceWrapper);
}
window.initFinancingSimulator = initFinancingSimulator;
