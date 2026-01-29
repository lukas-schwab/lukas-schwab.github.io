import { storage } from './storage.js';

export const SimilarityLabeling = {
    render: (data = {}) => {
        const imgA = data.imgA || 'assets/concepts/concept_0.png';
        const imgB = data.imgB || 'assets/concepts/concept_1.png';
        return `
        <header>
            <div class="header-content">
                <div>
                    <h1>How similar are these two image groups?</h1>
                    <p class="lead">Use the slider below to rank similarity from 1 (not similar) to 5 (identical).</p>
                </div>
            </div>
        </header>

        <section class="images">
            <div>
                <div class="imgwrap" style="margin-right: 1em">
                    <img src="${imgA}" alt="Reference Concept">
                </div>
            </div>

            <div>
                <div class="imgwrap" style="margin-left: 1em">
                    <img src="${imgB}" alt="Target Concept">
                </div>
            </div>
        </section>

        <section class="similarity-container">
            <div class="slider-section">
                <div class="slider-label-row">
                    <span>Not similar at all</span>
                    <span>Very similar</span>
                </div>

                <div class="slider-wrapper">
                    <input type="range" id="similaritySlider" min="1" max="5" step="1" value="3">
                    <div class="ticks">
                        <div class="tick"><span></span>1</div>
                        <div class="tick"><span></span>2</div>
                        <div class="tick"><span></span>3</div>
                        <div class="tick"><span></span>4</div>
                        <div class="tick"><span></span>5</div>
                    </div>
                </div>

                </div>
            <button id="submitBtn" class="primary">Submit</button>
        </section>
        <div class="status" id="status"></div>
    `;
    },

    init: (container, data = {}) => {
        const slider = container.querySelector('#similaritySlider');
        const submitBtn = container.querySelector('#submitBtn');
        const status = container.querySelector('#status');

        function showToast(message) {
            const event = new CustomEvent('app-toast', { detail: message });
            window.dispatchEvent(event);
        }

        const handleSubmit = () => {
            const value = slider.value;
            storage.saveResult('similarity_labeling', { rank: value }, data);
            showToast(`Submitted: Score ${value}/5`);

            // Visual feedback on button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitted!';
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit';
            }, 2000);
        };

        submitBtn.addEventListener('click', handleSubmit);

        return () => {
            // Cleanup
        };
    }
};
