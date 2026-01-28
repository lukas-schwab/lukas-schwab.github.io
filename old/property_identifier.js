document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('imageWrapper');
    const img = document.getElementById('targetImage');
    const undoBtn = document.getElementById('undoBtn');
    const submitBtn = document.getElementById('submitBtn');

    let markers = []; // Stores { pixelX, pixelY, element }

    container.addEventListener('pointerdown', (e) => {
        // Prevent default browser behavior (like dragging)
        e.preventDefault();

        // Get coordinates relative to the bounding box of the image
        const rect = img.getBoundingClientRect();

        // offsetX/Y relative to the image element
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Ensure the click is within the image bounds
        if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
            return;
        }

        // Calculate normalized coordinates (0 to 1)
        const normX = x / rect.width;
        const normY = y / rect.height;

        // Calculate original pixel coordinates
        const pixelX = Math.round(normX * img.naturalWidth);
        const pixelY = Math.round(normY * img.naturalHeight);

        // Create marker
        const markerElement = document.createElement('div');
        markerElement.className = 'marker';

        // Position marker using percentages to stay responsive
        markerElement.style.left = `${normX * 100}%`;
        markerElement.style.top = `${normY * 100}%`;

        container.appendChild(markerElement);

        // Store both coordinates and the element for undo
        markers.push({ pixelX, pixelY, element: markerElement });

        // Log to console as requested
        console.log(`Point Recorded: { x: ${pixelX}, y: ${pixelY} } (Image Size: ${img.naturalWidth}x${img.naturalHeight})`);
        console.log(`Number of markers: ${markers.length}`);
    });

    undoBtn.addEventListener('click', () => {
        if (markers.length > 0) {
            const lastMarker = markers.pop();
            lastMarker.element.remove();
            console.log('Last marker removed.');
            console.log(`Number of markers: ${markers.length}`);
        } else {
            console.log('No markers to remove.');
        }
    });

    submitBtn.addEventListener('click', () => {
        const results = markers.map(m => ({ x: m.pixelX, y: m.pixelY }));
        console.log('--- Submission Results ---');
        console.log('Total markers:', results.length);
        console.log('Coordinates:', results);
        console.table(results);
        alert(`Submitted ${results.length} markers! Check console for details.`);
    });
});
