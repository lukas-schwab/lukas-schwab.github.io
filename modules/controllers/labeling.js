/**
 * Labeling Controller
 * Handles image labeling input and submission
 */
import { storage } from '../storage.js';
import { showToast, applyButtonCooldown } from '../utils.js';
import { t } from '../i18n.js';

export const LabelingController = {
    init: (container, taskConfig = {}) => {
        const { taskId, assets: data = {} } = taskConfig;
        const input = container.querySelector('#imageLabel');
        const submitBtn = container.querySelector('#submitBtn');
        const charCount = container.querySelector('#currentCharCount');
        const image = container.querySelector('#labelImage');

        // Set image source
        if (image) image.src = data.img || 'assets/patches/patch_3_0.png';

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
