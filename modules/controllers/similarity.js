/**
 * Property Identifier Controller
 * Handles clicking on properties in an image
 */
import { storage } from '../storage.js';
import { showToast, applyButtonCooldown } from '../utils.js';
import { t } from '../i18n.js';

export const PropertyIdentifierController = {
    init: (container, taskConfig = {}) => {
        const { taskId, assets: data = {} } = taskConfig;
        const wrapper = container.querySelector('#imageWrapper');
        const img = container.querySelector('#targetImage');
        const undoBtn = container.querySelector('#undoBtn');
        const submitBtn = container.querySelector('#submitBtn');

        // Set image source
        if (img) img.src = data.img || 'assets/targets/img_0.png';

        let markers = [];

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
            if (submitBtn.disabled) return;
            if (markers.length === 0) {
                showToast(t('messages.clickProperty'));
                return;
            }
            const results = markers.map(m => ({ x: m.pixelX, y: m.pixelY }));
            storage.saveResult(taskId, 'property_identifier', { markers: results }, data);
            showToast(`Submitted: ${results.length} markers`);

            // Cooldown logic
            applyButtonCooldown(submitBtn).then(() => {
                // Clear markers after submit
                while (markers.length > 0) handleUndo();
            });
        };

        wrapper.addEventListener('pointerdown', handleDown);
        undoBtn.addEventListener('click', handleUndo);
        submitBtn.addEventListener('click', handleSubmit);

        return () => {
            wrapper.removeEventListener('pointerdown', handleDown);
            undoBtn.removeEventListener('click', handleUndo);
            submitBtn.removeEventListener('click', handleSubmit);
        };
    }
};
