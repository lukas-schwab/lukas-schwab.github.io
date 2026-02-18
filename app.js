import { storage } from './modules/storage.js';
import { RegionLocatorController } from './modules/controllers/region-locator.js';
import { LabelingController } from './modules/controllers/labeling.js';
import { PropertyIdentifierController } from './modules/controllers/property-identifier.js';
import { SimilarityLabelingController } from './modules/controllers/similarity-labeling.js';
import { loadPageHTML } from './modules/utils.js';
import { applyTranslations, t, getUserLanguage, setUserLanguage } from './modules/i18n.js';
import { COOLDOWN } from './modules/constants.js';

// Mobile viewport height is now handled by CSS using 100dvh (dynamic viewport height)
// No JavaScript calculation needed - modern browsers handle address bar showing/hiding automatically
// Fallback chain in CSS: 100vh → 100dvh for broader compatibility

// Dummy tasks - one for each task type (will prepend one to each batch)
const DUMMY_TASKS = {
    labeling: {
        type: 'labeling',
        isDummy: true,
        assets: {
            img: 'assets/dummy/label.png',
        }
    },
    image_region_locator: {
        type: 'image_region_locator',
        isDummy: true,
        assets: {
            imgA: 'assets/dummy/reference.png',
            imgB: 'assets/dummy/scheme.png'
        }
    },
    property_identifier: {
        type: 'property_identifier',
        isDummy: true,
        assets: {
            img: 'assets/dummy/identify.png',
        }
    },
    similarity_labeling: {
        type: 'similarity_labeling',
        isDummy: true,
        assets: {
            imgA: 'assets/dummy/left.png',
            imgB: 'assets/dummy/right.png',
        }
    }
};

const taskControllers = {
    image_region_locator: { controller: RegionLocatorController, page: 'region-locator' },
    labeling: { controller: LabelingController, page: 'labeling' },
    property_identifier: { controller: PropertyIdentifierController, page: 'property-identifier' },
    similarity_labeling: { controller: SimilarityLabelingController, page: 'similarity-labeling' }
};

const elements = {
    taskContainer: document.getElementById('task-container'),
    resultsDisplay: document.getElementById('results-display'),
    clearStorage: document.getElementById('clearStorage'),
    downloadResults: document.getElementById('downloadResults'),
    toastContainer: document.getElementById('toast-container'),
    storageView: document.getElementById('storage-view')
};

let currentCleanup = null;
let currentTaskIndex = 0;
let taskList = [];
let userProgress = null;
let tasksLoaded = false;
let taskStartTime = null;
let batchCount = 0; // Track which batch we're on (0-3)
let nextBatchPromise = null; // Promise for fetching the next batch

// Expose taskStartTime getter globally for controllers
window.getTaskStartTime = () => taskStartTime;

// Cooldown functions removed as they are now in storage.js

// Function to fetch tasks from the API
async function fetchTasksFromApi() {
    if (storage.isCoolingDown()) return [];

    const userId = storage.getUserUuid();
    const url = `https://europe-west3-concept-interpretability-efded.cloudfunctions.net/get_tasks_batch?userId=${userId}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Handle both old array format and new object format
        let tasks = [];
        if (data.tasks && Array.isArray(data.tasks)) {
            userProgress = data.userProgress || null;
            tasks = data.tasks;
        } else if (data.fullSequence) {
            // New format with metadata
            userProgress = data;
            tasks = data.tasks || [];
        } else {
            tasks = Array.isArray(data) ? data : [];
        }

        return tasks;
    } catch (error) {
        console.error('Could not fetch tasks:', error);
        return [];
    }
}

// Fetch the next batch asynchronously and return a promise
function startFetchingNextBatch(afterUploadPromise = null) {
    if (nextBatchPromise) return nextBatchPromise; // Already fetching
    // Allow up to 4 batches; block only after 4 have been started
    if (batchCount >= 5) return Promise.resolve(null);

    const runFetch = async () => {
        // Ensure previous batch upload (if provided) finishes before fetching new tasks
        if (afterUploadPromise) {
            try {
                await afterUploadPromise;
            } catch (err) {
                console.error('Upload failed, skipping fetch:', err);
                return null;
            }
        }
        return fetchTasksFromApi();
    };

    nextBatchPromise = runFetch();
    return nextBatchPromise;
}

// Get the fetched batch and clear the promise
async function getNextBatch() {
    if (!nextBatchPromise) return null;
    const tasks = await nextBatchPromise;
    nextBatchPromise = null;
    return tasks;
}

// Function to upload results to the API
async function uploadResultsToApi() {
    const allResults = storage.getResults();
    // Filter out dummy tasks before uploading
    const results = allResults.filter(result => !result.isDummy);
    if (results.length === 0) return true;

    const url = 'https://europe-west3-concept-interpretability-efded.cloudfunctions.net/submit_results_batch';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(results)
        });

        if (!response.ok) {
            throw new Error(`Upload failed! status: ${response.status}`);
        }

        // Clear local storage after successful upload of this batch
        storage.clear();
        return true;
    } catch (error) {
        console.error('Could not upload batch results:', error);
        return false;
    }
}

function showToast(message, cooldown=COOLDOWN.TOAST_DURATION) {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, cooldown);
}

// Helper to update UI elements that depend on the task list
function updateUIWithTasks() {
    const card1Text = elements.taskContainer.querySelector('[data-i18n="landing.card1Text"]');
    if (card1Text) {
        const translatedText = t('landing.card1Text').replace('{count}', taskList.length);
        card1Text.textContent = translatedText;
    }
}

async function showLandingPage() {
    const landingHTML = await loadPageHTML('landing');
    elements.taskContainer.innerHTML = landingHTML;

    // Apply translations
    applyTranslations(elements.taskContainer);

    // Set initial task count if tasks are already loaded
    if (tasksLoaded) {
        updateUIWithTasks();
    }

    // Set up language toggle
    const languageToggle = document.getElementById('language-toggle');
    const langLabelEn = document.getElementById('lang-label-en');
    const langLabelDe = document.getElementById('lang-label-de');

    if (languageToggle && langLabelEn && langLabelDe) {
        // Set initial state based on current language
        const currentLang = getUserLanguage();
        languageToggle.checked = currentLang === 'de';
        langLabelEn.classList.toggle('active', currentLang === 'en');
        langLabelDe.classList.toggle('active', currentLang === 'de');

        // Add change event listener
        languageToggle.addEventListener('change', (e) => {
            const newLang = e.target.checked ? 'de' : 'en';
            setUserLanguage(newLang);

            // Update label states
            langLabelEn.classList.toggle('active', newLang === 'en');
            langLabelDe.classList.toggle('active', newLang === 'de');

            // Re-translate the task count
            if (tasksLoaded) {
                updateUIWithTasks();
            }
        });
    }

    // Add event listener to start button
    const startButton = document.getElementById('start-tasks-btn');
    if (startButton) {
        startButton.addEventListener('click', async () => {
            let loadingTimeout;
            if (storage.isCoolingDown()) {
                showToast(t('messages.noMoreTasks'));
                return;
            } else {
                // Set loading indicator after 0.7 seconds
                loadingTimeout = setTimeout(() => {
                    const buttonText = startButton.querySelector('span:not(.btn-arrow)');
                    if (buttonText) {
                        buttonText.textContent = t('landing.loadingText');
                    }
                }, 700);
            }


            if (!tasksLoaded) {
                const tasks = await fetchTasksFromApi();
                // Prepend dummy for first batch
                if (tasks.length > 0 && userProgress && userProgress.taskType) {
                    const dummyTask = DUMMY_TASKS[userProgress.taskType];
                    if (dummyTask) {
                        tasks.unshift(dummyTask);
                    }
                }
                taskList = tasks;
                tasksLoaded = true;
                batchCount = 1;
                updateUIWithTasks();
            }
            if (taskList.length === 0) {
                storage.setCooldown();
                const buttonText = startButton.querySelector('span:not(.btn-arrow)');
                if (buttonText) {
                    buttonText.textContent = t('landing.startBtn');
                }
                showToast(t('messages.noMoreTasks'));
                return;
            }
            storage.markVisited();
            clearTimeout(loadingTimeout);
            loadTask(0);
        });
    }
}

async function loadTask(index) {
    if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
    }

    if (index >= taskList.length) {
        // Current batch is finished.
        // Upload and next-batch fetching happen sequentially on task completion.

        // All batches completed
        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('group', 'referral');

        const completionHTML = await loadPageHTML('completion');
        elements.taskContainer.innerHTML = completionHTML;

        const shareInput = document.getElementById('share-link-input');
        if (shareInput) {
            shareInput.value = shareUrl.toString();
        }

        // Apply translations to the newly added content
        applyTranslations(elements.taskContainer);

        // Copy link button handler
        const copyLinkBtn = document.getElementById('copy-link-btn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(shareInput.value);
                    const originalText = copyLinkBtn.textContent;
                    copyLinkBtn.textContent = t('completion.copiedBtn');
                    copyLinkBtn.style.backgroundColor = '#4caf50';
                    setTimeout(() => {
                        copyLinkBtn.textContent = originalText;
                        copyLinkBtn.style.backgroundColor = '';
                    }, 2000);
                } catch (err) {
                    // Fallback for older browsers
                    if (shareInput) {
                        shareInput.select();
                        document.execCommand('copy');
                    }
                }
            });
        }

        const moreTasksBtn = document.getElementById('more-tasks-btn');
        if (moreTasksBtn) {
            // // Show the "More tasks" button only if backend says we're not finished
            // if (userProgress && !userProgress.finished) {
            //     moreTasksBtn.style.setProperty('display', 'inline-block', 'important');
            // }

            moreTasksBtn.addEventListener('click', async () => {
                if (storage.isCoolingDown()) {
                    showToast(t('messages.noMoreTasks'));
                    return;
                }

                moreTasksBtn.disabled = true;
                const originalText = moreTasksBtn.textContent;
                moreTasksBtn.textContent = t('messages.loadingTasks');

                const nextTasks = await fetchTasksFromApi();
                if (nextTasks && nextTasks.length > 0) {
                    taskList = [...taskList, ...nextTasks];
                    tasksLoaded = true;
                    loadTask(currentTaskIndex + 1);
                } else {
                    storage.setCooldown();
                    showToast(t('messages.noMoreTasks'), 6000);
                    moreTasksBtn.disabled = false;
                    moreTasksBtn.textContent = originalText;
                }
            });
        }

        return;
    }

    // No prefetching: only fetch tasks when a user clicks a button

    // Hide results when entering a task
    if (elements.storageView) {
        elements.storageView.style.display = 'none';
    }

    const taskConfig = taskList[index];
    const taskType = taskConfig.taskType || taskConfig.type;
    const taskMeta = taskControllers[taskType];

    if (!taskMeta) {
        console.error(`Task type ${taskType} not found`);
        return;
    }

    // Load and render page HTML
    const pageHTML = await loadPageHTML(taskMeta.page);
    elements.taskContainer.innerHTML = pageHTML;

    // Apply translations to the loaded content
    applyTranslations(elements.taskContainer);

    window.scrollTo(0, 0);

    // Initialize task controller
    currentCleanup = taskMeta.controller.init(elements.taskContainer, taskConfig);
    currentTaskIndex = index;

    // Record task start time
    taskStartTime = Date.now();
}

// Listen for task completion signal from storage
window.addEventListener('task-completed', async () => {
    const currentTask = taskList[currentTaskIndex];
    const isDummyTask = Boolean(currentTask?.isDummy);
    const hasPendingBatchFetch = Boolean(nextBatchPromise);

    // If we're on the dummy while the next batch is still being fetched, wait for it
    if (isDummyTask && hasPendingBatchFetch) {
        try {
            const nextBatch = await getNextBatch();
            if (nextBatch && nextBatch.length > 0) {
                taskList.push(...nextBatch);
                tasksLoaded = true;
            } else {
                storage.setCooldown();
                showToast(t('messages.noMoreTasks'), 6000);
            }
        } catch (err) {
            console.error('Failed to fetch next batch:', err);
            showToast(t('messages.noMoreTasks'), 6000);
        }

        // Move past the dummy to the first task of the fetched batch (or completion screen if none)
        setTimeout(() => {
            currentTaskIndex++;
            loadTask(currentTaskIndex);
        }, 250);
        return;
    }

    const isEndOfBatch = currentTaskIndex === taskList.length - 1;

    if (isEndOfBatch) {
        // Immediately increment batch and append next dummy (NO WAITING)
        batchCount++;
        if (userProgress && userProgress.nextTaskType && batchCount <= 4) {
            const nextDummyTask = DUMMY_TASKS[userProgress.nextTaskType];
            if (nextDummyTask) {
                taskList.push(nextDummyTask);
            }
        }

        // Start upload, then fetch next batch after upload completes (to preserve order server-side)
        if (!userProgress || !userProgress.finished) {
            const uploadPromise = uploadResultsToApi().catch(err => {
                console.error('Upload failed:', err);
                showToast(t('messages.uploadFailedToast') || 'Connection error. Progress might not be saved.');
                throw err;
            });

            if (batchCount < 5) {
                startFetchingNextBatch(uploadPromise).catch(err => {
                    console.error('Failed to fetch next batch:', err);
                });
            }
        }

        // Load dummy (or completion if no dummy) immediately
        setTimeout(() => {
            currentTaskIndex++;
            loadTask(currentTaskIndex);
        }, 250);

        return; // Don't execute the setTimeout below (we already scheduled loadTask above)
    }

    // Regular task completion (not end of batch) - just load next task
    setTimeout(() => {
        currentTaskIndex++;
        loadTask(currentTaskIndex);
    }, 250); // Small delay to let user see "Submitted" toast
});

// Global Event Listeners
window.addEventListener('app-toast', (e) => {
    showToast(e.detail);
});

// Delegate landing page button click
document.addEventListener('click', (e) => {
    // If we need any other global event delegation, it would go here
});

elements.clearStorage.addEventListener('click', () => {
    if (confirm(t('messages.clearConfirm'))) {
        storage.clear();
        showToast(t('messages.storageCleared'));
    }
});

elements.downloadResults.addEventListener('click', () => {
    storage.downloadResults();
    showToast(t('messages.downloadStarted'));
});

// Subscribe to storage updates
storage.subscribe((results) => {
    elements.resultsDisplay.textContent = JSON.stringify(results, null, 2);
});

async function showLockScreen() {
    const lockHTML = await loadPageHTML('lock');
    elements.taskContainer.innerHTML = lockHTML;
    applyTranslations(elements.taskContainer);

    const passwordInput = document.getElementById('password-input');
    const unlockBtn = document.getElementById('unlock-btn');
    const lockError = document.getElementById('lock-error');

    const attemptUnlock = () => {
        if (passwordInput.value === 'unlockmenow') {
            sessionStorage.setItem('isUnlocked', 'true');
            showLandingPage();
        } else {
            lockError.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();

            // Re-hide error after some time or on next input
            setTimeout(() => {
                lockError.style.display = 'none';
            }, 3000);
        }
    };

    if (unlockBtn) {
        unlockBtn.addEventListener('click', attemptUnlock);
    }

    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                attemptUnlock();
            }
        });
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', async () => {
    // Set HTML lang attribute based on user's browser language
    document.documentElement.lang = getUserLanguage();

    // Apply translations to static elements (like storage view)
    applyTranslations();

    storage.getGroupIdentifier();
    storage.getUserUuid();
    window.history.pushState({}, document.title, "/");

    // Check if site is already unlocked for this session
    const isUnlocked = sessionStorage.getItem('isUnlocked') === 'true';

    if (isUnlocked) {
        await showLandingPage();
    } else {
        await showLockScreen();
    }
});
