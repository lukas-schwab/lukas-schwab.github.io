/**
 * Region Locator Controller
 * Handles canvas drawing and region selection logic
 */
import { storage } from '../storage.js';
import { showToast, applyMultiButtonCooldown } from '../utils.js';
import { INTERACTION, DRAWING_STYLE } from '../constants.js';
import { t } from '../i18n.js';

export const RegionLocatorController = {
    init: (container, taskConfig = {}) => {
        const { taskId, assets: data = {} } = taskConfig;
        const elements = {
            imgA: container.querySelector('#imgA'),
            imgB: container.querySelector('#imgB'),
            cardA: container.querySelector('#cardA'),
            imgWrapB: container.querySelector('#imgWrapB'),
            canvas: container.querySelector('#regionCanvas'),
            submitBtn: container.querySelector('#submitBtn'),
            notFoundBtn: container.querySelector('#notFoundBtn'),
        };

        // Set image sources
        if (elements.imgA) elements.imgA.src = data.imgA || 'assets/patches/patch_3_0.png';
        if (elements.imgB) elements.imgB.src = data.imgB || 'assets/targets/img_0.png';

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
            ctx.strokeStyle = DRAWING_STYLE.strokeColor;
            ctx.lineWidth = DRAWING_STYLE.lineWidth;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.shadowBlur = DRAWING_STYLE.shadowBlur;
            ctx.shadowColor = DRAWING_STYLE.shadowColor;

            const firstPoint = pointsToDraw[0];
            ctx.moveTo(firstPoint.x * elements.canvas.width, firstPoint.y * elements.canvas.height);

            for (let i = 1; i < pointsToDraw.length; i++) {
                const p = pointsToDraw[i];
                ctx.lineTo(p.x * elements.canvas.width, p.y * elements.canvas.height);
            }

            if (isClosed && pointsToDraw.length > 2) {
                ctx.closePath();
                ctx.fillStyle = `rgba(255, 71, 87, ${DRAWING_STYLE.fillOpacity})`;
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
                if (duration > INTERACTION.MIN_DRAW_DURATION || state.tempPoints.length > INTERACTION.MIN_DRAW_POINTS) {
                    state.isRealInteraction = true;
                }
            }
            if (state.isRealInteraction) render();
        }

        function handlePointerUp(e) {
            if (!state.isDrawing) return;
            const duration = Date.now() - state.startTime;
            if (state.isRealInteraction && duration >= INTERACTION.MIN_DRAW_DURATION && state.tempPoints.length > 2) {
                state.points = [...state.tempPoints];
                state.regionPlaced = true;
            } else {
                showToast(t('messages.holdLongerToDraw'));
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
            if (elements.submitBtn.disabled) return;
            if (!state.regionPlaced) {
                showToast(t('messages.encircleRegion'));
                return;
            }
            const results = state.points.map(p => ({
                x: Math.round(p.x * elements.imgB.naturalWidth),
                y: Math.round(p.y * elements.imgB.naturalHeight)
            }));
            storage.saveResult(taskId, 'image_region_locator', { points: results }, data);
            showToast(t('messages.submittedRegion'));

            // Cooldown logic
            applyMultiButtonCooldown(
                [elements.submitBtn, elements.notFoundBtn],
                elements.submitBtn
            );
        }

        function handleNotFound() {
            if (elements.notFoundBtn.disabled) return;
            storage.saveResult(taskId, 'image_region_locator', { notFound: true }, data);
            showToast(t('messages.submittedRegionNotFound'));

            // Cooldown logic
            applyMultiButtonCooldown(
                [elements.submitBtn, elements.notFoundBtn],
                elements.notFoundBtn
            );
        }

        elements.imgWrapB.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        elements.submitBtn.addEventListener('click', handleSubmit);
        elements.notFoundBtn.addEventListener('click', handleNotFound);
        elements.cardA.addEventListener('click', () => showToast(t('messages.drawOnImageB')));

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
