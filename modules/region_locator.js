import { storage } from './storage.js';

export const RegionLocator = {
    render: (data = {}) => {
        const imgA = data.imgA || 'assets/patches/patch_3_0.png';
        const imgB = data.imgB || 'assets/targets/img_0.png';
        return `
        <header>
            <div class="header-content">
                <div>
                    <h1>Encircle image A in image B.</h1>
                    <p class="lead">Draw a boundary around the matching location on image B.</p>
                </div>
            </div>
        </header>

        <section class="locator-grid">
            <div id="cardA" style="height: fit-content;">
                <div class="card-label">Image A (Reference)</div>
                <div class="imgwrap" id="imgWrapA">
                    <img id="imgA" alt="Image A" src="${imgA}" draggable="false">
                </div>
                <div class="meta">
                    <div class="hint">Target object to find</div>
                </div>
            </div>

            <div id="cardB">
                <div class="card-label">Image B (Draw here)</div>
                <div class="imgwrap target-wrap" id="imgWrapB">
                    <img id="imgB" alt="Image B" src="${imgB}" draggable="false">
                    <canvas id="regionCanvas" class="region-canvas"></canvas>
                </div>
                <div class="meta">
                    <div class="hint">Click and drag to encircle</div>
                </div>
            </div>
        </section>

        <div class="actions">
            <button id="notFoundBtn" class="secondary">I do not see where image A is</button>
            <button id="submitBtn" class="primary">Submit</button>
        </div>

        <div class="status" id="status"></div>
    `;
    },

    init: (container, data = {}) => {
        const elements = {
            imgA: container.querySelector('#imgA'),
            imgB: container.querySelector('#imgB'),
            cardA: container.querySelector('#cardA'),
            imgWrapB: container.querySelector('#imgWrapB'),
            canvas: container.querySelector('#regionCanvas'),
            submitBtn: container.querySelector('#submitBtn'),
            notFoundBtn: container.querySelector('#notFoundBtn'),
        };

        const ctx = elements.canvas.getContext('2d');
        const state = {
            isDrawing: false,
            isRealInteraction: false,
            points: [],
            tempPoints: [],
            startTime: 0,
            regionPlaced: false,
            resizeObserver: null
        };

        function showToast(message) {
            const event = new CustomEvent('app-toast', { detail: message });
            window.dispatchEvent(event);
        }

        function resizeCanvas() {
            if (!elements.imgB) return;
            const rect = elements.imgB.getBoundingClientRect();
            elements.canvas.width = rect.width;
            elements.canvas.height = rect.height;
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
            ctx.strokeStyle = '#ff4757';
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
            ctx.shadowBlur = 0;
        }

        function render() {
            ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
            if (state.isDrawing && state.isRealInteraction) {
                drawPoints(state.tempPoints, false);
            } else if (state.points.length > 2) {
                drawPoints(state.points, true);
            }
        }

        function handlePointerDown(e) {
            state.startTime = Date.now();
            state.isDrawing = true;
            state.isRealInteraction = false;
            state.tempPoints = [];
            addPointTo(e, state.tempPoints);
        }

        function handlePointerMove(e) {
            if (!state.isDrawing) return;
            addPointTo(e, state.tempPoints);
            if (!state.isRealInteraction) {
                const duration = Date.now() - state.startTime;
                if (duration > 200 || state.tempPoints.length > 5) {
                    state.isRealInteraction = true;
                }
            }
            if (state.isRealInteraction) render();
        }

        function handlePointerUp(e) {
            if (!state.isDrawing) return;
            const duration = Date.now() - state.startTime;
            if (state.isRealInteraction && duration >= 200 && state.tempPoints.length > 2) {
                state.points = [...state.tempPoints];
                state.regionPlaced = true;
            } else {
                showToast("Hold down longer to draw!");
            }
            state.isDrawing = false;
            state.isRealInteraction = false;
            state.tempPoints = [];
            render();
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
            if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
                pointsArray.push({ x, y });
            }
        }

        function handleSubmit() {
            if (!state.regionPlaced) {
                showToast("Please encircle a region on Image B first!");
                return;
            }
            const results = state.points.map(p => ({
                x: Math.round(p.x * elements.imgB.naturalWidth),
                y: Math.round(p.y * elements.imgB.naturalHeight)
            }));
            storage.saveResult('image_region_locator', { points: results }, data);
            showToast("Submitted: Region");
        }

        function handleNotFound() {
            storage.saveResult('image_region_locator', { notFound: true }, data);
            showToast("Submitted: Region not found.");
        }

        elements.imgWrapB.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        elements.submitBtn.addEventListener('click', handleSubmit);
        elements.notFoundBtn.addEventListener('click', handleNotFound);
        elements.cardA.addEventListener('click', () => showToast("You can only draw on Image B"));

        state.resizeObserver = new ResizeObserver(resizeCanvas);
        state.resizeObserver.observe(elements.imgWrapB);
        state.resizeObserver.observe(elements.imgB);
        if (elements.imgB.complete) resizeCanvas(); else elements.imgB.onload = resizeCanvas;

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            state.resizeObserver.disconnect();
        };
    }
};
