import { storage } from './storage.js';

export const PropertyIdentifier = {
    render: (data = {}) => {
        const img = data.img || 'assets/target_scene_b.png';
        return `
        <header>
            <h1>Click on all the properties you can identify in this image.</h1>
            <p class="lead">A property is defined as a distinct object or feature in the image.</p>
        </header>

        <div class="property-id-wrapper">
            <div class="imgwrap target-wrap" id="imageWrapper">
                <img id="targetImage" src="${img}" alt="Property for identification"
                    draggable="false">
            </div>

            <div class="actions">
                <button id="undoBtn" class="secondary">Undo Last Marker</button>
                <button id="submitBtn" class="primary">Submit</button>
            </div>
        </div>
    `;
    },

    init: (container, data = {}) => {
        const wrapper = container.querySelector('#imageWrapper');
        const img = container.querySelector('#targetImage');
        const undoBtn = container.querySelector('#undoBtn');
        const submitBtn = container.querySelector('#submitBtn');

        let markers = [];

        function showToast(message) {
            const event = new CustomEvent('app-toast', { detail: message });
            window.dispatchEvent(event);
        }

        const handleDown = (e) => {
            e.preventDefault();
            const rect = img.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

            const normX = x / rect.width;
            const normY = y / rect.height;
            const pixelX = Math.round(normX * img.naturalWidth);
            const pixelY = Math.round(normY * img.naturalHeight);

            const markerElement = document.createElement('div');
            markerElement.className = 'marker';
            markerElement.style.left = `${normX * 100}%`;
            markerElement.style.top = `${normY * 100}%`;
            wrapper.appendChild(markerElement);

            markers.push({ pixelX, pixelY, element: markerElement });
        };

        const handleUndo = () => {
            if (markers.length > 0) {
                const last = markers.pop();
                last.element.remove();
            }
        };

        const handleSubmit = () => {
            if (markers.length === 0) {
                showToast("Please click on at least one property!");
                return;
            }
            const results = markers.map(m => ({ x: m.pixelX, y: m.pixelY }));
            storage.saveResult('property_identifier', { markers: results }, data);
            showToast(`Submitted: ${results.length} markers`);

            // Clear markers after submit
            while (markers.length > 0) handleUndo();
        };

        wrapper.addEventListener('pointerdown', handleDown);
        undoBtn.addEventListener('click', handleUndo);
        submitBtn.addEventListener('click', handleSubmit);

        return () => {
            // Cleanup
        };
    }
};
