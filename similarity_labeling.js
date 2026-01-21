const slider = document.getElementById('similaritySlider');
const submitBtn = document.getElementById('submitBtn');
const status = document.getElementById('status');

submitBtn.addEventListener('click', () => {
    const value = slider.value;
    console.log('Similarity submitted:', value);

    // Visual feedback
    status.textContent = `Ranking of ${value}/5 submitted to console.`;
    status.style.color = 'var(--accent)';

    // Brief success state
    submitBtn.style.opacity = '0.7';
    submitBtn.textContent = 'Submitted!';

    setTimeout(() => {
        status.textContent = '';
        submitBtn.style.opacity = '1';
        submitBtn.textContent = 'Submit Ranking';
    }, 3000);
});

// Update value display if we wanted to (but the slider itself shows position)
slider.addEventListener('input', () => {
    // Optional: could add some animation or audio feedback here
});