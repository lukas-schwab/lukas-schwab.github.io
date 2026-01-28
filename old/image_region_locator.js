// =============================================================================
// DOM ELEMENTS
// =============================================================================

const elements = {
    imgA: document.getElementById('imgA'),
    imgB: document.getElementById('imgB'),
    cardA: document.getElementById('cardA'),
    cardB: document.getElementById('cardB'),
    imgWrapB: document.getElementById('imgWrapB'),
    canvas: document.getElementById('regionCanvas'),
    toastContainer: document.getElementById('toast-container'),
    submitBtn: document.getElementById('submitBtn'),
    notFoundBtn: document.getElementById('notFoundBtn'),
};

const ctx = elements.canvas.getContext('2d');

// =============================================================================
// STATE
// =============================================================================

const state = {
    isDrawing: false,
    isRealInteraction: false,
    points: [], // Committed points, relative to image (0-1)
    tempPoints: [], // Points currently being drawn (0-1)
    startTime: 0,
    regionPlaced: false,
    resizeObserver: null
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

function resizeCanvas() {
    const rect = elements.imgB.getBoundingClientRect();
    elements.canvas.width = rect.width;
    elements.canvas.height = rect.height;

    // Position the canvas exactly over the image
    elements.canvas.style.left = `${elements.imgB.offsetLeft}px`;
    elements.canvas.style.top = `${elements.imgB.offsetTop}px`;
    elements.canvas.style.width = `${rect.width}px`;
    elements.canvas.style.height = `${rect.height}px`;

    if (state.points.length > 0 || (state.isDrawing && state.isRealInteraction)) {
        render();
    }
}

function drawPoints(pointsToDraw, isClosed) {
    if (!pointsToDraw || pointsToDraw.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = '#ff4757'; // var(--marker)
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 71, 87, 0.8)';

    const firstPoint = pointsToDraw[0];
    ctx.moveTo(firstPoint.x * elements.canvas.width, firstPoint.y * elements.canvas.height);

    for (let i = 1; i < pointsToDraw.length; i++) {
        const p = pointsToDraw[i];
        ctx.lineTo(p.x * elements.canvas.width, p.y * elements.canvas.height);
    }

    if (isClosed && pointsToDraw.length > 2) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 71, 87, 0.2)';
        ctx.fill();
    }

    ctx.stroke();
    // Reset shadow for next draw operations if any
    ctx.shadowBlur = 0;
}

function render() {
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

    if (state.isDrawing && state.isRealInteraction) {
        // While drawing, show the current path (unclosed)
        drawPoints(state.tempPoints, false);
    } else if (state.points.length > 2) {
        // Show the committed shape (closed)
        drawPoints(state.points, true);
    }
}

// =============================================================================
// LOGIC
// =============================================================================

function handlePointerDown(e) {
    state.startTime = Date.now();
    state.isDrawing = true;
    state.isRealInteraction = false;
    state.tempPoints = [];
    addPointTo(e, state.tempPoints);
    // Note: We don't render() yet to keep the old shape visible during the potential short click
}

function handlePointerMove(e) {
    if (!state.isDrawing) return;
    addPointTo(e, state.tempPoints);

    if (!state.isRealInteraction) {
        const duration = Date.now() - state.startTime;
        // If moved enough or enough time passed, it's a "real" intent to draw
        // 5 points is a simple threshold for movement
        if (duration > 200 || state.tempPoints.length > 5) {
            state.isRealInteraction = true;
        }
    }

    if (state.isRealInteraction) {
        render();
    }
}

function handlePointerUp(e) {
    if (!state.isDrawing) return;

    const duration = Date.now() - state.startTime;

    if (state.isRealInteraction && duration >= 200 && state.tempPoints.length > 2) {
        state.points = [...state.tempPoints];
        state.regionPlaced = true;
        console.log("Region defined and committed with", state.points.length, "points.");
    } else {
        if (duration < 200) {
            console.log("Interaction too short (<0.2s), ignoring.");
        } else if (state.tempPoints.length <= 2) {
            console.log("Not enough points for a shape, ignoring.");
        }
    }

    state.isDrawing = false;
    state.isRealInteraction = false;
    state.tempPoints = [];
    render(); // Redraw either the new points or restore the old points
}

function addPointTo(e, pointsArray) {
    const rect = elements.imgB.getBoundingClientRect();

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    // Boundary check
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        pointsArray.push({ x, y });
    }
}

function handleSubmit() {
    if (!state.regionPlaced) {
        showToast("Please encircle a region on Image B first!");
        return;
    }

    // Normalize points to natural dimensions for logging
    const naturalPoints = state.points.map(p => ({
        x: Math.round(p.x * elements.imgB.naturalWidth),
        y: Math.round(p.y * elements.imgB.naturalHeight)
    }));

    console.log("Submit clicked. Region points (normalized/pixel):", naturalPoints);
    showToast("Region submitted! (Check console for logs)");
}

function handleNotFound() {
    console.log("User reported: I do not see where image A is");
    showToast("Reported as not found. Thank you!");
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // We attach events to imgWrapB but need to handle coordinate calculation carefully
    elements.imgWrapB.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Button actions
    elements.submitBtn.addEventListener('click', handleSubmit);
    elements.notFoundBtn.addEventListener('click', handleNotFound);

    // Handle resizing
    state.resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
    });
    state.resizeObserver.observe(elements.imgWrapB);
    state.resizeObserver.observe(elements.imgB);

    if (elements.imgB.complete) {
        resizeCanvas();
    } else {
        elements.imgB.onload = resizeCanvas;
    }

    // Warn if Image A is clicked
    elements.cardA.addEventListener('click', () => showToast("You can only draw on Image B"));
}

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});
