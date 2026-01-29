import { storage } from './storage.js';

export const PropertyIdentifier = {
    render: (data = {}) => {
        const img = data.img || 'assets/targets/img_0.png';
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
            const wrapperRect = wrapper.getBoundingClientRect();
            const imgRect = img.getBoundingClientRect();
            
            // Calculate click position relative to the wrapper
            const clickX = e.clientX - wrapperRect.left;
            const clickY = e.clientY - wrapperRect.top;
            
            // Calculate click position relative to the image
            const imgX = e.clientX - imgRect.left;
            const imgY = e.clientY - imgRect.top;

            // Check if click is within image bounds
            if (imgX < 0 || imgX > imgRect.width || imgY < 0 || imgY > imgRect.height) return;

            // Calculate normalized position relative to the image
            const normX = imgX / imgRect.width;
            const normY = imgY / imgRect.height;
            
            // Calculate pixel coordinates on the original image
            const pixelX = Math.round(normX * img.naturalWidth);
            const pixelY = Math.round(normY * img.naturalHeight);

            // Position marker relative to wrapper using wrapper coordinates
            const markerElement = document.createElement('div');
            markerElement.className = 'marker';
            markerElement.style.left = `${clickX}px`;
            markerElement.style.top = `${clickY}px`;
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
