const input = document.getElementById('imageLabel');
const submitBtn = document.getElementById('submitBtn');
const charCount = document.getElementById('currentCharCount');
const status = document.getElementById('status');

input.addEventListener('input', () => {
    charCount.textContent = input.value.length;
});

submitBtn.addEventListener('click', () => {
    const label = input.value.trim();
    if (label) {
        console.log('Label submitted:', label);
        status.textContent = `Submitted: "${label}"`;
        input.value = '';
        charCount.textContent = '0';

        // Brief feedback
        setTimeout(() => {
            status.textContent = '';
        }, 3000);
    } else {
        status.textContent = 'Please enter a label.';
    }
});

// Enter key support
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitBtn.click();
    }
});