// =============================================================================
// STATE MANAGEMENT
// =============================================================================

const state = {
    currentPair: [null, null], // [imageA_url, imageB_url]
    imageUrlQueue: [], // Stores upcoming pairs [ [a1, b1], [a2, b2], ... ]
    session: null,
    groupIdentifier: null,
    isVoting: true,    // Start true to block voting until first images load
    isFetching: false, // Prevent simultaneous fetches
};

// =============================================================================
// DOM ELEMENTS
// =============================================================================

const elements = {
    imgA: document.getElementById('imgA'),
    imgB: document.getElementById('imgB'),
    cardA: document.getElementById('cardA'),
    cardB: document.getElementById('cardB'),
    countAel: document.getElementById('countA'),
    countBel: document.getElementById('countB'),
    status: document.getElementById('status'),
    // urlA: document.getElementById('urlA'),
    // urlB: document.getElementById('urlB'),
    // loadUrls: document.getElementById('loadUrls'),
    // swapBtn: document.getElementById('swapBtn'),
    // resetBtn: document.getElementById('resetBtn'),
    // uploadBtn: document.getElementById('uploadBtn'),
};

// =============================================================================
// BACKEND INTEGRATION
// =============================================================================

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbz7SH8va_1Zy0TR7cJXL9-_FcunWEUtJOOwHdPRlNRx_yJsi4TieE6ujirK_o_TnBWCMQ/exec";
const IMAGE_QUEUE_LOW_WATER_MARK = 2; // Fetch more images when queue has this many pairs left

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function getOrCreateSession() {
    if (!state.session) {
        state.session = localStorage.getItem("session") || (() => {
            const s = crypto.randomUUID();
            localStorage.setItem("session", s);
            return s;
        })();
    }

    return state.session;
}

function getGroupIdentifier() {
    if (!state.groupIdentifier) {
        state.groupIdentifier = localStorage.getItem("groupIdentifier") || (() => {
            const urlParams = new URLSearchParams(window.location.search);
            const group = urlParams.get('group');
            localStorage.setItem("groupIdentifier", group);
            
            return group;
        })();
    }
    
    return state.groupIdentifier;
}

function resetURL() {
    window.history.pushState({}, document.title, "/");
}

/**
 * Submits the vote in the background without blocking the UI.
 */
async function submitVoteInBackground(side, pair, imgSrcToCount) {
    console.log('Submitting vote...');

    // TODO: Submit groupIdentifier

    try {
        const payload = {
            imageA: pair[0],
            imageB: pair[1],
            choice: side,
            session: getOrCreateSession()
        };

        const response = await fetch(BACKEND_URL, {
            method: "POST",
            mode: 'cors',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log('Vote recorded!');
        // Update local counts after successful vote
        updateLocalVoteCount(imgSrcToCount);
        // updateDisplayedCounts(); // Counts are updated when new pair is shown

    } catch (error) {
        console.error('Vote submission failed:', error);
        updateStatus('Last vote failed to submit. It may be retried.');
    }
}

/**
 * Fetches a batch of image URLs (10) from the backend and adds them to the queue.
 */
async function fetchImageBatch() {
    if (state.isFetching) return;
    state.isFetching = true;
    console.log('Fetching new image batch...');

    try {
        const response = await fetch(BACKEND_URL, {
            method: "GET",
            mode: 'cors',
            headers: { "Content-Type": "text/plain;charset=utf-8" }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const responseText = await response.text();
        const data = JSON.parse(responseText);

        // Assuming data.received is an array of 10 URLs
        const pairs = [];
        if (data.received && data.received.length > 0) {
            for (let i = 0; i < data.received.length; i += 2) {
                if (data.received[i] && data.received[i + 1]) {
                    pairs.push([data.received[i], data.received[i + 1]]);
                }
            }
        }

        if (pairs.length > 0) {
            state.imageUrlQueue.push(...pairs);
            console.log(`Added ${pairs.length} new pairs to queue.`);
        } else {
            throw new Error('No valid image pairs received from backend.');
        }

    } catch (error) {
        console.error('Loading URLs failed:', error);
        updateStatus('Loading new images failed, try reloading the site.');
    } finally {
        state.isFetching = false;
    }
}

// =============================================================================
// LOCAL STORAGE MANAGEMENT
// =============================================================================

function storageGet() {
    try {
        return JSON.parse(localStorage.getItem('two-image-votes') || '{}');
    } catch (e) {
        return {};
    }
}

function storageSet(obj) {
    localStorage.setItem('two-image-votes', JSON.stringify(obj));
}

function idFor(src) {
    if (!src) return 'unknown';
    try {
        if (src.startsWith('data:')) return src.slice(0, 80);
        const u = new URL(src, location.href);
        return u.origin + u.pathname;
    } catch (e) {
        return src;
    }
}

/**
 * Updates the local vote count for a specific image source.
 */
function updateLocalVoteCount(imgSrc) {
    const store = storageGet();
    const id = idFor(imgSrc);
    store[id] = (store[id] || 0) + 1;
    storageSet(store);
}

/**
 * Updates the displayed vote counts for the *currently visible* images.
 */
function updateDisplayedCounts() {
    // This feature is currently commented out in the HTML.
    // If re-enabled, this function will work as intended.
    if (!elements.countAel || !elements.countBel) return;

    const store = storageGet();
    const countA = store[idFor(elements.imgA.src)] || 0;
    const countB = store[idFor(elements.imgB.src)] || 0;
    // elements.countAel.textContent = countA + ' votes';
    // elements.countBel.textContent = countB + ' votes';
}

// =============================================================================
// UI HELPERS
// =============================================================================

function updateStatus(message) {
    elements.status.textContent = message;
}

/**
 * Gets the next pair from the queue and displays them.
 * Fetches more images if the queue is empty or low.
 */
async function displayNextPair() {
    // 1. Check if queue is empty and fetch if needed
    if (state.imageUrlQueue.length === 0) {
        updateStatus('Fetching new images...');
        await fetchImageBatch(); // Wait for it to finish

        // After await, check again in case fetch failed
        if (state.imageUrlQueue.length === 0) {
            updateStatus('Failed to load new images. Please refresh.');
            state.isVoting = true; // Block voting
            return; // Can't proceed
        }
    }


    // 2. Queue has images, so display the next one
    const nextPair = state.imageUrlQueue.shift();
    state.currentPair = nextPair;

    // Set src to empty string first to trigger loading state (if CSS is set up)
    elements.imgA.src = "";
    elements.imgB.src = "";

    // Set the actual source
    elements.imgA.src = state.currentPair[0];
    elements.imgB.src = state.currentPair[1];

    updateDisplayedCounts(); // Update counts for the *new* pair
    updateStatus('Please vote.');
    state.isVoting = false; // Allow voting for this new pair

    // 3. Check buffer and pre-fetch if necessary
    if (state.imageUrlQueue.length <= IMAGE_QUEUE_LOW_WATER_MARK && !state.isFetching) {
        // Don't await, just start it in the background
        console.log('Queue is low, pre-fetching next batch...');
        fetchImageBatch();
    }
}


function addSelectedEffect(side) {
    // Remove previous selection
    elements.cardA.classList.remove('selected');
    elements.cardB.classList.remove('selected');

    // Add selection to voted card
    if (side === 'A') {
        elements.cardA.classList.add('selected');
    } else {
        elements.cardB.classList.add('selected');
    }

    // Remove selection after animation
    setTimeout(() => {
        elements.cardA.classList.remove('selected');
        elements.cardB.classList.remove('selected');
    }, 1000);
}

// =============================================================================
// VOTING LOGIC
// =============================================================================

async function vote(side) {
    if (state.isVoting) return; // Prevent double-clicks
    state.isVoting = true; // Block *new* votes immediately

    // 1. Get data for the vote before changing images
    const pairToSubmit = [...state.currentPair];
    const imgSrcToCount = pairToSubmit[side === 'A' ? 0 : 1];

    // 2. Update UI immediately
    addSelectedEffect(side);

    // 3. Start background submission
    // We don't await this. It runs in parallel.
    submitVoteInBackground(side, pairToSubmit, imgSrcToCount);

    // 4. Load and display the next pair
    // This is awaited, and will set state.isVoting = false when done
    // For UX reasons we also wait before setting the new image.
    setTimeout(async () => {
        await displayNextPair();
    }, 1000);
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // Vote handlers
    elements.cardA.addEventListener('click', () => vote('A'));
    elements.cardB.addEventListener('click', () => vote('B'));

    // Keyboard support
    window.addEventListener('keydown', (e) => {
        if (state.isVoting) return; // Ignore keypress if not ready
        if (e.key === 'ArrowLeft' || e.key === '1') vote('A');
        if (e.key === 'ArrowRight' || e.key === '2') vote('B');
    });

    // Reset votes (if button is re-enabled)
    // if (elements.resetBtn) {
    //   elements.resetBtn.addEventListener('click', () => {
    //     // Use a custom modal instead of confirm()
    //     updateStatus('Resetting votes... (feature in dev)');
    //     // localStorage.removeItem('two-image-votes');
    //     // updateDisplayedCounts();
    //     // updateStatus('Local votes reset.');
    //   });
    // }

    // Accessibility
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') document.body.classList.add('show-focus');
    });
}

// =============================================================================
// INITIALIZATION
// =============================================================================

function init() {
    setupEventListeners();
    getOrCreateSession(); // Ensure session is created
    getGroupIdentifier();
    resetURL();
    updateStatus('Loading first images...');

    // Kick off the whole process
    displayNextPair();
}

// =============================================================================
// DEBUG HELPERS
// =============================================================================

window.twoImageVote = {
    vote,
    updateDisplayedCounts,
    storageGet,
    state,
    elements,
    fetchImageBatch,
    displayNextPair
};
