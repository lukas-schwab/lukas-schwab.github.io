/**
 * Similarity Labeling Controller
 * Handles similarity rating via slider
 */
import { storage } from '../storage.js';
import { showToast, applyButtonCooldown } from '../utils.js';

export const SimilarityLabelingController = {
    init: (container, taskConfig = {}) => {
        const { taskId, assets: data = {} } = taskConfig;
        const slider = container.querySelector('#similaritySlider');
        const submitBtn = container.querySelector('#submitBtn');
        const imgA = container.querySelector('#similarityImgA');
        const imgB = container.querySelector('#similarityImgB');

        // Set image sources
        if (imgA) imgA.src = data.imgA || 'assets/concepts/concept_0.png';
        if (imgB) imgB.src = data.imgB || 'assets/concepts/concept_1.png';

        const handleSubmit = () => {
            const value = slider.value;
            storage.saveResult(taskId, 'similarity_labeling', { rank: value }, data, window.getTaskStartTime?.());
            showToast(`Submitted: Score ${value}/5`);

            // Visual feedback on button
            applyButtonCooldown(submitBtn);
        };

        submitBtn.addEventListener('click', handleSubmit);

        return () => {
            submitBtn.removeEventListener('click', handleSubmit);
        };
    }
};
