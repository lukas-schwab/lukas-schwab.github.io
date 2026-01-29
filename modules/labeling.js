import { storage } from './storage.js';

export const Labeling = {
    render: (data = {}) => {
        const img = data.img || 'assets/patches/patch_3_0.png';
        return `
        <header>
            <div class="header-content">
                <div>
                    <h1>Enter a label for this image</h1>
                    <p class="lead">Keep it short and descriptive.</p>
                </div>
            </div>
        </header>

        <section class="labeling-container">
            <div class="image-preview">
                <div class="imgwrap">
                    <img src="${img}" alt="Image to label" draggable="false">
                </div>
            </div>

            <div class="input-section">
                <div class="input-group">
                    <input type="text" id="imageLabel" placeholder="Enter label here..." maxlength="16"
                        autocomplete="off">
                    <button id="submitBtn" class="primary">Submit</button>
                </div>
                <div class="char-count"><span id="currentCharCount">0</span>/16</div>
            </div>
        </section>
    `;
    },

    init: (container, data = {}) => {
        const input = container.querySelector('#imageLabel');
        const submitBtn = container.querySelector('#submitBtn');
        const charCount = container.querySelector('#currentCharCount');

        function showToast(message) {
            const event = new CustomEvent('app-toast', { detail: message });
            window.dispatchEvent(event);
        }

        const handleInput = () => {
            charCount.textContent = input.value.length;
        };

        const handleSubmit = () => {
            const label = input.value.trim();
            if (label) {
                storage.saveResult('labeling', { label }, data);
                showToast(`Submitted: "${label}"`);
                input.value = '';
                charCount.textContent = '0';
            } else {
                showToast('Please enter a label.');
            }
        };

        const handleKey = (e) => {
            if (e.key === 'Enter') handleSubmit();
        };

        input.addEventListener('input', handleInput);
        submitBtn.addEventListener('click', handleSubmit);
        input.addEventListener('keypress', handleKey);

        return () => {
            // Cleanup if needed
        };
    }
};
