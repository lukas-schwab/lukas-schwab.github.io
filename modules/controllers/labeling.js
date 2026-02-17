/**
 * Labeling Controller
 * Handles image labeling input and submission
 */
import { storage } from '../storage.js';
import { showToast, applyButtonCooldown } from '../utils.js';
import { t } from '../i18n.js';

/**
 * Extract class name from image URL path folder name only
 * E.g., 'assets/concepts/airliner/combined_airliner_2.png' -> 'airliner'
 * @param {string} imagePath - The image file path
 * @returns {string|null} The class name or null if not found
 */
function extractClassFromImagePath(imagePath) {
    const parts = imagePath.split('/');
    // Find the index of 'concepts', 'patches', or 'targets' and return the next part (folder name)
    const typeIndex = parts.findIndex(part => ['concepts', 'patches', 'targets'].includes(part));
    return typeIndex !== -1 && typeIndex + 1 < parts.length ? parts[typeIndex + 1] : t("labeling.defaultClassName");
}

export const LabelingController = {
    init: (container, taskConfig = {}) => {
        const { taskId, assets: data = {} } = taskConfig;
        const input = container.querySelector('#imageLabel');
        const submitBtn = container.querySelector('#submitBtn');
        const charCount = container.querySelector('#currentCharCount');
        const image = container.querySelector('#labelImage');
        const titleElement = container.querySelector('h1[data-i18n="labeling.title"]');

        // Set image source
        if (image) image.src = data.img || 'assets/patches/patch_3_0.png';

        // Extract class from image URL and update title
        if (titleElement && data.img) {
            const classValue = extractClassFromImagePath(data.img);
            if (classValue) {
                titleElement.textContent = t('labeling.title').replace('[class]', classValue);
            }
        }

        const handleInput = () => {
            charCount.textContent = input.value.length;
        };

        const handleSubmit = () => {
            if (submitBtn.disabled) return;
            const label = input.value.trim();
            if (label) {
                storage.saveResult(taskId, 'labeling', { label }, data, window.getTaskStartTime?.(), taskConfig.isDummy);
                showToast(`${t('labeling.submitBtn')}: "${label}"`);

                // Cooldown logic
                applyButtonCooldown(submitBtn).then(() => {
                    input.value = '';
                    charCount.textContent = '0';
                });
            } else {
                showToast(t('messages.enterLabel'));
            }
        };

        const handleKey = (e) => {
            if (e.key === 'Enter') handleSubmit();
        };

        input.addEventListener('input', handleInput);
        submitBtn.addEventListener('click', handleSubmit);
        input.addEventListener('keypress', handleKey);

        return () => {
            input.removeEventListener('input', handleInput);
            submitBtn.removeEventListener('click', handleSubmit);
            input.removeEventListener('keypress', handleKey);
        };
    }
};
