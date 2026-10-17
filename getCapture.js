(async () => {
    const SELECTOR = '#worksheet-preview';
    const OUTPUT_NAME = 'ejercicio-completo.png';
    const OUTPUT_WIDTH = 1000;

    const target = document.querySelector(SELECTOR);

    if (!target) {
        console.error('No se encontró el elemento #worksheet-preview.');
        return;
    }

    // =========================================================
    // 1. CARGAR HTML2CANVAS
    // =========================================================

    if (typeof html2canvas === 'undefined') {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');

            script.src =
                'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

            script.onload = resolve;
            script.onerror = () => reject(
                new Error('No se pudo cargar html2canvas.')
            );

            document.head.appendChild(script);
        });
    }

    // =========================================================
    // 2. ESPERAR LAS IMÁGENES DEL EJERCICIO
    // =========================================================

    const images = [...target.querySelectorAll('img')];

    await Promise.all(images.map(async img => {
        if (!img.complete) {
            await new Promise(resolve => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
            });
        }

        if (img.naturalWidth === 0) {
            console.warn('No se pudo cargar una imagen:', img.src);
        }
    }));

    // Esperar a que el navegador termine de renderizar
    await new Promise(resolve =>
        requestAnimationFrame(() =>
            requestAnimationFrame(resolve)
        )
    );

    // =========================================================
    // 3. DETERMINAR LAS DIMENSIONES ORIGINALES
    // =========================================================

    const previewWidth = 1000;

    // El SVG final de tu HTML mide 1000 × 2828.
    // Se utiliza como referencia para capturar las dos páginas.
    const svg = target.querySelector(
        '#worksheet-final-svg, #worksheet-svg'
    );

    const svgHeight = svg
        ? parseFloat(svg.getAttribute('height')) || 2828
        : 2828;

    // =========================================================
    // 4. CAPTURAR TODO EL EJERCICIO
    // =========================================================

    const canvas = await html2canvas(target, {
        scale: 1,
        width: previewWidth,
        height: svgHeight,

        // Mantener un fondo blanco
        backgroundColor: '#ffffff',

        // Intentar incluir imágenes externas
        useCORS: true,
        allowTaint: false,

        logging: false,

        // Evitar que el zoom 0.6 reduzca la captura
        onclone: clonedDoc => {
            const clonedTarget =
                clonedDoc.querySelector(SELECTOR);

            if (!clonedTarget) return;

            clonedTarget.style.setProperty(
                'transform',
                'none',
                'important'
            );

            clonedTarget.style.setProperty(
                'transform-origin',
                'top left',
                'important'
            );

            clonedTarget.style.setProperty(
                'width',
                `${previewWidth}px`,
                'important'
            );

            clonedTarget.style.setProperty(
                'height',
                `${svgHeight}px`,
                'important'
            );

            clonedTarget.style.setProperty(
                'overflow',
                'visible',
                'important'
            );

            // Conservar los elementos de respuesta y selección.
            const elements = clonedTarget.querySelector(
                '#worksheet-preview-elements'
            );

            if (elements) {
                elements.style.setProperty(
                    'visibility',
                    'visible',
                    'important'
                );

                elements.style.setProperty(
                    'display',
                    'block',
                    'important'
                );
            }

            // Conservar la calificación si está visible.
            const rate = clonedTarget.querySelector('#worksheet-rate');
            const originalRate = target.querySelector('#worksheet-rate');

            if (rate && originalRate) {
                rate.style.display =
                    getComputedStyle(originalRate).display;

                rate.style.visibility =
                    getComputedStyle(originalRate).visibility;
            }

            // Mantener visibles las capas SVG.
            clonedTarget.querySelectorAll('svg').forEach(node => {
                node.style.overflow = 'visible';
            });
        }
    });

    // =========================================================
    // 5. AJUSTAR AL ANCHO EXACTO DE 1000 PX
    // =========================================================

    let finalCanvas = canvas;

    if (canvas.width !== OUTPUT_WIDTH) {
        const resized = document.createElement('canvas');

        resized.width = OUTPUT_WIDTH;
        resized.height = Math.round(
            canvas.height * OUTPUT_WIDTH / canvas.width
        );

        const ctx = resized.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, resized.width, resized.height);

        ctx.drawImage(
            canvas,
            0,
            0,
            resized.width,
            resized.height
        );

        finalCanvas = resized;
    }

    // =========================================================
    // 6. DESCARGAR PNG
    // =========================================================

    finalCanvas.toBlob(blob => {
        if (!blob) {
            console.error('No se pudo generar el PNG.');
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = OUTPUT_NAME;

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1500);

        console.log('Captura generada correctamente.');
        console.log('Ancho:', finalCanvas.width, 'px');
        console.log('Alto:', finalCanvas.height, 'px');
        console.log('Archivo:', OUTPUT_NAME);
    }, 'image/png');
})().catch(error => {
    console.error('Error al capturar el ejercicio:', error);
});
