// =============================================================================
// DOM ELEMENTS
// =============================================================================

const elements = {
    imgA: document.getElementById('imgA'),
    imgB: document.getElementById('imgB'),
    cardA: document.getElementById('cardA'),
    cardB: document.getElementById('cardB'),
    imgWrapB: document.getElementById('imgWrapB'),
    marker: document.getElementById('marker'),
    toastContainer: document.getElementById('toast-container'),
    submitBtn: document.getElementById('submitBtn'),
    notFoundBtn: document.getElementById('notFoundBtn'),
};

// =============================================================================
// STATE
// =============================================================================

const state = {
    markerPlaced: false,
    coordinates: { x: null, y: null, pxX: null, pxY: null }
};

// =============================================================================
// UTILS
// =============================================================================

function showToast(message) {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;

    elements.toastContainer.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

// =============================================================================
// LOGIC
// =============================================================================

function handleImageAClick(e) {
    showToast("You can only click on B");
}

function handleImageBInteraction(e) {
    const wrapRect = elements.imgWrapB.getBoundingClientRect();
    const rect = elements.imgB.getBoundingClientRect();

    // Get interaction coordinates relative to the screen
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    // Coordinates relative to the IMAGE for pixel calculation
    const imgX = clientX - rect.left;
    const imgY = clientY - rect.top;

    // Boundary check (ensure click is inside the image)
    if (imgX < 0 || imgX > rect.width || imgY < 0 || imgY > rect.height) {
        console.log("Clicked outside image boundaries");
        return;
    }

    // Coordinates relative to the WRAPPER for marker positioning
    const markerX = clientX - wrapRect.left;
    const markerY = clientY - wrapRect.top;

    // Calculate normalized coordinates (0 to 1) based on image size
    const normX = imgX / rect.width;
    const normY = imgY / rect.height;

    // Calculate pixel coordinates
    const pxX = Math.round(normX * elements.imgB.naturalWidth);
    const pxY = Math.round(normY * elements.imgB.naturalHeight);

    state.coordinates = {
        x: normX,
        y: normY,
        pxX: pxX,
        pxY: pxY
    };

    updateMarker(markerX, markerY);

    console.log(`Marker placed at: Pixel(${pxX}, ${pxY}), Normalized(${normX.toFixed(4)}, ${normY.toFixed(4)})`);
    state.markerPlaced = true;
}

function updateMarker(x, y) {
    elements.marker.style.display = 'block';
    elements.marker.style.left = `${x}px`;
    elements.marker.style.top = `${y}px`;
}

function handleSubmit() {
    if (!state.markerPlaced) {
        showToast("Please select a location on Image B first!");
        console.log("Submit clicked, but no marker placed.");
        return;
    }
    console.log("Submit clicked. Final coordinates:", state.coordinates);
    showToast("Decision submitted! (Check console for logs)");
}

function handleNotFound() {
    console.log("User reported: I do not see where image A is in image B");
    showToast("Reported as not found. Thank you!");
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // Image A click
    elements.cardA.addEventListener('click', handleImageAClick);

    // Image B interaction - using pointer events for broader support (mouse + touch)
    // We attach to the wrap but calculate relative to the image
    elements.imgWrapB.addEventListener('pointerdown', (e) => {
        handleImageBInteraction(e);
    });

    // Button actions
    elements.submitBtn.addEventListener('click', handleSubmit);
    elements.notFoundBtn.addEventListener('click', handleNotFound);

    // Initial check for natural dimensions (in case image is already loaded)
    if (elements.imgB.complete) {
        // Ready
    } else {
        elements.imgB.onload = () => {
            console.log("Image B loaded. Natural dimensions:", elements.imgB.naturalWidth, "x", elements.imgB.naturalHeight);
        };
    }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});
