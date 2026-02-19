import { DUMMY_TASKS } from '../config/task-registry.js';

const prefetchedImageUrls = new Set();
const inFlightImagePrefetches = new Map();

function getConnectionProfile() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = Boolean(connection?.saveData);
    const effectiveType = connection?.effectiveType || 'unknown';

    let concurrency = 4;
    if (saveData || effectiveType === '2g') {
        concurrency = 1;
    } else if (effectiveType === '3g') {
        concurrency = 2;
    }

    return { saveData, effectiveType, concurrency };
}

export function getTaskImageUrls(task = {}) {
    const assets = task.assets || {};
    const urls = [];

    if (typeof assets.img === 'string' && assets.img) urls.push(assets.img);
    if (typeof assets.imgA === 'string' && assets.imgA) urls.push(assets.imgA);
    if (typeof assets.imgB === 'string' && assets.imgB) urls.push(assets.imgB);

    return urls;
}

function getAllDummyImageUrls() {
    return Object.values(DUMMY_TASKS)
        .flatMap(task => getTaskImageUrls(task));
}

function prefetchSingleImage(url) {
    if (!url) return Promise.resolve();
    if (prefetchedImageUrls.has(url)) return Promise.resolve();
    if (inFlightImagePrefetches.has(url)) return inFlightImagePrefetches.get(url);

    const promise = new Promise(resolve => {
        const img = new Image();
        img.decoding = 'async';

        const complete = () => {
            prefetchedImageUrls.add(url);
            inFlightImagePrefetches.delete(url);
            resolve();
        };

        img.onload = complete;
        img.onerror = () => {
            inFlightImagePrefetches.delete(url);
            resolve();
        };
        img.src = url;
    });

    inFlightImagePrefetches.set(url, promise);
    return promise;
}

async function prefetchImageUrls(urls = [], options = {}) {
    const uniqueUrls = [...new Set(urls.filter(Boolean))]
        .filter(url => !prefetchedImageUrls.has(url) && !inFlightImagePrefetches.has(url));

    if (uniqueUrls.length === 0) return;

    const { saveData, concurrency: connectionConcurrency } = getConnectionProfile();
    const requestedConcurrency = options.concurrency;
    const concurrency = Math.max(
        1,
        Math.min(
            Number.isFinite(requestedConcurrency) ? requestedConcurrency : connectionConcurrency,
            connectionConcurrency
        )
    );

    const maxCount = Number.isFinite(options.maxCount)
        ? Math.max(0, options.maxCount)
        : (saveData ? 8 : Number.POSITIVE_INFINITY);

    const queue = uniqueUrls.slice(0, maxCount);

    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
        while (queue.length > 0) {
            const nextUrl = queue.shift();
            await prefetchSingleImage(nextUrl);
        }
    });

    await Promise.all(workers);
}

function scheduleImagePrefetch(urls = [], options = {}) {
    const run = () => prefetchImageUrls(urls, options).catch(err => {
        console.error('Image prefetch failed:', err);
    });

    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => {
            run();
        }, { timeout: 1200 });
        return;
    }

    setTimeout(run, 0);
}

export function prefetchTaskBatchImages(tasks = []) {
    const urls = tasks.flatMap(task => getTaskImageUrls(task));
    scheduleImagePrefetch(urls);
}

export function prefetchDummyImages() {
    const dummyUrls = getAllDummyImageUrls();
    scheduleImagePrefetch(dummyUrls, { concurrency: 2, maxCount: dummyUrls.length });
}
