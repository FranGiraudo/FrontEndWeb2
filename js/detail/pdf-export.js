/**
 * js/detail/pdf-export.js
 * Módulo para inicializar la lógica de generación y exportación de fichas PDF.
 */

export function initPdfExport(car, showToast) {
    const btnPdf = document.getElementById('btn-download-pdf');
    if (!btnPdf) return;

    btnPdf.addEventListener('click', async () => {
        if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
            if (typeof showToast === 'function') showToast("Las librerías para PDF no están cargadas.", "error");
            return;
        }

        btnPdf.disabled = true;
        btnPdf.innerHTML = "Generando PDF...";

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Colors
            const accentColor = [118, 74, 241];
            const darkText = [40, 40, 40];
            const grayText = [100, 100, 100];

            // Header Background
            pdf.setFillColor(20, 20, 20);
            pdf.rect(0, 0, pdfWidth, 40, 'F');

            // Title
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(24);
            pdf.setFont("helvetica", "bold");
            pdf.text("SMARTAUTO", 20, 25);
            
            pdf.setTextColor(200, 200, 200);
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "normal");
            pdf.text("Ficha Técnica Oficial", pdfWidth - 60, 25);

            // Car details
            pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
            pdf.setFontSize(22);
            pdf.setFont("helvetica", "bold");
            pdf.text(`${car.brand} ${car.model}`, 20, 60);

            pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
            pdf.setFontSize(18);
            pdf.text(`u$s ${Number(car.price).toLocaleString()}`, pdfWidth - 60, 60);

            pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
            pdf.setFontSize(12);
            pdf.text(`${car.year}  •  ${car.km.toLocaleString()} km  •  ${car.location}`, 20, 70);

            // Load image properly using a Promise to ensure it's ready
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = car.image || '';
            
            await new Promise((resolve) => {
                if (!car.image) { resolve(); return; }
                img.onload = resolve;
                img.onerror = () => { console.warn("No se pudo cargar la imagen para el PDF"); resolve(); };
            });
            
            // Draw image if available
            if (car.image) {
                pdf.addImage(img, 'JPEG', 20, 80, pdfWidth - 40, 100);
            }

            // Specifications Box
            pdf.setDrawColor(220, 220, 220);
            pdf.setFillColor(250, 250, 250);
            pdf.rect(20, 190, pdfWidth - 40, 60, 'FD');

            pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.text("Especificaciones:", 25, 200);

            pdf.setFontSize(11);
            pdf.setFont("helvetica", "normal");
            pdf.text(`Combustible: ${car.fuel}`, 25, 210);
            pdf.text(`Transmisión: ${car.transmission}`, 25, 220);
            pdf.text(`Carrocería: ${car.bodyType || 'Sedán'}`, 25, 230);

            pdf.text(`Estado: ${car.status || 'Disponible'}`, pdfWidth/2 + 10, 210);
            
            // Footer
            pdf.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
            pdf.rect(0, pdfHeight - 20, pdfWidth, 20, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.text(`SmartAuto Marketplace - ${new Date().toLocaleDateString()}`, 20, pdfHeight - 8);

            pdf.save(`Ficha_${car.brand}_${car.model}_${car.year}.pdf`);
            if (typeof showToast === 'function') showToast("PDF generado correctamente.", "success");

        } catch (error) {
            console.error(error);
            if (typeof showToast === 'function') showToast("Ocurrió un error al generar el PDF.", "error");
        } finally {
            btnPdf.disabled = false;
            btnPdf.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                Descargar Ficha PDF
            `;
        }
    });
}
